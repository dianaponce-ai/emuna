import express from "express";
import crypto from "node:crypto";
import { q, one, db } from "./db.js";
import { checkCredentials, setSession, clearSession, readSession, requireAuth, rateLimit, hashPassword } from "./auth.js";
import { TEST_LOGINS } from "./test-users.js";
import { humanCheck, tooMany, recordAttempt, clearAttempts, clientIp, sendMail, turnstileSiteKey } from "./security.js";

export const SERVICES = {
  "paid-media": "Marketing & Paid Media",
  "diseno-web": "Diseño & Desarrollo Web",
  "branding": "Branding & Content Strategy",
  "consultoria": "Consultoría & Optimización",
  "otro": "No definido"
};
export const STAGES = ["nuevo", "contactado", "reunion", "propuesta", "ganado", "perdido"];
const PROPOSAL_STATUS = ["borrador", "enviada", "aceptada", "rechazada"];
const ACT_TYPES = ["nota", "llamada", "email", "reunion", "whatsapp", "tarea", "sistema"];

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "300kb" }));
// Asegura que la base (y la clave de sesión) estén listas antes de cualquier ruta de la API
app.use("/api", (req, res, next) => { db().then(() => next(), next); });

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const str = (v, max = 2000) => (v == null ? null : String(v).trim().slice(0, max) || null);
const num = v => (Number.isFinite(+v) ? +v : 0);
const pick = (v, list, def) => (list.includes(v) ? v : def);
const ORDER_STAGE = s => STAGES.indexOf(s);

function proposalTotal(p) {
  const sub = (p.items || []).reduce((a, it) => a + num(it.qty) * num(it.price), 0);
  return Math.round(sub * (1 - num(p.discount) / 100) * 100) / 100;
}
function cleanItems(items) {
  return (Array.isArray(items) ? items : []).slice(0, 60).map(it => ({
    title: str(it.title, 200) || "Ítem",
    detail: str(it.detail, 800) || "",
    qty: num(it.qty) || 1,
    price: num(it.price),
    recurring: !!it.recurring
  }));
}
async function log(clientId, body, type = "sistema") {
  if (clientId) await q("INSERT INTO activities (client_id,type,body,done) VALUES ($1,$2,$3,true)", [clientId, type, body]);
}

/* ------------------------- público ------------------------- */

app.get("/api/health", wrap(async (_req, res) => {
  await q("SELECT 1");
  res.json({ ok: true });
}));

// Planillas del sitio → lead en el CRM
app.get("/api/config", (_req, res) => res.json({
  turnstileSiteKey: turnstileSiteKey(),
  testLogins: process.env.DISABLE_TEST_USERS ? [] : TEST_LOGINS
}));

app.post("/api/leads", rateLimit("lead", 8, 10 * 60 * 1000), humanCheck({ minMs: 4000, silent: true }), wrap(async (req, res) => {
  const b = req.body || {};
  if (await tooMany("lead:" + clientIp(req), 15, 60)) return res.status(429).json({ error: "Recibimos demasiados envíos. Probá más tarde o escribinos por WhatsApp." });
  await recordAttempt("lead:" + clientIp(req));
  const name = str(b.name, 120), email = str(b.email, 160);
  if (!name || name.length < 2) return res.status(400).json({ error: "Falta el nombre." });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: "Email inválido." });
  const service = pick(b.service, Object.keys(SERVICES), "otro");
  const brief = (Array.isArray(b.brief) ? b.brief : []).slice(0, 80).map(x => ({
    section: str(x.section, 80) || "", label: str(x.label, 200) || "", value: str(x.value, 3000) || "—"
  }));
  const row = await one(
    `INSERT INTO clients (name,email,phone,company,website,service,stage,source,brief,notes)
     VALUES ($1,$2,$3,$4,$5,$6,'nuevo',$7,$8,$9) RETURNING id`,
    [name, email, str(b.phone, 60), str(b.company, 160), str(b.website, 300), service,
     str(b.source, 40) || "web", JSON.stringify(brief), str(b.message, 4000)]
  );
  await log(row.id, `Ingresó por la planilla de ${SERVICES[service]}.`);
  res.status(201).json({ ok: true });
}));

// Propuesta pública por token
app.get("/api/public/proposals/:token", wrap(async (req, res) => {
  const p = await one(
    `SELECT p.*, c.name AS client_name, c.company AS client_company
       FROM proposals p LEFT JOIN clients c ON c.id = p.client_id WHERE p.token = $1`, [req.params.token]);
  if (!p || p.status === "borrador" && !readSession(req)) return res.status(404).json({ error: "Propuesta no encontrada" });
  if (!readSession(req) && !p.viewed_at) {
    await q("UPDATE proposals SET viewed_at = now() WHERE id = $1", [p.id]);
    await log(p.client_id, `Abrió la propuesta “${p.title}”.`);
  }
  const { id, client_id, ...pub } = p;
  res.json({ ...pub, total: proposalTotal(p) });
}));

