import express from "express";
import { z } from "zod";
import { authRequired, requireRole } from "../middleware/auth.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination, paged } from "../utils/pagination.js";

export const chatRouter = express.Router();

chatRouter.use(authRequired, requireRole(["Owner"]));

chatRouter.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ participants: req.user.id }).sort({ lastMessageAt: -1, createdAt: -1 });
    res.json({ data: conversations.map((item) => item.toPublic()) });
  })
);

chatRouter.post(
  "/conversations",
  asyncHandler(async (req, res) => {
    const data = z.object({
      title: z.string().trim().min(1),
      participants: z.array(z.string()).optional().default([]),
    }).parse(req.body);
    const participants = Array.from(new Set([req.user.id, ...data.participants]));
    const conversation = await Conversation.create({ title: data.title, participants });
    res.status(201).json(conversation.toPublic());
  })
);

chatRouter.get(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { conversation: req.params.id };
    const [items, total] = await Promise.all([
      Message.find(filter).populate("sender", "name surname avatar").sort({ createdAt: 1 }).skip(skip).limit(limit),
      Message.countDocuments(filter),
    ]);
    res.json(paged(items.map((item) => item.toPublic()), total, page, limit));
  })
);

chatRouter.post(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    const data = z.object({ text: z.string().trim().min(1, "Xabar matnini kiriting") }).parse(req.body);
    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user.id,
      text: data.text,
      readBy: [req.user.id],
    });
    await Conversation.findByIdAndUpdate(req.params.id, {
      lastMessage: data.text,
      lastMessageAt: new Date(),
    });
    res.status(201).json(message.toPublic());
  })
);
