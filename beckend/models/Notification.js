import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
    recipientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    title: { type: String, required: true, trim: true },
    message: { type: String, default: "" },
    type: { type: String, default: "info", index: true },
    entityType: { type: String, default: "", trim: true },
    entityId: { type: String, default: "", trim: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

notificationSchema.methods.toPublic = function toPublic(userId) {
  const data = this.toObject();
  data.id = data._id.toString();
  data.read = userId
    ? data.readBy.some((id) => String(id) === String(userId))
    : false;
  delete data._id;
  delete data.__v;
  return data;
};

export const Notification = mongoose.model("Notification", notificationSchema);
