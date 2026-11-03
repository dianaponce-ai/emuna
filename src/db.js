// Capa de datos: Postgres en producción (Neon / Vercel Postgres / Supabase vía DATABASE_URL)
// y PGlite (Postgres embebido, sin instalar nada) en desarrollo local.
import path from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS clients (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  website     TEXT,
  service     TEXT,
  stage       TEXT NOT NULL DEFAULT 'nuevo',
  source      TEXT NOT NULL DEFAULT 'manual',
  value       DOUBLE PRECISION DEFAULT 0,
  brief       JSONB,
  notes       TEXT,
  next_follow TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activities (
  id         SERIAL PRIMARY KEY,
  client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'nota',
  body       TEXT NOT NULL,
  due_at     TEXT,
  done       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS proposals (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  token       TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  service     TEXT,
  intro       TEXT,
  items       JSONB NOT NULL DEFAULT '[]',
  discount    DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'ARS',
  valid_until TEXT,
  terms       TEXT,
  status      TEXT NOT NULL DEFAULT 'borrador',
  sent_at     TIMESTAMPTZ,
  viewed_at   TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_act_client ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_prop_client ON proposals(client_id);
`;

let ready;

async function connect() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const { default: pg } = await import("pg");
    const local = /localhost|127\.0\.0\.1/.test(url);
    const pool = new pg.Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, max: 5 });
    await pool.query(SCHEMA);
    return { query: (sql, params = []) => pool.query(sql, params), kind: "postgres" };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.VERCEL
    ? "/tmp/emuna-db" // efímero: en Vercel configurá DATABASE_URL
    : path.resolve(process.env.PGLITE_DIR || "data/emuna-db");
  if (process.env.VERCEL) console.warn("[EMUNÁ] Sin DATABASE_URL: los datos NO persisten en Vercel.");
  const fs = await import("node:fs");
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  const db = new PGlite(dir);
  await db.exec(SCHEMA);
  return { query: (sql, params = []) => db.query(sql, params), kind: "pglite" };
}

export async function db() {
  if (!ready) ready = connect().catch(e => { ready = null; throw e; });
  return ready;
}

export async function q(sql, params) {
  const c = await db();
  const r = await c.query(sql, params);
  return r.rows;
}

export async function one(sql, params) {
  return (await q(sql, params))[0] || null;
}