app.post("/api/public/proposals/:token/accept", rateLimit("accept", 10, 60 * 60 * 1000), wrap(async (req, res) => {
  const p = await one("SELECT * FROM proposals WHERE token = $1", [req.params.token]);
  if (!p || p.status === "borrador") return res.status(404).json({ error: "Propuesta no encontrada" });
  if (p.status === "aceptada") return res.json({ ok: true, already: true });
  if (p.status === "rechazada") return res.status(409).json({ error: "Esta propuesta ya no está vigente." });
  if (p.valid_until && p.valid_until < new Date().toISOString().slice(0, 10))
    return res.status(409).json({ error: "La propuesta venció. Escribinos y la actualizamos." });
  const by = str(req.body?.name, 120);
  if (!by) return res.status(400).json({ error: "Escribí tu nombre para confirmar." });
  await q("UPDATE proposals SET status='aceptada', accepted_at=now(), accepted_by=$2, updated_at=now() WHERE id=$1", [p.id, by]);
  if (p.client_id) {
    await q("UPDATE clients SET stage='ganado', value=$2, updated_at=now() WHERE id=$1", [p.client_id, proposalTotal(p)]);
    await log(p.client_id, `Aceptó la propuesta “${p.title}” (firmó: ${by}).`);
  }
  res.json({ ok: true });
}));

/* ------------------------- auth ------------------------- */

app.post("/api/auth/login", rateLimit("login", 20, 15 * 60 * 1000), humanCheck({ minMs: 1200 }), wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const e = String(email || "").toLowerCase().trim();
  const ipKey = "login-ip:" + clientIp(req), userKey = "login-user:" + e;
  if (await tooMany(ipKey, 20, 15) || await tooMany(userKey, 6, 15))
    return res.status(429).json({ error: "Demasiados intentos fallidos. Esperá 15 minutos o recuperá tu contraseña." });
  const user = await checkCredentials(e, password, x => one("SELECT * FROM users WHERE email = $1", [x]));
  if (!user) {
    await recordAttempt(ipKey); await recordAttempt(userKey);
    return res.status(401).json({ error: "Email o contraseña incorrectos." });
  }
  await clearAttempts(userKey);
  await q("UPDATE users SET last_login = now() WHERE email = $1", [user.email]);
  setSession(res, user);
  res.json({ ok: true, user });
}));

// Olvidé mi contraseña: siempre responde lo mismo para no revelar qué emails existen.
const FORGOT_MSG = "Si el email está registrado, te enviamos un enlace para crear una contraseña nueva. Revisá tu bandeja (y spam).";
app.post("/api/auth/forgot", rateLimit("forgot", 5, 15 * 60 * 1000), humanCheck({ minMs: 1500 }), wrap(async (req, res) => {
  const e = String(req.body?.email || "").toLowerCase().trim();
  const ipKey = "forgot-ip:" + clientIp(req), userKey = "forgot-user:" + e;
  if (await tooMany(ipKey, 10, 60) || await tooMany(userKey, 3, 60)) return res.json({ ok: true, message: FORGOT_MSG });
  await recordAttempt(ipKey); await recordAttempt(userKey);
  const u = await one("SELECT * FROM users WHERE email = $1", [e]);
  if (u) {
    const token = crypto.randomBytes(32).toString("base64url");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    await q("UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL", [u.id]);
    await q("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '1 hour')", [u.id, hash]);
    const base = process.env.SITE_URL || `${req.headers["x-forwarded-proto"] || req.protocol}://${req.headers.host}`;
    const link = `${base.replace(/\/$/, "")}/admin/?reset=${token}`;
    await sendMail({
      to: u.email,
      subject: "Recuperar contraseña · EMUNÁ",
      text: `Hola ${u.name},\n\nPara crear una contraseña nueva entrá a este enlace (vence en 1 hora):\n${link}\n\nSi no lo pediste, ignorá este email.`,
      html: `<div style="font-family:Georgia,serif;color:#2C3320;max-width:480px;margin:auto;padding:32px;background:#F7F3EA;border-radius:18px">
        <p style="font-size:22px;letter-spacing:.14em;margin:0 0 24px">EMUNÁ<span style="color:#AA7229">.</span></p>
        <p style="font-family:Arial,sans-serif;font-size:15px">Hola ${u.name.replace(/[<>&]/g, "")},</p>
        <p style="font-family:Arial,sans-serif;font-size:15px">Recibimos un pedido para cambiar tu contraseña del panel. El enlace vence en 1 hora.</p>
        <p><a href="${link}" style="display:inline-block;background:#6E7D4E;color:#F7F3EA;padding:14px 22px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold">Crear contraseña nueva</a></p>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#5B6447">Si no lo pediste, ignorá este email: tu contraseña no cambia.</p></div>`
    });
  }
  res.json({ ok: true, message: FORGOT_MSG });
}));

