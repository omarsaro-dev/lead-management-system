import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { spawn } from "node:child_process";
import { createSession, validSession, validCredentials, sessionSeconds } from "../lib/auth.ts";

// Ephemeral credentials, only in this process and its isolated test server. No lead writes.
const password = randomBytes(20).toString("hex");
const salt = randomBytes(16).toString("hex");
process.env.AUTH_EMAIL = "auth-test@example.invalid";
process.env.AUTH_PASSWORD_HASH = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
process.env.AUTH_SECRET = randomBytes(48).toString("hex");
assert.equal(await validCredentials(process.env.AUTH_EMAIL, password), true);
assert.equal(await validCredentials(process.env.AUTH_EMAIL, "incorrect"), false);
const token = createSession();
assert.equal(validSession(token), true);
assert.equal(validSession(token + "tampered"), false);
const originalNow = Date.now;
Date.now = () => originalNow() + (sessionSeconds + 1) * 1000;
assert.equal(validSession(token), false);
Date.now = originalNow;

const base = "http://127.0.0.1:3107";
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3107"], { env: process.env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
let serverOutput = "";
child.stdout.on("data", chunk => { serverOutput += chunk; });
child.stderr.on("data", chunk => { serverOutput += chunk; });
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error(`Test server stopped: ${serverOutput}`);
    if (serverOutput.includes("Ready")) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, "Test server started");
  const send = (path, options = {}) => fetch(base + path, { redirect: "manual", ...options });
  const login = (pass, origin = base) => send("/api/auth/login", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.AUTH_EMAIL, password: pass }) });
  assert.equal((await send("/login")).status, 200);
  for (const path of ["/", "/leads", "/analytics", "/settings"]) assert.equal((await send(path)).status, 307);
  assert.equal((await send("/api/leadflow/leads")).status, 401);
  assert.equal((await send("/api/n8n/leads", { method: "POST" })).status, 401);
  assert.equal((await login(password, "https://example.invalid")).status, 403);
  assert.equal((await login("incorrect")).status, 401);
  const response = await login(password);
  assert.equal(response.status, 200);
  const header = response.headers.get("set-cookie");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=strict/i);
  const cookie = header.split(";")[0];
  assert.equal((await send("/", { headers: { Cookie: cookie } })).status, 200);
  assert.equal((await send("/", { headers: { Cookie: cookie + "tampered" } })).status, 307);
  const settings = await send("/settings", { headers: { Cookie: cookie } });
  const visible = (await settings.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(visible, /\bAPI\b|FastAPI|NEXT_PUBLIC|ngrok/i);
  assert.equal((await send("/api/n8n/leads", { method: "POST", headers: { Cookie: cookie, Origin: base, "Content-Type": "application/json" }, body: "{}" })).status, 422);
  assert.equal((await send("/api/leadflow/leads", { method: "DELETE", headers: { Cookie: cookie, Origin: "https://example.invalid" } })).status, 403);
  const logout = await send("/api/auth/logout", { method: "POST", headers: { Cookie: cookie, Origin: base } });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
  assert.equal((await send("/")).status, 307);
  for (let attempt = 0; attempt < 10; attempt++) assert.equal((await login("incorrect")).status, 401);
  assert.equal((await login("incorrect")).status, 429);
  console.log("PASS: password verification, expiry, tampering, page/data protection, login, logout, same-origin checks, rate limiting, and settings text.");
} finally { child.kill(); }
