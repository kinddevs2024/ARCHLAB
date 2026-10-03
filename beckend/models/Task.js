import mongoose from "mongoose";
import { taskStatuses } from "../config.js";

const taskSchema = new mongoose.Schema(
  {
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    description: String,
    status: { type: String, enum: taskStatuses, default: "todo", index: true },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    dueDate: Date,
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

taskSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  return data;
};

export const Task = mongoose.model("Task", taskSchema);