app.post("/api/auth/reset", rateLimit("reset", 10, 15 * 60 * 1000), wrap(async (req, res) => {
  const { token, password } = req.body || {};
  if (!password || String(password).length < 10) return res.status(400).json({ error: "La contraseña tiene que tener al menos 10 caracteres." });
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return res.status(400).json({ error: "Usá letras y números." });
  const hash = crypto.createHash("sha256").update(String(token || "")).digest("hex");
  const r = await one(
    `SELECT pr.id, pr.user_id, u.email FROM password_resets pr JOIN users u ON u.id = pr.user_id
     WHERE pr.token_hash = $1 AND pr.used_at IS NULL AND pr.expires_at > now()`, [hash]);
  if (!r) return res.status(400).json({ error: "El enlace venció o ya se usó. Pedí uno nuevo." });
  await q("UPDATE users SET pass_hash = $2 WHERE id = $1", [r.user_id, hashPassword(password)]);
  await q("UPDATE password_resets SET used_at = now() WHERE id = $1", [r.id]);
  await clearAttempts("login-user:" + r.email);
  res.json({ ok: true });
}));

app.post("/api/auth/logout", (_req, res) => { clearSession(res); res.json({ ok: true }); });
app.get("/api/auth/me", (req, res) => {
  const s = readSession(req);
  s ? res.json({ email: s.e, name: s.n || "Administrador", role: s.r || "admin" }) : res.status(401).json({ error: "No autorizado" });
});

/* ------------------------- privado ------------------------- */
const api = express.Router();
api.use(requireAuth);

api.get("/meta", (_req, res) => res.json({ services: SERVICES, stages: STAGES, proposalStatus: PROPOSAL_STATUS, activityTypes: ACT_TYPES }));

// Clientes / leads
api.get("/clients", wrap(async (req, res) => {
  const where = [], params = [];
  if (req.query.stage) { params.push(req.query.stage); where.push(`c.stage = $${params.length}`); }
  if (req.query.service) { params.push(req.query.service); where.push(`c.service = $${params.length}`); }
  if (req.query.q) {
    params.push(`%${req.query.q}%`);
    where.push(`(c.name ILIKE $${params.length} OR c.company ILIKE $${params.length} OR c.email ILIKE $${params.length})`);
  }
  const rows = await q(
    `SELECT c.id,c.name,c.email,c.phone,c.company,c.website,c.service,c.stage,c.source,c.value,c.next_follow,c.created_at,c.updated_at,
       (SELECT count(*)::int FROM proposals p WHERE p.client_id = c.id) AS proposals,
       (SELECT max(a.created_at) FROM activities a WHERE a.client_id = c.id AND a.type <> 'sistema') AS last_touch
     FROM clients c ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY c.updated_at DESC LIMIT 500`, params);
  res.json(rows);
}));

