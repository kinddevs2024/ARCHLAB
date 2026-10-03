import express from "express";
import { z } from "zod";
import { adminOnly } from "../middleware/access.js";
import { authRequired } from "../middleware/auth.js";
import { CompanySettings } from "../models/CompanySettings.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAudit } from "../utils/audit.js";
export const settingsRouter = express.Router();
settingsRouter.use(authRequired);
const publicSettings = (s) => ({ companyName: s.companyName || "ARCH LAB" });
settingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const settings = await CompanySettings.findOne({ key: "main" });
    res.json(publicSettings(settings || {}));
  }),
);
settingsRouter.patch(
  "/",
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = z
      .object({ companyName: z.string().trim().min(1).max(120) })
      .parse(req.body);
    const settings = await CompanySettings.findOneAndUpdate(
      { key: "main" },
      { ...data, updatedBy: req.user.id },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    await writeAudit(req, "update", "CompanySettings", settings._id, {
      fields: Object.keys(data),
    });
    res.json(publicSettings(settings));
  }),
);
