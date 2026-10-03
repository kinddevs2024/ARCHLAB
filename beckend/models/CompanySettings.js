import mongoose from "mongoose";

const companySettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    companyName: { type: String, default: "ARCH LAB", trim: true },
    archivePath: { type: String, default: "uploads", trim: true },
    language: { type: String, default: "uz", trim: true },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

companySettingsSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  return data;
};

export const CompanySettings = mongoose.model(
  "CompanySettings",
  companySettingsSchema,
);
