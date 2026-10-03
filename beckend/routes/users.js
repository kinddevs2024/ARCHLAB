import { adminOnly } from "../middleware/access.js";
import { patchData, searchFilter, requireId } from "../utils/validation.js";
import bcrypt from "bcryptjs";
import express from "express";
import { z } from "zod";
import { roles } from "../config.js";
import { authRequired } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { ApiError, notFound } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
import { getPagination, paged } from "../utils/pagination.js";

export const usersRouter = express.Router();

const userSchema = z.object({
  position: z.string().trim().max(120).optional(),
  name: z.string().trim().optional().default(""),
  surname: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  username: z.string().trim().optional().default(""),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(12).max(72).optional(),
  status: z.enum(roles).default("User"),
  active: z.boolean().optional(),
});

usersRouter.use(authRequired);

usersRouter.get(
  "/directory",
  asyncHandler(async (req, res) => {
    const users = await User.find({ active: true })
      .select("name surname avatar position status")
      .sort({ name: 1 })
      .limit(500);
    res.json({ data: users.map((u) => u.toPublic()) });
  }),
);
usersRouter.get(
  "/:id",
  adminOnly,
  asyncHandler(async (req, res) => {
    const item = await User.findById(requireId(req.params.id));
    if (!item) throw notFound();
    res.json(item.toPublic());
  }),
);
usersRouter.get(
  "/",
  adminOnly,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.role) filter.status = req.query.role;
    if (req.query.search)
      Object.assign(
        filter,
        searchFilter(req.query.search, [
          "name",
          "surname",
          "email",
          "username",
          "phone",
          "position",
          "address",
        ]),
      );

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json(
      paged(
        items.map((user) => user.toPublic()),
        total,
        page,
        limit,
      ),
    );
  }),
);

usersRouter.post(
  "/",
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = userSchema.parse(req.body);
    if (data.status === "Owner" && req.user.status !== "Owner")
      throw new ApiError(403, "Ruxsat yo'q", "FORBIDDEN");
    if (!data.password)
      throw new ApiError(400, "Parolni kiriting", "BAD_REQUEST");
    const user = await User.create({
      ...data,
      username: data.username || data.email.split("@")[0],
      password: await bcrypt.hash(data.password, 10),
    });
    await writeAudit(req, "create", "User", user._id, {
      email: user.email,
      status: user.status,
    });
    res.status(201).json(user.toPublic());
  }),
);

usersRouter.patch(
  "/:id",
  adminOnly,
  asyncHandler(async (req, res) => {
    requireId(req.params.id);
    const target = await User.findById(req.params.id);
    if (!target) throw notFound();
    if (req.user.status !== "Owner" && target.status === "Owner")
      throw new ApiError(403, "Ruxsat yo'q", "FORBIDDEN");
    const data = patchData(userSchema, req.body);
    if (req.user.status !== "Owner" && data.status === "Owner")
      throw new ApiError(403, "Ruxsat yo'q", "FORBIDDEN");
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    if (
      req.params.id === req.user.id &&
      (data.active === false ||
        (data.status && data.status !== req.user.status))
    ) {
      throw new ApiError(
        400,
        "Cannot disable or demote your own owner account",
        "BAD_REQUEST",
      );
    }
    const update = { $set: data };
    if (
      data.password ||
      (data.status && data.status !== target.status) ||
      (data.active !== undefined && data.active !== target.active)
    )
      update.$inc = { sessionVersion: 1 };
    const user = await User.findByIdAndUpdate(req.params.id, update, {
      returnDocument: "after",
    });
    if (!user) throw notFound("Foydalanuvchi topilmadi");
    await writeAudit(req, "update", "User", user._id, {
      fields: Object.keys(data),
    });
    res.json(user.toPublic());
  }),
);

usersRouter.delete(
  "/:id",
  adminOnly,
  asyncHandler(async (req, res) => {
    requireId(req.params.id);
    const target = await User.findById(req.params.id);
    if (!target) throw notFound();
    if (target.status === "Owner" && req.user.status !== "Owner")
      throw new ApiError(403, "Ruxsat yo'q", "FORBIDDEN");
    if (req.params.id === req.user.id)
      throw new ApiError(
        400,
        "Cannot disable your own owner account",
        "BAD_REQUEST",
      );
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { active: false }, $inc: { sessionVersion: 1 } },
      { returnDocument: "after" },
    );
    if (!user) throw notFound("Foydalanuvchi topilmadi");
    await writeAudit(req, "deactivate", "User", user._id);
    res.json(user.toPublic());
  }),
);
