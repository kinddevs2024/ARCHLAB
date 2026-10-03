import express from "express";
import { authRequired } from "../middleware/auth.js";
import { isAdmin, visibleProjectIds } from "../middleware/access.js";
import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination, paged } from "../utils/pagination.js";
import { requireId } from "../utils/validation.js";
import { notFound } from "../utils/apiError.js";
export const notificationsRouter = express.Router();
notificationsRouter.use(authRequired);
const scope = async (user) =>
  isAdmin(user)
    ? {}
    : {
        $or: [
          { createdBy: user.id },
          { recipientIds: user.id },
          { project: { $in: await visibleProjectIds(user) } },
        ],
      };
notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query),
      filter = await scope(req.user);
    if (req.user.status === "User")
      filter.type = { $nin: ["Contract", "Expense"] };
    const [items, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, readBy: { $ne: req.user.id } }),
    ]);
    res.json({
      ...paged(
        items.map((i) => i.toPublic(req.user.id)),
        total,
        page,
        limit,
      ),
      unread,
    });
  }),
);
notificationsRouter.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { ...(await scope(req.user)), readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } },
    );
    res.json({ ok: true });
  }),
);
notificationsRouter.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const item = await Notification.findOneAndUpdate(
      { _id: requireId(req.params.id), ...(await scope(req.user)) },
      { $addToSet: { readBy: req.user.id } },
      { returnDocument: "after" },
    );
    if (!item) throw notFound();
    res.json(item.toPublic(req.user.id));
  }),
);
