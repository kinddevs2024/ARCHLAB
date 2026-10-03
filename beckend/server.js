import crypto from "node:crypto";
import { isIP } from "node:net";
import { exportRouter } from "./routes/export.js";
import { createServer } from "node:http";
import { attachRealtime } from "./realtime.js";
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { auditRouter } from "./routes/audit.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { contractsRouter } from "./routes/contracts.js";
import { expensesRouter } from "./routes/expenses.js";
import { filesRouter } from "./routes/files.js";
import { healthRouter } from "./routes/health.js";
import { lettersRouter } from "./routes/letters.js";
import { notificationsRouter } from "./routes/notifications.js";
import { ordersRouter } from "./routes/orders.js";
import { profileRouter } from "./routes/profile.js";
import { projectFoldersRouter } from "./routes/projectFolders.js";
import { projectsRouter } from "./routes/projects.js";
import { searchRouter } from "./routes/search.js";
import { settingsRouter } from "./routes/settings.js";
import { tasksRouter } from "./routes/tasks.js";
import { usersRouter } from "./routes/users.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", "loopback");
app.use((req, res, next) => {
  const provided = Buffer.from(req.get("x-archlab-proxy-token") || ""),
    expected = Buffer.from(config.originProxySecret);
  if (
    expected.length &&
    provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected)
  ) {
    const ip = req.get("x-archlab-client-ip");
    if (isIP(ip || "")) req.clientIp = ip;
  }
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("origin");
    if (
      (origin && !config.corsOrigin.includes(origin)) ||
      req.get("sec-fetch-site") === "cross-site"
    ) {
      return res
        .status(403)
        .json({ message: "Origin rejected", code: "FORBIDDEN" });
    }
  }
  next();
});

app.use(
  cors({
    origin: config.corsOrigin.includes("*") ? true : config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  const host = req.get("host") || "127.0.0.1:4000";
  const frontendHost = host.replace(/:4000$/, ":5173");
  res.redirect(`${req.protocol}://${frontendHost}/`);
});

app.use("/api/export", exportRouter);
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/project-folders", projectFoldersRouter);
app.use("/api/contracts", contractsRouter);
app.use("/api/letters", lettersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/chat", chatRouter);
app.use("/api/files", filesRouter);
app.use("/api/search", searchRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/audit", auditRouter);

app.use(notFoundHandler);
app.use(errorHandler);

connectDb()
  .then(() => {
    const server = createServer(app);
    attachRealtime(server);
    server.listen(config.port, config.host, () => {
      console.log(`API server running on http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