api.post("/clients", wrap(async (req, res) => {
  const b = req.body || {};
  if (!str(b.name)) return res.status(400).json({ error: "El nombre es obligatorio." });
  const row = await one(
    `INSERT INTO clients (name,email,phone,company,website,service,stage,source,value,notes,next_follow)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [str(b.name, 120), str(b.email, 160), str(b.phone, 60), str(b.company, 160), str(b.website, 300),
     pick(b.service, Object.keys(SERVICES), "otro"), pick(b.stage, STAGES, "nuevo"), str(b.source, 40) || "manual",
     num(b.value), str(b.notes, 4000), str(b.next_follow, 10)]);
  await log(row.id, "Contacto creado manualmente.");
  res.status(201).json(row);
}));

api.get("/clients/:id", wrap(async (req, res) => {
  const c = await one("SELECT * FROM clients WHERE id = $1", [req.params.id]);
  if (!c) return res.status(404).json({ error: "No existe" });
  c.activities = await q("SELECT * FROM activities WHERE client_id = $1 ORDER BY created_at DESC", [c.id]);
  c.proposals = (await q("SELECT * FROM proposals WHERE client_id = $1 ORDER BY created_at DESC", [c.id]))
    .map(p => ({ ...p, total: proposalTotal(p) }));
  res.json(c);
}));

api.patch("/clients/:id", wrap(async (req, res) => {
  const before = await one("SELECT * FROM clients WHERE id = $1", [req.params.id]);
  if (!before) return res.status(404).json({ error: "No existe" });
  const b = req.body || {};
  const fields = {
    name: v => str(v, 120) || before.name, email: v => str(v, 160), phone: v => str(v, 60), company: v => str(v, 160),
    website: v => str(v, 300), service: v => pick(v, Object.keys(SERVICES), before.service), stage: v => pick(v, STAGES, before.stage),
    value: num, notes: v => str(v, 4000), next_follow: v => str(v, 10), source: v => str(v, 40) || before.source
  };
  const sets = [], params = [];
  for (const [k, fn] of Object.entries(fields)) if (k in b) { params.push(fn(b[k])); sets.push(`${k} = $${params.length}`); }
  if (!sets.length) return res.json(before);
  params.push(before.id);
  const row = await one(`UPDATE clients SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length} RETURNING *`, params);
  if (row.stage !== before.stage) await log(row.id, `Etapa: ${before.stage} → ${row.stage}.`);
  res.json(row);
}));

api.delete("/clients/:id", wrap(async (req, res) => {
  await q("DELETE FROM clients WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

// Actividades (notas, llamadas, tareas de seguimiento)
api.post("/clients/:id/activities", wrap(async (req, res) => {
  const b = req.body || {};
  if (!str(b.body)) return res.status(400).json({ error: "Escribí el detalle." });
  const type = pick(b.type, ACT_TYPES.filter(t => t !== "sistema"), "nota");
  const row = await one(
    "INSERT INTO activities (client_id,type,body,due_at,done) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [req.params.id, type, str(b.body, 4000), str(b.due_at, 10), type !== "tarea"]);
  const c = await one("SELECT stage FROM clients WHERE id=$1", [req.params.id]);
  if (c?.stage === "nuevo" && ["llamada", "email", "whatsapp", "reunion"].includes(type))
    await q("UPDATE clients SET stage='contactado' WHERE id=$1", [req.params.id]);
  await q("UPDATE clients SET updated_at = now() WHERE id = $1", [req.params.id]);
  res.status(201).json(row);
}));
api.patch("/activities/:id", wrap(async (req, res) => {
  const row = await one("UPDATE activities SET done = $2 WHERE id = $1 RETURNING *", [req.params.id, !!req.body?.done]);
  res.json(row);
}));
api.delete("/activities/:id", wrap(async (req, res) => {
  await q("DELETE FROM activities WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));
api.get("/tasks", wrap(async (_req, res) => {
  res.json(await q(
    `SELECT a.*, c.name AS client_name FROM activities a JOIN clients c ON c.id = a.client_id
     WHERE a.type = 'tarea' AND a.done = false ORDER BY a.due_at NULLS LAST, a.created_at LIMIT 50`));
}));

// Propuestas
api.get("/proposals", wrap(async (_req, res) => {
  const rows = await q(
    `SELECT p.*, c.name AS client_name, c.company AS client_company
       FROM proposals p LEFT JOIN clients c ON c.id = p.client_id ORDER BY p.updated_at DESC LIMIT 500`);
  res.json(rows.map(p => ({ ...p, total: proposalTotal(p) })));
}));
api.get("/proposals/:id", wrap(async (req, res) => {
  const p = await one("SELECT * FROM proposals WHERE id = $1", [req.params.id]);
  p ? res.json({ ...p, total: proposalTotal(p) }) : res.status(404).json({ error: "No existe" });
}));

function proposalParams(b, prev = {}) {
  return [
    b.client_id ? +b.client_id : null,
    str(b.title, 200) || prev.title || "Propuesta",
    pick(b.service, Object.keys(SERVICES), prev.service || "otro"),
    str(b.intro, 6000),
    JSON.stringify(cleanItems(b.items)),
    Math.min(100, Math.max(0, num(b.discount))),
    pick(b.currency, ["ARS", "USD", "EUR"], "ARS"),
    str(b.valid_until, 10),
    str(b.terms, 6000)
  ];
}

api.post("/proposals", wrap(async (req, res) => {
  const token = crypto.randomBytes(12).toString("base64url");
  const row = await one(
    `INSERT INTO proposals (client_id,title,service,intro,items,discount,currency,valid_until,terms,token)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [...proposalParams(req.body || {}), token]);
  await log(row.client_id, `Se creó la propuesta “${row.title}”.`);
  res.status(201).json({ ...row, total: proposalTotal(row) });
}));

