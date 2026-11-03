// Servidor local / Render / Railway. En Vercel se usa api/index.js.
import fs from "node:fs";

// Carga .env si existe (sin dependencias)
if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith("#") && !(m[1] in process.env) && m[2] !== "") process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { default: express } = await import("express");
import path from "node:path";
import { fileURLToPath } from "node:url";
const { default: app } = await import("./src/app.js");
const { db } = await import("./src/db.js");

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "public");
const server = express();

server.use(app);
server.get("/p/:token", (_req, res) => res.sendFile(path.join(pub, "propuesta.html")));
server.use(express.static(pub, { extensions: ["html"] }));
server.use((_req, res) => res.status(404).sendFile(path.join(pub, "404.html")));

const port = process.env.PORT || 3000;
db().then(c => {
  server.listen(port, () => {
    console.log(`EMUNÁ en http://localhost:${port}  ·  panel: http://localhost:${port}/admin  ·  base: ${c.kind}`);
  });
});
