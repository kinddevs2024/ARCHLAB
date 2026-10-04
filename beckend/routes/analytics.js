import express from "express";
import mongoose from "mongoose";
import { authRequired } from "../middleware/auth.js";
import { isAdmin, projectScope, checkProject } from "../middleware/access.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { AuditLog } from "../models/AuditLog.js";
import { File } from "../models/File.js";
import { ProjectFolder } from "../models/ProjectFolder.js";
import { Contract } from "../models/Contract.js";
import { Expense } from "../models/Expense.js";
import { Letter } from "../models/Letter.js";
import { Order } from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest } from "../utils/apiError.js";
import { getPagination } from "../utils/pagination.js";

const timezone = "Asia/Tashkent",
  offset = 5 * 3600000;
const businessActions = [
  "create",
  "update",
  "upload",
  "archive",
  "restore",
  "avatar",
  "deactivate",
];
const models = {
  Project,
  Task,
  File,
  ProjectFolder,
  Contract,
  Expense,
  Letter,
  Order,
  User,
};
const links = {
  Project: "projects",
  Task: "tasks",
  File: "files",
  Contract: "contracts",
  Expense: "expenses",
  Letter: "letters",
  Order: "orders",
  User: "users",
};
const id = (value) => new mongoose.Types.ObjectId(value);
const number = (values) => values?.[0]?.count || 0;
const pageMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.max(1, Math.ceil(total / limit)),
});
const displayName = (person) =>
  [person?.name, person?.surname].filter(Boolean).join(" ") ||
  person?.username ||
  "Xodim";
const completion = (done, total) =>
  total ? Math.round((done / total) * 100) : null;
const personSummary = (person) => ({
  id: String(person._id),
  name: displayName(person),
  avatar: person.avatar,
  position: person.position || "",
  active: person.active,
});

