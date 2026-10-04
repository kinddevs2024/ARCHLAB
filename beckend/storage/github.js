import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "../config.js";
import { File } from "../models/File.js";
import { Project } from "../models/Project.js";
import { GitHubArchive, StorageJob } from "../models/GitHubStorage.js";
import {
  GitHubStorageClient,
  StorageError,
  MAX_GITHUB_FILE_BYTES,
  fileHashes,
} from "./github-client.js";
const inflight = new Map();
export const eligibleFile = (file) =>
  !!file.project &&
  file.kind !== "avatar" &&
  !file.conversation &&
  file.entityType !== "conversations";
export const safeLocalPath = (file) => {
  const local = path.resolve(file.path);
  if (!local.startsWith(config.uploadDir + path.sep))
    throw new StorageError("INVALID_LOCAL_PATH");
  return local;
};
let cachedClient;
export const githubClient = async () => {
  if (cachedClient) return cachedClient;
  const token = (await fs.readFile(config.github.tokenFile, "utf8")).trim();
  if (!token) throw new StorageError("GITHUB_TOKEN_MISSING");
  const client = new GitHubStorageClient({
    token,
    owner: config.github.owner,
    baseUrl: config.github.baseUrl,
  });
  await client.verifyOwner();
  cachedClient = client;
  return client;
};
export const enqueue = async (type, item) => {
  if (!config.github.enabled) return;
  const key = `${type}:${item._id}`;
  const fields = {
    type,
    project: type === "project" ? item._id : item.project,
    ...(type === "file" ? { file: item._id } : {}),
    nextAttempt: new Date(),
  };
  await StorageJob.updateOne(
    { key },
    { $setOnInsert: { ...fields, state: "pending", attempts: 0, revision: 1 } },
    { upsert: true },
  );
  await StorageJob.updateOne({ key }, { $set: fields, $inc: { revision: 1 } });
  await StorageJob.updateOne(
    { key, state: { $ne: "processing" } },
    { $set: { state: "pending" } },
  );
  if (type === "file")
    await File.updateOne(
      { _id: item._id, "github.status": { $ne: "synced" } },
      { $set: { "github.status": "pending" } },
    );
};
export const metadataFor = (project) => ({
  schemaVersion: 1,
  projectId: String(project._id),
  title: project.title,
  description: project.description || "",
});
export const metadataHash = (project) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(metadataFor(project), null, 2) + "\n")
    .digest("hex");
export const repositoryName = (project) =>
  `archlab-${
    project.title
      .normalize("NFKD")
      .replace(/[^a-z\d]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 45)
      .toLowerCase() || "project"
  }-${project._id}`;
