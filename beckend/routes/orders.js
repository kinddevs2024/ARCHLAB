import express from "express";
import { z } from "zod";
import { taskStatuses } from "../config.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { Order } from "../models/Order.js";
import { notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { createNotification } from "../utils/notify.js";
import { getPagination, paged } from "../utils/pagination.js";

export const ordersRouter = express.Router();

const schema = z.object({
  project: z.string().trim().optional().transform((value) => value || undefined),
  title: z.string().trim().min(1, "Buyuruq nomini kiriting"),
  description: z.string().optional().default(""),
  status: z.enum(taskStatuses).optional().default("todo"),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
  dueDate: z.coerce.date().optional(),
  assignee: z.string().trim().optional().transform((value) => value || undefined),
  customerName: z.string().trim().optional().default(""),
  customerPhone: z.string().trim().optional().default(""),
});

ordersRouter.use(authRequired, requireRole(["Owner"]));

ordersRouter.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignee) filter.assignee = req.query.assignee;
  if (req.query.year) {
    const start = new Date(Number(req.query.year), 0, 1);
    const end = new Date(Number(req.query.year) + 1, 0, 1);
    filter.createdAt = { $gte: start, $lt: end };
  }
  if (req.query.search) filter.title = new RegExp(String(req.query.search), "i");

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate("project", "title category")
      .populate("assignee", "name surname email status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json(paged(items.map((item) => item.toPublic()), total, page, limit));
}));

ordersRouter.post("/", asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const item = await Order.create({ ...data, createdBy: req.user.id });
  await writeAudit(req, "create", "Order", item._id, { title: item.title });
  await createNotification(req, "Buyuruq yaratildi", item.title, { type: "order", entityType: "orders", entityId: item._id });
  res.status(201).json(item.toPublic());
}));

ordersRouter.patch("/:id", asyncHandler(async (req, res) => {
  const data = schema.partial().parse(req.body);
  const item = await Order.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!item) throw notFound("Buyuruq topilmadi");
  await writeAudit(req, "update", "Order", item._id, { fields: Object.keys(data) });
  await createNotification(req, "Buyuruq yangilandi", item.title, { type: "order", entityType: "orders", entityId: item._id });
  res.json(item.toPublic());
}));

ordersRouter.delete("/:id", asyncHandler(async (req, res) => {
  const item = await Order.findByIdAndDelete(req.params.id);
  if (!item) throw notFound("Buyuruq topilmadi");
  await writeAudit(req, "delete", "Order", item._id, { title: item.title });
  await createNotification(req, "Buyuruq o'chirildi", item.title, { type: "order", entityType: "orders", entityId: item._id });
  res.json({ ok: true });
}));
