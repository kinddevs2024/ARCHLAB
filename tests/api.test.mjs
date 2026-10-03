import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../beckend/config.js";
import { patchData, literalSearch } from "../beckend/utils/validation.js";
import { User } from "../beckend/models/User.js";
import { Project } from "../beckend/models/Project.js";
import { Task } from "../beckend/models/Task.js";
import { Conversation } from "../beckend/models/Conversation.js";
import { Message } from "../beckend/models/Message.js";
import { Notification } from "../beckend/models/Notification.js";
import { AuditLog } from "../beckend/models/AuditLog.js";
test("PATCH preserves omitted defaults", () => {
  const schema = z.object({
    title: z.string(),
    status: z.string().default("new"),
    amount: z.number().default(0),
    assignedTo: z.array(z.string()).default([]),
  });
  assert.deepEqual(patchData(schema, { title: "changed" }), {
    title: "changed",
  });
  assert(literalSearch("[a+.(").test("[a+.("));
});
test("isolated staging access and lifecycle", async () => {
  assert(
    config.mongoUri.startsWith("mongodb://127.0.0.1:27021/"),
    "Tests must run against staging only",
  );
  await mongoose.connect(config.mongoUri);
  const ids = [],
    pids = [],
    tids = [],
    cids = [];
  const marker = `audit-${Date.now()}`,
    password = "Stage-only-password-42";
  const api = async (cookie, path, method = "GET", body) => {
    const r = await fetch(`http://127.0.0.1:4031/api${path}`, {
      method,
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
        Origin: "http://127.0.0.1:5174",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data;
    try {
      data = await r.json();
    } catch {
      data = null;
    }
    return {
      status: r.status,
      data,
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  };
  try {
    const people = {};
    for (const role of ["Owner", "Admin", "Manager", "User"]) {
      const user = await User.create({
        email: `${marker}-${role.toLowerCase()}@example.test`,
        password: await bcrypt.hash(password, 4),
        status: role,
        name: role,
      });
      ids.push(user._id);
      const login = await api(null, "/auth/login", "POST", {
        email: user.email,
        password,
      });
      assert.equal(login.status, 200);
      people[role] = { id: String(user._id), cookie: login.cookie };
    }
    const owner = people.Owner.cookie,
      employee = people.User.cookie,
      manager = people.Manager.cookie;
    let r = await api(owner, "/projects", "POST", {
      title: marker,
      status: "done",
      company: "Preserve",
      contractAmount: 950,
      assignedTo: [people.User.id, people.Manager.id],
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    const id = r.data.id;
    pids.push(id);
    r = await api(owner, `/projects/${id}`, "PATCH", {
      title: marker + " updated",
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.status, "done");
    assert.equal(r.data.company, "Preserve");
    assert.equal(r.data.contractAmount, 950);
    assert.equal(r.data.assignedTo.length, 2);
    r = await api(employee, `/projects/${id}`);
    assert.equal(r.status, 200);
    assert(!Object.hasOwn(r.data, "contractAmount"));
    assert.equal((await api(employee, "/contracts")).status, 403);
    assert.equal(
      (await api(manager, `/projects/${id}`, "PATCH", { assignedTo: [] }))
        .status,
      403,
    );
    r = await api(owner, "/projects", "POST", { title: marker + " hidden" });
    const hidden = r.data.id;
    pids.push(hidden);
    assert.equal((await api(employee, `/projects/${hidden}`)).status, 404);
    r = await api(employee, `/search?q=${marker}`);
    assert.equal(r.status, 200);
    assert(!r.data.data.some((x) => x.id === hidden));
    assert(!r.data.data.some((x) => x.type === "user"));
    assert.equal((await api(owner, "/projects?search=%5B")).status, 200);
    assert.equal((await api(owner, "/projects?page=1.5")).status, 400);
    assert.equal((await api(owner, "/projects/bad-id")).status, 400);
    assert.equal(
      (
        await api(owner, "/tasks", "POST", {
          title: marker,
          project: hidden,
          assignee: people.User.id,
        })
      ).status,
      400,
      "Unassigned employees cannot receive inaccessible project tasks",
    );
    r = await api(owner, "/tasks", "POST", {
      title: marker,
      project: id,
      assignee: people.User.id,
    });
    assert.equal(r.status, 201);
    const taskId = r.data.id;
    tids.push(taskId);
    assert.equal(
      (await api(employee, `/tasks/${taskId}`, "PATCH", { status: "done" }))
        .status,
      200,
    );
    assert.equal(
      (
        await api(employee, `/tasks/${taskId}`, "PATCH", {
          assignee: people.Owner.id,
        })
      ).status,
      403,
    );
    r = await api(owner, "/chat/conversations", "POST", {
      title: marker,
      participants: [people.User.id],
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    const conversation = r.data.id;
    cids.push(conversation);
    assert.equal(
      (await api(manager, `/chat/conversations/${conversation}/messages`))
        .status,
      404,
    );
    const messages = Array.from({ length: 110 }, (_, i) => ({
      conversation,
      sender: people.Owner.id,
      text: String(i),
      readBy: [people.Owner.id],
    }));
    await Message.insertMany(messages);
    r = await api(
      employee,
      `/chat/conversations/${conversation}/messages?limit=50`,
    );
    assert.equal(r.data.data.at(-1).text, "109");
    assert.equal(r.data.hasMore, true);
    assert.equal(r.data.data.length, 50);
    assert.equal((await api(owner, `/projects/${id}`, "DELETE")).status, 200);
    assert.equal((await api(owner, `/projects/${id}`)).status, 404);
    assert.equal(
      (await api(owner, `/projects/${id}/restore`, "POST")).status,
      200,
    );
    assert.equal((await api(owner, `/projects/${id}`)).status, 200);
    assert.equal(
      (
        await api(people.Admin.cookie, `/users/${people.Owner.id}`, "PATCH", {
          active: false,
        })
      ).status,
      403,
    );
    console.log(
      "Role isolation, PATCH preservation, cursor history and archive/restore passed",
    );
  } finally {
    await Message.deleteMany({ conversation: { $in: cids } });
    await Conversation.deleteMany({ _id: { $in: cids } });
    await Task.deleteMany({ _id: { $in: tids } });
    await Project.deleteMany({ _id: { $in: pids } });
    await Notification.deleteMany({ createdBy: { $in: ids } });
    await AuditLog.deleteMany({ actor: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    await mongoose.disconnect();
  }
});
