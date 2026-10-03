import mongoose from "mongoose";
import { projectStatuses } from "../config.js";

const projectSchema = new mongoose.Schema(
  {
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    objectName: { type: String, trim: true },
    objectAddress: { type: String, trim: true },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    contractAmount: { type: Number, default: 0 },
    category: { type: String, default: "general", trim: true },
    status: {
      type: String,
      enum: projectStatuses,
      default: "new",
      index: true,
    },
    description: String,
    date: { type: Date, default: Date.now, index: true },
    helper: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    master: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

projectSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  return data;
};

export const Project = mongoose.model("Project", projectSchema);
