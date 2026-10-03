import express from "express";
import { authRequired } from "../middleware/auth.js";
import {
  isAdmin,
  isManager,
  projectScope,
  visibleProjectIds,
  checkProject,
  validAssignees,
} from "../middleware/access.js";
import { User } from "../models/User.js";
import { badRequest, forbidden, notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  patchData,
  searchFilter,
  requireId,
  yearFilter,
} from "../utils/validation.js";
import { getPagination, paged } from "../utils/pagination.js";
import { writeAudit } from "../utils/audit.js";
import { createNotification } from "../utils/notify.js";
export function resourceRouter({
  Model,
  schema,
  type,
  entity,
  fields = ["title"],
  dateField = "createdAt",
  populate = [],
  project = false,
  finance = false,
  task = false,
}) {
  const router = express.Router();
  router.use(authRequired);
  const baseFilter = async (req) => {
    if (finance && !isManager(req.user)) throw forbidden();
    const filter = {
      deletedAt: req.query.trash === "true" ? { $ne: null } : null,
    };
    if (project) Object.assign(filter, projectScope(req.user));
    else if (!isAdmin(req.user)) {
      if (task) {
        const ids = await visibleProjectIds(req.user);
        if (req.user.status === "User") {
          filter.assignee = req.user.id;
          filter.$and = [
            { $or: [{ project: { $in: ids } }, { project: null }] },
          ];
        } else
          filter.$and = [
            {
              $or: [
                { project: { $in: ids } },
                { project: null, createdBy: req.user.id },
              ],
            },
          ];
      } else filter.project = { $in: await visibleProjectIds(req.user) };
    }
    return filter;
  };
  const queryFor = (filter) => {
    let q = Model.find(filter);
    for (const p of populate) q = q.populate(p[0], p[1]);
    return q;
  };
  const publicItem = (item, user) => {
    const v = item.toPublic();
    if (project && user.status === "User") delete v.contractAmount;
    return v;
  };
  const findItem = async (req) => {
    requireId(req.params.id);
    const filter = await baseFilter(req);
    delete filter.deletedAt;
    const item = await Model.findOne({ _id: req.params.id, ...filter });
    if (!item) throw notFound();
    return item;
  };
  const canWrite = async (req, item, data = {}) => {
    if (project) {
      if (!isManager(req.user)) throw forbidden();
      if (!item && !isAdmin(req.user)) throw forbidden();
      if (
        !isAdmin(req.user) &&
        ["assignedTo", "helper", "master", "owner", "category"].some((k) =>
          Object.hasOwn(data, k),
        )
      )
        throw forbidden();
    } else {
      if (!isManager(req.user) && !task) throw forbidden();
      if (
        task &&
        !isManager(req.user) &&
        Object.keys(data).some((k) => k !== "status")
      )
        throw forbidden();
      const id = data.project || item?.project;
      if (id) await checkProject(req.user, id);
      else if (!isAdmin(req.user) && !task) throw forbidden();
    }
    await validAssignees(data);
    if (
      task &&
      (!item ||
        Object.hasOwn(data, "assignee") ||
        Object.hasOwn(data, "project"))
    ) {
      const projectId = data.project || item?.project;
      const assignee = Object.hasOwn(data, "assignee")
        ? data.assignee
        : item?.assignee;
      if (projectId && assignee) {
        const assignedProject = await checkProject(req.user, projectId);
        const person = await User.findById(assignee).select("status");
        const allowed =
          isAdmin(person) ||
          [
            ...(assignedProject.assignedTo || []),
            assignedProject.helper,
            assignedProject.master,
          ]
            .filter(Boolean)
            .some((id) => String(id) === String(assignee));
        if (!allowed)
          throw badRequest("Avval xodimni ushbu loyihaga biriktiring");
      }
    }
  };
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPagination(req.query);
      const filter = await baseFilter(req);
      for (const k of ["status", "category", "direction"])
        if (req.query[k]) filter[k] = String(req.query[k]);
      if (req.query.project) {
        await checkProject(req.user, req.query.project);
        filter.project = req.query.project;
      }
      if (req.query.parent) {
        requireId(req.query.parent);
        filter.parent = req.query.parent;
      } else if (type === "ProjectFolder") filter.parent = null;
      if (req.query.assignee) {
        requireId(req.query.assignee);
        if (req.user.status === "User" && req.query.assignee !== req.user.id)
          throw forbidden();
        filter.assignee = req.query.assignee;
      }
      if (req.query.year) filter[dateField] = yearFilter(req.query.year);
      if (req.query.search) {
        const searched = searchFilter(req.query.search, fields);
        filter.$and = [...(filter.$and || []), searched];
      }
      const sort = req.query.sort === "asc" ? 1 : -1;
      const [items, total] = await Promise.all([
        queryFor(filter)
          .sort(
            type === "ProjectFolder"
              ? { order: 1, [dateField]: sort, _id: sort }
              : { [dateField]: sort, _id: sort },
          )
          .skip(skip)
          .limit(limit),
        Model.countDocuments(filter),
      ]);
      res.json(
        paged(
          items.map((i) => publicItem(i, req.user)),
          total,
          page,
          limit,
        ),
      );
    }),
  );
  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const item = await findItem(req);
      if (item.deletedAt) throw notFound();
      await item.populate(populate.map((p) => ({ path: p[0], select: p[1] })));
      res.json(publicItem(item, req.user));
    }),
  );
  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const data = schema.parse(req.body);
      await canWrite(req, null, data);
      if (
        type === "ProjectFolder" &&
        data.parent &&
        !(await Model.exists({
          _id: data.parent,
          project: data.project,
          deletedAt: null,
        }))
      )
        throw notFound("Asosiy papka topilmadi");
      const item = await Model.create({
        ...data,
        ...(project ? { owner: req.user.id } : { createdBy: req.user.id }),
      });
      await writeAudit(req, "create", type, item._id, { title: item.title });
      await createNotification(req, `${type} yaratildi`, item.title, {
        type,
        entityType: entity,
        entityId: item._id,
        project: project ? item._id : item.project,
        recipientIds: item.assignee ? [item.assignee] : item.assignedTo || [],
      });
      res.status(201).json(publicItem(item, req.user));
    }),
  );
  router.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const item = await findItem(req);
      if (item.deletedAt) throw notFound();
      const data = patchData(schema, req.body);
      await canWrite(req, item, data);
      if (
        !project &&
        Object.hasOwn(data, "project") &&
        String(data.project) !== String(item.project)
      )
        throw forbidden("Loyihani almashtirish mumkin emas");
      if (type === "ProjectFolder" && data.parent) {
        let parentId = data.parent;
        const seen = new Set();
        while (parentId) {
          if (
            String(parentId) === String(item._id) ||
            seen.has(String(parentId))
          )
            throw forbidden("Papka zanjiri noto'g'ri");
          seen.add(String(parentId));
          const p = await Model.findById(parentId).select("parent");
          parentId = p?.parent;
        }
        if (
          !(await Model.exists({
            _id: data.parent,
            project: item.project,
            deletedAt: null,
          }))
        )
          throw notFound("Asosiy papka topilmadi");
      }
      Object.assign(item, data);
      await item.save();
      await writeAudit(req, "update", type, item._id, {
        fields: Object.keys(data),
      });
      res.json(publicItem(item, req.user));
    }),
  );
  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const item = await findItem(req);
      await canWrite(req, item);
      if (!isManager(req.user)) throw forbidden();
      item.deletedAt = new Date();
      item.deletedBy = req.user.id;
      await item.save();
      await writeAudit(req, "archive", type, item._id);
      res.json({ ok: true });
    }),
  );
  router.post(
    "/:id/restore",
    asyncHandler(async (req, res) => {
      const item = await findItem(req);
      await canWrite(req, item);
      if (!isManager(req.user)) throw forbidden();
      item.deletedAt = null;
      item.deletedBy = null;
      await item.save();
      await writeAudit(req, "restore", type, item._id);
      res.json(publicItem(item, req.user));
    }),
  );
  return router;
}
