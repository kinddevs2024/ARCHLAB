import { rmSync, lstatSync, realpathSync } from "node:fs";
import path from "node:path";
const root = realpathSync(process.cwd()),
  output = path.join(root, "dist");
if (lstatSync(output, { throwIfNoEntry: false })?.isSymbolicLink())
  throw new Error("Build output must not be a symlink");
rmSync(output, { recursive: true, force: true });
