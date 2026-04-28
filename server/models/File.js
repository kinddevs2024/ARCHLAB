import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, required: true },
    extension: { type: String, trim: true, lowercase: true, index: true },
    size: { type: Number, required: true },
    kind: { type: String, default: "document", index: true },
    section: { type: String, default: "archive", trim: true, index: true },
    entityType: { type: String, default: "", trim: true, index: true },
    entityId: { type: String, default: "", trim: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

fileSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  delete data.path;
  delete data.storedName;
  return data;
};

export const File = mongoose.model("File", fileSchema);
