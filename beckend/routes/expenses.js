import express from "express";
import { z } from "zod";
import { authRequired, requireRole } from "../middleware/auth.js";
import { Expense } from "../models/Expense.js";
import { notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { getPagination, paged } from "../utils/pagination.js";

export const expensesRouter = express.Router();

const schema = z.object({
  project: z.string().trim().optional().transform((value) => value || undefined),
  title: z.string().trim().min(1, "Xarajat nomini kiriting"),
  amount: z.coerce.number().optional().default(0),
  advance: z.coerce.number().optional().default(0),
  totalPaid: z.coerce.number().optional().default(0),
  date: z.coerce.date().optional().default(() => new Date()),
  closedAt: z.coerce.date().optional(),
  notes: z.string().optional().default(""),
});

expensesRouter.use(authRequired, requireRole(["Owner"]));

expensesRouter.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.year) {
    const start = new Date(Number(req.query.year), 0, 1);
    const end = new Date(Number(req.query.year) + 1, 0, 1);
    filter.date = { $gte: start, $lt: end };
  }
  if (req.query.search) filter.title = new RegExp(String(req.query.search), "i");
  const [items, total] = await Promise.all([
    Expense.find(filter).populate("project", "title category").sort({ date: -1 }).skip(skip).limit(limit),
    Expense.countDocuments(filter),
  ]);
  res.json(paged(items.map((item) => item.toPublic()), total, page, limit));
}));

expensesRouter.post("/", asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const item = await Expense.create({ ...data, createdBy: req.user.id });
  await writeAudit(req, "create", "Expense", item._id, { title: item.title });
  res.status(201).json(item.toPublic());
}));

expensesRouter.patch("/:id", asyncHandler(async (req, res) => {
  const data = schema.partial().parse(req.body);
  const item = await Expense.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!item) throw notFound("Xarajat topilmadi");
  await writeAudit(req, "update", "Expense", item._id, { fields: Object.keys(data) });
  res.json(item.toPublic());
}));

expensesRouter.delete("/:id", asyncHandler(async (req, res) => {
  const item = await Expense.findByIdAndDelete(req.params.id);
  if (!item) throw notFound("Xarajat topilmadi");
  await writeAudit(req, "delete", "Expense", item._id, { title: item.title });
  res.json({ ok: true });
}));
