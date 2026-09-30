import { randomBytes, scryptSync } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
const prompt = createInterface({ input: process.stdin, output: process.stdout });
try {
  const email = (await prompt.question("Workspace owner email: ")).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  const password = randomBytes(18).toString("base64url");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  const path = new URL("../.env.local", import.meta.url);
  const current = await readFile(path, "utf8").catch(error => { if (error.code === "ENOENT") return ""; throw error; });
  const kept = current.split(/\r?\n/).filter(line => !/^AUTH_(EMAIL|PASSWORD_HASH|SECRET)=/.test(line)).join("\n").trimEnd();
  await writeFile(path, `${kept}\nAUTH_EMAIL=${email}\nAUTH_PASSWORD_HASH=${salt}:${hash}\nAUTH_SECRET=${randomBytes(48).toString("hex")}\n`, { mode: 0o600 });
  console.log(`\nAccount configured. Save this password in your password manager:\n\n${password}\n\nRestart the dashboard, then sign in. Running setup again resets the account and invalidates existing sessions.`);
} finally { prompt.close(); }
