import express from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { Contract } from "../models/Contract.js";
import { File } from "../models/File.js";
import { Letter } from "../models/Letter.js";
import { Order } from "../models/Order.js";
import { Project } from "../models/Project.js";
import { ProjectFolder } from "../models/ProjectFolder.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const searchRouter = express.Router();

searchRouter.use(authRequired);

searchRouter.get("/", asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) {
    res.json({ data: [] });
    return;
  }

  const search = new RegExp(q, "i");
  const [projects, folders, contracts, letters, orders, users, files] = await Promise.all([
    Project.find({ $or: [{ title: search }, { customerName: search }, { objectName: search }] }).limit(8),
    ProjectFolder.find({ title: search }).limit(8),
    Contract.find({ $or: [{ title: search }, { customerName: search }, { contractNumber: search }] }).limit(8),
    Letter.find({ $or: [{ title: search }, { customerName: search }] }).limit(8),
    Order.find({ title: search }).limit(8),
    User.find({ $or: [{ name: search }, { surname: search }, { email: search }, { username: search }] }).limit(8),
    File.find({ originalName: search }).limit(8),
  ]);

  const wrap = (type, item, subtitle = "") => ({
    type,
    id: item._id.toString(),
    title: item.title || item.originalName || item.email || `${item.name || ""} ${item.surname || ""}`.trim(),
    subtitle,
  });

  res.json({
    data: [
      ...projects.map((item) => wrap("project", item, item.category)),
      ...folders.map((item) => wrap("folder", item, "Project folder")),
      ...contracts.map((item) => wrap("contract", item, item.customerName)),
      ...letters.map((item) => wrap("letter", item, item.customerName)),
      ...orders.map((item) => wrap("order", item, item.status)),
      ...users.map((item) => wrap("user", item, item.status)),
      ...files.map((item) => wrap("file", item, item.extension)),
    ],
  });
}));
