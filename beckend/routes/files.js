import express from "express";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { authRequired, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { File } from "../models/File.js";
import { config } from "../config.js";
import { notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { createNotification } from "../utils/notify.js";
import { getPagination, paged } from "../utils/pagination.js";

export const filesRouter = express.Router();

filesRouter.use(authRequired, requireRole(["Owner"]));

filesRouter.get(
  "/counts",
  asyncHandler(async (req, res) => {
    const match = {};
    if (req.query.kind) match.kind = req.query.kind;
    if (req.query.project) match.project = req.query.project;
    if (req.query.section) match.section = req.query.section;
    if (req.query.entityType) match.entityType = req.query.entityType;
    const items = await File.aggregate([
      { $match: match },
      { $group: { _id: "$entityId", count: { $sum: 1 }, size: { $sum: "$size" } } },
    ]);
    res.json({
      data: items.reduce((acc, item) => {
        if (item._id) acc[item._id] = { count: item.count, size: item.size };
        return acc;
      }, {}),
    });
  })
);

filesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.kind) filter.kind = req.query.kind;
    if (req.query.project) filter.project = req.query.project;
    if (req.query.section) filter.section = req.query.section;
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.entityId) filter.entityId = req.query.entityId;
    const [items, total] = await Promise.all([
      File.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      File.countDocuments(filter),
    ]);
    res.json(paged(items.map((item) => item.toPublic()), total, page, limit));
  })
);

filesRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const file = await File.create({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: req.file.path,
      mimeType: req.file.mimetype,
      extension: path.extname(req.file.originalname).toLowerCase(),
      size: req.file.size,
      kind: req.body.kind || "document",
      section: req.body.section || "archive",
      entityType: req.body.entityType || "",
      entityId: req.body.entityId || "",
      project: req.body.project || undefined,
      uploadedBy: req.user.id,
    });
    await writeAudit(req, "upload", "File", file._id, { originalName: file.originalName });
    await createNotification(req, "Fayl yuklandi", file.originalName, {
      type: "file",
      entityType: file.entityType || "files",
      entityId: file.entityId || file._id,
    });
    res.status(201).json(file.toPublic());
  })
);

filesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = z.object({
      kind: z.string().trim().optional(),
      section: z.string().trim().optional(),
      entityType: z.string().trim().optional(),
      entityId: z.string().trim().optional(),
      project: z.string().trim().optional(),
    }).parse(req.body);
    const file = await File.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!file) throw notFound("Fayl topilmadi");
    await writeAudit(req, "update", "File", file._id, { fields: Object.keys(data) });
    res.json(file.toPublic());
  })
);

filesRouter.get(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) throw notFound("Fayl topilmadi");
    const resolved = path.resolve(file.path);
    if (!resolved.startsWith(config.uploadDir + path.sep) || !fs.existsSync(resolved)) {
      throw notFound("Fayl diskda topilmadi");
    }
    await writeAudit(req, "download", "File", file._id, { originalName: file.originalName });
    res.download(resolved, file.originalName);
  })
);

filesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) throw notFound("Fayl topilmadi");
    const resolved = path.resolve(file.path);
    if (resolved.startsWith(config.uploadDir + path.sep) && fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
    await writeAudit(req, "delete", "File", file._id, { originalName: file.originalName });
    await createNotification(req, "Fayl o'chirildi", file.originalName, {
      type: "file",
      entityType: file.entityType || "files",
      entityId: file.entityId || file._id,
    });
    res.json({ ok: true });
  })
);
