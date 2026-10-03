import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { AuditLog } from "../models/AuditLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination, paged } from "../utils/pagination.js";

export const auditRouter = express.Router();

auditRouter.use(authRequired, requireRole(["Owner"]));

auditRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const [items, total] = await Promise.all([
      AuditLog.find()
        .populate("actor", "name surname email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(),
    ]);
    res.json(
      paged(
        items.map((item) => item.toPublic()),
        total,
        page,
        limit,
      ),
    );
  }),
);
