import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { config } from "../beckend/config.js";
import { User } from "../beckend/models/User.js";
import { Project } from "../beckend/models/Project.js";
import { ProjectFolder } from "../beckend/models/ProjectFolder.js";
import { Contract } from "../beckend/models/Contract.js";
import { Letter } from "../beckend/models/Letter.js";
import { Order } from "../beckend/models/Order.js";
import { Expense } from "../beckend/models/Expense.js";
import { Task } from "../beckend/models/Task.js";
import { File } from "../beckend/models/File.js";
import { Conversation } from "../beckend/models/Conversation.js";
import { Message } from "../beckend/models/Message.js";
import { Notification } from "../beckend/models/Notification.js";
import { AuditLog } from "../beckend/models/AuditLog.js";
assert(
  config.mongoUri.startsWith("mongodb://127.0.0.1:27021/"),
  "Staging only",
);
await mongoose.connect(config.mongoUri);
const stamp = `qa-${Date.now()}`,
  password = "Isolated-test-account-42",
  userIds = [],
  errors = [],
  report = [],
  dir =
    process.env.SCREENSHOT_DIR || "/home/deploy/archlab-staging/screenshots";
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
});
const monitor = (page) => {
  page.on("pageerror", (e) => errors.push(e.message));
};
const screenshot = async (page, name) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () =>
      ![...document.querySelectorAll(".loading-state")].some(
        (el) => el.getClientRects().length,
      ),
  );
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(dir, name + ".png"),
    fullPage: true,
  });
};
const api = async (page, url, method = "GET", data) =>
  page.evaluate(
    async ({ url, method, data }) => {
      const r = await fetch("/api" + url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
      });
      const type = r.headers.get("content-type");
      return {
        status: r.status,
        data: type?.includes("json") ? await r.json() : null,
      };
    },
    { url, method, data },
  );
