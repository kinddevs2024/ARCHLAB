// Synthetic verification fixtures. This script refuses production MongoDB.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { chromium } from "playwright";
import { config } from "../beckend/config.js";
import { User } from "../beckend/models/User.js";
import { Project } from "../beckend/models/Project.js";
import { Task } from "../beckend/models/Task.js";
import { File } from "../beckend/models/File.js";
import { AuditLog } from "../beckend/models/AuditLog.js";
import { selectMaterial } from "./material-select.mjs";
assert(config.mongoUri.startsWith("mongodb://127.0.0.1:27021/"));
await mongoose.connect(config.mongoUri);
const prefix = `analytics-${Date.now()}`,
  password = "Isolated-analytics-test-42",
  userIds = [],
  projectIds = [],
  taskIds = [],
  fileIds = [],
  auditIds = [],
  checks = [];
const base = "http://127.0.0.1:4031/api",
  front = "http://127.0.0.1:5174";
const request = async (cookie, route, method = "GET", body) => {
  const response = await fetch(base + route, {
    method,
    headers: {
      Origin: front,
      ...(cookie ? { cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
};
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
let browser;
try {
  const people = {};
  for (const [name, status] of [
    ["Owner", "Owner"],
    ["Admin", "Admin"],
    ["Manager", "Manager"],
    ["Employee", "User"],
    ["Other", "User"],
  ]) {
    const person = await User.create({
      name,
      email: `${prefix}-${name}@example.test`,
      password: await bcrypt.hash(password, 4),
      status,
    });
    userIds.push(person._id);
    const login = await request(null, "/auth/login", "POST", {
      email: person.email,
      password,
    });
    assert.equal(login.status, 200);
    people[name] = {
      id: person._id,
      cookie: login.cookie,
      email: person.email,
    };
  }
  const createProject = async (data) => {
    const p = await Project.create(data);
    projectIds.push(p._id);
    return p;
  };
  const a = await createProject({
    title: prefix + " Alpha",
    status: "in_progress",
    category: "interior",
    assignedTo: [people.Employee.id, people.Manager.id],
    helper: people.Employee.id,
    master: people.Employee.id,
    createdAt: daysAgo(2),
  });
  const b = await createProject({
    title: prefix + " Beta",
    status: "done",
    category: "laboratory",
    assignedTo: [people.Other.id],
    createdAt: daysAgo(12),
  });
  const zero = await createProject({
    title: prefix + " Zero",
    status: "archived",
    category: "single",
    createdAt: daysAgo(100),
  });
  await createProject({
    title: prefix + " Deleted",
    status: "new",
    deletedAt: new Date(),
  });
  const createTask = async (data) => {
    const row = await Task.create(data);
    taskIds.push(row._id);
    return row;
  };
  const completed = await createTask({
    title: prefix + " Finished",
    project: a._id,
    assignee: people.Employee.id,
    status: "done",
    dueDate: daysAgo(10),
  });
  await createTask({
    title: prefix + " Overdue",
    project: a._id,
    assignee: people.Employee.id,
    status: "in_progress",
    dueDate: daysAgo(1),
  });
  const today = new Date(
    new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10),
  );
  await createTask({
    title: prefix + " Today",
    project: a._id,
    assignee: people.Employee.id,
    status: "todo",
    dueDate: today,
  });
  await createTask({
    title: prefix + " Unassigned",
    project: a._id,
    status: "todo",
  });
  await createTask({
    title: prefix + " Other task",
    project: b._id,
    assignee: people.Other.id,
    status: "done",
  });
  await createTask({
    title: prefix + " Archived",
    project: a._id,
    assignee: people.Employee.id,
    status: "archived",
    dueDate: daysAgo(10),
  });
  await createTask({
    title: prefix + " Deleted task",
    project: a._id,
    assignee: people.Employee.id,
    status: "todo",
    dueDate: daysAgo(10),
    deletedAt: new Date(),
  });
  const file = await File.create({
    originalName: prefix + ".pdf",
    storedName: "fixture",
    path: "test-artifacts/analytics-fixture",
    mimeType: "application/pdf",
    size: 12,
    project: a._id,
    kind: "document",
  });
  fileIds.push(file._id);
  for (const [action, entity, entityId, age] of [
    ["create", "Project", a._id, 2],
    ["update", "Task", completed._id, 1],
    ["upload", "File", file._id, 1],
    ["create", "Project", b._id, 2],
    ["update", "Project", a._id, 40],
  ]) {
    const event = await AuditLog.create({
      actor: people.Employee.id,
      action,
      entity,
      entityId: String(entityId),
      createdAt: daysAgo(age),
      ip: "192.0.2.1",
      details: { privateInternal: "never expose" },
    });
    auditIds.push(event._id);
  }
  assert.equal((await request(null, "/analytics")).status, 401);
  let r = await request(people.Owner.cookie, "/analytics?days=30");
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.deepEqual(
    Object.fromEntries(
      [
        "projects",
        "openProjects",
        "tasks",
        "doneTasks",
        "openTasks",
        "overdueTasks",
        "completion",
        "unassignedTasks",
        "periodActions",
      ].map((k) => [k, r.data.summary[k]]),
    ),
    {
      projects: 3,
      openProjects: 1,
      tasks: 5,
      doneTasks: 2,
      openTasks: 3,
      overdueTasks: 1,
      completion: 40,
      unassignedTasks: 1,
      periodActions: 4,
    },
  );
  assert.equal(r.data.timeline.length, 30);
  assert.equal(
    r.data.timeline.reduce((s, d) => s + d.count, 0),
    4,
  );
  assert.equal(r.data.meta.timezone, "Asia/Tashkent");
  assert.equal(new Date(r.data.meta.from).getUTCHours(), 19);
  const alpha = r.data.projects.rows.find((p) => p.id === String(a._id));
  assert.equal(alpha.completion, 25);
  assert.equal(alpha.members.length, 2);
  assert.equal(
    r.data.projects.rows.find((p) => p.id === String(zero._id)).completion,
    null,
  );
  const employee = r.data.team.rows.find(
    (p) => p.id === String(people.Employee.id),
  );
  assert.equal(employee.projects, 1);
  assert.equal(employee.open, 2);
  assert.equal(employee.done, 1);
  assert.equal(employee.overdue, 1);
  const encoded = JSON.stringify(r.data);
  assert(!encoded.includes("192.0.2.1"));
  assert(!encoded.includes("privateInternal"));
  assert(!encoded.includes('"password"'));
  assert(!encoded.includes('"email"'));
  for (const days of [7, 90]) {
    const result = await request(
      people.Owner.cookie,
      "/analytics?days=" + days,
    );
    assert.equal(result.data.timeline.length, days);
    assert.equal(result.data.summary.periodActions, days === 90 ? 5 : 4);
  }
  const scoped = await request(
    people.Owner.cookie,
    `/analytics?project=${a._id}`,
  );
  assert.equal(scoped.data.summary.projects, 1);
  assert.equal(scoped.data.summary.tasks, 4);
  assert.equal(scoped.data.summary.periodActions, 3);
  assert(scoped.data.activity.rows.some((row) => row.entity === "File"));
  const empty = await request(
    people.Owner.cookie,
    `/analytics?project=${zero._id}`,
  );
  assert.equal(empty.data.summary.completion, null);
  assert.equal(empty.data.summary.periodActions, 0);
  assert.equal(empty.data.activity.rows.length, 0);
  assert.equal(
    (await request(people.Owner.cookie, "/analytics?days=999")).status,
    400,
  );
  assert.equal(
    (await request(people.Owner.cookie, "/analytics?page=-1")).status,
    400,
  );
  assert.equal(
    (await request(people.Employee.cookie, `/analytics?project=${b._id}`))
      .status,
    404,
  );
  for (const role of ["Admin", "Manager", "Employee"]) {
    const result = await request(people[role].cookie, "/analytics");
    assert.equal(result.status, 200);
    assert.equal(result.data.activity, null);
    assert.equal(result.data.summary.periodActions, null);
    assert.equal(result.data.summary.projects, role === "Admin" ? 3 : 1);
    assert.equal(
      result.data.summary.tasks,
      role === "Admin" ? 5 : role === "Manager" ? 4 : 3,
    );
    if (role === "Employee") {
      assert.equal(result.data.team.rows.length, 1);
      assert.equal(result.data.team.rows[0].id, String(people.Employee.id));
    }
  }
  checks.push(
    "Known source totals, task denominator/nulls, deduplicated assignments, overdue excluding today's date, 7/30/90 local-day windows and zero-filled dates",
  );
  checks.push(
    "Anonymous denial; Owner/Admin/Manager/User isolation; audit data remains Owner-only; private project filters denied; safe response omits IP/details/password/email",
  );
  for (let n = 0; n < 9; n++)
    await createProject({ title: `${prefix} Pagination ${n}`, status: "new" });
  const paged = await request(people.Owner.cookie, "/analytics?page=2");
  assert.equal(paged.data.projects.meta.total, 12);
  assert.equal(paged.data.projects.rows.length, 4);
  checks.push(
    "Project filter reconciles summary/team/activity with resource joins; independent list pagination preserves full totals",
  );
  await Project.updateOne(
    { _id: a._id },
    { $set: { objectName: "Populated visual fixture" } },
  );
  browser = await chromium.launch({ args: ["--no-sandbox"] });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const login = await context.request.post(base + "/auth/login", {
    data: { email: people.Owner.email, password },
    headers: { Origin: front },
  });
  assert(login.ok());
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(front + "/analytics");
  await page.locator('[data-testid="analytics-activity"] strong').waitFor();
  assert.equal(
    await page.locator('[data-testid="analytics-activity"] strong').innerText(),
    "4",
  );
  assert.equal(
    await page.locator('[data-testid="analytics-overdue"] strong').innerText(),
    "1",
  );
  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
  assert(
    await page
      .locator(".analytics-chart-bar")
      .evaluateAll(
        (rows) =>
          rows.filter((row) => Number(row.getAttribute("height")) > 0).length >=
          2,
      ),
  );
  await page.locator('.analytics-chart-bar[tabindex="0"]').first().focus();
  await selectMaterial(
    page.getByRole("combobox", { name: "Faollik davri" }),
    "90",
  );
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="analytics-activity"] strong')
        ?.textContent === "5",
  );
  await page
    .getByRole("button", { name: "Barcha loyihalar", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await dialog
    .getByRole("textbox", { name: "Loyihani qidirish" })
    .fill(prefix + " Alpha");
  await dialog
    .getByRole("button", { name: new RegExp(prefix + " Alpha") })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="analytics-open-projects"] strong')
        ?.textContent === "1",
  );
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="analytics-activity"] strong')
        ?.textContent === "4",
  );
  await page.getByRole("button", { name: "Loyiha filtrini tozalash" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="analytics-activity"] strong')
        ?.textContent === "5",
  );
  await page.route("**/api/analytics?*", (route) => route.abort());
  await page.getByRole("button", { name: "Analitikani yangilash" }).click();
  await page.getByRole("alert").waitFor();
  await page.unroute("**/api/analytics?*");
  await page.getByRole("button", { name: "Analitikani yangilash" }).click();
  await page.locator('[data-testid="analytics-activity"] strong').waitFor();
  checks.push(
    "Real browser: SVG marks, period changes, searchable project modal, filtered counts/reset and API error/retry",
  );
  const dir = path.resolve("test-artifacts/analytics-screenshots");
  await fs.mkdir(dir, { recursive: true });
  for (const mode of ["light", "dark"]) {
    const response = await context.request.patch(
      base + "/profile/preferences",
      { data: { theme: mode }, headers: { Origin: front } },
    );
    assert(response.ok());
    for (const width of [1440, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 1100 });
      await page.goto(front + "/analytics");
      await page.locator('[data-testid="analytics-activity"] strong').waitFor();
      await page.waitForTimeout(400);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      );
      assert.equal(
        await page
          .locator("html")
          .evaluate((el) => el.classList.contains("dark")),
        mode === "dark",
      );
      await page.screenshot({
        path: path.join(dir, `${mode}-${width}.png`),
        fullPage: true,
      });
    }
  }
  assert.deepEqual(errors, []);
  checks.push(
    "Analytics in both themes at 1440/768/390/360; readable SVG, no page overflow or uncaught errors",
  );
  await fs.writeFile(
    path.resolve("test-artifacts/analytics-report.json"),
    JSON.stringify({ passed: true, checks }, null, 2),
  );
  console.log(JSON.stringify({ passed: true, checks }));
  await context.close();
} finally {
  await browser?.close();
  await AuditLog.deleteMany({
    $or: [{ _id: { $in: auditIds } }, { actor: { $in: userIds } }],
  });
  await Task.deleteMany({ _id: { $in: taskIds } });
  await File.deleteMany({ _id: { $in: fileIds } });
  await Project.deleteMany({ _id: { $in: projectIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  await mongoose.disconnect();
}
