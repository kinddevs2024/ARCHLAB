import express from "express";
import { mongoState } from "../db.js";

export const healthRouter = express.Router();

healthRouter.get("/", (_req, res) => {
  const mongo = mongoState();
  res
    .status(mongo === "connected" ? 200 : 503)
    .json({ ok: mongo === "connected", mongo });
});
