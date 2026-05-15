import express from "express";
import { z } from "zod";
import { documentStatuses } from "../config.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { Contract } from "../models/Contract.js";
import { notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { createNotification } from "../utils/notify.js";
import { getPagination, paged } from "../utils/pagination.js";

export const contractsRouter = express.Router();

const schema = z.object({
  project: z.string().trim().optional().transform((value) => value || undefined),
  title: z.string().trim().min(1, "Shartnoma nomini kiriting"),
  contractNumber: z.string().trim().optional().default(""),
  customerName: z.string().trim().optional().default(""),
  customerPhone: z.string().trim().optional().default(""),
  amount: z.coerce.number().optional().default(0),
  advance: z.coerce.number().optional().default(0),
  totalPaid: z.coerce.number().optional().default(0),
  signedAt: z.coerce.date().optional().default(() => new Date()),
  closedAt: z.coerce.date().optional(),
  status: z.enum(documentStatuses).optional().default("draft"),
  notes: z.string().optional().default(""),
});

contractsRouter.use(authRequired, requireRole(["Owner"]));

contractsRouter.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.year) {
    const start = new Date(Number(req.query.year), 0, 1);
    const end = new Date(Number(req.query.year) + 1, 0, 1);
    filter.signedAt = { $gte: start, $lt: end };
  }
  if (req.query.search) {
    const search = new RegExp(String(req.query.search), "i");
    filter.$or = [{ title: search }, { customerName: search }, { contractNumber: search }];
  }

  const [items, total] = await Promise.all([
    Contract.find(filter).populate("project", "title category").sort({ signedAt: -1 }).skip(skip).limit(limit),
    Contract.countDocuments(filter),
  ]);
  res.json(paged(items.map((item) => item.toPublic()), total, page, limit));
}));

contractsRouter.post("/", asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const item = await Contract.create({ ...data, createdBy: req.user.id });
  await writeAudit(req, "create", "Contract", item._id, { title: item.title });
  await createNotification(req, "Shartnoma yaratildi", item.title, { type: "contract", entityType: "contracts", entityId: item._id });
  res.status(201).json(item.toPublic());
}));

contractsRouter.patch("/:id", asyncHandler(async (req, res) => {
  const data = schema.partial().parse(req.body);
  const item = await Contract.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!item) throw notFound("Shartnoma topilmadi");
  await writeAudit(req, "update", "Contract", item._id, { fields: Object.keys(data) });
  await createNotification(req, "Shartnoma yangilandi", item.title, { type: "contract", entityType: "contracts", entityId: item._id });
  res.json(item.toPublic());
}));

contractsRouter.delete("/:id", asyncHandler(async (req, res) => {
  const item = await Contract.findByIdAndDelete(req.params.id);
  if (!item) throw notFound("Shartnoma topilmadi");
  await writeAudit(req, "delete", "Contract", item._id, { title: item.title });
  await createNotification(req, "Shartnoma o'chirildi", item.title, { type: "contract", entityType: "contracts", entityId: item._id });
  res.json({ ok: true });
}));
