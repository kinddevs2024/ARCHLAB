import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import mongoose from "mongoose";
import { config } from "../config.js";
import { connectDb } from "../db.js";
import { Project } from "../models/Project.js";
import { File } from "../models/File.js";
import {
  StorageJob,
  StorageState,
  GitHubArchive,
} from "../models/GitHubStorage.js";
import {
  enqueue,
  githubClient,
  eligibleFile,
  metadataHash,
  ensureProjectArchive,
  syncFile,
  evictCachedFile,
} from "./github.js";
export async function processNextJob(client) {
  const now = new Date(),
    claim = crypto.randomUUID();
  const job = await StorageJob.findOneAndUpdate(
    {
      $or: [
        { state: "pending", nextAttempt: { $lte: now } },
        { state: "processing", lockedAt: { $lt: new Date(+now - 300000) } },
      ],
    },
    {
      $set: { state: "processing", lockedAt: now, claim },
      $inc: { attempts: 1 },
    },
    { sort: { nextAttempt: 1, _id: 1 }, returnDocument: "after" },
  );
  if (!job) return false;
  const heartbeat = setInterval(
    () =>
      StorageJob.updateOne(
        { _id: job._id, claim },
        { $set: { lockedAt: new Date() } },
      ).catch(() => {}),
    30000,
  );
  heartbeat.unref();
  try {
    if (job.type === "project") {
      const p = await Project.findById(job.project);
      if (p) await ensureProjectArchive(p, client);
    } else {
      const f = await File.findById(job.file);
      if (f && eligibleFile(f)) {
        await File.updateOne(
          { _id: f._id, "github.status": { $ne: "synced" } },
          { $set: { "github.status": "syncing" } },
        );
        await syncFile(f, client);
      }
    }
    // A rename/update while work was in flight must remain queued.
    const result = await StorageJob.updateOne(
      { _id: job._id, claim, revision: job.revision },
      {
        $set: { state: "done", lastError: "" },
        $unset: { claim: 1, lockedAt: 1 },
      },
    );
    if (!result.modifiedCount)
      await StorageJob.updateOne(
        { _id: job._id, claim },
        {
          $set: { state: "pending", nextAttempt: new Date() },
          $unset: { claim: 1, lockedAt: 1 },
        },
      );
    await StorageState.updateOne(
      { _id: "github" },
      { $set: { lastSuccess: new Date(), lastError: "" } },
      { upsert: true },
    );
  } catch (e) {
    const code = /^[A-Z_\d]+$/.test(e.code || "")
      ? e.code
      : "STORAGE_SYNC_FAILED";
    const delay = Math.max(
      Math.min(21600000, 30000 * 2 ** Math.min(job.attempts - 1, 10)),
      Math.min(e.retryAfter || 0, 86400000),
    );
    await StorageJob.updateOne(
      { _id: job._id, claim },
      {
        $set: {
          state: "pending",
          nextAttempt: new Date(Date.now() + delay),
          lastError: code,
        },
        $unset: { claim: 1, lockedAt: 1 },
      },
    );
    if (job.type === "file")
      await File.updateOne(
        { _id: job.file, "github.status": { $ne: "synced" } },
        { $set: { "github.status": "error", "github.lastError": code } },
      );
    else
      await GitHubArchive.updateOne(
        { project: job.project },
        { $set: { status: "error", lastError: code } },
      );
    await StorageState.updateOne(
      { _id: "github" },
      { $set: { lastError: code } },
      { upsert: true },
    );
  } finally {
    clearInterval(heartbeat);
  }
  return true;
}
export async function reconcile() {
  // A file record is itself durable; a failed queue insert or process exit cannot lose it.
  for await (const project of Project.find().cursor()) {
    const key = `project:${project._id}`;
    const [job, archive] = await Promise.all([
      StorageJob.findOne({ key }).select("state"),
      GitHubArchive.findOne({ project: project._id }).select(
        "metadataHash status",
      ),
    ]);
    if (
      !job ||
      (job.state === "done" &&
        (!archive ||
          archive.status !== "synced" ||
          archive.metadataHash !== metadataHash(project)))
    )
      await enqueue("project", project);
  }
  for await (const file of File.find({
    project: { $ne: null },
    kind: { $ne: "avatar" },
    conversation: null,
    "github.status": { $ne: "synced" },
  }).cursor()) {
    if (
      eligibleFile(file) &&
      !(await StorageJob.exists({
        key: `file:${file._id}`,
        state: { $ne: "done" },
      }))
    )
      await enqueue("file", file);
  }
}
async function cleanCache(client) {
  const cutoff = new Date(Date.now() - config.github.cacheHours * 3600000);
  for await (const file of File.find({
    "github.status": "synced",
    "github.cachedAt": { $lte: cutoff },
  })
    .limit(50)
    .cursor()) {
    try {
      await evictCachedFile(file, client);
    } catch {
      /* Keep the only usable local copy when remote verification fails. */
    }
  }
}
async function main() {
  if (!config.github.enabled) throw new Error("GITHUB_STORAGE_DISABLED");
  await connectDb();
  let stop = false,
    lastScan = 0,
    lastClean = 0;
  process.on("SIGTERM", () => {
    stop = true;
  });
  process.on("SIGINT", () => {
    stop = true;
  });
  const heartbeat = setInterval(
    () =>
      StorageState.updateOne(
        { _id: "github" },
        { $set: { heartbeat: new Date(), running: true } },
        { upsert: true },
      ).catch(() => {}),
    30000,
  );
  heartbeat.unref();
  try {
    while (!stop) {
      await StorageState.updateOne(
        { _id: "github" },
        { $set: { heartbeat: new Date(), running: true } },
        { upsert: true },
      );
      try {
        if (Date.now() - lastScan > 60000) {
          await reconcile();
          lastScan = Date.now();
        }
        const client = await githubClient();
        if (Date.now() - lastClean > 60000) {
          await cleanCache(client);
          lastClean = Date.now();
        }
        const worked = await processNextJob(client);
        if (!worked) await new Promise((r) => setTimeout(r, 1000));
      } catch {
        await StorageState.updateOne(
          { _id: "github" },
          { $set: { lastError: "GITHUB_UNAVAILABLE" } },
        );
        await new Promise((r) => setTimeout(r, 10000));
      }
    }
  } finally {
    clearInterval(heartbeat);
    await StorageState.updateOne(
      { _id: "github" },
      { $set: { running: false } },
    );
    await mongoose.disconnect();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => {
    console.error("GitHub archive worker failed");
    process.exit(1);
  });
