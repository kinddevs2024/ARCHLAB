import { Notification } from "../models/Notification.js";
export const createNotification = async (req, title, message, meta = {}) => {
  try {
    await Notification.create({
      title,
      message,
      type: meta.type || "info",
      entityType: meta.entityType || "",
      entityId: meta.entityId ? String(meta.entityId) : "",
      project: meta.project,
      recipientIds: meta.recipientIds || [],
      createdBy: req.user?.id,
    });
  } catch (error) {
    console.error("Notification write failed", error.name);
  }
};
