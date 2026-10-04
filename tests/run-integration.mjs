import { spawn } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
const mongo = process.env.MONGODB_URI || "mongodb://127.0.0.1:27021/archlab_ci";
if (!mongo.startsWith("mongodb://127.0.0.1:27021/"))
  throw new Error("Tests require isolated MongoDB on port 27021");
const env = {
  ...process.env,
  NODE_ENV: "development",
  GITHUB_STORAGE_ENABLED: "false",
  MONGODB_URI: mongo,
  JWT_SECRET: crypto.randomBytes(48).toString("hex"),
  HOST: "127.0.0.1",
  PORT: "4031",
  CORS_ORIGIN: "http://127.0.0.1:5174",
  UPLOAD_DIR: path.resolve("test-artifacts/uploads"),
  VITE_API_PROXY: "http://127.0.0.1:4031",
  VITE_PORT: "5174",
  SCREENSHOT_DIR: path.resolve("test-artifacts/screenshots"),
  REPORT_PATH: path.resolve("test-artifacts/browser-report.json"),
};
const children = [];
const start = (args) => {
  const child = spawn(process.execPath, args, {
    env,
    stdio: ["ignore", "ignore", "inherit"],
  });
  children.push(child);
  return child;
};
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit" });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Test command failed")),
    );
  });
const wait = async (url) => {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* Service may still be starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Test service did not start");
};
try {
  await run(["tests/github-storage.test.mjs"]);
  if (process.argv.includes("--storage-only")) process.exitCode = 0;
  else {
    start(["beckend/server.js"]);
    start([
      "node_modules/vite/bin/vite.js",
      "--host",
      "127.0.0.1",
      "--port",
      "5174",
    ]);
    await Promise.all([
      wait("http://127.0.0.1:4031/api/health"),
      wait("http://127.0.0.1:5174"),
    ]);
    if (!process.argv.includes("--polish-only")) {
      await run(["--test", "tests/api.test.mjs"]);
      await run(["tests/staging-browser.mjs"]);
    }
    await run(["tests/ui-polish.test.mjs"]);
  }
} finally {
  for (const child of children) child.kill("SIGTERM");
}
