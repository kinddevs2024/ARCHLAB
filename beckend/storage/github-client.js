import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import { Transform, Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
export const MAX_GITHUB_FILE_BYTES = 95 * 1024 * 1024;
export class StorageError extends Error {
  constructor(code, status = 503, retryAfter = 0) {
    super(code);
    this.name = "StorageError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}
export const fileHashes = async (file, size) => {
  const sha = crypto.createHash("sha1").update(`blob ${size}\0`),
    digest = crypto.createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(file)) {
    bytes += chunk.length;
    sha.update(chunk);
    digest.update(chunk);
  }
  if (bytes !== size) throw new StorageError("LOCAL_FILE_SIZE_MISMATCH");
  return { blobSha: sha.digest("hex"), sha256: digest.digest("hex") };
};
export class GitHubStorageClient {
  constructor({
    token,
    owner,
    baseUrl = "https://api.github.com",
    delayMs = 1200,
  }) {
    if (
      process.env.NODE_ENV === "production" &&
      baseUrl !== "https://api.github.com"
    )
      throw new StorageError("INVALID_GITHUB_ENDPOINT");
    if (!/^[a-z\d][a-z\d-]{0,38}$/i.test(owner))
      throw new StorageError("INVALID_GITHUB_OWNER");
    this.token = token;
    this.owner = owner;
    this.base = baseUrl;
    this.delayMs = delayMs;
    this.nextWrite = 0;
    this.repoWrites = new Map();
    this.writes = [];
  }
  async request(
    endpoint,
    { method = "GET", body, raw = false, missing = false } = {},
  ) {
    if (method !== "GET") {
      const repo = endpoint.match(/^\/repos\/[^/]+\/([^/]+)\/contents\//)?.[1];
      this.writes = this.writes.filter((t) => Date.now() - t < 3600000);
      if (this.writes.length >= 450)
        throw new StorageError(
          "GITHUB_WRITE_RATE_PAUSED",
          429,
          this.writes[0] + 3600000 - Date.now(),
        );
      const delay =
        Math.max(this.nextWrite, repo ? this.repoWrites.get(repo) || 0 : 0) -
        Date.now();
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      this.nextWrite = Date.now() + this.delayMs;
      if (repo)
        this.repoWrites.set(repo, Date.now() + (this.delayMs ? 10000 : 0));
      this.writes.push(Date.now());
    }
    let res;
    try {
      res = await fetch(this.base + endpoint, {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(raw ? 180000 : 120000),
        headers: {
          Authorization: `Bearer ${this.token}`,
          "User-Agent": "ARCHLAB-project-archive",
          Accept: raw
            ? "application/vnd.github.raw+json"
            : "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new StorageError("GITHUB_NETWORK_UNAVAILABLE");
    }
    if (missing && res.status === 404) {
      await res.body?.cancel();
      return null;
    }
    if (!res.ok) {
      const retry =
        Number(res.headers.get("retry-after")) * 1000 ||
        Math.max(
          0,
          Number(res.headers.get("x-ratelimit-reset")) * 1000 - Date.now(),
        );
      await res.body?.cancel();
      throw new StorageError(`GITHUB_HTTP_${res.status}`, res.status, retry);
    }
    return raw ? res : res.json();
  }
  repoPath(repo) {
    if (!/^archlab-[a-z\d-]+$/.test(repo))
      throw new StorageError("INVALID_REPOSITORY");
    return `/repos/${encodeURIComponent(this.owner)}/${repo}`;
  }
  async verifyOwner() {
    const user = await this.request("/user");
    if (user.login.toLowerCase() !== this.owner.toLowerCase())
      throw new StorageError("GITHUB_ACCOUNT_MISMATCH");
    return user.login;
  }
  async ensureRepo(repo, description) {
    let item = await this.request(this.repoPath(repo), { missing: true });
    if (!item) {
      try {
        item = await this.request("/user/repos", {
          method: "POST",
          body: {
            name: repo,
            description: description.slice(0, 350),
            private: true,
            auto_init: true,
            has_issues: false,
            has_wiki: false,
            has_projects: false,
          },
        });
      } catch (e) {
        if (e.status !== 422) throw e;
        item = await this.request(this.repoPath(repo));
      }
    }
    if (
      !item.private ||
      item.owner.login.toLowerCase() !== this.owner.toLowerCase()
    )
      throw new StorageError("REPOSITORY_MUST_BE_PRIVATE");
    if (item.description !== description.slice(0, 350))
      item = await this.request(this.repoPath(repo), {
        method: "PATCH",
        body: { description: description.slice(0, 350) },
      });
    return item;
  }
  async content(repo, file, ref) {
    return this.request(
      this.repoPath(repo) +
        "/contents/" +
        file.split("/").map(encodeURIComponent).join("/") +
        (ref ? "?ref=" + encodeURIComponent(ref) : ""),
      { missing: true },
    );
  }
  async put(repo, file, buffer, message) {
    const wanted = crypto
      .createHash("sha1")
      .update(`blob ${buffer.length}\0`)
      .update(buffer)
      .digest("hex");
    const current = await this.content(repo, file);
    if (current?.sha === wanted) return { blobSha: wanted, commitSha: null };
    const result = await this.request(
      this.repoPath(repo) +
        "/contents/" +
        file.split("/").map(encodeURIComponent).join("/"),
      {
        method: "PUT",
        body: {
          message,
          content: buffer.toString("base64"),
          ...(current?.sha ? { sha: current.sha } : {}),
        },
      },
    );
    if (result.content?.sha !== wanted)
      throw new StorageError("GITHUB_BLOB_MISMATCH");
    return { blobSha: wanted, commitSha: result.commit.sha };
  }
  async verifyBlob(repo, blobSha, expected) {
    const res = await this.request(
      this.repoPath(repo) + "/git/blobs/" + blobSha,
      { raw: true },
    );
    const hash = crypto.createHash("sha256");
    let size = 0;
    for await (const chunk of res.body) {
      size += chunk.length;
      if (size > expected.size)
        throw new StorageError("GITHUB_FILE_SIZE_MISMATCH");
      hash.update(chunk);
    }
    if (size !== expected.size || hash.digest("hex") !== expected.sha256)
      throw new StorageError("GITHUB_FILE_HASH_MISMATCH");
  }
  async download(repo, blobSha, expected, target) {
    const temporary = target + "." + crypto.randomUUID() + ".partial";
    const res = await this.request(
      this.repoPath(repo) + "/git/blobs/" + blobSha,
      { raw: true },
    );
    const hash = crypto.createHash("sha256");
    let size = 0;
    const verify = new Transform({
      transform(chunk, _encoding, done) {
        size += chunk.length;
        if (size > expected.size)
          return done(new StorageError("GITHUB_FILE_SIZE_MISMATCH"));
        hash.update(chunk);
        done(null, chunk);
      },
    });
    try {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await pipeline(
        Readable.fromWeb(res.body),
        verify,
        createWriteStream(temporary, { flags: "wx", mode: 0o600 }),
      );
      if (size !== expected.size || hash.digest("hex") !== expected.sha256)
        throw new StorageError("GITHUB_FILE_HASH_MISMATCH");
      await fs.rename(temporary, target);
    } catch (e) {
      await fs.unlink(temporary).catch(() => {});
      throw e;
    }
  }
}
