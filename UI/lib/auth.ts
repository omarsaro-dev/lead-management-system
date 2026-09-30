import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt);
export const sessionCookie = "leadflow_session";
export const sessionSeconds = 60 * 60 * 8;
export function authConfigured() {
  return Boolean(process.env.AUTH_EMAIL && process.env.AUTH_PASSWORD_HASH && (process.env.AUTH_SECRET?.length ?? 0) >= 32);
}
function sign(value: string) {
  return createHmac("sha256", process.env.AUTH_SECRET!).update(`${process.env.AUTH_EMAIL}:${process.env.AUTH_PASSWORD_HASH}:${value}`).digest("base64url");
}
export function createSession() {
  if (!authConfigured()) throw new Error("Sign-in is not configured.");
  const value = `${Math.floor(Date.now() / 1000) + sessionSeconds}.${randomBytes(24).toString("hex")}`;
  return `${value}.${sign(value)}`;
}
export function validSession(token?: string) {
  if (!authConfigured() || !token || token.length > 200) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !/^[a-f0-9]{48}$/.test(parts[1])) return false;
  const expiry = Number(parts[0]);
  const now = Math.floor(Date.now() / 1000);
  if (expiry <= now || expiry > now + sessionSeconds) return false;
  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`));
  const supplied = Buffer.from(parts[2]);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
export async function validCredentials(email: string, password: string) {
  if (!authConfigured() || password.length > 1024) return false;
  const [salt, hash] = process.env.AUTH_PASSWORD_HASH!.split(":");
  if (!/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(hash ?? "")) return false;
  const actual = await derive(password, salt, 64) as Buffer;
  return timingSafeEqual(actual, Buffer.from(hash, "hex")) && email.trim().toLowerCase() === process.env.AUTH_EMAIL!.trim().toLowerCase();
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const source = new URL(origin);
    return ["http:", "https:"].includes(source.protocol) && source.host === (request.headers.get("host") ?? new URL(request.url).host);
  } catch { return false; }
}
