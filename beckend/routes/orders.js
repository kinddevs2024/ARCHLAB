import { z } from "zod";
import { taskStatuses } from "../config.js";
import { optionalId, optionalDate } from "../utils/validation.js";
import { Order } from "../models/Order.js";
import { resourceRouter } from "./resource.js";
const schema = z.object({
  project: optionalId,
  title: z.string().trim().min(1, "Buyuruq nomini kiriting"),
  description: z.string().max(10000).optional().default(""),
  status: z.enum(taskStatuses).optional().default("todo"),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
  issuedAt: optionalDate.default(() => new Date()),
  dueDate: optionalDate,
  assignee: optionalId,
  customerName: z.string().trim().max(500).optional().default(""),
  customerPhone: z.string().trim().max(500).optional().default(""),
});
export const ordersRouter = resourceRouter({
  Model: Order,
  schema,
  ...{
    type: "Order",
    entity: "orders",
    dateField: "issuedAt",
    fields: ["title", "customerName"],
    populate: [
      ["project", "title category"],
      ["assignee", "name surname email status"],
    ],
    project: false,
    finance: false,
    task: false,
  },
});
