import mongoose from "mongoose";
import { config } from "./config.js";

export const connectDb = async () => {
  if (!config.mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to .env before starting the backend.");
  }

  await mongoose.connect(config.mongoUri);
};

export const mongoState = () =>
  mongoose.connection.readyState === 1 ? "connected" : "disconnected";
