import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: String,
    lastMessageAt: Date,
  },
  { timestamps: true }
);

conversationSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  return data;
};

export const Conversation = mongoose.model("Conversation", conversationSchema);
