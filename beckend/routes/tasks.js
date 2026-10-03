import { z } from "zod";
import { taskStatuses } from "../config.js";
import { optionalId, optionalDate } from "../utils/validation.js";
import { Task } from "../models/Task.js";
import { resourceRouter } from "./resource.js";
const schema = z.object({
  title: z.string().trim().min(1, "Vazifa nomini kiriting"),
  description: z.string().max(10000).optional().default(""),
  status: z.enum(taskStatuses).optional().default("todo"),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
  dueDate: optionalDate,
  project: optionalId,
  assignee: optionalId,
});
export const tasksRouter = resourceRouter({
  Model: Task,
  schema,
  ...{
    type: "Task",
    entity: "tasks",
    dateField: "createdAt",
    fields: ["title", "description"],
    populate: [
      ["project", "title category"],
      ["assignee", "name surname email status"],
    ],
    project: false,
    finance: false,
    task: true,
  },
});
