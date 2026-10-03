import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import {
  fileAccess,
  visibleFileFilter,
  fileFor,
} from "../middleware/fileAccess.js";
import { upload } from "../middleware/upload.js";
import { File } from "../models/File.js";
import { config } from "../config.js";
import { badRequest, notFound, forbidden } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { getPagination, paged } from "../utils/pagination.js";
import { optionalId, literalSearch, requireId } from "../utils/validation.js";
export const filesRouter = express.Router();
filesRouter.use(authRequired);
const filterFor = async (req) => {
  const filter = {
    $and: [await visibleFileFilter(req.user)],
    deletedAt: req.query.trash === "true" ? { $ne: null } : null,
  };
  for (const k of [
    "kind",
    "section",
    "entityType",
    "entityId",
    "project",
    "folder",
    "conversation",
  ])
    if (req.query[k]) filter[k] = String(req.query[k]);
  if (!req.query.kind) filter.kind = { $ne: "avatar" };
  if (req.query.id) filter._id = requireId(req.query.id);
  if (req.query.extension)
    filter.extension =
      req.query.extension === "doc"
        ? { $in: [".doc", ".docx"] }
        : "." + String(req.query.extension);
  if (req.query.search) filter.originalName = literalSearch(req.query.search);
  return filter;
};
filesRouter.get(
  "/counts",
  asyncHandler(async (req, res) => {
    const items = await File.find(await filterFor(req)).select(
      "entityId size extension",
    );
    const data = {};
    for (const file of items) {
      if (!file.entityId) continue;
      data[file.entityId] ??= { count: 0, size: 0, extensions: {} };
      data[file.entityId].count++;
      data[file.entityId].size += file.size;
      const type =
        file.extension === ".docx" ? "doc" : file.extension?.slice(1);
      data[file.entityId].extensions[type] =
        (data[file.entityId].extensions[type] || 0) + 1;
    }
    res.json({ data });
  }),
);
filesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query),
      filter = await filterFor(req);
    const [items, total] = await Promise.all([
      File.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      File.countDocuments(filter),
    ]);
    res.json(
      paged(
        items.map((i) => i.toPublic()),
        total,
        page,
        limit,
      ),
    );
  }),
);
const metadata = z.object({
  kind: z
    .enum(["document", "project", "contract", "letter", "order", "chat"])
    .default("document"),
  section: z.string().max(40).default("archive"),
  entityType: z.enum([
    "projects",
    "project-folders",
    "contracts",
    "letters",
    "orders",
    "conversations",
  ]),
  entityId: z.string().regex(/^[a-f\d]{24}$/i),
  project: optionalId,
  folder: optionalId,
  conversation: optionalId,
});
filesRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest("Faylni tanlang");
    try {
      const data = metadata.parse(req.body);
      if (data.entityType === "conversations")
        data.conversation = data.entityId;
      await fileAccess(req.user, data, true);
      const handle = await fs.open(req.file.path, "r");
      const bytes = Buffer.alloc(8);
      await handle.read(bytes, 0, 8, 0);
      await handle.close();
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === ".pdf" && bytes.subarray(0, 5).toString() !== "%PDF-")
        throw badRequest("PDF fayl noto'g'ri");
      if (
        [".docx", ".xlsx", ".zip"].includes(ext) &&
        bytes.subarray(0, 2).toString() !== "PK"
      )
        throw badRequest("Fayl formati noto'g'ri");
      const file = await File.create({
        ...data,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        path: req.file.path,
        mimeType: req.file.mimetype,
        extension: ext,
        size: req.file.size,
        uploadedBy: req.user.id,
      });
      await writeAudit(req, "upload", "File", file._id, {
        originalName: file.originalName,
      });
      res.status(201).json(file.toPublic());
    } catch (error) {
      await fs.unlink(req.file.path).catch(() => {});
      throw error;
    }
  }),
);
filesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const file = await fileFor(req.user, req.params.id);
    res.json(file.toPublic());
  }),
);
filesRouter.get(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const file = await fileFor(req.user, req.params.id);
    const resolved = path.resolve(file.path);
    if (!resolved.startsWith(config.uploadDir + path.sep)) throw forbidden();
    try {
      await fs.access(resolved);
    } catch {
      throw notFound("Fayl diskda topilmadi");
    }
    await writeAudit(req, "download", "File", file._id);
    res.download(resolved, file.originalName);
  }),
);
filesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const file = await fileFor(req.user, req.params.id, true);
    file.deletedAt = new Date();
    file.deletedBy = req.user.id;
    await file.save();
    await writeAudit(req, "archive", "File", file._id);
    res.json({ ok: true });
  }),
);
filesRouter.post(
  "/:id/restore",
  asyncHandler(async (req, res) => {
    const file = await fileFor(req.user, req.params.id, true, true);
    file.deletedAt = null;
    file.deletedBy = null;
    await file.save();
    res.json(file.toPublic());
  }),
);
