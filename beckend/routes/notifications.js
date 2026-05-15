import express from "express";
import { z } from "zod";
import { authRequired, requireRole } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination, paged } from "../utils/pagination.js";

export const notificationsRouter = express.Router();

notificationsRouter.use(authRequired, requireRole(["Owner"]));

notificationsRouter.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total, unread] = await Promise.all([
    Notification.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(),
    Notification.countDocuments({ readBy: { $ne: req.user.id } }),
  ]);
  res.json({ ...paged(items.map((item) => item.toPublic(req.user.id)), total, page, limit), unread });
}));

notificationsRouter.post("/", asyncHandler(async (req, res) => {
  const data = z.object({
    title: z.string().trim().min(1),
    message: z.string().optional().default(""),
    type: z.string().optional().default("info"),
    entityType: z.string().optional().default(""),
    entityId: z.string().optional().default(""),
  }).parse(req.body);
  const item = await Notification.create({ ...data, createdBy: req.user.id });
  res.status(201).json(item.toPublic(req.user.id));
}));

notificationsRouter.patch("/:id/read", asyncHandler(async (req, res) => {
  const item = await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user.id } }, { new: true });
  res.json(item ? item.toPublic(req.user.id) : { ok: true });
}));

notificationsRouter.patch("/read-all", asyncHandler(async (req, res) => {
  await Notification.updateMany({ readBy: { $ne: req.user.id } }, { $addToSet: { readBy: req.user.id } });
  res.json({ ok: true });
}));
