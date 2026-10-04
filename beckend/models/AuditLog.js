import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: String,
    details: mongoose.Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1, _id: -1 });

auditLogSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  return data;
};

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
