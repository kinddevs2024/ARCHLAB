import { z } from "zod";
import { documentStatuses } from "../config.js";
import { optionalId, optionalDate, money } from "../utils/validation.js";
import { Letter } from "../models/Letter.js";
import { resourceRouter } from "./resource.js";
const schema = z.object({
  project: optionalId,
  direction: z.enum(["incoming", "outgoing"]).optional().default("outgoing"),
  title: z.string().trim().min(1, "Xat nomini kiriting"),
  customerName: z.string().trim().max(500).optional().default(""),
  customerPhone: z.string().trim().max(500).optional().default(""),
  amount: money.optional().default(0),
  date: optionalDate.default(() => new Date()),
  status: z.enum(documentStatuses).optional().default("draft"),
  notes: z.string().max(10000).optional().default(""),
});
export const lettersRouter = resourceRouter({
  Model: Letter,
  schema,
  ...{
    type: "Letter",
    entity: "letters",
    dateField: "date",
    fields: ["title", "customerName"],
    populate: [["project", "title category"]],
    project: false,
    finance: false,
    task: false,
  },
});
