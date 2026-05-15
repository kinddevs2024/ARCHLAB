import express from "express";
import { z } from "zod";
import { config } from "../config.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { CompanySettings } from "../models/CompanySettings.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";

export const settingsRouter = express.Router();

const schema = z.object({
  companyName: z.string().trim().optional(),
  archivePath: z.string().trim().optional(),
  language: z.string().trim().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

settingsRouter.use(authRequired, requireRole(["Owner"]));

const ensureSettings = async () =>
  CompanySettings.findOneAndUpdate(
    { key: "main" },
    { $setOnInsert: { archivePath: config.uploadDir } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

settingsRouter.get("/", asyncHandler(async (_req, res) => {
  const settings = await ensureSettings();
  res.json(settings.toPublic());
}));

settingsRouter.patch("/", asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const settings = await CompanySettings.findOneAndUpdate(
    { key: "main" },
    { ...data, updatedBy: req.user.id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await writeAudit(req, "update", "CompanySettings", settings._id, { fields: Object.keys(data) });
  res.json(settings.toPublic());
}));
