import express from "express";
import { mongoState } from "../db.js";

export const healthRouter = express.Router();

healthRouter.get("/", (_req, res) => {
  res.json({ ok: true, mongo: mongoState() });
});
