import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { config } from "../config.js";
import { ApiError } from "../utils/apiError.js";

const allowed = new Set([".pdf", ".doc", ".docx", ".zip", ".png", ".jpg", ".jpeg"]);
const architectureAllowed = new Set([
  ".dwg", ".dxf", ".rvt", ".ifc", ".skp", ".pln", ".3dm", ".max", ".obj", ".fbx",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".zip", ".rar", ".7z",
]);

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const entityType = String(req.body.entityType || req.body.kind || "documents").replace(/[^a-z0-9-_]/gi, "_");
    const entityId = String(req.body.entityId || req.body.project || "general").replace(/[^a-z0-9-_]/gi, "_");
    const section = String(req.body.section || "archive").replace(/[^a-z0-9-_]/gi, "_");
    const target = path.join(config.uploadDir, entityType, entityId, section);
    fs.mkdirSync(target, { recursive: true });
    cb(null, target);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const limits = config.maxUploadSizeMb > 0 ? { fileSize: config.maxUploadSizeMb * 1024 * 1024 } : undefined;

export const upload = multer({
  storage,
  limits,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!architectureAllowed.has(ext) && !allowed.has(ext)) {
      cb(new ApiError(400, "Bu fayl turi qo'llab-quvvatlanmaydi", "BAD_FILE_TYPE"));
      return;
    }
    cb(null, true);
  },
});
