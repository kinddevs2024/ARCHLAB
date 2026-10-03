import { Server } from "socket.io";
import crypto from "node:crypto";
import { authRequired } from "./middleware/auth.js";
import { conversationFor } from "./middleware/access.js";
import { config } from "./config.js";
export const onlineUsers = new Map();
export let io;
const calls = new Map();
export function attachRealtime(server) {
  io = new Server(server, {
    path: "/api/socket.io",
    maxHttpBufferSize: 20000,
    cors: { origin: config.corsOrigin, credentials: true },
    allowRequest: (req, cb) =>
      cb(
        null,
        !req.headers.origin || config.corsOrigin.includes(req.headers.origin),
      ),
  });
  io.use((socket, next) => authRequired(socket.request, {}, next));
  io.on("connection", (socket) => {
    const user = socket.request.user;
    socket.join(`user:${user.id}`);
    onlineUsers.set(user.id, (onlineUsers.get(user.id) || 0) + 1);
    const revalidate = setInterval(
      () =>
        authRequired(socket.request, {}, (error) => {
          if (error) socket.disconnect(true);
        }),
      30000,
    );
    revalidate.unref();
    let bucket = 0,
      last = Date.now();
    socket.use((packet, next) => {
      if (Date.now() - last > 60000) {
        bucket = 0;
        last = Date.now();
      }
      if (++bucket > 120) return next(new Error("Juda ko'p so'rov"));
      authRequired(socket.request, {}, next);
    });
    socket.on("call:invite", async (payload, ack = () => {}) => {
      try {
        const chat = await conversationFor(
          socket.request.user,
          payload.conversation,
        );
        const target = String(payload.target || "");
        if (
          !chat.participants.some((id) => String(id) === target) ||
          target === user.id
        )
          throw new Error("Ruxsat yo'q");
        if (!onlineUsers.has(target)) throw new Error("Xodim hozir offline");
        if (
          [...calls.values()].some(
            (c) =>
              [c.from, c.to].includes(user.id) ||
              [c.from, c.to].includes(target),
          )
        )
          throw new Error("Qo'ng'iroq band");
        const id = crypto.randomUUID(),
          call = {
            id,
            from: user.id,
            fromSocket: socket.id,
            to: target,
            conversation: String(chat._id),
            video: payload.video === true,
            at: Date.now(),
          };
        calls.set(id, call);
        io.to(`user:${target}`).emit("call:incoming", {
          id,
          from: call.from,
          to: call.to,
          conversation: call.conversation,
          video: call.video,
          at: call.at,
          caller: { id: user.id, name: user.name, surname: user.surname },
        });
        ack({ ok: true, id });
        setTimeout(() => {
          if (calls.has(id) && !calls.get(id).accepted) {
            io.to(`user:${call.from}`)
              .to(`user:${call.to}`)
              .emit("call:ended", { id, reason: "Javob yo'q" });
            calls.delete(id);
          }
        }, 45000).unref();
      } catch (e) {
        ack({ ok: false, message: e.message });
      }
    });
    socket.on("call:accept", async (payload, ack = () => {}) => {
      const id = payload?.id;
      const c = calls.get(id);
      if (!c || c.to !== user.id || c.accepted) return ack({ ok: false });
      try {
        await conversationFor(socket.request.user, c.conversation);
        if (calls.get(id) !== c || c.accepted || !socket.connected)
          return ack({ ok: false });
        c.accepted = true;
        c.toSocket = socket.id;
        socket.to(`user:${c.to}`).emit("call:answered_elsewhere", { id });
        io.to(c.fromSocket).emit("call:accepted", {
          id,
          target: c.to,
          video: c.video,
        });
        ack({ ok: true });
      } catch {
        ack({ ok: false });
      }
    });
    socket.on("call:signal", (payload) => {
      const { id, signal } = payload || {};
      const c = calls.get(id);
      if (!c || !c.accepted || ![c.fromSocket, c.toSocket].includes(socket.id))
        return;
      if (!signal || typeof signal !== "object") return;
      io.to(c.fromSocket === socket.id ? c.toSocket : c.fromSocket).emit(
        "call:signal",
        {
          id,
          signal,
        },
      );
    });
    socket.on("call:end", (payload) => {
      const id = payload?.id;
      const c = calls.get(id);
      if (!c || ![c.from, c.to].includes(user.id)) return;
      if (c.accepted && ![c.fromSocket, c.toSocket].includes(socket.id)) return;
      if (!c.accepted && c.from === user.id && c.fromSocket !== socket.id)
        return;
      io.to(`user:${c.from}`).to(`user:${c.to}`).emit("call:ended", { id });
      calls.delete(id);
    });
    socket.on("disconnect", () => {
      clearInterval(revalidate);
      const count = (onlineUsers.get(user.id) || 1) - 1;
      if (count) onlineUsers.set(user.id, count);
      else onlineUsers.delete(user.id);
      for (const [id, c] of calls)
        if (
          [c.fromSocket, c.toSocket].includes(socket.id) ||
          (!count && c.to === user.id)
        ) {
          io.to(`user:${c.from}`)
            .to(`user:${c.to}`)
            .emit("call:ended", { id, reason: "Aloqa uzildi" });
          calls.delete(id);
        }
    });
  });
}
export const notifyParticipants = (conversation, event, payload) => {
  if (!io) return;
  for (const id of conversation.participants)
    io.to(`user:${id}`).emit(event, payload);
};
