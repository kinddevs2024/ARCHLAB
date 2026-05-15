import mongoose from "mongoose";
import { taskStatuses } from "../config.js";

const orderSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: taskStatuses, default: "todo", index: true },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal", index: true },
    dueDate: Date,
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    customerName: { type: String, default: "", trim: true },
    customerPhone: { type: String, default: "", trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

orderSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  return data;
};

export const Order = mongoose.model("Order", orderSchema);
