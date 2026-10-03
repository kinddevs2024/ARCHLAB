import { z } from "zod";
import { documentStatuses } from "../config.js";
import { optionalId, optionalDate, money } from "../utils/validation.js";
import { Contract } from "../models/Contract.js";
import { resourceRouter } from "./resource.js";
const schema = z.object({
  project: optionalId,
  title: z.string().trim().min(1, "Shartnoma nomini kiriting"),
  contractNumber: z.string().trim().max(500).optional().default(""),
  customerName: z.string().trim().max(500).optional().default(""),
  customerPhone: z.string().trim().max(500).optional().default(""),
  amount: money.optional().default(0),
  advance: money.optional().default(0),
  totalPaid: money.optional().default(0),
  signedAt: optionalDate.default(() => new Date()),
  closedAt: optionalDate,
  status: z.enum(documentStatuses).optional().default("draft"),
  notes: z.string().max(10000).optional().default(""),
});
export const contractsRouter = resourceRouter({
  Model: Contract,
  schema,
  ...{
    type: "Contract",
    entity: "contracts",
    dateField: "signedAt",
    fields: ["title", "customerName", "contractNumber"],
    populate: [["project", "title category"]],
    project: false,
    finance: true,
    task: false,
  },
});
