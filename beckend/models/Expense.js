import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    date: { type: Date, default: Date.now, index: true },
    closedAt: Date,
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

expenseSchema.methods.toPublic = function toPublic() {
  const data = this.toObject();
  data.id = data._id.toString();
  delete data._id;
  delete data.__v;
  return data;
};

export const Expense = mongoose.model("Expense", expenseSchema);
