import express from "express";
import { authRequired } from "../middleware/auth.js";
import {
  isAdmin,
  isManager,
  projectScope,
  visibleProjectIds,
} from "../middleware/access.js";
import { visibleFileFilter } from "../middleware/fileAccess.js";
import { Project } from "../models/Project.js";
import { ProjectFolder } from "../models/ProjectFolder.js";
import { Contract } from "../models/Contract.js";
import { Letter } from "../models/Letter.js";
import { Order } from "../models/Order.js";
import { Task } from "../models/Task.js";
import { File } from "../models/File.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { literalSearch } from "../utils/validation.js";
export const searchRouter = express.Router();
searchRouter.use(authRequired);
searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json({ data: [] });
    const search = literalSearch(q),
      ids = await visibleProjectIds(req.user),
      scope = isAdmin(req.user) ? {} : { project: { $in: ids } },
      data = [];
    for (const [type, Model, filter, field] of [
      [
        "project",
        Project,
        {
          $and: [projectScope(req.user)],
          $or: [{ title: search }, { objectName: search }, { company: search }],
        },
        "title",
      ],
      ["folder", ProjectFolder, { ...scope, title: search }, "title"],
      ["letter", Letter, { ...scope, title: search }, "title"],
      ["order", Order, { ...scope, title: search }, "title"],
      [
        "task",
        Task,
        {
          ...(req.user.status === "User" ? { assignee: req.user.id } : scope),
          title: search,
        },
        "title",
      ],
      [
        "file",
        File,
        { $and: [await visibleFileFilter(req.user)], originalName: search },
        "originalName",
      ],
      ...(isManager(req.user)
        ? [["contract", Contract, { ...scope, title: search }, "title"]]
        : []),
      ...(isAdmin(req.user)
        ? [
            [
              "user",
              User,
              { $or: [{ name: search }, { email: search }], active: true },
              "email",
            ],
          ]
        : []),
    ]) {
      const items = await Model.find({ ...filter, deletedAt: null }).limit(6);
      for (const item of items) {
        const id = String(item._id);
        let href =
          type === "project"
            ? `/projects/${id}`
            : type === "folder"
              ? `/projects/${item.project}/folders/${id}`
              : type === "file"
                ? `/files?file=${id}`
                : type === "user"
                  ? `/users?record=${id}`
                  : `/${{ contract: "contracts", letter: "letters", order: "orders", task: "tasks" }[type]}?record=${id}`;
        data.push({ type, id, title: item[field] || item.name, href });
      }
    }
    res.json({ data });
  }),
);
