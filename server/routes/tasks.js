import express from "express";
import { z } from "zod";
import { taskStatuses } from "../config.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { Task } from "../models/Task.js";
import { notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { getPagination, paged } from "../utils/pagination.js";

export const tasksRouter = express.Router();

const schema = z.object({
  title: z.string().trim().min(1, "Vazifa nomini kiriting"),
  description: z.string().optional().default(""),
  status: z.enum(taskStatuses).optional().default("todo"),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
  dueDate: z.coerce.date().optional(),
  project: z.string().optional(),
  assignee: z.string().optional(),
});

tasksRouter.use(authRequired, requireRole(["Owner"]));

tasksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignee) filter.assignee = req.query.assignee;
    if (req.query.search) filter.title = new RegExp(String(req.query.search), "i");
    const [items, total] = await Promise.all([
      Task.find(filter).populate("assignee", "name surname email status").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Task.countDocuments(filter),
    ]);
    res.json(paged(items.map((item) => item.toPublic()), total, page, limit));
  })
);

tasksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    const task = await Task.create({ ...data, createdBy: req.user.id });
    await writeAudit(req, "create", "Task", task._id, { title: task.title });
    res.status(201).json(task.toPublic());
  })
);

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = schema.partial().parse(req.body);
    const task = await Task.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!task) throw notFound("Vazifa topilmadi");
    await writeAudit(req, "update", "Task", task._id, { fields: Object.keys(data) });
    res.json(task.toPublic());
  })
);

tasksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) throw notFound("Vazifa topilmadi");
    await writeAudit(req, "delete", "Task", task._id, { title: task.title });
    res.json({ ok: true });
  })
);
