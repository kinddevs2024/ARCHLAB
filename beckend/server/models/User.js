import mongoose from "mongoose";
import { roles } from "../config.js";

const userSchema = new mongoose.Schema(
  {
    status: { type: String, enum: roles, default: "User", index: true },
    name: { type: String, default: "", trim: true },
    surname: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    username: { type: String, default: "", trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  delete data.password;
  return data;
};

export const User = mongoose.model("User", userSchema);
