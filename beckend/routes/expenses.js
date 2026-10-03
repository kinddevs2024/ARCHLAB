import { z } from "zod";
import { optionalId, optionalDate, money } from "../utils/validation.js";
import { Expense } from "../models/Expense.js";
import { resourceRouter } from "./resource.js";
const schema = z.object({
  project: optionalId,
  title: z.string().trim().min(1, "Xarajat nomini kiriting"),
  amount: money.optional().default(0),
  advance: money.optional().default(0),
  totalPaid: money.optional().default(0),
  date: optionalDate.default(() => new Date()),
  closedAt: optionalDate,
  notes: z.string().max(10000).optional().default(""),
});
export const expensesRouter = resourceRouter({
  Model: Expense,
  schema,
  ...{
    type: "Expense",
    entity: "expenses",
    dateField: "date",
    fields: ["title"],
    populate: [["project", "title category"]],
    project: false,
    finance: true,
    task: false,
  },
});
