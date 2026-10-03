import fs from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { isAdmin } from "../middleware/access.js";
import bcrypt from "bcryptjs";
import express from "express";
import path from "path";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { avatarUpload } from "../middleware/upload.js";
import { File } from "../models/File.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";

export const profileRouter = express.Router();

profileRouter.use(authRequired);

profileRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        name: z.string().trim().max(120).optional(),
        surname: z.string().trim().max(120).optional(),
        phone: z.string().trim().max(40).optional(),
        address: z.string().trim().max(500).optional(),
        username: z.string().trim().max(80).optional(),
      })
      .parse(req.body);
    const user = await User.findByIdAndUpdate(req.user.id, data, {
      returnDocument: "after",
    });
    await writeAudit(req, "update", "Profile", req.user.id, {
      fields: Object.keys(data),
    });
    res.json({ user: user.toPublic() });
  }),
);

profileRouter.patch(
  "/password",
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(12).max(72),
      })
      .parse(req.body);
    const user = await User.findById(req.user.id).select(
      "+password +sessionVersion",
    );
    const ok = await bcrypt.compare(data.currentPassword, user.password);
    if (!ok) throw new ApiError(400, "Hozirgi parol noto'g'ri", "BAD_PASSWORD");
    user.password = await bcrypt.hash(data.newPassword, 10);
    user.sessionVersion += 1;
    await user.save();
    await writeAudit(req, "password", "Profile", req.user.id);
    const token = jwt.sign(
      { id: user._id.toString(), version: user.sessionVersion },
      config.jwtSecret,
      { expiresIn: "8h", algorithm: "HS256" },
    );
    res.cookie("archlab_session", token, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "lax",
      path: "/",
    });
    res.json({ ok: true });
  }),
);

profileRouter.patch(
  "/preferences",
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        theme: z.enum(["light", "dark", "system"]).optional(),
        language: z.enum(["uz", "ru", "en"]).optional(),
      })
      .parse(req.body);
    const user = await User.findById(req.user.id);
    user.preferences = {
      theme: user.preferences?.theme || "system",
      language: user.preferences?.language || "uz",
      ...data,
    };
    await user.save();
    res.json({ user: user.toPublic() });
  }),
);
profileRouter.post(
  "/avatar",
  avatarUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Rasmni tanlang");
    let imagePath;
    try {
      const userId = req.body.userId || req.user.id;
      if (userId !== req.user.id && !isAdmin(req.user))
        throw new ApiError(403, "Ruxsat yo'q");
      const target = await User.findById(userId);
      if (!target) throw new ApiError(404, "Xodim topilmadi");
      imagePath = path.join(config.uploadDir, crypto.randomUUID() + ".webp");
      try {
        await sharp(req.file.path, { limitInputPixels: 20000000 })
          .rotate()
          .resize(512, 512, { fit: "cover" })
          .webp({ quality: 85 })
          .toFile(imagePath);
      } catch {
        throw new ApiError(400, "Rasm formati noto'g'ri", "BAD_IMAGE");
      }
      const stat = await fs.stat(imagePath);
      const file = await File.create({
        originalName: "avatar.webp",
        storedName: path.basename(imagePath),
        path: imagePath,
        mimeType: "image/webp",
        extension: ".webp",
        size: stat.size,
        kind: "avatar",
        section: "avatars",
        entityType: "users",
        entityId: userId,
        uploadedBy: req.user.id,
      });
      target.avatar = `/api/files/${file._id}/download`;
      await target.save();
      await writeAudit(req, "avatar", "User", userId);
      res.status(201).json({ user: target.toPublic(), file: file.toPublic() });
    } catch (error) {
      if (imagePath) await fs.unlink(imagePath).catch(() => {});
      throw error;
    } finally {
      await fs.unlink(req.file.path).catch(() => {});
    }
  }),
);
