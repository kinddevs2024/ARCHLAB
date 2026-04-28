import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

messageSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  return data;
};

export const Message = mongoose.model("Message", messageSchema);
