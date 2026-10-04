import mongoose from "mongoose";
import path from "node:path";
import { config } from "../config.js";
import { File } from "../models/File.js";
import { eligibleFile } from "./github.js";
await mongoose.connect(config.mongoUri);
// Only verified project cache files are omitted. Database and unsynced/nonproject files retain normal backups.
for await (const file of File.find({
  "github.status": "synced",
  "github.verifiedAt": { $ne: null },
  "github.sha256": { $exists: true },
}).cursor()) {
  const local = path.resolve(file.path);
  if (eligibleFile(file) && local.startsWith(config.uploadDir + path.sep))
    process.stdout.write(path.relative(config.uploadDir, local) + "\0");
}
await mongoose.disconnect();
