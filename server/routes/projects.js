import express from "express";
import { z } from "zod";
import { projectStatuses } from "../config.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { Project } from "../models/Project.js";
import { notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { createNotification } from "../utils/notify.js";
import { getPagination, paged } from "../utils/pagination.js";

export const projectsRouter = express.Router();

const schema = z.object({
  title: z.string().trim().min(1, "Loyiha nomini kiriting"),
  company: z.string().trim().optional().default(""),
  objectName: z.string().trim().optional().default(""),
  objectAddress: z.string().trim().optional().default(""),
  customerName: z.string().trim().optional().default(""),
  customerPhone: z.string().trim().optional().default(""),
  contractAmount: z.coerce.number().optional().default(0),
  category: z.string().trim().optional().default("general"),
  status: z.enum(projectStatuses).optional().default("new"),
  description: z.string().optional().default(""),
  date: z.coerce.date().optional().default(() => new Date()),
  assignedTo: z.array(z.string()).optional().default([]),
});

projectsRouter.use(authRequired, requireRole(["Owner"]));

projectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.year) {
      const start = new Date(Number(req.query.year), 0, 1);
      const end = new Date(Number(req.query.year) + 1, 0, 1);
      filter.date = { $gte: start, $lt: end };
    }
    if (req.query.search) {
      const search = new RegExp(String(req.query.search), "i");
      filter.$or = [{ title: search }, { company: search }, { objectName: search }, { customerName: search }];
    }

    const [items, total] = await Promise.all([
      Project.find(filter)
        .populate("assignedTo", "name surname email status")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(filter),
    ]);
    res.json(paged(items.map((item) => item.toPublic()), total, page, limit));
  })
);

projectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id).populate("assignedTo", "name surname email status");
    if (!project) throw notFound("Loyiha topilmadi");
    res.json(project.toPublic());
  })
);

projectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const project = await Project.create({ ...data, owner: req.user.id });
    await writeAudit(req, "create", "Project", project._id, { title: project.title });
    await createNotification(req, "Loyiha yaratildi", project.title, { type: "project", entityType: "projects", entityId: project._id });
    res.status(201).json(project.toPublic());
  })
);

projectsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = schema.partial().parse(req.body);
    const project = await Project.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!project) throw notFound("Loyiha topilmadi");
    await writeAudit(req, "update", "Project", project._id, { fields: Object.keys(data) });
    await createNotification(req, "Loyiha yangilandi", project.title, { type: "project", entityType: "projects", entityId: project._id });
    res.json(project.toPublic());
  })
);

projectsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) throw notFound("Loyiha topilmadi");
    await writeAudit(req, "delete", "Project", project._id, { title: project.title });
    await createNotification(req, "Loyiha o'chirildi", project.title, { type: "project", entityType: "projects", entityId: project._id });
    res.json({ ok: true });
  })
);
