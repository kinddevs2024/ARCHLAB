import mongoose from "mongoose";
import { config } from "./config.js";

export const connectDb = async () => {
  const uri = config.mongoUri;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to .env before starting the backend.");
  }

  console.log(`Connecting to MongoDB: ${uri}`);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    family: 4,
  });
};

export const mongoState = () =>
  mongoose.connection.readyState === 1 ? "connected" : "disconnected";