export const ensureProjectArchive = async (project, client) => {
  const data = metadataFor(project),
    json = JSON.stringify(data, null, 2) + "\n",
    fingerprint = crypto.createHash("sha256").update(json).digest("hex");
  let archive = await GitHubArchive.findOneAndUpdate(
    { project: project._id },
    {
      $setOnInsert: {
        owner: config.github.owner,
        repository: repositoryName(project),
        title: project.title,
        status: "pending",
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (archive.owner !== config.github.owner)
    throw new StorageError("GITHUB_ARCHIVE_ACCOUNT_MISMATCH");
  const repo = await client.ensureRepo(
    archive.repository,
    (project.description || project.title).replace(/\s+/g, " "),
  );
  const existing = await client.content(archive.repository, "project.json");
  if (existing?.content) {
    let remote;
    try {
      remote = JSON.parse(Buffer.from(existing.content, "base64").toString());
    } catch {
      throw new StorageError("INVALID_PROJECT_METADATA");
    }
    if (remote.projectId !== String(project._id))
      throw new StorageError("REPOSITORY_PROJECT_MISMATCH");
  }
  if (archive.metadataHash !== fingerprint || !existing) {
    await client.put(
      archive.repository,
      "project.json",
      Buffer.from(json),
      "Update ARCHLAB project name and description",
    );
    await client.put(
      archive.repository,
      "README.md",
      Buffer.from(
        `# ${project.title.replace(/[\r\n]/g, " ")}\n\n${project.description || "ARCHLAB project documents"}\n\nProject ID: ${project._id}\n\nThis private archive is retained when its project is removed from ARCHLAB.\n`,
      ),
      "Update project archive description",
    );
  }
  archive.status = "synced";
  archive.title = project.title;
  archive.url = repo.html_url;
  archive.metadataHash = fingerprint;
  archive.syncedAt = new Date();
  archive.lastError = "";
  await archive.save();
  return archive;
};
export const syncFile = async (file, client) => {
  if (!eligibleFile(file)) return;
  if (
    file.github?.status === "synced" &&
    file.github.blobSha &&
    file.github.sha256
  ) {
    await client.verifyBlob(file.github.repository, file.github.blobSha, {
      size: file.size,
      sha256: file.github.sha256,
    });
    return;
  }
  if (file.size > MAX_GITHUB_FILE_BYTES)
    throw new StorageError("FILE_EXCEEDS_GITHUB_LIMIT", 413);
  const project = await Project.findById(file.project);
  if (!project) throw new StorageError("PROJECT_METADATA_MISSING");
  const archive = await ensureProjectArchive(project, client),
    local = safeLocalPath(file);
  const hash = await fileHashes(local, file.size),
    name =
      [...path.basename(file.originalName).normalize("NFKC")]
        .map((c) => (c.charCodeAt(0) < 32 || "/\\".includes(c) ? "_" : c))
        .join("")
        .slice(0, 140) || "document";
  const remotePath = `files/${String(file._id).slice(-2)}/${file._id}-${name}`;
  const bytes = await fs.readFile(local);
  const result = await client.put(
    archive.repository,
    remotePath,
    bytes,
    `Upload document: ${name}`,
  );
  await client.verifyBlob(archive.repository, result.blobSha, {
    size: file.size,
    sha256: hash.sha256,
  });
  await File.updateOne(
    { _id: file._id },
    {
      $set: {
        github: {
          status: "synced",
          owner: archive.owner,
          repository: archive.repository,
          remotePath,
          blobSha: result.blobSha,
          commitSha: result.commitSha || file.github?.commitSha,
          sha256: hash.sha256,
          verifiedAt: new Date(),
          cachedAt: new Date(),
          lastError: "",
        },
      },
    },
  );
};
export const downloadPath = async (file, providedClient) => {
  const local = safeLocalPath(file);
  if (file.github?.status === "synced") {
    let acquired = false;
    for (let i = 0; i < 100; i++) {
      const now = new Date();
      const result = await File.updateOne(
        {
          _id: file._id,
          $or: [
            { "github.cacheEvictUntil": { $lte: now } },
            { "github.cacheEvictUntil": null },
          ],
        },
        { $set: { "github.cachedAt": now } },
      );
      if (result.matchedCount) {
        acquired = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!acquired) throw new StorageError("CACHE_BUSY");
  }
  try {
    await fs.access(local);
    if (file.github?.status === "synced")
      await File.updateOne(
        { _id: file._id },
        { $set: { "github.cachedAt": new Date() } },
      );
    return local;
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  if (
    file.github?.status !== "synced" ||
    !file.github.blobSha ||
    !file.github.sha256
  )
    throw new StorageError("FILE_NOT_AVAILABLE");
  if (!inflight.has(String(file._id)))
    inflight.set(
      String(file._id),
      (async () => {
        const client = providedClient || (await githubClient());
        if (file.github.owner !== client.owner)
          throw new StorageError("GITHUB_ARCHIVE_ACCOUNT_MISMATCH");
        await client.download(
          file.github.repository,
          file.github.blobSha,
          { size: file.size, sha256: file.github.sha256 },
          local,
        );
        await File.updateOne(
          { _id: file._id },
          { $set: { "github.cachedAt": new Date() } },
        );
        return local;
      })().finally(() => inflight.delete(String(file._id))),
    );
  return inflight.get(String(file._id));
};
export const evictCachedFile = async (file, client, now = new Date()) => {
  if (
    !eligibleFile(file) ||
    file.github?.status !== "synced" ||
    !file.github.sha256 ||
    !file.github.verifiedAt ||
    !file.github.cachedAt
  )
    return false;
  if (
    +now - +file.github.cachedAt < config.github.cacheHours * 3600000 ||
    inflight.has(String(file._id))
  )
    return false;
  const current = await File.findById(file._id);
  if (
    !current ||
    +now - +current.github.cachedAt < config.github.cacheHours * 3600000
  )
    return false;
  const remote = await client.content(
    file.github.repository,
    file.github.remotePath,
    file.github.commitSha,
  );
  if (remote?.sha !== file.github.blobSha || remote.size !== file.size)
    throw new StorageError("GITHUB_CACHE_EVICTION_NOT_VERIFIED");
  // Verify the local bytes still match the confirmed upload before removing only this cached file.
  const local = safeLocalPath(file);
  try {
    const hash = await fileHashes(local, file.size);
    if (hash.sha256 !== file.github.sha256)
      throw new StorageError("LOCAL_FILE_HASH_MISMATCH");
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const lockUntil = new Date(Date.now() + 60000);
  const acquired = await File.updateOne(
    {
      _id: file._id,
      "github.cachedAt": current.github.cachedAt,
      $or: [
        { "github.cacheEvictUntil": { $lte: new Date() } },
        { "github.cacheEvictUntil": null },
      ],
    },
    { $set: { "github.cacheEvictUntil": lockUntil } },
  );
  if (!acquired.modifiedCount) return false;
  try {
    await fs.unlink(local).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    });
    await File.updateOne(
      { _id: file._id, "github.cacheEvictUntil": lockUntil },
      { $unset: { "github.cachedAt": 1 } },
    );
    return true;
  } finally {
    await File.updateOne(
      { _id: file._id, "github.cacheEvictUntil": lockUntil },
      { $unset: { "github.cacheEvictUntil": 1 } },
    );
  }
};
