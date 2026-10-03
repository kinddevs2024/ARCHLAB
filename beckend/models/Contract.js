import mongoose from "mongoose";
import { documentStatuses } from "../config.js";

const contractSchema = new mongoose.Schema(
  {
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    contractNumber: { type: String, default: "", trim: true, index: true },
    customerName: { type: String, default: "", trim: true },
    customerPhone: { type: String, default: "", trim: true },
    amount: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    signedAt: { type: Date, default: Date.now, index: true },
    closedAt: Date,
    status: {
      type: String,
      enum: documentStatuses,
      default: "draft",
      index: true,
    },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

contractSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  return data;
};

export const Contract = mongoose.model("Contract", contractSchema);