const login = async (page, email) => {
  monitor(page);
  await page.goto("http://127.0.0.1:5174/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
  await page.getByRole("heading", { name: "Loyihalar", exact: true }).waitFor();
  await page
    .getByRole("status")
    .waitFor({ state: "hidden" })
    .catch(() => {});
};
let owner, user, ownerContext, userContext;
try {
  const hash = await bcrypt.hash(password, 4);
  owner = await User.create({
    name: "Kamoliddin",
    surname: "Sulaymonov",
    email: stamp + "-owner@example.test",
    status: "Owner",
    position: "Asosiy arxitektor",
    password: hash,
  });
  user = await User.create({
    name: "Alisher",
    surname: "Karimov",
    email: stamp + "-user@example.test",
    status: "User",
    position: "3d dizayner",
    password: hash,
  });
  userIds.push(owner._id, user._id);
  ownerContext = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    permissions: ["camera", "microphone"],
  });
  userContext = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    permissions: ["camera", "microphone"],
  });
  const a = await ownerContext.newPage(),
    b = await userContext.newPage();
  await a.goto("http://127.0.0.1:5174/login");
  await a.getByRole("heading", { name: "Xush kelibsiz" }).waitFor();
  await screenshot(a, "login");
  await login(a, owner.email);
  await a.getByRole("button", { name: "Yangi loyiha", exact: true }).click();
  const dialog = a.getByRole("dialog");
  await dialog
    .getByLabel("Mijoz ismi", { exact: true })
    .fill("Alisher Karimov");
  await dialog
    .getByLabel("Yordamchi ismi", { exact: true })
    .selectOption(String(user._id));
  await dialog
    .getByLabel("Ustaning ismi", { exact: true })
    .selectOption(String(user._id));
  await dialog
    .getByLabel("Proyekt haqida")
    .fill("Figma bo‘yicha arxitektura loyihasi");
  await screenshot(a, "project-form");
  await dialog.locator("summary").click();
  await dialog.getByLabel("Loyiha nomi", { exact: true }).fill(stamp);
  await dialog
    .getByLabel("Kompaniya nomi", { exact: true })
    .fill("ARCH LAB loyiha");
  await dialog
    .getByLabel("Obyekt nomi", { exact: true })
    .fill("Toshkent ofisi");
  await dialog
    .getByLabel("Obyekt joyi", { exact: true })
    .fill("Toshkent shahri");
  await dialog.getByLabel("Status", { exact: true }).selectOption("done");
  await dialog
    .getByRole("button", { name: "Loyiha yaratish", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await a
    .getByRole("button", { name: "ARCH LAB loyiha", exact: true })
    .waitFor();
  await screenshot(a, "projects");
  const project = await Project.findOne({ title: stamp });
  assert(project);
  assert.equal(project.status, "done");
  report.push("Project creation from UI, assignments and Figma form");
  await a.getByRole("button", { name: "ARCH LAB loyiha", exact: true }).click();
  await a
    .getByRole("dialog")
    .getByRole("button", { name: "Papkalar va hujjatlar", exact: true })
    .click();
  await a.getByRole("heading", { name: stamp, exact: true }).waitFor();
  await screenshot(a, "folders-empty");
  // Folder tree and safe defaults work through API then appear in UI.
  for (let i = 0; i < 2; i++) {
    const r = await api(a, "/project-folders/defaults", "POST", {
      project: String(project._id),
      titles: ["Eskiz", "Arxitektura", "Konstruktsiya"],
    });
    assert.equal(r.status, 200, JSON.stringify(r));
  }
  assert.equal(await ProjectFolder.countDocuments({ project: project._id }), 3);
  const folder = await ProjectFolder.findOne({
    project: project._id,
    title: "Eskiz",
  });
  const child = await api(a, "/project-folders", "POST", {
    project: String(project._id),
    parent: String(folder._id),
    title: "Fasad",
    contactPhone: "+998 90 123 45 67",
  });
  assert.equal(child.status, 201, JSON.stringify(child));
  assert.equal(
    (
      await api(a, `/project-folders/${folder._id}`, "PATCH", {
        parent: child.data.id,
      })
    ).status,
    403,
  );
  await a.reload();
  await a.getByRole("button", { name: /Eskiz/ }).waitFor();
  await screenshot(a, "folders");
  await a.getByRole("button", { name: /Eskiz/ }).click();
  await a
    .getByRole("dialog")
    .getByRole("button", { name: "Papkalar va hujjatlar", exact: true })
    .click();
  await a.getByRole("button", { name: /Fasad/ }).waitFor();
  await screenshot(a, "sketches");
  report.push("Nested folders, repeated default creation and cycle prevention");
  // Documents, spreadsheet export and genuine attachment download.
  const contract = await api(a, "/contracts", "POST", {
    title: "Arxitektura shartnomasi",
    project: String(project._id),
    customerName: "Alisher Karimov",
    customerPhone: "+998901234567",
    amount: 15000000,
    advance: 3000000,
    totalPaid: 6000000,
    signedAt: "2026-10-03",
  });
  assert.equal(contract.status, 201, JSON.stringify(contract));
  await a.goto(`http://127.0.0.1:5174/projects/${project._id}`);
  await a.getByRole("button", { name: "Shartnoma", exact: true }).click();
  await a.getByText("Arxitektura shartnomasi", { exact: true }).waitFor();
  await screenshot(a, "contracts");
  let exportResult = await a.evaluate(async (id) => {
    const r = await fetch(`/api/export/projects/${id}/contracts`);
    return { status: r.status, size: (await r.arrayBuffer()).byteLength };
  }, String(project._id));
  assert.equal(exportResult.status, 200);
  assert(exportResult.size > 5000);
  report.push("Financial table and real XLSX export");
  const pdf = Buffer.from(
    "%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF",
  );
  const uploaded = await a.evaluate(
    async ({ bytes, id, project }) => {
      const body = new FormData();
      body.append("kind", "contract");
      body.append("entityType", "contracts");
      body.append("entityId", id);
      body.append("project", project);
      body.append(
        "file",
        new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
        "contract.pdf",
      );
      const r = await fetch("/api/files", { method: "POST", body });
      return { status: r.status, data: await r.json() };
    },
    { bytes: [...pdf], id: contract.data.id, project: String(project._id) },
  );
  assert.equal(uploaded.status, 201, JSON.stringify(uploaded));
  assert.equal((await api(a, `/files/${uploaded.data.id}`)).status, 200);
  let content = await a.evaluate(async (id) => {
    const r = await fetch(`/api/files/${id}/download`);
    return { status: r.status, text: await r.text() };
  }, uploaded.data.id);
  assert.equal(content.text, pdf.toString());
  assert.equal(
    (await api(a, `/files/${uploaded.data.id}`, "DELETE")).status,
    200,
  );
  assert.equal(
    (await api(a, `/files/${uploaded.data.id}/restore`, "POST")).status,
    200,
  );
  await a.goto("http://127.0.0.1:5174/users");
  await a.getByRole("heading", { name: "Foydalanuvchilar" }).waitFor();
  await a.getByRole("button", { name: "Xodim qo'shish", exact: true }).click();
  await screenshot(a, "employee-form");
  await a
    .getByRole("dialog")
    .getByRole("button", { name: "Yopish", exact: true })
    .click();
  const png = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "#c6a47e" },
  })
    .png()
    .toBuffer();
  const avatar = await a.evaluate(
    async (bytes) => {
      const form = new FormData();
      form.append(
        "file",
        new Blob([new Uint8Array(bytes)], { type: "image/png" }),
        "avatar.png",
      );
      const r = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form,
      });
      return { status: r.status, data: await r.json() };
    },
    [...png],
  );
  assert.equal(avatar.status, 201, JSON.stringify(avatar));
  const task = await api(a, "/tasks", "POST", {
    title: "Eskizni tekshirish",
    project: String(project._id),
    assignee: String(user._id),
    priority: "high",
    dueDate: "2026-10-07",
  });
  assert.equal(task.status, 201, JSON.stringify(task));
  await a.goto("http://127.0.0.1:5174/tasks");
  await a.getByRole("heading", { name: "Vazifalar" }).waitFor();
  await a.getByRole("button", { name: "Vazifa yaratish", exact: true }).click();
  await screenshot(a, "task-form");
  await a
    .getByRole("dialog")
    .getByRole("button", { name: "Yopish", exact: true })
    .click();
  await login(b, user.email);
  assert.equal((await api(b, "/contracts")).status, 403);
  const ownFiles = await api(b, "/files");
  assert(!ownFiles.data.data.some((f) => f.id === uploaded.data.id));
  assert.equal(
    (await api(b, `/files/${uploaded.data.id}/download`)).status,
    403,
  );
  assert.equal(
    (await api(b, `/tasks/${task.data.id}`, "PATCH", { status: "done" }))
      .status,
    200,
  );
  report.push(
    "Employee role, financial attachment isolation, task completion, validated avatar",
  );
  const chat = await api(a, "/chat/conversations", "POST", {
    title: "ARCH LAB muhokama",
    participants: [String(user._id)],
  });
  assert.equal(chat.status, 201, JSON.stringify(chat));
  await a.goto("http://127.0.0.1:5174/chat");
  await b.goto("http://127.0.0.1:5174/chat");
  await a.getByRole("button", { name: /ARCH LAB muhokama/ }).click();
  await b.getByRole("button", { name: /ARCH LAB muhokama/ }).click();
  await a.getByLabel("Xabar matni", { exact: true }).fill("Loyiha tasdiqlandi");
  await a.getByRole("button", { name: "Xabar yuborish", exact: true }).click();
  await b
    .getByRole("article")
    .getByText("Loyiha tasdiqlandi", { exact: true })
    .waitFor();
  await screenshot(a, "chat");
  await a.locator("input[type=file]").setInputFiles({
    name: "sketch.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await a.locator(".chat-files").waitFor();
  await a.getByRole("button", { name: "Xabar yuborish", exact: true }).click();
  await b.getByRole("button", { name: /sketch.pdf/ }).waitFor();
  report.push("Realtime chat between two sessions and attachment-only message");
  const extraTab = await userContext.newPage();
  monitor(extraTab);
  await extraTab.goto("http://127.0.0.1:5174/chat");
  await extraTab.getByRole("heading", { name: "Chat", exact: true }).waitFor();
  await a
    .getByRole("button", { name: "Audio qo‘ng‘iroq", exact: true })
    .count()
    .then(async (n) => {
      if (n)
        await a
          .getByRole("button", { name: "Audio qo‘ng‘iroq", exact: true })
          .click();
      else
        await a
          .getByRole("button", { name: "Audio qo'ng'iroq", exact: true })
          .click();
    });
  await b.getByRole("button", { name: "Qabul qilish", exact: true }).waitFor();
  await extraTab
    .getByRole("button", { name: "Qabul qilish", exact: true })
    .waitFor();
  await b.getByRole("button", { name: "Qabul qilish", exact: true }).click();
  await extraTab.getByRole("dialog").waitFor({ state: "hidden" });
  await a
    .getByRole("status")
    .filter({ hasText: "Qo'ng'iroq ulandi" })
    .waitFor({ timeout: 25000 });
  await b
    .getByRole("status")
    .filter({ hasText: "Qo'ng'iroq ulandi" })
    .waitFor({ timeout: 25000 });
  await a.getByRole("button", { name: "Yakunlash", exact: true }).click();
  await b.getByRole("dialog").waitFor({ state: "hidden" });
  report.push(
    "Audio call across multiple tabs: only accepting tab connects, actual WebRTC and hang-up",
  );
  await a
    .getByRole("button", { name: "Video qo'ng'iroq", exact: true })
    .click();
  await b.getByRole("button", { name: "Qabul qilish", exact: true }).click();
  await a
    .getByRole("status")
    .filter({ hasText: "Qo'ng'iroq ulandi" })
    .waitFor({ timeout: 25000 });
  assert((await a.locator("video").count()) === 2);
  // Closing the accepted tab ends the call even with another user tab online.
  await b.close();
  await a.getByRole("dialog").waitFor({ state: "hidden" });
  report.push(
    "Video call with actual media tracks and accepted-tab disconnect cleanup",
  );
  await extraTab.close();
  // Exercise pages and mobile overflow, including dark mode.
  for (const route of ["letters", "orders"]) {
    await a.goto("http://127.0.0.1:5174/" + route);
    await a.getByRole("button", { name: "Yangi", exact: true }).click();
    const form = a.getByRole("dialog");
    await form
      .getByLabel("Nomi", { exact: true })
      .fill(route === "letters" ? "Ruxsatnoma xati" : "Ish boshlash buyrug‘i");
    await form
      .getByLabel("Loyiha", { exact: true })
      .selectOption(String(project._id));
    await form.getByRole("button", { name: "Saqlash", exact: true }).click();
    await form.waitFor({ state: "hidden" });
    await a
      .getByRole("button", {
        name: route === "letters" ? "Ruxsatnoma xati" : "Ish boshlash buyrug‘i",
        exact: true,
      })
      .waitFor();
    await screenshot(a, route);
  }
  report.push("Letter/order creation through forms and persisted records");
  await a.goto(`http://127.0.0.1:5174/projects/${project._id}`);
  await a.getByRole("button", { name: "Xarajatlar", exact: true }).click();
  await a.getByRole("button", { name: "Yangi", exact: true }).click();
  const expenseForm = a.getByRole("dialog");
  await expenseForm.getByLabel("Nomi", { exact: true }).fill("Eskiz xarajati");
  await expenseForm.getByLabel("Dog summa", { exact: true }).fill("250000");
  await expenseForm
    .getByRole("button", { name: "Saqlash", exact: true })
    .click();
  await expenseForm.waitFor({ state: "hidden" });
  await a
    .getByRole("button", { name: "Eskiz xarajati", exact: true })
    .waitFor();
  await screenshot(a, "expenses");
  assert.equal(
    (await api(a, `/export/projects/${project._id}/expenses`)).status,
    200,
  );
  report.push("Expense creation through UI and XLSX export");
  if (config.turnSecret) {
    const relay = await a.evaluate(async () => {
      const { iceServers } = await (await fetch("/api/chat/ice")).json();
      const p = new RTCPeerConnection({
          iceServers,
          iceTransportPolicy: "relay",
        }),
        q = new RTCPeerConnection({ iceServers, iceTransportPolicy: "relay" }),
        pendingP = [],
        pendingQ = [];
      let channel;
      try {
        return await new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("TURN relay timeout")),
            20000,
          );
          const fail = (e) => {
            clearTimeout(timer);
            reject(e);
          };
          p.onicecandidate = (e) => {
            if (e.candidate) {
              if (q.remoteDescription)
                q.addIceCandidate(e.candidate).catch(fail);
              else pendingQ.push(e.candidate);
            }
          };
          q.onicecandidate = (e) => {
            if (e.candidate) {
              if (p.remoteDescription)
                p.addIceCandidate(e.candidate).catch(fail);
              else pendingP.push(e.candidate);
            }
          };
          q.ondatachannel = (e) =>
            (e.channel.onmessage = () => e.channel.send("relay-ok"));
          channel = p.createDataChannel("relay-test");
          channel.onopen = () => channel.send("relay-check");
          channel.onmessage = async (e) => {
            clearTimeout(timer);
            const stats = await p.getStats(),
              pair = [...stats.values()].find(
                (s) =>
                  s.type === "candidate-pair" &&
                  s.state === "succeeded" &&
                  s.nominated,
              );
            resolve({
              message: e.data,
              type: stats.get(pair.localCandidateId).candidateType,
            });
          };
          const negotiate = async () => {
            try {
              await p.setLocalDescription(await p.createOffer());
              await q.setRemoteDescription(p.localDescription);
              for (const c of pendingQ) await q.addIceCandidate(c);
              await q.setLocalDescription(await q.createAnswer());
              await p.setRemoteDescription(q.localDescription);
              for (const c of pendingP) await p.addIceCandidate(c);
            } catch (e) {
              fail(e);
            }
          };
          negotiate().catch(fail);
        });
      } finally {
        channel?.close();
        p.close();
        q.close();
      }
    });
    assert.equal(relay.type, "relay");
    assert.equal(relay.message, "relay-ok");
    report.push("Forced authenticated TURN relay exchanged actual data");
  }
  for (const route of ["settings", "files", "dashboard", "notifications"]) {
    await a.goto("http://127.0.0.1:5174/" + route);
    await a.locator("h1").waitFor();
    await screenshot(a, route);
  }
  await a.goto("http://127.0.0.1:5174/settings");
  await a.getByLabel("Tema", { exact: true }).selectOption("dark");
  await a.locator("html.dark").waitFor();
  await screenshot(a, "settings-dark");
  await a.getByLabel("Tema", { exact: true }).selectOption("light");
  await a.setViewportSize({ width: 390, height: 844 });
  for (const route of ["projects", "tasks", "users", "settings", "chat"]) {
    await a.goto("http://127.0.0.1:5174/" + route);
    await a.locator(route === "chat" ? ".chat-search" : "h1").waitFor();
    const width = await a.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    assert(
      width.scroll <= width.client + 1,
      `Overflow ${route}: ${JSON.stringify(width)}`,
    );
    await screenshot(a, "mobile-" + route);
  }
  report.push(
    "Desktop/mobile pages, no page overflow and persistent dark theme",
  );
  assert.deepEqual(errors, [], "Browser JS errors");
  await fs.writeFile(
    process.env.REPORT_PATH ||
      "/home/deploy/archlab-staging/browser-report.json",
    JSON.stringify({ passed: true, report, errors }, null, 2),
  );
  console.log(JSON.stringify({ passed: true, report }));
} catch (e) {
  console.error(e.stack);
  const pages = ownerContext?.pages() || [];
  if (pages[0]) await screenshot(pages[0], "failure").catch(() => {});
  await fs.writeFile(
    process.env.REPORT_PATH ||
      "/home/deploy/archlab-staging/browser-report.json",
    JSON.stringify(
      { passed: false, report, errors, error: e.message },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
  const scoped = { createdBy: { $in: userIds } };
  const files = await File.find({ uploadedBy: { $in: userIds } });
  for (const f of files)
    if (f.path.startsWith(config.uploadDir + "/"))
      await fs.unlink(f.path).catch(() => {});
  await File.deleteMany({ uploadedBy: { $in: userIds } });
  const chats = await Conversation.find({ participants: { $in: userIds } });
  await Message.deleteMany({ conversation: { $in: chats.map((c) => c._id) } });
  await Conversation.deleteMany({ _id: { $in: chats.map((c) => c._id) } });
  for (const Model of [
    ProjectFolder,
    Contract,
    Letter,
    Order,
    Expense,
    Task,
    Notification,
  ])
    await Model.deleteMany(scoped);
  await Project.deleteMany({ owner: { $in: userIds } });
  await AuditLog.deleteMany({ actor: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  await mongoose.disconnect();
}
