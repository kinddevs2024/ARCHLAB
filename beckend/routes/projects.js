import { z } from "zod";
import { projectStatuses } from "../config.js";
import {
  objectId,
  optionalId,
  optionalDate,
  money,
} from "../utils/validation.js";
import { Project } from "../models/Project.js";
import { resourceRouter } from "./resource.js";
const schema = z.object({
  helper: optionalId,
  master: optionalId,
  title: z.string().trim().min(1, "Loyiha nomini kiriting"),
  company: z.string().trim().max(500).optional().default(""),
  objectName: z.string().trim().max(500).optional().default(""),
  objectAddress: z.string().trim().max(500).optional().default(""),
  customerName: z.string().trim().max(500).optional().default(""),
  customerPhone: z.string().trim().max(500).optional().default(""),
  contractAmount: money.optional().default(0),
  category: z
    .enum([
      "general",
      "single",
      "interior",
      "tex-obs",
      "laboratory",
      "control",
      "render",
    ])
    .optional()
    .default("general"),
  status: z.enum(projectStatuses).optional().default("new"),
  description: z.string().max(10000).optional().default(""),
  date: optionalDate.default(() => new Date()),
  assignedTo: z.array(objectId).optional().default([]),
});
export const projectsRouter = resourceRouter({
  Model: Project,
  schema,
  ...{
    type: "Project",
    entity: "projects",
    dateField: "date",
    fields: [
      "title",
      "company",
      "objectName",
      "objectAddress",
      "customerName",
      "customerPhone",
    ],
    populate: [
      ["assignedTo", "name surname email status"],
      ["helper", "name surname"],
      ["master", "name surname"],
    ],
    project: true,
    finance: false,
    task: false,
  },
});
