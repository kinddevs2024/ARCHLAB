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
import { Expense } from "../models/Expense.js";
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
    const q = String(req.query.q || "")
      .normalize("NFKC")
      .trim();
    if (q.length < 2) return res.json({ data: [] });
    const words = q.split(/\s+/).slice(0, 8).map(literalSearch);
    const ids = await visibleProjectIds(req.user),
      scope = isAdmin(req.user) ? {} : { project: { $in: ids } };
    const taskScope = isAdmin(req.user)
      ? {}
      : req.user.status === "User"
        ? {
            assignee: req.user.id,
            $or: [{ project: { $in: ids } }, { project: null }],
          }
        : {
            $or: [
              { project: { $in: ids } },
              { project: null, createdBy: req.user.id },
            ],
          };
    const plans = [
      [
        "project",
        Project,
        projectScope(req.user),
        [
          "title",
          "company",
          "objectName",
          "objectAddress",
          "customerName",
          "customerPhone",
          "description",
        ],
      ],
      [
        "folder",
        ProjectFolder,
        scope,
        ["title", "description", "contactPhone"],
      ],
      [
        "letter",
        Letter,
        scope,
        ["title", "customerName", "customerPhone", "description", "notes"],
      ],
      [
        "order",
        Order,
        scope,
        ["title", "customerName", "customerPhone", "description", "notes"],
      ],
      ["task", Task, taskScope, ["title", "description"]],
      ["file", File, await visibleFileFilter(req.user), ["originalName"]],
      ...(isManager(req.user)
        ? [
            [
              "contract",
              Contract,
              scope,
              [
                "title",
                "contractNumber",
                "customerName",
                "customerPhone",
                "notes",
              ],
            ],
            ["expense", Expense, scope, ["title", "description", "notes"]],
          ]
        : []),
      ...(isAdmin(req.user)
        ? [
            [
              "user",
              User,
              { active: true },
              ["name", "surname", "email", "phone", "position", "username"],
            ],
          ]
        : []),
    ];
    const groups = await Promise.all(
      plans.map(async ([type, Model, access, fields]) => {
        const items = await Model.find({
          deletedAt: null,
          $and: [
            access,
            ...words.map((regex) => ({
              $or: fields.map((field) => ({ [field]: regex })),
            })),
          ],
        })
          .sort({ updatedAt: -1, _id: -1 })
          .limit(8);
        return items.map((item) => {
          const id = String(item._id);
          const href =
            type === "project"
              ? `/projects?record=${id}`
              : type === "folder"
                ? `/projects/${item.project}?folder=${id}`
                : type === "file"
                  ? `/files?file=${id}`
                  : `/${{ user: "users", task: "tasks", letter: "letters", order: "orders", contract: "contracts", expense: "expenses" }[type]}?record=${id}`;
          const title =
            type === "user"
              ? [item.name, item.surname].filter(Boolean).join(" ") ||
                item.email
              : type === "file"
                ? item.originalName
                : item.title;
          const subtitle =
            type === "user"
              ? item.email
              : type === "project"
                ? item.objectAddress || item.company
                : item.customerName || "";
          return { type, id, title, subtitle, href };
        });
      }),
    );
    res.json({ data: groups.flat() });
  }),
);
