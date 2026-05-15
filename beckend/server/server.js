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

app.use(
  cors({
    origin: config.corsOrigin.includes("*") ? true : config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  const host = req.get("host") || "127.0.0.1:4000";
  const frontendHost = host.replace(/:4000$/, ":5173");
  res.redirect(`${req.protocol}://${frontendHost}/`);
});

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
    app.listen(config.port, () => {
      console.log(`API server running on http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