api.put("/proposals/:id", wrap(async (req, res) => {
  const prev = await one("SELECT * FROM proposals WHERE id = $1", [req.params.id]);
  if (!prev) return res.status(404).json({ error: "No existe" });
  const row = await one(
    `UPDATE proposals SET client_id=$1,title=$2,service=$3,intro=$4,items=$5,discount=$6,currency=$7,valid_until=$8,terms=$9,updated_at=now()
     WHERE id=$10 RETURNING *`, [...proposalParams(req.body || {}, prev), prev.id]);
  res.json({ ...row, total: proposalTotal(row) });
}));

api.post("/proposals/:id/status", wrap(async (req, res) => {
  const status = pick(req.body?.status, PROPOSAL_STATUS, null);
  if (!status) return res.status(400).json({ error: "Estado inválido" });
  const p = await one(
    `UPDATE proposals SET status=$2, updated_at=now(),
       sent_at = CASE WHEN $2='enviada' AND sent_at IS NULL THEN now() ELSE sent_at END,
       accepted_at = CASE WHEN $2='aceptada' THEN coalesce(accepted_at, now()) ELSE accepted_at END
     WHERE id=$1 RETURNING *`, [req.params.id, status]);
  if (!p) return res.status(404).json({ error: "No existe" });
  if (p.client_id) {
    const c = await one("SELECT stage FROM clients WHERE id=$1", [p.client_id]);
    let stage = c.stage;
    if (status === "enviada" && ORDER_STAGE(c.stage) < ORDER_STAGE("propuesta")) stage = "propuesta";
    if (status === "aceptada") stage = "ganado";
    if (stage !== c.stage) await q("UPDATE clients SET stage=$2, updated_at=now() WHERE id=$1", [p.client_id, stage]);
    if (status === "aceptada") await q("UPDATE clients SET value=$2 WHERE id=$1", [p.client_id, proposalTotal(p)]);
    await log(p.client_id, `Propuesta “${p.title}” marcada como ${status}.`);
  }
  res.json({ ...p, total: proposalTotal(p) });
}));

api.post("/proposals/:id/duplicate", wrap(async (req, res) => {
  const p = await one("SELECT * FROM proposals WHERE id = $1", [req.params.id]);
  if (!p) return res.status(404).json({ error: "No existe" });
  const token = crypto.randomBytes(12).toString("base64url");
  const row = await one(
    `INSERT INTO proposals (client_id,title,service,intro,items,discount,currency,valid_until,terms,token)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [p.client_id, p.title + " (copia)", p.service, p.intro, JSON.stringify(p.items), p.discount, p.currency, p.valid_until, p.terms, token]);
  res.status(201).json(row);
}));

api.delete("/proposals/:id", wrap(async (req, res) => {
  await q("DELETE FROM proposals WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

// Métricas del dashboard
api.get("/stats", wrap(async (_req, res) => {
  const clients = await q("SELECT stage, service, value, source, created_at FROM clients");
  const proposals = await q("SELECT status, items, discount, currency, created_at, accepted_at FROM proposals");
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const byStage = Object.fromEntries(STAGES.map(s => [s, 0]));
  const byService = Object.fromEntries(Object.keys(SERVICES).map(s => [s, 0]));
  let newThisMonth = 0, webLeads = 0;
  for (const c of clients) {
    byStage[c.stage] = (byStage[c.stage] || 0) + 1;
    byService[c.service] = (byService[c.service] || 0) + 1;
    if (new Date(c.created_at) >= monthStart) newThisMonth++;
    if (c.source === "web") webLeads++;
  }
  const pStatus = Object.fromEntries(PROPOSAL_STATUS.map(s => [s, 0]));
  const won = {}, open = {};
  for (const p of proposals) {
    pStatus[p.status]++;
    const t = proposalTotal(p);
    if (p.status === "aceptada") won[p.currency] = (won[p.currency] || 0) + t;
    if (p.status === "enviada") open[p.currency] = (open[p.currency] || 0) + t;
  }
  const decided = pStatus.aceptada + pStatus.rechazada;
  res.json({
    totalContacts: clients.length, newThisMonth, webLeads, byStage, byService, proposals: pStatus,
    wonByCurrency: won, openByCurrency: open,
    closeRate: decided ? Math.round((pStatus.aceptada / decided) * 100) : null
  });
}));

app.use("/api", api);

app.use("/api", (_req, res) => res.status(404).json({ error: "No encontrado" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error del servidor" });
});

export default app;
