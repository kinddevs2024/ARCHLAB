import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import { config } from "../config.js";
import { authRequired } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";

export const authRouter = express.Router();
const limiter = rateLimit({
  keyGenerator: (req) => ipKeyGenerator(req.clientIp || req.ip),
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(128),
  remember: z.boolean().optional().default(false),
});
const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: "lax",
  path: "/",
};
const dummyHash = bcrypt.hashSync("not-a-real-account-password", 12);

authRouter.post(
  "/login",
  limiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email }).select(
      "+password +sessionVersion",
    );
    const ok = await bcrypt.compare(data.password, user?.password || dummyHash);
    if (!user || !user.active || !ok)
      throw new ApiError(401, "Email yoki parol noto'g'ri", "INVALID_LOGIN");
    const token = jwt.sign(
      { id: user._id.toString(), version: user.sessionVersion },
      config.jwtSecret,
      { expiresIn: data.remember ? "30d" : "8h", algorithm: "HS256" },
    );
    res.cookie("archlab_session", token, {
      ...cookieOptions,
      ...(data.remember ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
    });
    req.auditActor = user._id;
    await writeAudit(req, "login", "User", user._id);
    res.json({ user: user.toPublic(), status: user.status });
  }),
);
authRouter.post("/register", (_req, res) =>
  res
    .status(403)
    .json({
      message: "Ro'yxatdan o'tish yopiq. Administratorga murojaat qiling.",
      code: "REGISTRATION_DISABLED",
    }),
);
authRouter.get("/me", authRequired, (req, res) => res.json({ user: req.user }));
authRouter.post(
  "/logout",
  authRequired,
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.user.id }, { $inc: { sessionVersion: 1 } });
    res.clearCookie("archlab_session", cookieOptions);
    await writeAudit(req, "logout", "User", req.user.id);
    res.json({ ok: true });
  }),
);
