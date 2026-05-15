import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../config.js";
import { authRequired } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";

export const authRouter = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
});

const email = z.string().trim().email("Email formati noto'g'ri").toLowerCase();
const password = z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lsin");

const registerSchema = z.object({
  name: z.string().trim().optional().default(""),
  surname: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  username: z.string().trim().optional().default(""),
  email,
  password,
});

const loginSchema = z.object({ email, password: z.string().min(1, "Parolni kiriting") });

const tokenFor = (user) =>
  jwt.sign({ id: user._id.toString(), status: user.status }, config.jwtSecret, {
    expiresIn: config.jwtAccessTtl,
  });

authRouter.post(
  "/login",
  limiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email }).select("+password");

    if (!user || !user.active) {
      throw new ApiError(401, "Bunday email topilmadi", "INVALID_LOGIN");
    }

    const ok = user.password.startsWith("$2")
      ? await bcrypt.compare(data.password, user.password)
      : data.password === user.password;

    if (!ok) {
      throw new ApiError(401, "Parol noto'g'ri", "INVALID_PASSWORD");
    }

    if (!user.password.startsWith("$2")) {
      user.password = await bcrypt.hash(data.password, 10);
      await user.save();
    }

    await writeAudit(req, "login", "User", user._id);
    res.json({ token: tokenFor(user), user: user.toPublic(), status: user.status });
  })
);

authRouter.post(
  "/register",
  limiter,
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const exists = await User.exists({ email: data.email });

    if (exists) {
      throw new ApiError(409, "Bu email allaqachon ro'yxatdan o'tgan", "DUPLICATE_EMAIL");
    }

    const count = await User.countDocuments();
    const user = await User.create({
      ...data,
      username: data.username || data.email.split("@")[0],
      status: count === 0 ? "Owner" : "User",
      password: await bcrypt.hash(data.password, 10),
    });

    await writeAudit(req, "register", "User", user._id);
    res.status(201).json({ token: tokenFor(user), user: user.toPublic(), status: user.status });
  })
);

authRouter.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

authRouter.post("/logout", authRequired, asyncHandler(async (req, res) => {
  await writeAudit(req, "logout", "User", req.user.id);
  res.json({ ok: true });
}));
