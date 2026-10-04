import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../beckend/config.js";
import { User } from "../beckend/models/User.js";
import { Project } from "../beckend/models/Project.js";
import { File } from "../beckend/models/File.js";
import { Notification } from "../beckend/models/Notification.js";
import { AuditLog } from "../beckend/models/AuditLog.js";
import { StorageJob, GitHubArchive } from "../beckend/models/GitHubStorage.js";
import { GitHubStorageClient } from "../beckend/storage/github-client.js";
import {
  enqueue,
  evictCachedFile,
  downloadPath,
  syncFile,
} from "../beckend/storage/github.js";
import { processNextJob, reconcile } from "../beckend/storage/worker.js";
assert(
  config.mongoUri.startsWith("mongodb://127.0.0.1:27021/"),
  "Isolated MongoDB required",
);
await mongoose.connect(config.mongoUri);
config.github.enabled = true;
const repos = new Map(),
  calls = [],
  ids = [],
  marker = `storage-${Date.now()}`,
  password = "Isolated-storage-password-42";
let failWrites = false,
  failReads = false,
  corruptRaw = false,
  apiProcess;
const fake = createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const segments = u.pathname
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  calls.push({ method: req.method, path: u.pathname });
  const send = (status, data) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };
  if (u.pathname === "/user") return send(200, { login: "ARCHLAB-di" });
  let body = "";
  for await (const chunk of req) body += chunk;
  body = body ? JSON.parse(body) : {};
  if (req.method === "POST" && u.pathname === "/user/repos") {
    if (repos.has(body.name)) return send(422, {});
    const repo = {
      name: body.name,
      private: body.private,
      owner: { login: "ARCHLAB-di" },
      html_url: "https://github.com/ARCHLAB-di/" + body.name,
      description: body.description,
      files: new Map(),
      blobs: new Map(),
      commits: 0,
    };
    repos.set(body.name, repo);
    return send(201, repo);
  }
  const repo = repos.get(segments[2]);
  if (!repo) return send(404, {});
  if (segments.length === 3) {
    if (req.method === "PATCH") repo.description = body.description;
    return send(200, repo);
  }
  if (segments[3] === "contents") {
    const key = segments.slice(4).join("/");
    const file = repo.files.get(key);
    if (req.method === "GET") {
      if (failReads) return send(503, {});
      if (!file) return send(404, {});
      return send(200, {
        sha: file.sha,
        size: file.bytes.length,
        content: file.bytes.toString("base64"),
        encoding: "base64",
      });
    }
    if (req.method === "PUT") {
      if (failWrites && key.startsWith("files/")) return send(503, {});
      const bytes = Buffer.from(body.content, "base64");
      const sha = crypto
        .createHash("sha1")
        .update(`blob ${bytes.length}\0`)
        .update(bytes)
        .digest("hex");
      repo.files.set(key, { bytes, sha });
      repo.blobs.set(sha, bytes);
      repo.commits++;
      return send(201, {
        content: { sha },
        commit: {
          sha: crypto
            .createHash("sha1")
            .update(String(repo.commits))
            .digest("hex"),
        },
      });
    }
  }
  if (segments[3] === "git" && segments[4] === "blobs") {
    const bytes = repo.blobs.get(segments[5]);
    if (!bytes) return send(404, {});
    res.writeHead(200, { "Content-Type": "application/octet-stream" });
    return res.end(corruptRaw ? Buffer.from("CORRUPT") : bytes);
  }
  return send(404, {});
});
await new Promise((r) => fake.listen(0, "127.0.0.1", r));
const githubUrl = `http://127.0.0.1:${fake.address().port}`;
const tokenFile = path.resolve("test-artifacts/github-test-token");
await fs.mkdir(path.dirname(tokenFile), { recursive: true });
await fs.writeFile(tokenFile, "test-only-token", { mode: 0o600 });
const client = new GitHubStorageClient({
  token: "test-only-token",
  owner: "ARCHLAB-di",
  baseUrl: githubUrl,
  delayMs: 0,
});
const api = async (cookie, url, method = "GET", body) => {
  const r = await fetch("http://127.0.0.1:4033/api" + url, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      Origin: "http://127.0.0.1:5174",
    },
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  return {
    status: r.status,
    data: r.headers.get("content-type")?.includes("json")
      ? await r.json()
      : Buffer.from(await r.arrayBuffer()),
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
};
const fixtureFiles = [];
let projectId;
try {
  const hash = await bcrypt.hash(password, 4);
  const owner = await User.create({
      name: "Owner",
      email: marker + "@example.test",
      password: hash,
      status: "Owner",
    }),
    worker = await User.create({
      name: "Worker",
      email: marker + "-worker@example.test",
      password: hash,
      status: "User",
    });
  ids.push(owner._id, worker._id);
  apiProcess = spawn(process.execPath, ["beckend/server.js"], {
    env: {
      ...process.env,
      PORT: "4033",
      GITHUB_STORAGE_ENABLED: "true",
      GITHUB_STORAGE_API_BASE_URL: githubUrl,
      GITHUB_STORAGE_TOKEN_FILE: tokenFile,
    },
    stdio: ["ignore", "ignore", "inherit"],
  });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4033/api/health")).ok) break;
    } catch {
      /* Service is starting. */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  let r = await api(null, "/auth/login", "POST", {
    email: owner.email,
    password,
  });
  assert.equal(r.status, 200);
  const cookie = r.cookie;
  r = await api(null, "/auth/login", "POST", { email: worker.email, password });
  const other = r.cookie;
  const before = calls.length;
  r = await api(cookie, "/projects", "POST", {
    title: marker,
    description: "Only the project name and description",
    customerName: "Private customer",
    customerPhone: "+998123456",
    contractAmount: 123,
  });
  assert.equal(r.status, 201);
  projectId = r.data.id;
  assert.equal(
    calls.length,
    before,
    "Project creation must not wait for GitHub",
  );
  const bytes = Buffer.from(
    "%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF",
  );
  const upload = () => {
    const form = new FormData();
    for (const [k, v] of Object.entries({
      entityType: "projects",
      entityId: projectId,
      project: projectId,
      kind: "project",
    }))
      form.append(k, v);
    form.append(
      "file",
      new Blob([bytes], { type: "application/pdf" }),
      "test plan.pdf",
    );
    return form;
  };
  failWrites = true;
  const started = Date.now();
  r = await api(cookie, "/files", "POST", upload());
  assert.equal(r.status, 201);
  assert.equal(
    calls.length,
    before,
    "Upload response must precede any GitHub network activity",
  );
  assert(Date.now() - started < 2000);
  assert.equal(r.data.storage.status, "pending");
  assert.equal(r.data.github, undefined);
  fixtureFiles.push(r.data.id);
  let file = await File.findById(r.data.id);
  await processNextJob(client);
  await processNextJob(client);
  file = await File.findById(file._id);
  assert.equal(file.github.status, "error");
  assert.equal((await fs.readFile(file.path)).toString(), bytes.toString());
  assert.equal(
    (await StorageJob.findOne({ key: `file:${file._id}` })).state,
    "pending",
  );
  failWrites = false;
  await StorageJob.updateOne(
    { key: `file:${file._id}` },
    {
      $set: {
        nextAttempt: new Date(0),
        state: "processing",
        lockedAt: new Date(Date.now() - 600000),
        claim: "dead-worker",
      },
    },
  );
  await processNextJob(client);
  file = await File.findById(file._id);
  assert.equal(file.github.status, "synced");
  assert.equal(
    file.github.sha256,
    crypto.createHash("sha256").update(bytes).digest("hex"),
  );
  const archive = await GitHubArchive.findOne({ project: projectId }),
    repo = repos.get(archive.repository);
  assert(repo.private);
  assert.equal(
    repo.commits,
    3,
    "Project metadata plus exactly one file commit",
  );
  assert.deepEqual(
    Object.keys(JSON.parse(repo.files.get("project.json").bytes)),
    ["schemaVersion", "projectId", "title", "description"],
  );
  assert(
    ![...repo.files.values()].some((f) =>
      f.bytes.includes(Buffer.from("Private customer")),
    ),
  );
  assert(
    ![...repo.files.keys()].some((p) => /users|password|database/i.test(p)),
  );
  await enqueue("file", file);
  await processNextJob(client);
  assert.equal(
    repo.commits,
    3,
    "Retry after success must not add duplicate commits",
  );
  assert.equal(await evictCachedFile(file, client), false);
  await File.updateOne(
    { _id: file._id },
    { $set: { "github.cachedAt": new Date(Date.now() - 25 * 3600000) } },
  );
  file = await File.findById(file._id);
  failReads = true;
  await assert.rejects(evictCachedFile(file, client));
  assert.equal((await fs.readFile(file.path)).toString(), bytes.toString());
  failReads = false;
  assert.equal(await evictCachedFile(file, client), true);
  await assert.rejects(fs.access(file.path));
  file = await File.findById(file._id);
  const downloaded = await Promise.all([
    downloadPath(file, client),
    downloadPath(file, client),
  ]);
  assert.equal(downloaded[0], file.path);
  assert.equal((await fs.readFile(file.path)).toString(), bytes.toString());
  // Download stays authorized after the temporary local cache is removed.
  await File.updateOne(
    { _id: file._id },
    { $set: { "github.cachedAt": new Date(Date.now() - 25 * 3600000) } },
  );
  file = await File.findById(file._id);
  await evictCachedFile(file, client);
  assert.equal((await api(other, `/files/${file._id}/download`)).status, 404);
  r = await api(cookie, `/files/${file._id}/download`);
  assert.equal(r.status, 200);
  assert.deepEqual(r.data, bytes);
  await File.updateOne(
    { _id: file._id },
    { $set: { "github.cachedAt": new Date(Date.now() - 25 * 3600000) } },
  );
  file = await File.findById(file._id);
  await evictCachedFile(file, client);
  corruptRaw = true;
  await assert.rejects(downloadPath(await File.findById(file._id), client));
  await assert.rejects(fs.access(file.path));
  corruptRaw = false;
  await downloadPath(await File.findById(file._id), client);
  // An unsynced copy and a recently used cached copy are never evicted.
  const pending = await File.create({
    originalName: "pending.pdf",
    storedName: "pending-" + marker,
    path: path.join(config.uploadDir, "pending-" + marker),
    mimeType: "application/pdf",
    size: bytes.length,
    project: projectId,
    kind: "project",
    entityType: "projects",
    entityId: projectId,
    uploadedBy: owner._id,
    github: { status: "pending" },
  });
  fixtureFiles.push(String(pending._id));
  await fs.writeFile(pending.path, bytes);
  const omitted = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["beckend/storage/backup-files.js"], {
      env: process.env,
      stdio: ["ignore", "pipe", "inherit"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.on("exit", (code) =>
      code === 0
        ? resolve(output.split("\0"))
        : reject(new Error("Backup selection failed")),
    );
  });
  assert(
    omitted.includes(path.relative(config.uploadDir, file.path)),
    "Verified cached copy is omitted from daily upload backups",
  );
  assert(
    !omitted.includes(path.relative(config.uploadDir, pending.path)),
    "Unsynced document retains daily backups",
  );

  assert.equal(await evictCachedFile(pending, client), false);
  await syncFile({ ...pending.toObject(), kind: "avatar" }, client);
  assert.equal(repo.commits, 3);
  await syncFile(
    { ...pending.toObject(), conversation: new mongoose.Types.ObjectId() },
    client,
  );
  assert.equal(repo.commits, 3);
  const second = await api(cookie, "/files", "POST", upload());
  fixtureFiles.push(second.data.id);
  corruptRaw = true;
  await processNextJob(client);
  assert.equal((await File.findById(second.data.id)).github.status, "error");
  corruptRaw = false;
  await StorageJob.updateOne(
    { key: `file:${second.data.id}` },
    { $set: { nextAttempt: new Date(0) } },
  );
  await processNextJob(client);
  assert.equal((await File.findById(second.data.id)).github.status, "synced");
  assert.equal(
    repo.commits,
    4,
    "Incomplete verification retry retains the same file commit",
  );
  r = await api(cookie, `/projects/${projectId}`, "PATCH", {
    title: marker + " renamed",
    description: "Updated description",
  });
  assert.equal(r.status, 200);
  await processNextJob(client);
  assert.equal(
    JSON.parse(repo.files.get("project.json").bytes).description,
    "Updated description",
  );
  await Project.updateOne(
    { _id: projectId },
    { $set: { description: "Recovered after queue insertion failure" } },
  );
  await reconcile();
  await processNextJob(client);
  assert.equal(
    JSON.parse(repo.files.get("project.json").bytes).description,
    "Recovered after queue insertion failure",
  );
  r = await api(cookie, `/projects/${projectId}`, "DELETE");
  assert.equal(r.status, 200);
  assert(repos.has(archive.repository));
  assert(!calls.some((c) => c.method === "DELETE"));
  assert.equal(
    (await Project.findById(projectId)).deletedAt instanceof Date,
    true,
  );
  assert.equal((await api(other, "/storage/status")).status, 403);
  assert.equal((await api(null, `/files/${file._id}/download`)).status, 401);
  console.log(
    JSON.stringify({
      passed: true,
      checks: [
        "Local upload returns before GitHub work",
        "Private repository per project; only title/description/files exported",
        "Durable retry and stale worker lease recovery",
        "Exactly one file commit; idempotent retry after interrupted verification",
        "Remote SHA-256 verified before synced",
        "24h eviction, remote outage preservation, cache rehydration and concurrent downloads",
        "Downloads remain authorized; corrupted remote bytes are rejected",
        "Avatar/chat excluded; deletion never deletes repository; rename updates metadata",
      ],
    }),
  );
} finally {
  apiProcess?.kill("SIGTERM");
  await new Promise((r) => fake.close(r));
  const files = await File.find({ _id: { $in: fixtureFiles } });
  for (const f of files)
    if (f.path.startsWith(config.uploadDir + "/"))
      await fs.unlink(f.path).catch(() => {});
  await File.deleteMany({ _id: { $in: fixtureFiles } });
  await StorageJob.deleteMany({ project: projectId });
  await GitHubArchive.deleteMany({ project: projectId });
  await Project.deleteMany({ _id: projectId });
  await Notification.deleteMany({ createdBy: { $in: ids } });
  await AuditLog.deleteMany({ actor: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
  await fs.unlink(tokenFile).catch(() => {});
  await mongoose.disconnect();
}
