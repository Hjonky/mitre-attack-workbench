import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "frontend/package.json"));
const vite = resolve(
  dirname(require.resolve("vite/package.json")),
  "bin/vite.js",
);
const processes = [
  spawn(process.execPath, ["server.js"], {
    cwd: resolve(root, "backend"),
    stdio: "inherit",
  }),
  spawn(process.execPath, [vite, "--host", "127.0.0.1"], {
    cwd: resolve(root, "frontend"),
    stdio: "inherit",
  }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) child.kill();
  process.exitCode = code;
}
for (const child of processes) {
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => stop(code || 0));
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
