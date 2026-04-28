import express from "express";
import { z } from "zod";
import { projectStatuses } from "../config.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { ProjectFolder } from "../models/ProjectFolder.js";
import { notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { createNotification } from "../utils/notify.js";
import { getPagination, paged } from "../utils/pagination.js";

export const projectFoldersRouter = express.Router();

const schema = z.object({
  project: z.string().trim().min(1),
  title: z.string().trim().min(1, "Papka nomini kiriting"),
  key: z.string().trim().optional().default(""),
  status: z.enum(projectStatuses).optional().default("new"),
  date: z.coerce.date().optional().default(() => new Date()),
  order: z.coerce.number().optional().default(0),
  description: z.string().optional().default(""),
  assignedTo: z.array(z.string()).optional().default([]),
});

projectFoldersRouter.use(authRequired, requireRole(["Owner"]));

projectFoldersRouter.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.title = new RegExp(String(req.query.search), "i");

  const [items, total] = await Promise.all([
    ProjectFolder.find(filter)
      .populate("project", "title category")
      .populate("assignedTo", "name surname email status")
      .sort({ order: 1, date: -1 })
      .skip(skip)
      .limit(limit),
    ProjectFolder.countDocuments(filter),
  ]);

  res.json(paged(items.map((item) => item.toPublic()), total, page, limit));
}));

projectFoldersRouter.post("/", asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const item = await ProjectFolder.create({ ...data, createdBy: req.user.id });
  await writeAudit(req, "create", "ProjectFolder", item._id, { title: item.title });
  await createNotification(req, "Papka yaratildi", item.title, { type: "project-folder", entityType: "project-folders", entityId: item._id });
  res.status(201).json(item.toPublic());
}));

projectFoldersRouter.patch("/:id", asyncHandler(async (req, res) => {
  const data = schema.partial().parse(req.body);
  const item = await ProjectFolder.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!item) throw notFound("Papka topilmadi");
  await writeAudit(req, "update", "ProjectFolder", item._id, { fields: Object.keys(data) });
  await createNotification(req, "Papka yangilandi", item.title, { type: "project-folder", entityType: "project-folders", entityId: item._id });
  res.json(item.toPublic());
}));

projectFoldersRouter.delete("/:id", asyncHandler(async (req, res) => {
  const item = await ProjectFolder.findByIdAndDelete(req.params.id);
  if (!item) throw notFound("Papka topilmadi");
  await writeAudit(req, "delete", "ProjectFolder", item._id, { title: item.title });
  await createNotification(req, "Papka o'chirildi", item.title, { type: "project-folder", entityType: "project-folders", entityId: item._id });
  res.json({ ok: true });
}));
