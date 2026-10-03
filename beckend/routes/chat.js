import express from "express";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { conversationFor, validAssignees } from "../middleware/access.js";
import { fileFor } from "../middleware/fileAccess.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { objectId, requireId, literalSearch } from "../utils/validation.js";
import { badRequest, forbidden } from "../utils/apiError.js";
import { notifyParticipants, onlineUsers } from "../realtime.js";
import { config } from "../config.js";
export const chatRouter = express.Router();
chatRouter.use(authRequired);
chatRouter.get("/ice", (req, res) => {
  const iceServers = [{ urls: ["stun:stun.cloudflare.com:3478"] }];
  if (config.turnSecret && config.turnUrls.length) {
    const username = `${Math.floor(Date.now() / 1000) + 3600}:${req.user.id}`,
      credential = crypto
        .createHmac("sha1", config.turnSecret)
        .update(username)
        .digest("base64");
    iceServers.push({ urls: config.turnUrls, username, credential });
  }
  res.json({ iceServers, relayConfigured: !!config.turnSecret });
});
chatRouter.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const filter = { participants: req.user.id };
    if (req.query.search) filter.title = literalSearch(req.query.search);
    const items = await Conversation.find(filter)
      .populate("participants", "name surname avatar position")
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(200);
    const counts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: items.map((c) => c._id) },
          readBy: { $ne: new mongoose.Types.ObjectId(req.user.id) },
        },
      },
      { $group: { _id: "$conversation", count: { $sum: 1 } } },
    ]);
    res.json({
      data: items.map((i) => ({
        ...i.toPublic(),
        participants: i.participants.map((u) => ({
          ...u.toPublic(),
          online: onlineUsers.has(String(u._id)),
        })),
        unread: counts.find((c) => String(c._id) === String(i._id))?.count || 0,
      })),
    });
  }),
);
chatRouter.post(
  "/conversations",
  asyncHandler(async (req, res) => {
    const data = z
        .object({
          title: z.string().trim().min(1).max(120),
          participants: z.array(objectId).min(1).max(20),
        })
        .parse(req.body),
      participants = [...new Set([req.user.id, ...data.participants])];
    if (participants.length < 2) throw badRequest("Suhbatdoshni tanlang");
    await validAssignees({ assignedTo: participants });
    const item = await Conversation.create({ title: data.title, participants });
    notifyParticipants(item, "chat:changed", { id: String(item._id) });
    res.status(201).json(item.toPublic());
  }),
);
chatRouter.get(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    await conversationFor(req.user, req.params.id);
    const limit = Number(req.query.limit || 50);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw badRequest("Limit noto'g'ri");
    const filter = { conversation: req.params.id };
    if (req.query.before) filter._id = { $lt: requireId(req.query.before) };
    const items = await Message.find(filter)
      .populate("sender", "name surname avatar")
      .populate("attachments")
      .sort({ _id: -1 })
      .limit(limit + 1);
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    res.json({
      data: items
        .reverse()
        .map((i) => ({
          ...i.toPublic(),
          attachments: i.attachments
            .filter((f) => !f.deletedAt)
            .map((f) => f.toPublic()),
        })),
      hasMore,
      nextCursor: items[0] ? String(items[0]._id) : null,
    });
  }),
);
chatRouter.post(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    const chat = await conversationFor(req.user, req.params.id);
    const data = z
      .object({
        text: z.string().trim().max(5000).default(""),
        attachments: z.array(objectId).max(5).default([]),
      })
      .parse(req.body);
    if (!data.text && !data.attachments.length)
      throw badRequest("Xabar yoki faylni kiriting");
    for (const id of data.attachments) {
      const f = await fileFor(req.user, id);
      if (String(f.conversation) !== req.params.id) throw forbidden();
    }
    const item = await Message.create({
      ...data,
      conversation: chat._id,
      sender: req.user.id,
      readBy: [req.user.id],
    });
    chat.lastMessage = data.text || "Fayl";
    chat.lastMessageAt = new Date();
    await chat.save();
    notifyParticipants(chat, "chat:message", { conversation: req.params.id });
    res.status(201).json(item.toPublic());
  }),
);
chatRouter.patch(
  "/conversations/:id/read",
  asyncHandler(async (req, res) => {
    const chat = await conversationFor(req.user, req.params.id);
    await Message.updateMany(
      { conversation: chat._id, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } },
    );
    notifyParticipants(chat, "chat:read", {
      conversation: req.params.id,
      user: req.user.id,
    });
    res.json({ ok: true });
  }),
);
