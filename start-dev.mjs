import { execSync } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

execSync("/opt/homebrew/bin/node node_modules/.bin/next dev", {
  stdio: "inherit",
  env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH}` },
});
