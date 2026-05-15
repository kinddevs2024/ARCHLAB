import bcrypt from "bcryptjs";
import express from "express";
import { z } from "zod";
import { roles } from "../config.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { ApiError, notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { getPagination, paged } from "../utils/pagination.js";

export const usersRouter = express.Router();

const userSchema = z.object({
  name: z.string().trim().optional().default(""),
  surname: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  username: z.string().trim().optional().default(""),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(6).optional(),
  status: z.enum(roles).default("User"),
  active: z.boolean().optional(),
});

usersRouter.use(authRequired);

usersRouter.get(
  "/",
  requireRole(["Owner"]),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.role) filter.status = req.query.role;
    if (req.query.search) {
      const search = new RegExp(String(req.query.search), "i");
      filter.$or = [{ name: search }, { surname: search }, { email: search }, { username: search }];
    }

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json(paged(items.map((user) => user.toPublic()), total, page, limit));
  })
);

usersRouter.post(
  "/",
  requireRole(["Owner"]),
  asyncHandler(async (req, res) => {
    const data = userSchema.parse(req.body);
    if (!data.password) throw new ApiError(400, "Parolni kiriting", "BAD_REQUEST");
    const user = await User.create({
      ...data,
      username: data.username || data.email.split("@")[0],
      password: await bcrypt.hash(data.password, 10),
    });
    await writeAudit(req, "create", "User", user._id, { email: user.email, status: user.status });
    res.status(201).json(user.toPublic());
  })
);

usersRouter.patch(
  "/:id",
  requireRole(["Owner"]),
  asyncHandler(async (req, res) => {
    const data = userSchema.partial().parse(req.body);
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!user) throw notFound("Foydalanuvchi topilmadi");
    await writeAudit(req, "update", "User", user._id, { fields: Object.keys(data) });
    res.json(user.toPublic());
  })
);

usersRouter.delete(
  "/:id",
  requireRole(["Owner"]),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!user) throw notFound("Foydalanuvchi topilmadi");
    await writeAudit(req, "deactivate", "User", user._id);
    res.json(user.toPublic());
  })
);