// Day boundaries follow the product's Uzbekistan timezone, including today's partial day.
function timeWindow(days, now) {
  const local = new Date(now.getTime() + offset);
  const today = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) -
      offset,
  );
  const from = new Date(today.getTime() - (days - 1) * 86400000);
  return { today, from, to: now };
}
function dailyPipeline(from, to) {
  return [
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone },
        },
        count: { $sum: 1 },
      },
    },
  ];
}
function activityProjectPipeline(project) {
  if (!project) return [];
  const operations = [
    {
      $set: {
        recordId: {
          $convert: {
            input: "$entityId",
            to: "objectId",
            onError: null,
            onNull: null,
          },
        },
      },
    },
  ];
  const branches = [{ entity: "Project", recordId: project }];
  for (const entity of [
    "Task",
    "File",
    "ProjectFolder",
    "Contract",
    "Expense",
    "Letter",
    "Order",
  ]) {
    const name = "linked" + entity;
    operations.push({
      $lookup: {
        from: models[entity].collection.name,
        as: name,
        let: { record: "$recordId", type: "$entity" },
        pipeline: [
          {
            $match: {
              project,
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$record"] },
                  { $eq: ["$$type", entity] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
      },
    });
    branches.push({ [name + ".0"]: { $exists: true } });
  }
  operations.push({ $match: { $or: branches } });
  return operations;
}
async function activityDetails(events) {
  const records = new Map();
  await Promise.all(
    Object.entries(models).map(async ([entity, Model]) => {
      const ids = events
        .filter(
          (e) => e.entity === entity && mongoose.isValidObjectId(e.entityId),
        )
        .map((e) => id(e.entityId));
      if (!ids.length) return;
      for (const row of await Model.find({ _id: { $in: ids } })
        .select("title originalName name surname username project deletedAt")
        .lean())
        records.set(entity + ":" + row._id, row);
    }),
  );
  const actors = await User.find({
    _id: { $in: events.map((e) => e.actor).filter(Boolean) },
  })
    .select("name surname username avatar")
    .lean();
  const people = new Map(actors.map((p) => [String(p._id), personSummary(p)]));
  return events.map((event) => {
    const record = records.get(event.entity + ":" + event.entityId);
    let href = null;
    if (record && !record.deletedAt) {
      if (event.entity === "File") href = `/files?file=${record._id}`;
      else if (event.entity === "ProjectFolder")
        href = `/projects/${record.project}?folder=${record._id}`;
      else if (links[event.entity])
        href = `/${links[event.entity]}?record=${record._id}`;
    }
    if (event.entity === "Profile" || event.entity === "CompanySettings")
      href = "/settings";
    return {
      id: String(event._id),
      action: event.action,
      entity: event.entity,
      time: event.createdAt,
      actor: people.get(String(event.actor)) || { name: "O'chirilgan xodim" },
      title:
        record?.title ||
        record?.originalName ||
        (record && event.entity === "User" ? displayName(record) : null) ||
        event.details?.title ||
        event.details?.originalName ||
        null,
      href,
    };
  });
}

export const analyticsRouter = express.Router();
analyticsRouter.use(authRequired);
analyticsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const days = Number(req.query.days ?? 30);
    if (![7, 30, 90].includes(days))
      throw badRequest("Davr 7, 30 yoki 90 kun bo'lishi kerak");
    const projectPage = getPagination({ page: req.query.page, limit: 8 });
    const teamPage = getPagination({ page: req.query.teamPage, limit: 8 });
    const activityPage = getPagination({
      page: req.query.activityPage,
      limit: 12,
    });
    const now = new Date(),
      window = timeWindow(days, now),
      owner = req.user.status === "Owner";
    const userId = id(req.user.id);
    const projectFilter = {
      ...projectScope({ ...req.user, id: userId }),
      deletedAt: null,
    };
    let selected = null;
    if (req.query.project) {
      selected = await checkProject(req.user, req.query.project);
      projectFilter._id = selected._id;
    }
    const ids = isAdmin(req.user)
      ? []
      : (await Project.find(projectFilter).select("_id").lean()).map(
          (p) => p._id,
        );
    const taskFilter = { deletedAt: null, status: { $ne: "archived" } };
    if (selected) taskFilter.project = selected._id;
    else if (!isAdmin(req.user))
      taskFilter.$or = [
        { project: { $in: ids } },
        { project: null, createdBy: userId },
      ];
    if (req.user.status === "User") {
      taskFilter.assignee = userId;
      if (!selected)
        taskFilter.$or = [{ project: { $in: ids } }, { project: null }];
    }
    const overdue = {
      $and: [
        { $in: ["$status", ["todo", "in_progress"]] },
        { $ne: [{ $ifNull: ["$dueDate", null] }, null] },
        { $lt: ["$dueDate", window.today] },
      ],
    };
    const taskGroup = (key) => ({
      $group: {
        _id: key,
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
        open: {
          $sum: {
            $cond: [{ $in: ["$status", ["todo", "in_progress"]] }, 1, 0],
          },
        },
        overdue: { $sum: { $cond: [overdue, 1, 0] } },
      },
    });
    const [portfolio, tasks, assignments, audit] = await Promise.all([
      Project.aggregate([
        { $match: projectFilter },
        {
          $facet: {
            statuses: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            categories: [{ $group: { _id: "$category", count: { $sum: 1 } } }],
            total: [{ $count: "count" }],
            rows: [
              { $sort: { updatedAt: -1, _id: -1 } },
              { $skip: projectPage.skip },
              { $limit: 8 },
              {
                $project: {
                  title: 1,
                  category: 1,
                  status: 1,
                  assignedTo: 1,
                  helper: 1,
                  master: 1,
                  updatedAt: 1,
                },
              },
            ],
            daily: dailyPipeline(window.from, window.to),
          },
        },
      ]),
      Task.aggregate([
        { $match: taskFilter },
        {
          $facet: {
            summary: [taskGroup(null)],
            statuses: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            people: [taskGroup("$assignee")],
          },
        },
      ]),
      Project.aggregate([
        { $match: projectFilter },
        {
          $project: {
            members: {
              $setDifference: [
                {
                  $setUnion: [
                    { $ifNull: ["$assignedTo", []] },
                    ["$helper", "$master"],
                  ],
                },
                [null],
              ],
            },
          },
        },
        { $unwind: "$members" },
        { $group: { _id: "$members", count: { $sum: 1 } } },
      ]),
      owner
        ? AuditLog.aggregate([
            {
              $match: {
                action: { $in: businessActions },
                createdAt: { $gte: window.from, $lte: window.to },
              },
            },
            ...activityProjectPipeline(selected?._id),
            {
              $facet: {
                daily: [
                  {
                    $group: {
                      _id: {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$createdAt",
                          timezone,
                        },
                      },
                      count: { $sum: 1 },
                    },
                  },
                ],
                total: [{ $count: "count" }],
                latest: [
                  { $sort: { createdAt: -1, _id: -1 } },
                  { $skip: activityPage.skip },
                  { $limit: 12 },
                  {
                    $project: {
                      actor: 1,
                      action: 1,
                      entity: 1,
                      entityId: 1,
                      createdAt: 1,
                      "details.title": 1,
                      "details.originalName": 1,
                    },
                  },
                ],
              },
            },
          ])
        : null,
    ]);
    const p = portfolio[0],
      t = tasks[0],
      summary = t.summary[0] || { total: 0, done: 0, open: 0, overdue: 0 };
    const linkedUsers = [
      ...assignments.map((a) => a._id),
      ...t.people.map((a) => a._id),
    ].filter(Boolean);
    const userFilter =
      req.user.status === "User"
        ? { _id: userId }
        : isAdmin(req.user) && !selected
          ? { $or: [{ active: true }, { _id: { $in: linkedUsers } }] }
          : { _id: { $in: linkedUsers } };
    const [
      people,
      peopleCount,
      projectTaskGroups,
      populatedRows,
      overdueTasks,
    ] = await Promise.all([
      User.find(userFilter)
        .select("name surname username position avatar active")
        .sort({ active: -1, name: 1, surname: 1, _id: 1 })
        .skip(teamPage.skip)
        .limit(8)
        .lean(),
      User.countDocuments(userFilter),
      Task.aggregate([
        {
          $match: {
            ...taskFilter,
            project: { $in: p.rows.map((row) => row._id) },
          },
        },
        taskGroup("$project"),
      ]),
      Project.populate(
        p.rows,
        ["assignedTo", "helper", "master"].map((path) => ({
          path,
          select: "name surname username avatar",
        })),
      ),
      Task.find({
        ...taskFilter,
        status: { $in: ["todo", "in_progress"] },
        dueDate: { $lt: window.today },
      })
        .select("title dueDate priority assignee project")
        .sort({ dueDate: 1, _id: 1 })
        .limit(5)
        .populate("assignee", "name surname username")
        .lean(),
    ]);
    const taskMap = new Map(t.people.map((row) => [String(row._id), row]));
    const assignmentMap = new Map(
      assignments.map((row) => [String(row._id), row.count]),
    );
    const projectMap = new Map(
      projectTaskGroups.map((row) => [String(row._id), row]),
    );
    const byStatus = Object.fromEntries(
      p.statuses.map((row) => [row._id, row.count]),
    );
    const daysMap = new Map(
      (owner ? audit[0].daily : p.daily).map((row) => [row._id, row.count]),
    );
    const timeline = Array.from({ length: days }, (_, n) => {
      const date = new Date(window.from.getTime() + n * 86400000 + offset)
        .toISOString()
        .slice(0, 10);
      return { date, count: daysMap.get(date) || 0 };
    });
    res.json({
      meta: {
        generatedAt: now,
        timezone,
        days,
        from: window.from,
        to: window.to,
        personal: req.user.status === "User",
        activityAvailable: owner,
        project: selected
          ? { id: String(selected._id), title: selected.title }
          : null,
      },
      summary: {
        projects: number(p.total),
        openProjects: (byStatus.new || 0) + (byStatus.in_progress || 0),
        completedProjects: byStatus.done || 0,
        tasks: summary.total,
        doneTasks: summary.done,
        openTasks: summary.open,
        overdueTasks: summary.overdue,
        completion: completion(summary.done, summary.total),
        unassignedTasks: taskMap.get("null")?.open || 0,
        periodActions: owner ? number(audit[0].total) : null,
        createdProjects: p.daily.reduce((sum, row) => sum + row.count, 0),
      },
      statuses: ["new", "in_progress", "done", "archived"].map((status) => ({
        status,
        count: byStatus[status] || 0,
      })),
      taskStatuses: ["todo", "in_progress", "done"].map((status) => ({
        status,
        count: t.statuses.find((row) => row._id === status)?.count || 0,
      })),
      categories: p.categories.map((row) => ({
        category: row._id || "general",
        count: row.count,
      })),
      timeline,
      projects: {
        meta: pageMeta(number(p.total), projectPage.page, 8),
        rows: populatedRows.map((row) => {
          const counts = projectMap.get(String(row._id)) || {
            total: 0,
            done: 0,
            open: 0,
            overdue: 0,
          };
          const members = new Map(
            [...(row.assignedTo || []), row.helper, row.master]
              .filter(Boolean)
              .map((person) => [String(person._id), personSummary(person)]),
          );
          return {
            id: String(row._id),
            title: row.title,
            status: row.status,
            category: row.category,
            members: [...members.values()],
            tasks: counts.total,
            done: counts.done,
            overdue: counts.overdue,
            completion: completion(counts.done, counts.total),
          };
        }),
      },
      team: {
        meta: pageMeta(peopleCount, teamPage.page, 8),
        rows: people.map((person) => {
          const counts = taskMap.get(String(person._id)) || {
            total: 0,
            done: 0,
            open: 0,
            overdue: 0,
          };
          return {
            ...personSummary(person),
            projects: assignmentMap.get(String(person._id)) || 0,
            tasks: counts.total,
            open: counts.open,
            done: counts.done,
            overdue: counts.overdue,
          };
        }),
      },
      overdue: overdueTasks.map((row) => ({
        id: String(row._id),
        title: row.title,
        dueDate: row.dueDate,
        priority: row.priority,
        assignee: row.assignee ? displayName(row.assignee) : null,
      })),
      activity: owner
        ? {
            meta: pageMeta(number(audit[0].total), activityPage.page, 12),
            rows: await activityDetails(audit[0].latest),
          }
        : null,
    });
  }),
);
