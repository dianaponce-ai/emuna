// Protección anti-bots y utilidades de seguridad.
// Capas: campo trampa (honeypot) + tiempo mínimo de llenado + límite de intentos en la base
// + Cloudflare Turnstile (opcional, se activa al cargar las claves).
import { q, one } from "./db.js";

export const turnstileSiteKey = () => process.env.TURNSTILE_SITE_KEY || "";

export function clientIp(req) {
  return (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip })
    });
    const d = await r.json();
    return !!d.success;
  } catch (e) {
    console.error("[turnstile]", e.message);
    return false;
  }
}

// Middleware para formularios públicos y de acceso.
// minMs: tiempo mínimo entre que se muestra el formulario y se envía (los bots envían al instante).
export function humanCheck({ minMs = 2500, silent = false } = {}) {
  return async (req, res, next) => {
    const b = req.body || {};
    const fail = msg => silent ? res.status(200).json({ ok: true }) : res.status(400).json({ error: msg });
    if (b._hp) return fail("No pudimos procesar el envío.");
    const t = Number(b._t);
    const elapsed = Date.now() - t;
    if (!t || elapsed < minMs || elapsed > 1000 * 60 * 60 * 24)
      return res.status(400).json({ error: "Esperá unos segundos y volvé a intentar." });
    if (!(await verifyTurnstile(b._ts, clientIp(req))))
      return res.status(400).json({ error: "No pudimos verificar que no seas un robot. Recargá la página e intentá de nuevo." });
    next();
  };
}

// Límite de intentos guardado en la base (sirve también en serverless, donde la memoria no se comparte).
export async function tooMany(key, max, windowMin) {
  await q("DELETE FROM auth_attempts WHERE created_at < now() - interval '1 day'");
  const r = await one(
    `SELECT count(*)::int AS n FROM auth_attempts WHERE key = $1 AND created_at > now() - ($2 || ' minutes')::interval`,
    [key, String(windowMin)]);
  return r.n >= max;
}
export async function recordAttempt(key) {
  await q("INSERT INTO auth_attempts (key) VALUES ($1)", [key]);
}
export async function clearAttempts(key) {
  await q("DELETE FROM auth_attempts WHERE key = $1", [key]);
}

// Envío de emails con Resend (https://resend.com). Sin clave, el email se muestra en los logs del servidor.
export async function sendMail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "EMUNÁ <onboarding@resend.dev>";
  if (!key) {
    console.log(`[email sin enviar: falta RESEND_API_KEY]\nPara: ${to}\nAsunto: ${subject}\n${text || html}`);
    return false;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, text })
  });
  if (!r.ok) console.error("[email]", r.status, await r.text());
  return r.ok;
}
