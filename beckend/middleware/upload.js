import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { config } from "../config.js";
import { ApiError } from "../utils/apiError.js";
fs.mkdirSync(config.uploadDir, { recursive: true });
const allowed = new Set([
  ".dwg",
  ".dxf",
  ".rvt",
  ".ifc",
  ".skp",
  ".pln",
  ".3dm",
  ".max",
  ".obj",
  ".fbx",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".zip",
  ".rar",
  ".7z",
]);
const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (_req, file, cb) =>
    cb(
      null,
      `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
    ),
});
export const upload = multer({
  storage,
  limits: {
    fileSize: Math.min(config.maxUploadSizeMb || 100, 100) * 1024 * 1024,
    files: 1,
    fields: 12,
    parts: 13,
  },
  fileFilter: (_req, file, cb) =>
    cb(
      allowed.has(path.extname(file.originalname).toLowerCase())
        ? null
        : new ApiError(
            400,
            "Bu fayl turi qo'llab-quvvatlanmaydi",
            "BAD_FILE_TYPE",
          ),
      true,
    ),
});
export const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (_req, file, cb) =>
    cb(
      [".png", ".jpg", ".jpeg", ".webp"].includes(
        path.extname(file.originalname).toLowerCase(),
      )
        ? null
        : new ApiError(400, "PNG, JPG yoki WebP tanlang", "BAD_FILE_TYPE"),
      true,
    ),
});
