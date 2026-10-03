import { asyncHandler } from "../utils/asyncHandler.js";
import { checkProject, isManager } from "../middleware/access.js";
import { forbidden } from "../utils/apiError.js";
import { z } from "zod";
import { projectStatuses } from "../config.js";
import {
  objectId,
  optionalId,
  optionalDate,
  money,
} from "../utils/validation.js";
import { ProjectFolder } from "../models/ProjectFolder.js";
import { resourceRouter } from "./resource.js";
const schema = z.object({
  project: objectId,
  parent: optionalId,
  contactPhone: z.string().trim().max(40).optional().default(""),
  title: z.string().trim().min(1, "Papka nomini kiriting"),
  key: z.string().trim().max(500).optional().default(""),
  status: z.enum(projectStatuses).optional().default("new"),
  date: optionalDate.default(() => new Date()),
  order: money.optional().default(0),
  description: z.string().max(10000).optional().default(""),
  assignedTo: z.array(objectId).optional().default([]),
});
const baseRouter = resourceRouter({
  Model: ProjectFolder,
  schema,
  ...{
    type: "ProjectFolder",
    entity: "project-folders",
    dateField: "date",
    fields: ["title"],
    populate: [["assignedTo", "name surname email status"]],
    project: false,
    finance: false,
    task: false,
  },
});

import express from "express";
import { authRequired } from "../middleware/auth.js";
export const projectFoldersRouter = express.Router();
let defaultsQueue = Promise.resolve();
projectFoldersRouter.post(
  "/defaults",
  authRequired,
  asyncHandler(async (req, res) => {
    if (!isManager(req.user)) throw forbidden();
    const data = z
      .object({
        project: objectId,
        titles: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
      })
      .parse(req.body);
    await checkProject(req.user, data.project);
    const job = defaultsQueue
      .catch(() => {})
      .then(async () => {
        for (const [order, title] of [...new Set(data.titles)].entries())
          await ProjectFolder.findOneAndUpdate(
            { project: data.project, parent: null, title, deletedAt: null },
            { $setOnInsert: { order, createdBy: req.user.id } },
            {
              returnDocument: "after",
              upsert: true,
              setDefaultsOnInsert: true,
            },
          );
      });
    defaultsQueue = job;
    await job;
    res.json({ ok: true });
  }),
);
projectFoldersRouter.use(baseRouter);
