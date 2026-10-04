import { selectMaterial } from "./material-select.mjs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../beckend/config.js";
import { User } from "../beckend/models/User.js";
import { Project } from "../beckend/models/Project.js";
import { File } from "../beckend/models/File.js";
import { Task } from "../beckend/models/Task.js";
import { ProjectFolder } from "../beckend/models/ProjectFolder.js";
import { Contract } from "../beckend/models/Contract.js";
import { Letter } from "../beckend/models/Letter.js";
import { Order } from "../beckend/models/Order.js";
import { Expense } from "../beckend/models/Expense.js";
import { Notification } from "../beckend/models/Notification.js";
import { AuditLog } from "../beckend/models/AuditLog.js";
assert(
  config.mongoUri.startsWith("mongodb://127.0.0.1:27021/"),
  "Isolated staging only",
);
await mongoose.connect(config.mongoUri);
const stamp = `polish-${Date.now()}`,
  password = "Isolated-polish-password-42",
  ids = [],
  errors = [],
  checks = [];
const dir = path.resolve("test-artifacts/polish-screenshots");
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1024 },
  colorScheme: "light",
});
const a = await context.newPage();
a.on("pageerror", (e) => errors.push(e.message));
const api = async (url, method = "GET", data) =>
  a.evaluate(
    async ({ url, method, data }) => {
      const r = await fetch("/api" + url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
      });
      return { status: r.status, data: await r.json() };
    },
    { url, method, data },
  );
