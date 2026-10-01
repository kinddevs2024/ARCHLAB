import bcrypt from "bcryptjs";
import express from "express";
import path from "path";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { File } from "../models/File.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";

export const profileRouter = express.Router();

profileRouter.use(authRequired);

profileRouter.patch("/", asyncHandler(async (req, res) => {
  const data = z.object({
    name: z.string().trim().optional(),
    surname: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    username: z.string().trim().optional(),
  }).parse(req.body);
  const user = await User.findByIdAndUpdate(req.user.id, data, { new: true });
  await writeAudit(req, "update", "Profile", req.user.id, { fields: Object.keys(data) });
  res.json({ user: user.toPublic() });
}));

profileRouter.patch("/password", asyncHandler(async (req, res) => {
  const data = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(12).max(72),
  }).parse(req.body);
  const user = await User.findById(req.user.id).select("+password +sessionVersion");
  const ok = await bcrypt.compare(data.currentPassword, user.password);
  if (!ok) throw new ApiError(400, "Hozirgi parol noto'g'ri", "BAD_PASSWORD");
  user.password = await bcrypt.hash(data.newPassword, 10);
  user.sessionVersion += 1;
  await user.save();
  await writeAudit(req, "password", "Profile", req.user.id);
  res.json({ ok: true });
}));

profileRouter.post("/avatar", upload.single("file"), asyncHandler(async (req, res) => {
  const file = await File.create({
    originalName: req.file.originalname,
    storedName: req.file.filename,
    path: req.file.path,
    mimeType: req.file.mimetype,
    extension: path.extname(req.file.originalname).toLowerCase(),
    size: req.file.size,
    kind: "avatar",
    section: "avatars",
    entityType: "users",
    entityId: req.user.id,
    uploadedBy: req.user.id,
  });
  const user = await User.findByIdAndUpdate(req.user.id, { avatar: `/api/files/${file._id}/download` }, { new: true });
  await writeAudit(req, "avatar", "Profile", req.user.id, { file: file.originalName });
  res.status(201).json({ user: user.toPublic(), file: file.toPublic() });
}));
