import { Notification } from "../models/Notification.js";

export const createNotification = async (req, title, message, meta = {}) => {
  await Notification.create({
    title,
    message,
    type: meta.type || "info",
    entityType: meta.entityType || "",
    entityId: meta.entityId ? String(meta.entityId) : "",
    createdBy: req.user?.id,
  });
};