const shot = async (name) => {
  await a.evaluate(() => document.fonts.ready);
  await a.waitForTimeout(350);
  await a.screenshot({ path: path.join(dir, name + ".png"), fullPage: true });
};
const go = async (route) => {
  await a.goto("http://127.0.0.1:5174" + route);
  await a.locator("h1").waitFor({ state: "attached" });
  await a
    .locator(".loading-state")
    .waitFor({ state: "hidden" })
    .catch(() => {});
};
const dialog = () => a.getByRole("dialog");
const close = async () => {
  await dialog()
    .getByRole("button", { name: "Yopish", exact: true })
    .first()
    .click();
  await dialog().waitFor({ state: "hidden" });
};
let owner, worker, project, file;
try {
  const hash = await bcrypt.hash(password, 4);
  owner = await User.create({
    name: "Otabek",
    surname: "Yuldashev",
    email: stamp + "-owner@example.test",
    password: hash,
    status: "Owner",
    preferences: { theme: "light" },
  });
  worker = await User.create({
    name: "Madina",
    surname: "Saidova",
    email: stamp + "-user@example.test",
    phone: "+998901234567",
    position: "Arxitektor",
    password: hash,
    status: "User",
  });
  ids.push(owner._id, worker._id);
  await a.goto("http://127.0.0.1:5174/login");
  await a.getByLabel("Email", { exact: true }).fill(owner.email);
  await a.getByLabel("Password", { exact: true }).fill(password);
  await a.getByRole("button", { name: "Kirish", exact: true }).click();
  await a.getByRole("heading", { name: "Loyihalar", exact: true }).waitFor();
  let r = await api("/projects", "POST", {
    title: "Nord House",
    company: "Nord Studio",
    objectName: "Ofis",
    objectAddress: "Chilonzor 42 Toshkent",
    customerName: "Madina Saidova",
    helper: String(worker._id),
    assignedTo: [String(worker._id)],
    description: "Qulay ofis uchun loyiha",
  });
  assert.equal(r.status, 201);
  project = r.data;
  for (const [route, title] of [
    ["contracts", "Nord shartnoma"],
    ["letters", "Nord xat"],
    ["orders", "Nord buyruq"],
    ["expenses", "Nord xarajat"],
  ]) {
    r = await api("/" + route, "POST", {
      title,
      project: project.id,
      customerName: "Madina Saidova",
      amount: 10000,
      signedAt: "2026-10-03",
      date: "2026-10-03",
      issuedAt: "2026-10-03",
    });
    assert.equal(r.status, 201, JSON.stringify(r));
  }
  r = await api("/tasks", "POST", {
    title: "Nord tekshirish",
    project: project.id,
    assignee: String(worker._id),
    priority: "high",
    dueDate: "2026-10-07",
    description: "Fasadni tekshirish",
  });
  assert.equal(r.status, 201);
  r = await api("/project-folders", "POST", {
    title: "Nord Eskiz",
    project: project.id,
  });
  assert.equal(r.status, 201);
  r = await a.evaluate(async (id) => {
    const data = new FormData();
    for (const [k, v] of Object.entries({
      project: id,
      entityType: "projects",
      entityId: id,
      kind: "project",
    }))
      data.append(k, v);
    data.append(
      "file",
      new Blob(["%PDF-1.7\n%%EOF"], { type: "application/pdf" }),
      "Nord plan.pdf",
    );
    const res = await fetch("/api/files", { method: "POST", body: data });
    return { status: res.status, data: await res.json() };
  }, project.id);
  assert.equal(r.status, 201);
  file = r.data;
  await go("/projects");
  // Literal multi-field matching and real modal destinations.
  for (const [url, id] of [
    [`/search?q=${encodeURIComponent("Chilonzor Toshkent")}`, project.id],
    [`/search?q=${encodeURIComponent("Madina Saidova")}`, String(worker._id)],
    [`/projects?search=${encodeURIComponent("Nord Toshkent")}`, project.id],
    [
      `/users?search=${encodeURIComponent("Madina Saidova")}`,
      String(worker._id),
    ],
  ]) {
    r = await api(url);
    assert.equal(r.status, 200);
    assert(
      r.data.data.some((x) => x.id === id),
      url,
    );
  }
  r = await api("/search?q=" + encodeURIComponent(".*"));
  assert.equal(r.data.data.length, 0, "Regex characters must stay literal");
  const search = a.getByRole("combobox", { name: "Umumiy qidiruv" });
  await search.fill("Chilonzor");
  await a.getByRole("option", { name: /Nord House/ }).waitFor();
  await shot("global-search-light");
  await search.press("ArrowDown");
  await search.press("Enter");
  await dialog().getByRole("heading", { name: "Nord Studio" }).waitFor();
  await dialog().getByText("Chilonzor 42 Toshkent", { exact: true }).waitFor();
  await shot("project-preview");
  await dialog()
    .getByRole("button", { name: "Tahrirlash", exact: true })
    .click();
  await dialog()
    .getByRole("heading", { name: "Loyihani tahrirlash" })
    .waitFor();
  await close();
  assert.equal((await Project.findById(project.id)).title, "Nord House");
  await search.fill("Madina Saidova");
  await a.getByRole("option", { name: /Madina Saidova Xodim/ }).waitFor();
  await a.getByRole("option", { name: /Madina Saidova Xodim/ }).click();
  await dialog().getByRole("heading", { name: "Madina Saidova" }).waitFor();
  await dialog()
    .getByRole("button", { name: "Tahrirlash", exact: true })
    .click();
  await dialog().getByLabel("Telefon nomer").fill("+998909876543");
  await dialog().getByRole("button", { name: "Saqlash", exact: true }).click();
  await dialog().waitFor({ state: "hidden" });
  assert.equal((await User.findById(worker._id)).phone, "+998909876543");
  checks.push(
    "Global and section search: surname, full name, address, multiple words, literal regex; keyboard opens details and user edits persist",
  );
  for (const [route, title] of [
    ["contracts", "Nord shartnoma"],
    ["letters", "Nord xat"],
    ["orders", "Nord buyruq"],
    ["expenses", "Nord xarajat"],
    ["tasks", "Nord tekshirish"],
  ]) {
    await go("/" + route);
    await a.getByRole("button", { name: title, exact: true }).click();
    await dialog().getByRole("heading", { name: title, exact: true }).waitFor();
    await dialog()
      .getByRole("button", { name: "Tahrirlash", exact: true })
      .click();
    await dialog()
      .getByRole("button", { name: "Saqlash", exact: true })
      .waitFor();
    await close();
  }
  await go("/files");
  await a.getByRole("button", { name: "Nord plan.pdf", exact: true }).click();
  await dialog().getByRole("heading", { name: "Nord plan.pdf" }).waitFor();
  const download = a.waitForEvent("download");
  await dialog()
    .getByRole("button", { name: "Yuklab olish", exact: true })
    .click();
  assert.equal((await download).suggestedFilename(), "Nord plan.pdf");
  await close();
  checks.push(
    "Project, employee, task, contract, letter, order, expense and file previews/editing are modals; real file download works",
  );
  await search.fill("nothing-" + stamp);
  await a
    .getByRole("status")
    .filter({ hasText: "Hech narsa topilmadi" })
    .waitFor();
  await a.route("**/api/search?*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Qidiruvni qayta sinab ko‘ring" }),
    }),
  );
  await search.fill("server failure");
  await a.getByRole("alert").filter({ hasText: "Qidiruvni qayta" }).waitFor();
  await a.unroute("**/api/search?*");
  await search.press("Escape");
  checks.push("Search shows empty and error states and Escape closes popover");
  await go("/projects/" + project.id);
  await a.getByRole("button", { name: /Nord Eskiz/ }).click();
  await dialog()
    .getByRole("heading", { name: "Nord Eskiz", exact: true })
    .waitFor();
  await dialog()
    .getByRole("button", { name: "Tahrirlash", exact: true })
    .click();
  await dialog().getByRole("heading", { name: "Papkani tahrirlash" }).waitFor();
  await close();
  await search.fill("Nord Eskiz");
  await a.getByRole("option").waitFor();
  await search.press("Enter");
  await dialog()
    .getByRole("heading", { name: "Nord Eskiz", exact: true })
    .waitFor();
  await close();
  checks.push(
    "Folder quick view/edit and search open modals, with explicit navigation to its contents",
  );
  // Confirmation stays above the attachment modal, and cancel never removes data.
  await go("/projects/" + project.id);
  await a
    .getByRole("button", { name: "Fayllarni boshqarish", exact: false })
    .click();
  await dialog().getByText("Nord plan.pdf", { exact: true }).waitFor();
  await dialog()
    .getByRole("button", { name: "Arxivlash", exact: true })
    .click();
  const confirmation = dialog().filter({
    has: a.getByRole("heading", { name: "Yozuvni arxivlash?" }),
  });
  await confirmation.getByText("Nord plan.pdf", { exact: true }).waitFor();
  const layers = await a
    .locator(".modal-backdrop.modal-open")
    .evaluateAll((nodes) =>
      nodes.map((x) => Number(getComputedStyle(x).zIndex)),
    );
  assert(layers[1] > layers[0], JSON.stringify(layers));
  await shot("nested-confirmation");
  await a.keyboard.press("Escape");
  await confirmation.waitFor({ state: "hidden" });
  assert.equal(await dialog().count(), 1);
  assert.equal((await File.findById(file.id)).deletedAt, null);
  await dialog()
    .getByRole("button", { name: "Arxivlash", exact: true })
    .click();
  await a.route("**/api/files/" + file.id, (route) =>
    route.request().method() === "DELETE"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ message: "Arxivga saqlanmadi" }),
        })
      : route.continue(),
  );
  await confirmation
    .getByRole("button", { name: "Arxivlash", exact: true })
    .click();
  await confirmation
    .getByRole("alert")
    .filter({ hasText: "Arxivga saqlanmadi" })
    .waitFor();
  await confirmation.getByRole("button", { name: "Bekor qilish" }).click();
  await a.unroute("**/api/files/" + file.id);
  await dialog()
    .getByRole("button", { name: "Arxivlash", exact: true })
    .click();
  await confirmation
    .getByRole("button", { name: "Arxivlash", exact: true })
    .click();
  await confirmation.waitFor({ state: "hidden" });
  assert((await File.findById(file.id)).deletedAt);
  await dialog().getByRole("button", { name: "Arxiv", exact: true }).click();
  const restoreResponse = a.waitForResponse(
    (r) =>
      r.url().endsWith(`/api/files/${file.id}/restore`) &&
      r.request().method() === "POST",
  );
  await dialog().getByRole("button", { name: "Tiklash", exact: true }).click();
  assert.equal((await restoreResponse).status(), 200);
  await a.waitForFunction(() => !document.querySelector(".loading-state"));
  assert.equal((await File.findById(file.id)).deletedAt, null);
  await close();
  checks.push(
    "Nested archive confirmation is above parent, Escape closes only top dialog, errors stay in dialog, cancel preserves data, archive and restore persist",
  );
  // Persisted theme, system theme updates, multi-tab and failed save rollback.
  await go("/settings");
  const theme = a.getByLabel("Tema", { exact: true });
  await selectMaterial(theme, "dark");
  await a.waitForFunction(
    () =>
      document.documentElement.classList.contains("dark") &&
      !document.querySelector(".theme-toggle").disabled,
  );
  await shot("settings-dark");
  const colors = await a
    .locator(".settings-card")
    .first()
    .evaluate((el) => ({
      bg: getComputedStyle(el).backgroundColor,
      text: getComputedStyle(el).color,
    }));
  assert.equal(colors.bg, "rgb(27, 35, 45)");
  assert.equal(colors.text, "rgb(237, 242, 248)");
  await a.reload();
  await theme.waitFor();
  assert.match(await theme.innerText(), /Qorong'i/);
  const other = await context.newPage();
  await other.goto("http://127.0.0.1:5174/projects");
  await other
    .getByRole("heading", { name: "Loyihalar", exact: true })
    .waitFor();
  await selectMaterial(theme, "light");
  await a.waitForFunction(
    () => !document.querySelector(".theme-toggle").disabled,
  );
  await other.waitForFunction(
    () => !document.documentElement.classList.contains("dark"),
  );
  await other.close();
  await selectMaterial(theme, "system");
  await a.waitForFunction(
    () => !document.querySelector(".theme-toggle").disabled,
  );
  await a.emulateMedia({ colorScheme: "dark" });
  await a.locator("html.dark").waitFor();
  await a.getByRole("button", { name: "Yorug' rejimga o'tish" }).waitFor();
  await a.emulateMedia({ colorScheme: "light" });
  await a.waitForFunction(
    () => !document.documentElement.classList.contains("dark"),
  );
  await a.route("**/api/profile/preferences", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Tema saqlanmadi" }),
    }),
  );
  await selectMaterial(theme, "dark");
  await a.getByRole("alert").filter({ hasText: "Tema saqlanmadi" }).waitFor();
  assert.match(await theme.innerText(), /Tizim sozlamasi/);
  assert.equal(
    await a.evaluate(() => document.documentElement.classList.contains("dark")),
    false,
  );
  await a.unroute("**/api/profile/preferences");
  await selectMaterial(theme, "dark");
  await a.waitForFunction(
    () => !document.querySelector(".theme-toggle").disabled,
  );
  checks.push(
    "Light/dark tokens, persistent theme after reload, multi-tab sync, system changes, toggle labels and rollback after save error",
  );
  for (const route of [
    "projects",
    "users",
    "tasks",
    "contracts",
    "letters",
    "orders",
    "expenses",
    "files",
    "dashboard",
    "notifications",
    "chat",
  ]) {
    await go("/" + route);
    await shot(route + "-dark");
  }
  await go("/projects");
  await search.fill("Chilonzor");
  await a.getByRole("option").waitFor();
  await shot("search-dark");
  await search.press("Escape");
  await a.getByRole("button", { name: "Yorug' rejimga o'tish" }).click();
  await a.waitForFunction(
    () => !document.querySelector(".theme-toggle").disabled,
  );
  for (const size of [360, 390, 768]) {
    await a.setViewportSize({ width: size, height: 844 });
    await go("/projects");
    assert(await search.isVisible());
    const width = await a.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    assert(width.scroll <= width.client + 1, JSON.stringify(width));
    await search.fill("Chilonzor");
    await a.getByRole("option").waitFor();
    await search.press("Enter");
    await dialog().waitFor();
    const box = await dialog().boundingBox();
    assert(box.x >= 0 && box.x + box.width <= size + 1);
    await shot("mobile-preview-" + size);
    await close();
  }
  await a.setViewportSize({ width: 1440, height: 1024 });
  await go("/projects");
  const create = a.getByRole("button", { name: "Yangi loyiha", exact: true });
  const before = await create.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await create.hover();
  await a.waitForTimeout(180);
  const hover = await create.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  assert.notEqual(before, hover);
  const box = await create.boundingBox();
  await a.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await a.mouse.down();
  await a.waitForTimeout(180);
  const transform = await create.evaluate(
    (el) => getComputedStyle(el).transform,
  );
  assert.notEqual(transform, "none");
  await a.mouse.move(0, 0);
  await a.mouse.up();
  await a.emulateMedia({ reducedMotion: "reduce" });
  await create.click();
  assert.equal(
    await dialog().evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  await a.keyboard.press("Tab");
  assert(await dialog().evaluate((el) => el.contains(document.activeElement)));
  await shot("reduced-motion-form");
  await close();
  checks.push(
    "Mobile 360/390/768: search visible, dialogs fit, no page overflow; hover/pressed feedback, trapped focus, reduced-motion disables animation",
  );

  await a.emulateMedia({ reducedMotion: "no-preference" });
  const routes = [
    "/projects",
    "/projects/single",
    "/projects/interior",
    "/projects/tex-obs",
    "/projects/laboratory",
    "/projects/control",
    "/projects/render",
    "/projects/" + project.id,
    "/dashboard",
    "/analytics",
    "/tasks",
    "/contracts",
    "/expenses",
    "/letters",
    "/orders",
    "/files",
    "/users",
    "/notifications",
    "/settings",
    "/chat",
  ];
  const matrix = [];
  for (const mode of ["light", "dark"]) {
    assert.equal(
      (await api("/profile/preferences", "PATCH", { theme: mode })).status,
      200,
    );
    for (const width of [1440, 360, 390, 768]) {
      await a.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await go(route);
        await a.evaluate(() => document.fonts.ready);
        await a.waitForTimeout(250);
        const dimensions = await a.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        assert(
          dimensions.scroll <= dimensions.client + 1,
          mode +
            " " +
            width +
            " " +
            route +
            " overflow: " +
            JSON.stringify(dimensions),
        );
        assert.equal(
          await a
            .locator("html")
            .evaluate((el) => el.classList.contains("dark")),
          mode === "dark",
        );
        assert.equal(await a.getByRole("heading", { level: 1 }).count(), 1);
        if (route !== "/chat")
          assert.equal(
            (await a.locator("[data-ui=surface]").count()) > 0,
            true,
            route + " missing shared surface",
          );
        matrix.push({ mode, width, route });
        if (
          width === 1440 ||
          (width === 390 &&
            ["/users", "/settings", "/chat", "/tasks"].includes(route))
        )
          await shot(
            "material-" + mode + "-" + width + "-" + route.replaceAll("/", "_"),
          );
      }
    }
  }
  await fs.writeFile(
    path.resolve("test-artifacts/material-matrix.json"),
    JSON.stringify(
      { passed: true, routes: routes.length, cases: matrix.length, matrix },
      null,
      2,
    ),
  );
  checks.push(
    "Material UI: every route in both themes at 1440/360/390/768, no document overflow, real library surfaces and controls",
  );

  assert.deepEqual(errors, []);
  await fs.writeFile(
    path.resolve("test-artifacts/polish-report.json"),
    JSON.stringify({ passed: true, checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ passed: true, checks }));
} catch (e) {
  await shot("failure").catch(() => {});
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await browser.close();
  const files = await File.find({ uploadedBy: { $in: ids } });
  for (const f of files)
    if (f.path.startsWith(config.uploadDir + "/"))
      await fs.unlink(f.path).catch(() => {});
  await File.deleteMany({ uploadedBy: { $in: ids } });
  for (const Model of [
    ProjectFolder,
    Task,
    Contract,
    Letter,
    Order,
    Expense,
    Notification,
  ])
    await Model.deleteMany({ createdBy: { $in: ids } });
  await Project.deleteMany({ owner: { $in: ids } });
  await AuditLog.deleteMany({ actor: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
  await mongoose.disconnect();
}
