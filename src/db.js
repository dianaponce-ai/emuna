// Capa de datos: Postgres en producción (Neon / Vercel Postgres / Supabase vía DATABASE_URL)
// y PGlite (Postgres embebido, sin instalar nada) en desarrollo local.
import path from "node:path";
import { TEST_USERS } from "./test-users.js";

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
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'editor',
  pass_hash  TEXT NOT NULL,
  is_test    BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth_attempts (
  id         SERIAL PRIMARY KEY,
  key        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attempts_key ON auth_attempts(key, created_at);
CREATE INDEX IF NOT EXISTS idx_act_client ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_prop_client ON proposals(client_id);
`;

let ready;

async function seedUsers(c) {
  if (process.env.DISABLE_TEST_USERS) {
    await c.query("DELETE FROM users WHERE is_test = true");
    return;
  }
  for (const u of TEST_USERS) {
    await c.query(
      `INSERT INTO users (email,name,role,pass_hash,is_test) VALUES ($1,$2,$3,$4,true)
       ON CONFLICT (email) DO NOTHING`, [u.email, u.name, u.role, u.hash]);
  }
}

async function connect() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const { default: pg } = await import("pg");
    const local = /localhost|127\.0\.0\.1/.test(url);
    const pool = new pg.Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, max: 5 });
    await pool.query(SCHEMA);
    const c = { query: (sql, params = []) => pool.query(sql, params), kind: "postgres" };
    await seedUsers(c);
    return c;
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
  const c = { query: (sql, params = []) => db.query(sql, params), kind: "pglite" };
  await seedUsers(c);
  return c;
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
