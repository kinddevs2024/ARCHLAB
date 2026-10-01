import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: process.env.ENV_FILE || ".env", quiet: true });

if (process.env.NODE_ENV === "production" && (!process.env.MONGODB_URI || (process.env.JWT_SECRET || "").length < 48)) {
  throw new Error("Production requires MONGODB_URI and a strong JWT_SECRET");
}

const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  host: process.env.HOST || "127.0.0.1",
  port: number(process.env.PORT, 4000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/archlab",
  jwtSecret: process.env.JWT_SECRET || "archlab-local-dev-secret",
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || "8h",
  corsOrigin: (process.env.CORS_ORIGIN || "http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || "uploads"),
  maxUploadSizeMb: number(process.env.MAX_UPLOAD_SIZE_MB, 0),
};

export const roles = ["Owner", "Admin", "Manager", "User"];
export const projectStatuses = ["new", "in_progress", "done", "archived"];
export const taskStatuses = ["todo", "in_progress", "done", "archived"];
export const documentStatuses = ["draft", "active", "done", "archived"];
