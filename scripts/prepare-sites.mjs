import { cpSync, mkdirSync, copyFileSync } from "node:fs";
mkdirSync("sites-dist/client", { recursive: true });
mkdirSync("sites-dist/server", { recursive: true });
mkdirSync("sites-dist/.openai", { recursive: true });
cpSync("dist", "sites-dist/client", { recursive: true });
copyFileSync("worker/index.js", "sites-dist/server/index.js");
copyFileSync(".openai/hosting.json", "sites-dist/.openai/hosting.json");
