import express from "express";
import { z } from "zod";
import { documentStatuses } from "../config.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { Letter } from "../models/Letter.js";
import { notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { createNotification } from "../utils/notify.js";
import { getPagination, paged } from "../utils/pagination.js";

export const lettersRouter = express.Router();

const schema = z.object({
  project: z.string().trim().optional().transform((value) => value || undefined),
  direction: z.enum(["incoming", "outgoing"]).optional().default("outgoing"),
  title: z.string().trim().min(1, "Xat nomini kiriting"),
  customerName: z.string().trim().optional().default(""),
  customerPhone: z.string().trim().optional().default(""),
  amount: z.coerce.number().optional().default(0),
  date: z.coerce.date().optional().default(() => new Date()),
  status: z.enum(documentStatuses).optional().default("draft"),
  notes: z.string().optional().default(""),
});

lettersRouter.use(authRequired, requireRole(["Owner"]));

lettersRouter.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.direction) filter.direction = req.query.direction;
  if (req.query.year) {
    const start = new Date(Number(req.query.year), 0, 1);
    const end = new Date(Number(req.query.year) + 1, 0, 1);
    filter.date = { $gte: start, $lt: end };
  }
  if (req.query.search) {
    const search = new RegExp(String(req.query.search), "i");
    filter.$or = [{ title: search }, { customerName: search }];
  }

  const [items, total] = await Promise.all([
    Letter.find(filter).populate("project", "title category").sort({ date: -1 }).skip(skip).limit(limit),
    Letter.countDocuments(filter),
  ]);
  res.json(paged(items.map((item) => item.toPublic()), total, page, limit));
}));

lettersRouter.post("/", asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const item = await Letter.create({ ...data, createdBy: req.user.id });
  await writeAudit(req, "create", "Letter", item._id, { title: item.title });
  await createNotification(req, "Xat yaratildi", item.title, { type: "letter", entityType: "letters", entityId: item._id });
  res.status(201).json(item.toPublic());
}));

lettersRouter.patch("/:id", asyncHandler(async (req, res) => {
  const data = schema.partial().parse(req.body);
  const item = await Letter.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!item) throw notFound("Xat topilmadi");
  await writeAudit(req, "update", "Letter", item._id, { fields: Object.keys(data) });
  await createNotification(req, "Xat yangilandi", item.title, { type: "letter", entityType: "letters", entityId: item._id });
  res.json(item.toPublic());
}));

lettersRouter.delete("/:id", asyncHandler(async (req, res) => {
  const item = await Letter.findByIdAndDelete(req.params.id);
  if (!item) throw notFound("Xat topilmadi");
  await writeAudit(req, "delete", "Letter", item._id, { title: item.title });
  await createNotification(req, "Xat o'chirildi", item.title, { type: "letter", entityType: "letters", entityId: item._id });
  res.json({ ok: true });
}));
