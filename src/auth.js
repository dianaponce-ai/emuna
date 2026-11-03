// Sesión firmada en cookie (sin estado en servidor: funciona igual en Vercel).
import crypto from "node:crypto";

const COOKIE = "emuna_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días
const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // Sin SESSION_SECRET: se deriva de la URL de la base (que es privada) para no bloquear el panel.
  const db = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (db) return crypto.createHash("sha256").update("emuna-session:" + db).digest("base64url");
  return isProd ? null : "dev-secret-cambiar";
}
export function adminPassword() {
  return process.env.ADMIN_PASSWORD || (isProd ? null : "emuna2026");
}
export function adminEmail() {
  return (process.env.ADMIN_EMAIL || "admin@emuna.com").toLowerCase();
}

function sign(data) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}
function safeEqual(a, b) {
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("base64url");
  return `scrypt$${salt}$${crypto.scryptSync(String(pw), salt, 32).toString("base64url")}`;
}
function verifyHash(pw, stored) {
  const [alg, salt, hash] = String(stored || "").split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  return safeEqual(crypto.scryptSync(String(pw || ""), salt, 32).toString("base64url"), hash);
}

// Devuelve { email, name, role } o null. Primero el admin de las variables de entorno, después la tabla users.
export async function checkCredentials(email, password, findUser) {
  if (!secret()) return null;
  const e = String(email || "").toLowerCase().trim();
  const pass = adminPassword();
  if (pass && safeEqual(e, adminEmail()) && safeEqual(password || "", pass)) return { email: e, name: "Administrador", role: "admin" };
  const u = await findUser(e);
  if (u && verifyHash(password, u.pass_hash)) return { email: u.email, name: u.name, role: u.role };
  return null;
}

export function setSession(res, user) {
  const payload = Buffer.from(JSON.stringify({ e: user.email, n: user.name, r: user.role, x: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  res.setHeader("Set-Cookie", `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${isProd ? "; Secure" : ""}`);
}
export function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? "; Secure" : ""}`);
}

export function readSession(req) {
  if (!secret()) return null;
  const raw = (req.headers.cookie || "").split(/;\s*/).find(c => c.startsWith(COOKIE + "="));
  if (!raw) return null;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.x > Date.now() ? data : null;
  } catch { return null; }
}

export function requireAuth(req, res, next) {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: "No autorizado" });
  req.user = s;
  // Permisos: lectura = solo ver; editor = todo menos borrar; admin = todo
  const role = s.r || "admin";
  if (role === "lectura" && req.method !== "GET") return res.status(403).json({ error: "Tu usuario es de solo lectura." });
  if (role === "editor" && req.method === "DELETE") return res.status(403).json({ error: "Solo un administrador puede borrar." });
  next();
}

// Límite simple de intentos por IP (en memoria)
const hits = new Map();
export function rateLimit(key, max, windowMs) {
  return (req, res, next) => {
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    const k = `${key}:${ip}`, now = Date.now();
    const arr = (hits.get(k) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: "Demasiados intentos. Probá en unos minutos." });
    arr.push(now); hits.set(k, arr);
    next();
  };
}
