import express from "express";
import { config } from "../config.js";
import { authRequired } from "../middleware/auth.js";
import { adminOnly, checkProject, isAdmin } from "../middleware/access.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  GitHubArchive,
  StorageJob,
  StorageState,
} from "../models/GitHubStorage.js";
import { File } from "../models/File.js";
import { enqueue } from "../storage/github.js";
export const storageRouter = express.Router();
storageRouter.use(authRequired);
storageRouter.get("/capabilities", (_req, res) =>
  res.json({
    enabled: config.github.enabled,
    projectFilesOnly: true,
    maxFileSizeMb: 95,
    cacheHours: config.github.cacheHours,
  }),
);
storageRouter.get(
  "/status",
  adminOnly,
  asyncHandler(async (_req, res) => {
    const [state, pending, saved, errors, repositories] = await Promise.all([
      StorageState.findById("github"),
      StorageJob.countDocuments({ state: { $ne: "done" } }),
      File.countDocuments({ "github.status": "synced" }),
      StorageJob.countDocuments({
        state: { $ne: "done" },
        lastError: { $nin: ["", null] },
      }),
      GitHubArchive.countDocuments({ status: "synced" }),
    ]);
    res.json({
      enabled: config.github.enabled,
      owner: config.github.owner,
      cacheHours: config.github.cacheHours,
      maxFileSizeMb: 95,
      workerHealthy:
        !!state?.heartbeat && Date.now() - +state.heartbeat < 180000,
      heartbeat: state?.heartbeat,
      lastSuccess: state?.lastSuccess,
      pending,
      saved,
      errors,
      repositories,
    });
  }),
);
storageRouter.get(
  "/projects/:id",
  asyncHandler(async (req, res) => {
    await checkProject(req.user, req.params.id);
    const archive = await GitHubArchive.findOne({ project: req.params.id });
    res.json({
      enabled: config.github.enabled,
      status: archive?.status || "pending",
      syncedAt: archive?.syncedAt,
      ...(isAdmin(req.user) ? { url: archive?.url } : {}),
    });
  }),
);
storageRouter.post(
  "/projects/:id/retry",
  adminOnly,
  asyncHandler(async (req, res) => {
    const p = await checkProject(req.user, req.params.id, true);
    await enqueue("project", p);
    for await (const f of File.find({
      project: p._id,
      "github.status": { $ne: "synced" },
    }).cursor())
      await enqueue("file", f);
    res.json({ ok: true });
  }),
);
