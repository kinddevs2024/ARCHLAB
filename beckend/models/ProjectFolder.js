import mongoose from "mongoose";
import { projectStatuses } from "../config.js";

const projectFolderSchema = new mongoose.Schema(
  {
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectFolder",
      default: null,
      index: true,
    },
    contactPhone: { type: String, default: "" },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    key: { type: String, trim: true, index: true },
    status: {
      type: String,
      enum: projectStatuses,
      default: "new",
      index: true,
    },
    date: { type: Date, default: Date.now, index: true },
    order: { type: Number, default: 0 },
    description: { type: String, default: "" },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

projectFolderSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  return data;
};

export const ProjectFolder = mongoose.model(
  "ProjectFolder",
  projectFolderSchema,
);
