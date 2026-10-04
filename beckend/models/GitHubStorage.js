import mongoose from "mongoose";
const backup = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
    },
    owner: String,
    repository: String,
    url: String,
    title: String,
    metadataHash: String,
    status: { type: String, default: "pending" },
    lastError: String,
    syncedAt: Date,
  },
  { timestamps: true },
);
const jobs = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    type: { type: String, enum: ["project", "file"], required: true },
    project: mongoose.Schema.Types.ObjectId,
    file: mongoose.Schema.Types.ObjectId,
    state: { type: String, default: "pending" },
    attempts: { type: Number, default: 0 },
    revision: { type: Number, default: 1 },
    nextAttempt: { type: Date, default: Date.now },
    lockedAt: Date,
    claim: String,
    lastError: String,
  },
  { timestamps: true },
);
jobs.index({ state: 1, nextAttempt: 1, lockedAt: 1 });
const state = new mongoose.Schema(
  {
    _id: String,
    heartbeat: Date,
    running: Boolean,
    lastSuccess: Date,
    lastError: String,
  },
  { timestamps: true },
);
export const GitHubArchive = mongoose.model("GitHubArchive", backup);
export const StorageJob = mongoose.model("StorageJob", jobs);
export const StorageState = mongoose.model("StorageState", state);
