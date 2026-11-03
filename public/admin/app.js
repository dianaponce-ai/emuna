/* =============================================================
   EMUNÁ · Panel de gestión (CRM, clientes y propuestas)
   ============================================================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const view = $("#view");

const STAGE_LABEL = { nuevo: "Nuevo", contactado: "Contactado", reunion: "Reunión", propuesta: "Propuesta", ganado: "Ganado", perdido: "Perdido" };
const STAGE_COLOR = { nuevo: "var(--st-nuevo)", contactado: "var(--st-contactado)", reunion: "var(--st-reunion)", propuesta: "var(--st-propuesta)", ganado: "var(--st-ganado)", perdido: "var(--st-perdido)" };
const STAGES = Object.keys(STAGE_LABEL);
const SERVICES = { "paid-media": "Paid Media", "diseno-web": "Diseño Web", "branding": "Branding", "consultoria": "Consultoría", "otro": "Sin definir" };
const ACT = { nota: ["✎", "Nota"], llamada: ["☏", "Llamada"], email: ["✉", "Email"], reunion: ["◷", "Reunión"], whatsapp: ["✆", "WhatsApp"], tarea: ["☐", "Tarea"], sistema: ["·", "Sistema"] };
const PSTATUS = { borrador: "Borrador", enviada: "Enviada", aceptada: "Aceptada", rechazada: "Rechazada" };

/* Plantillas de propuesta por servicio (los precios los definís vos) */
const TEMPLATES = {
  "paid-media": {
    title: "Gestión de campañas de Paid Media",
    intro: "Gracias por contarnos sobre tu negocio. A partir de la planilla, proponemos una estrategia de captación enfocada en {objetivo}, con medición desde el primer día y optimización continua.\n\nEsta propuesta incluye la configuración inicial y la gestión mensual de campañas. La inversión en pauta se abona directamente a cada plataforma.",
    items: [
      { title: "Setup y estrategia inicial", detail: "Auditoría de cuentas, configuración de píxel, API de conversiones y GA4, mapa de audiencias y estructura de campañas.", qty: 1, price: 0 },
      { title: "Gestión mensual de Meta Ads", detail: "Creación y optimización de campañas, testeo de anuncios y remarketing.", qty: 1, price: 0, recurring: true },
      { title: "Gestión mensual de Google Ads", detail: "Search, Shopping / Performance Max, palabras clave y pujas.", qty: 1, price: 0, recurring: true },
      { title: "Reporte y reunión mensual", detail: "Tablero de resultados, aprendizajes y próximos pasos.", qty: 1, price: 0, recurring: true }
    ],
    terms: "• Setup: 50% al aceptar y 50% al lanzar.\n• Gestión mensual: por adelantado, del 1 al 10 de cada mes.\n• Permanencia sugerida: 3 meses para que las campañas aprendan.\n• La inversión publicitaria no está incluida."
  },
  "diseno-web": {
    title: "Diseño y desarrollo web",
    intro: "Proponemos diseñar y desarrollar un sitio claro, rápido y pensado para convertir, alineado con tu marca y fácil de administrar.\n\nEl proyecto se organiza en etapas con aprobaciones en cada una para que siempre sepas en qué punto estamos.",
    items: [
      { title: "Arquitectura y UX", detail: "Mapa del sitio, wireframes y recorridos principales.", qty: 1, price: 0 },
      { title: "Diseño UI", detail: "Diseño visual responsive de todas las secciones, con 2 rondas de ajustes.", qty: 1, price: 0 },
      { title: "Desarrollo e implementación", detail: "Maquetación, panel autoadministrable, formularios y WhatsApp.", qty: 1, price: 0 },
      { title: "SEO técnico y analítica", detail: "Metadatos, sitemap, velocidad y Google Analytics 4.", qty: 1, price: 0 },
      { title: "Mantenimiento mensual (opcional)", detail: "Actualizaciones, backups, seguridad y pequeños cambios.", qty: 1, price: 0, recurring: true }
    ],
    terms: "• 50% al aceptar la propuesta y 50% al publicar.\n• Plazo estimado: a confirmar según entrega de contenidos.\n• Incluye 2 rondas de ajustes por etapa.\n• Dominio y hosting a nombre del cliente."
  },
  "branding": {
    title: "Estrategia e identidad de marca",
    intro: "Proponemos construir una marca coherente y memorable: primero definimos qué tiene que decir y a quién, y después cómo se ve y cómo suena.",
    items: [
      { title: "Workshop de estrategia", detail: "Propósito, posicionamiento, público, diferenciales y personalidad.", qty: 1, price: 0 },
      { title: "Identidad visual", detail: "2 rutas creativas, logo y variantes, paleta y tipografías.", qty: 1, price: 0 },
      { title: "Manual de marca", detail: "Usos, aplicaciones y archivos finales editables.", qty: 1, price: 0 },
      { title: "Tono de voz y mensajes clave", detail: "Guía de comunicación con ejemplos.", qty: 1, price: 0 },
      { title: "Plantillas para redes", detail: "Set de plantillas editables para posteos e historias.", qty: 1, price: 0 }
    ],
    terms: "• 50% al aceptar y 50% contra entrega del manual.\n• Incluye 2 rondas de ajustes sobre la ruta elegida.\n• Al finalizar se entregan archivos editables y derechos de uso."
  },
  "consultoria": {
    title: "Diagnóstico digital y plan de crecimiento",
    intro: "Proponemos revisar tu ecosistema digital completo para identificar qué te frena y qué conviene priorizar, con un plan accionable.",
    items: [
      { title: "Auditoría digital", detail: "Web, campañas, redes, SEO y medición. Hallazgos ordenados por impacto.", qty: 1, price: 0 },
      { title: "Plan de crecimiento de 90 días", detail: "Objetivos, prioridades, presupuesto sugerido e indicadores.", qty: 1, price: 0 },
      { title: "Reunión de devolución", detail: "Presentación de resultados y preguntas del equipo.", qty: 1, price: 0 },
      { title: "Acompañamiento mensual (opcional)", detail: "Sesiones de seguimiento e implementación.", qty: 1, price: 0, recurring: true }
    ],
    terms: "• 100% al aceptar la propuesta.\n• Entrega del informe: 10 días hábiles desde que recibimos los accesos.\n• Firmamos acuerdo de confidencialidad si lo necesitás."
  }
};

/* ---------------------------- utilidades ---------------------------- */
async function api(method, path, body) {
  const r = await fetch("/api" + path, {
    method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined, credentials: "same-origin"
  });
  if (r.status === 401 && !path.startsWith("/auth")) { showLogin(); throw new Error("Sesión vencida"); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Error");
  return data;
}
function toast(msg, err) {
  const t = $("#toast"); t.textContent = msg; t.classList.toggle("err", !!err); t.classList.add("on");
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 2600);
}
const money = (n, cur = "ARS") => new Intl.NumberFormat("es-AR", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n || 0);
const date = d => d ? new Date(d.length === 10 ? d + "T12:00" : d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const ago = d => {
  if (!d) return "—";
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  if (m < 60) return `hace ${Math.max(1, m)} min`;
  if (m < 1440) return `hace ${Math.round(m / 60)} h`;
  const days = Math.round(m / 1440); return days < 30 ? `hace ${days} d` : date(d);
};
const today = () => new Date().toISOString().slice(0, 10);
const stagePill = s => `<span class="pill st-${s}">${STAGE_LABEL[s] || s}</span>`;
const statusPill = s => `<span class="pill ps-${s}">${PSTATUS[s] || s}</span>`;
const totals = p => {
  let once = 0, monthly = 0;
  (p.items || []).forEach(it => { const v = (+it.qty || 0) * (+it.price || 0); it.recurring ? monthly += v : once += v; });
  const f = 1 - (+p.discount || 0) / 100;
  return { once: once * f, monthly: monthly * f, sub: once + monthly, discount: (once + monthly) * (1 - f), total: (once + monthly) * f };
};
const shareUrl = p => `${location.origin}/p/${p.token}`;

/* ---------------------------- auth ---------------------------- */
function showLogin() { $("#app").hidden = true; $("#login").hidden = false; closeDrawer(); }
$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  $("#loginErr").textContent = "";
  try { await api("POST", "/auth/login", d); start(); }
  catch (err) { $("#loginErr").textContent = err.message; }
});
$("#logout").addEventListener("click", async () => { await api("POST", "/auth/logout"); showLogin(); });

async function start() {
  let me;
  try { me = await api("GET", "/auth/me"); } catch { return showLogin(); }
  const ROLE = { admin: "Administrador", editor: "Comercial", lectura: "Solo lectura" };
  $("#me").innerHTML = `<b>${esc(me.name)}</b><small>${esc(me.email)} · ${ROLE[me.role] || me.role}</small>`;
  document.body.dataset.role = me.role;
  $("#login").hidden = true; $("#app").hidden = false;
  route();
}

/* ---------------------------- router ---------------------------- */
addEventListener("hashchange", route);
function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const [base, id] = h.split("/");
  $$(".side nav a").forEach(a => a.classList.toggle("on", a.dataset.nav === (base || "dashboard")));
  closeDrawer(true);
  scrollTo(0, 0);
  const r = { "": dashboard, pipeline, clientes, propuestas }[base];
  if (base === "propuestas" && id) return proposalEditor(id);
  if (base === "clientes" && id) { clientes(); return openClient(+id); }
  (r || dashboard)().catch(e => { view.innerHTML = `<p class="empty">${esc(e.message)}</p>`; });
}

/* ---------------------------- dashboard ---------------------------- */
async function dashboard() {
  view.innerHTML = `<p class="empty">Cargando…</p>`;
  const [s, tasks, clients] = await Promise.all([api("GET", "/stats"), api("GET", "/tasks"), api("GET", "/clients")]);
  const won = Object.entries(s.wonByCurrency).map(([c, v]) => money(v, c)).join(" · ") || money(0);
  const open = Object.entries(s.openByCurrency).map(([c, v]) => money(v, c)).join(" · ") || money(0);
  const maxSt = Math.max(1, ...Object.values(s.byStage));
  const maxSv = Math.max(1, ...Object.values(s.byService));
  const recent = clients.filter(c => c.stage === "nuevo").slice(0, 6);
  view.innerHTML = `
    <div class="top"><div><span class="eyebrow">Resumen</span><h1>Buen día.</h1><p>Así viene el negocio hoy.</p></div>
      <div class="acts"><button class="btn" data-new-client>+ Contacto</button><a class="btn primary" href="#/propuestas/nueva">+ Propuesta</a></div></div>
    <div class="kpis">
      <div class="kpi"><small>Contactos</small><b>${s.totalContacts}</b><span>${s.newThisMonth} nuevos este mes · ${s.webLeads} desde la web</span></div>
      <div class="kpi"><small>En negociación</small><b>${(s.byStage.reunion || 0) + (s.byStage.propuesta || 0)}</b><span>${s.proposals.enviada} propuestas enviadas</span></div>
      <div class="kpi"><small>Propuestas abiertas</small><b style="font-size:1.6rem">${open}</b><span>Monto esperando respuesta</span></div>
      <div class="kpi dark"><small>Ganado</small><b style="font-size:1.6rem">${won}</b><span>Tasa de cierre: ${s.closeRate == null ? "—" : s.closeRate + "%"}</span></div>
    </div>
    <div class="grid2">
      <div class="panel"><h2>Embudo <a href="#/pipeline">Ver pipeline →</a></h2>
        <div class="funnel">${STAGES.map(st => `<div><b>${s.byStage[st] || 0}</b><i style="height:${8 + (s.byStage[st] || 0) / maxSt * 80}%;background:${STAGE_COLOR[st]}"></i>${STAGE_LABEL[st]}</div>`).join("")}</div>
      </div>
      <div class="panel"><h2>Por servicio</h2>
        <div class="bars">${Object.entries(SERVICES).map(([k, l]) => `<div class="bar"><span>${l}</span><span class="track"><i style="width:${(s.byService[k] || 0) / maxSv * 100}%"></i></span><b>${s.byService[k] || 0}</b></div>`).join("")}</div>
      </div>
      <div class="panel"><h2>Leads nuevos sin contactar <a href="#/clientes">Todos →</a></h2>
        <div class="list">${recent.length ? recent.map(c => `<a href="#/clientes/${c.id}"><span><b>${esc(c.name)}</b> <small>${esc(c.company || "")}</small><br><span class="svc-tag">${SERVICES[c.service]}</span></span><small>${ago(c.created_at)}</small></a>`).join("") : `<p class="empty">No hay leads pendientes. 🎉</p>`}</div>
      </div>
      <div class="panel"><h2>Tareas pendientes</h2>
        <div class="list">${tasks.length ? tasks.map(t => `<div class="row"><label style="display:flex;gap:.6rem;align-items:flex-start;cursor:pointer"><input type="checkbox" data-task="${t.id}"><span>${esc(t.body)}<br><small><a href="#/clientes/${t.client_id}">${esc(t.client_name)}</a></small></span></label><small style="${t.due_at && t.due_at < today() ? "color:#a5481c" : ""}">${t.due_at ? date(t.due_at) : "Sin fecha"}</small></div>`).join("") : `<p class="empty">Nada pendiente.</p>`}</div>
      </div>
    </div>`;
  $$("[data-task]").forEach(cb => cb.addEventListener("change", async () => {
    await api("PATCH", `/activities/${cb.dataset.task}`, { done: cb.checked });
    cb.closest(".row").style.opacity = .4; toast("Tarea completada");
  }));
  $("[data-new-client]").addEventListener("click", newClient);
}

/* ---------------------------- pipeline ---------------------------- */
async function pipeline() {
  view.innerHTML = `<p class="empty">Cargando…</p>`;
  const clients = await api("GET", "/clients");
  view.innerHTML = `
    <div class="top"><div><span class="eyebrow">CRM</span><h1>Pipeline</h1><p>Arrastrá las tarjetas para cambiar de etapa.</p></div>
      <div class="acts"><button class="btn primary" data-new-client>+ Contacto</button></div></div>
    <div class="board">${STAGES.map(st => {
      const list = clients.filter(c => c.stage === st);
      const sum = list.reduce((a, c) => a + (+c.value || 0), 0);
      return `<div class="col" data-stage="${st}" style="--c:${STAGE_COLOR[st]}">
        <div class="col-h"><span>${STAGE_LABEL[st]}</span><small>${list.length}</small></div>
        ${sum ? `<div class="col-sum">${money(sum)}</div>` : ""}
        ${list.map(c => `<div class="deal" draggable="true" data-id="${c.id}">
          <b>${esc(c.name)}</b><span class="co">${esc(c.company || c.email || "")}</span>
          <div class="meta"><span class="svc-tag">${SERVICES[c.service]}</span>${c.value ? `<span class="val">${money(c.value)}</span>` : ""}</div>
          ${c.next_follow ? `<div class="due" style="${c.next_follow >= today() ? "color:var(--muted)" : ""}">Seguimiento: ${date(c.next_follow)}</div>` : ""}
        </div>`).join("")}
      </div>`;
    }).join("")}</div>`;
  $("[data-new-client]").addEventListener("click", newClient);
  let dragId = null;
  $$(".deal").forEach(d => {
    d.addEventListener("dragstart", e => { dragId = d.dataset.id; d.classList.add("drag"); e.dataTransfer.effectAllowed = "move"; });
    d.addEventListener("dragend", () => d.classList.remove("drag"));
    d.addEventListener("click", () => openClient(+d.dataset.id));
  });
  $$(".col").forEach(col => {
    col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("over"); });
    col.addEventListener("dragleave", () => col.classList.remove("over"));
    col.addEventListener("drop", async e => {
      e.preventDefault(); col.classList.remove("over");
      if (!dragId) return;
      const card = $(`.deal[data-id="${dragId}"]`);
      if (card.closest(".col") === col) return;
      col.appendChild(card);
      try { await api("PATCH", `/clients/${dragId}`, { stage: col.dataset.stage }); toast(`Movido a ${STAGE_LABEL[col.dataset.stage]}`); pipeline(); }
      catch (err) { toast(err.message, true); pipeline(); }
    });
  });
}

/* ---------------------------- clientes ---------------------------- */
const clientFilter = { tab: "todos", q: "", service: "" };
async function clientes() {
  view.innerHTML = `
    <div class="top"><div><span class="eyebrow">CRM</span><h1>Clientes y leads</h1><p>Todos los contactos, con su planilla e historial.</p></div>
      <div class="acts"><button class="btn primary" data-new-client>+ Contacto</button></div></div>
    <div class="filters">
      <div class="tabs">${[["todos", "Todos"], ["leads", "Leads"], ["clientes", "Clientes"], ["perdidos", "Perdidos"]].map(([k, l]) => `<button data-tab="${k}" class="${clientFilter.tab === k ? "on" : ""}">${l}</button>`).join("")}</div>
      <input type="search" id="cq" placeholder="Buscar por nombre, empresa o email" value="${esc(clientFilter.q)}">
      <select id="cs"><option value="">Todos los servicios</option>${Object.entries(SERVICES).map(([k, l]) => `<option value="${k}" ${clientFilter.service === k ? "selected" : ""}>${l}</option>`).join("")}</select>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Contacto</th><th>Servicio</th><th>Etapa</th><th class="r">Valor</th><th>Último contacto</th><th>Alta</th></tr></thead><tbody id="ctb"><tr><td colspan="6" class="empty">Cargando…</td></tr></tbody></table></div>`;
  $("[data-new-client]").addEventListener("click", newClient);
  $$("[data-tab]").forEach(b => b.addEventListener("click", () => { clientFilter.tab = b.dataset.tab; $$("[data-tab]").forEach(x => x.classList.toggle("on", x === b)); loadClients(); }));
  let t; $("#cq").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { clientFilter.q = e.target.value; loadClients(); }, 250); });
  $("#cs").addEventListener("change", e => { clientFilter.service = e.target.value; loadClients(); });
  await loadClients();
}
async function loadClients() {
  const qs = new URLSearchParams();
  if (clientFilter.q) qs.set("q", clientFilter.q);
  if (clientFilter.service) qs.set("service", clientFilter.service);
  let rows = await api("GET", "/clients?" + qs);
  const tab = clientFilter.tab;
  rows = rows.filter(c => tab === "todos" || (tab === "clientes" ? c.stage === "ganado" : tab === "perdidos" ? c.stage === "perdido" : !["ganado", "perdido"].includes(c.stage)));
  const tb = $("#ctb"); if (!tb) return;
  tb.innerHTML = rows.length ? rows.map(c => `<tr data-id="${c.id}">
      <td><b>${esc(c.name)}</b><span class="sub">${esc([c.company, c.email].filter(Boolean).join(" · "))}</span></td>
      <td><span class="svc-tag">${SERVICES[c.service]}</span></td>
      <td>${stagePill(c.stage)}</td>
      <td class="r">${c.value ? money(c.value) : "—"}</td>
      <td>${ago(c.last_touch)}${c.next_follow ? `<span class="sub" style="${c.next_follow < today() ? "color:#a5481c" : ""}">Seguir: ${date(c.next_follow)}</span>` : ""}</td>
      <td>${date(c.created_at)}<span class="sub">${c.source === "web" ? "Desde la web" : "Manual"}</span></td></tr>`).join("")
    : `<tr><td colspan="6" class="empty">No hay contactos con estos filtros.</td></tr>`;
  $$("tr[data-id]", tb).forEach(tr => tr.addEventListener("click", () => openClient(+tr.dataset.id)));
}

/* ---------------------------- drawer de cliente ---------------------------- */
function openDrawer(html) {
  const d = $("#drawer"); d.innerHTML = html; d.classList.add("on"); d.setAttribute("aria-hidden", "false");
  $("#drawerBg").classList.add("on"); d.scrollTop = 0;
  $$("[data-close]", d).forEach(b => b.addEventListener("click", () => closeDrawer()));
}
function closeDrawer(silent) {
  $("#drawer").classList.remove("on"); $("#drawer").setAttribute("aria-hidden", "true"); $("#drawerBg").classList.remove("on");
  if (!silent && /^#\/clientes\/\d+/.test(location.hash)) history.replaceState(null, "", "#/clientes");
}
$("#drawerBg").addEventListener("click", () => closeDrawer());
addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

function clientForm(c = {}) {
  return `<form class="form" id="cform">
    <label>Nombre *<input name="name" required value="${esc(c.name)}"></label>
    <label>Empresa<input name="company" value="${esc(c.company)}"></label>
    <label>Email<input name="email" type="email" value="${esc(c.email)}"></label>
    <label>Teléfono<input name="phone" value="${esc(c.phone)}"></label>
    <label class="full">Web / Instagram<input name="website" value="${esc(c.website)}"></label>
    <label>Servicio<select name="service">${Object.entries(SERVICES).map(([k, l]) => `<option value="${k}" ${c.service === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label>Etapa<select name="stage">${STAGES.map(s => `<option value="${s}" ${c.stage === s ? "selected" : ""}>${STAGE_LABEL[s]}</option>`).join("")}</select></label>
    <label>Valor estimado (ARS)<input name="value" type="number" min="0" step="1" value="${c.value || ""}"></label>
    <label>Próximo seguimiento<input name="next_follow" type="date" value="${esc(c.next_follow)}"></label>
    <label class="full">Notas<textarea name="notes">${esc(c.notes)}</textarea></label>
    <div class="form-actions"><span></span><button class="btn primary" type="submit">Guardar</button></div>
  </form>`;
}
function readForm(f) {
  const d = Object.fromEntries(new FormData(f));
  if ("value" in d) d.value = +d.value || 0;
  return d;
}

function newClient() {
  openDrawer(`<div class="dr-head"><div><span class="eyebrow">Nuevo contacto</span><h2>Agregar al CRM</h2></div><button class="x" data-close aria-label="Cerrar">×</button></div>
    <div class="dr-body"><div class="sec">${clientForm({ stage: "nuevo", service: "otro" })}</div></div>`);
  $("#cform").addEventListener("submit", async e => {
    e.preventDefault();
    try { const c = await api("POST", "/clients", readForm(e.target)); toast("Contacto creado"); refreshView(); openClient(c.id); }
    catch (err) { toast(err.message, true); }
  });
}

function refreshView() {
  const base = location.hash.replace(/^#\/?/, "").split("/")[0];
  if (base === "pipeline") pipeline(); else if (base === "clientes") loadClients(); else if (base === "") dashboard();
}

async function openClient(id) {
  let c;
  try { c = await api("GET", `/clients/${id}`); } catch (e) { return toast(e.message, true); }
  const brief = Array.isArray(c.brief) ? c.brief : [];
  let lastSec = "";
  const briefHtml = brief.length ? `<dl class="kv">${brief.map(b => {
    const sec = b.section && b.section !== lastSec ? `<div class="brief-sec">${esc(b.section)}</div>` : "";
    lastSec = b.section; return `${sec}<dt>${esc(b.label)}</dt><dd>${esc(b.value)}</dd>`;
  }).join("")}</dl>` : `<p class="empty">Este contacto no completó una planilla.</p>`;
  const si = STAGES.indexOf(c.stage);
  const wa = c.phone ? `https://wa.me/${c.phone.replace(/\D/g, "")}` : null;

  openDrawer(`
    <div class="dr-head">
      <div><span class="eyebrow">${SERVICES[c.service]} · ${c.source === "web" ? "Lead web" : "Carga manual"}</span>
        <h2>${esc(c.name)}</h2><p>${esc([c.company, c.email, c.phone].filter(Boolean).join(" · "))}</p></div>
      <button class="x" data-close aria-label="Cerrar">×</button>
    </div>
    <div class="dr-body">
      <div class="stagebar">${STAGES.map((s, i) => `<button data-stage="${s}" class="${s === c.stage ? "on" : (i < si && c.stage !== "perdido" ? "past" : "")}">${STAGE_LABEL[s]}</button>`).join("")}</div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        ${c.email ? `<a class="btn sm" href="mailto:${esc(c.email)}">✉ Email</a>` : ""}
        ${wa ? `<a class="btn sm" href="${wa}" target="_blank" rel="noopener">✆ WhatsApp</a>` : ""}
        ${c.website ? `<a class="btn sm" href="${/^https?:/.test(c.website) ? esc(c.website) : "https://" + esc(c.website.replace(/^@/, "instagram.com/"))}" target="_blank" rel="noopener">↗ Web</a>` : ""}
        <a class="btn sm primary" href="#/propuestas/nueva?cliente=${c.id}">+ Propuesta</a>
      </div>

      <div class="sec"><h3>Actividad</h3>
        <form class="addact" id="actForm">
          <select class="inp" name="type">${Object.entries(ACT).filter(([k]) => k !== "sistema").map(([k, [, l]]) => `<option value="${k}">${l}</option>`).join("")}</select>
          <textarea class="inp" name="body" placeholder="¿Qué pasó o qué hay que hacer?" rows="2" required></textarea>
          <div class="row2"><label hidden id="dueWrap">Vence <input class="inp" type="date" name="due_at" style="width:auto"></label><button class="btn primary sm" type="submit">Agregar</button></div>
        </form>
        <div class="timeline">${c.activities.map(a => `
          <div class="ev t-${a.type}${a.done && a.type === "tarea" ? " done" : ""}">
            <span class="ic" title="${ACT[a.type]?.[1] || a.type}">${a.type === "tarea" ? `<input type="checkbox" data-done="${a.id}" ${a.done ? "checked" : ""} style="accent-color:var(--olive)">` : ACT[a.type]?.[0] || "·"}</span>
            <div><p>${esc(a.body)}</p><small>${ACT[a.type]?.[1] || ""} · ${ago(a.created_at)}${a.due_at ? ` · vence ${date(a.due_at)}` : ""}</small></div>
            <div class="tools">${a.type !== "sistema" ? `<button data-del-act="${a.id}" title="Borrar">✕</button>` : ""}</div>
          </div>`).join("") || `<p class="empty">Sin actividad todavía.</p>`}</div>
      </div>

      <div class="sec"><h3>Planilla completada</h3>${briefHtml}${c.notes ? `<p style="margin-top:1rem;white-space:pre-line"><b>Mensaje / notas:</b><br>${esc(c.notes)}</p>` : ""}</div>

      <div class="sec"><h3>Propuestas</h3>
        <div class="list">${c.proposals.length ? c.proposals.map(p => `<a href="#/propuestas/${p.id}"><span><b>${esc(p.title)}</b><br><small>${date(p.created_at)}</small></span><span style="text-align:right">${statusPill(p.status)}<br><small>${money(p.total, p.currency)}</small></span></a>`).join("") : `<p class="empty">Todavía no hay propuestas.</p>`}</div>
      </div>

      <div class="sec"><h3>Datos del contacto</h3>${clientForm(c)}</div>
      <button class="btn danger" id="delClient" style="align-self:flex-start">Eliminar contacto</button>
    </div>`);

  $$("[data-stage]", $("#drawer")).forEach(b => b.addEventListener("click", async () => {
    await api("PATCH", `/clients/${c.id}`, { stage: b.dataset.stage }); toast(`Etapa: ${STAGE_LABEL[b.dataset.stage]}`); refreshView(); openClient(c.id);
  }));
  const af = $("#actForm");
  af.type.addEventListener("change", () => { $("#dueWrap").hidden = af.type.value !== "tarea"; });
  af.addEventListener("submit", async e => {
    e.preventDefault();
    try { await api("POST", `/clients/${c.id}/activities`, readForm(af)); toast("Actividad registrada"); refreshView(); openClient(c.id); }
    catch (err) { toast(err.message, true); }
  });
  $$("[data-done]").forEach(cb => cb.addEventListener("change", async () => { await api("PATCH", `/activities/${cb.dataset.done}`, { done: cb.checked }); openClient(c.id); }));
  $$("[data-del-act]").forEach(b => b.addEventListener("click", async () => { if (confirm("¿Borrar esta actividad?")) { await api("DELETE", `/activities/${b.dataset.delAct}`); openClient(c.id); } }));
  $("#cform").addEventListener("submit", async e => {
    e.preventDefault();
    try { await api("PATCH", `/clients/${c.id}`, readForm(e.target)); toast("Guardado"); refreshView(); openClient(c.id); }
    catch (err) { toast(err.message, true); }
  });
  $("#delClient").addEventListener("click", async () => {
    if (!confirm(`¿Eliminar a ${c.name}? Se borra también su historial.`)) return;
    await api("DELETE", `/clients/${c.id}`); toast("Contacto eliminado"); closeDrawer(); refreshView();
  });
}

/* ---------------------------- propuestas ---------------------------- */
async function propuestas() {
  view.innerHTML = `<p class="empty">Cargando…</p>`;
  const rows = await api("GET", "/proposals");
  view.innerHTML = `
    <div class="top"><div><span class="eyebrow">Ventas</span><h1>Propuestas</h1><p>Armalas, compartí el link y seguí si la abrieron o aceptaron.</p></div>
      <div class="acts"><a class="btn primary" href="#/propuestas/nueva">+ Nueva propuesta</a></div></div>
    <div class="table-wrap"><table><thead><tr><th>Propuesta</th><th>Cliente</th><th>Estado</th><th class="r">Total</th><th>Seguimiento</th></tr></thead><tbody>
    ${rows.length ? rows.map(p => `<tr data-id="${p.id}">
      <td><b>${esc(p.title)}</b><span class="sub svc-tag">${SERVICES[p.service]}</span></td>
      <td>${esc(p.client_name || "—")}<span class="sub">${esc(p.client_company || "")}</span></td>
      <td>${statusPill(p.status)}</td>
      <td class="r">${money(p.total, p.currency)}</td>
      <td><span class="sub">${p.accepted_at ? `Aceptada ${ago(p.accepted_at)}` : p.viewed_at ? `Vista ${ago(p.viewed_at)}` : p.sent_at ? `Enviada ${ago(p.sent_at)}` : `Editada ${ago(p.updated_at)}`}</span></td></tr>`).join("")
      : `<tr><td colspan="5" class="empty">Todavía no hay propuestas. Creá la primera desde un cliente o con el botón de arriba.</td></tr>`}
    </tbody></table></div>`;
  $$("tr[data-id]").forEach(tr => tr.addEventListener("click", () => location.hash = `#/propuestas/${tr.dataset.id}`));
}

async function proposalEditor(idRaw) {
  view.innerHTML = `<p class="empty">Cargando…</p>`;
  const isNew = idRaw.startsWith("nueva");
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const clients = await api("GET", "/clients");
  let p;
  if (isNew) {
    const cid = +params.get("cliente") || null;
    const cl = clients.find(c => c.id === cid);
    const svc = cl && TEMPLATES[cl.service] ? cl.service : "otro";
    const t = TEMPLATES[svc];
    const vu = new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10);
    p = { client_id: cid, service: svc, title: t ? t.title : "", intro: t ? t.intro : "", items: t ? structuredClone(t.items) : [{ title: "", detail: "", qty: 1, price: 0 }],
          discount: 0, currency: "ARS", valid_until: vu, terms: t ? t.terms : "", status: "borrador" };
    if (cl && t) {
      const full = await api("GET", `/clients/${cid}`);
      const obj = (full.brief || []).find(b => /quer[eé]s lograr/i.test(b.label));
      p.intro = p.intro.replace("{objetivo}", obj ? obj.value.toLowerCase() : "tus objetivos comerciales");
    }
  } else {
    p = await api("GET", `/proposals/${idRaw}`);
  }
  p.items = p.items || [];

  const totalsHtml = () => {
    const t = totals(p);
    return `<div><span>Subtotal</span><span>${money(t.sub, p.currency)}</span></div>
      ${t.discount ? `<div><span>Descuento ${p.discount}%</span><span>− ${money(t.discount, p.currency)}</span></div>` : ""}
      ${t.monthly ? `<div><span>Pago único</span><span>${money(t.once, p.currency)}</span></div><div><span>Mensual</span><span>${money(t.monthly, p.currency)}/mes</span></div>` : ""}
      <div class="grand"><span>Total</span><span>${money(t.total, p.currency)}</span></div>`;
  };
  const render = () => {
    view.innerHTML = `
      <div class="top"><div><a href="#/propuestas" class="eyebrow">← Propuestas</a><h1>${isNew ? "Nueva propuesta" : esc(p.title)}</h1>
        <p>${isNew ? "Elegí el cliente y el servicio: se carga una plantilla para editar." : `${statusPill(p.status)} &nbsp;Creada ${date(p.created_at)}${p.viewed_at ? ` · vista ${ago(p.viewed_at)}` : ""}${p.accepted_by ? ` · aceptada por ${esc(p.accepted_by)}` : ""}`}</p></div></div>
      <div class="editor">
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div class="panel"><div class="form">
            <label>Cliente<select name="client_id"><option value="">— Sin cliente —</option>${clients.map(c => `<option value="${c.id}" ${+p.client_id === c.id ? "selected" : ""}>${esc(c.name)}${c.company ? " · " + esc(c.company) : ""}</option>`).join("")}</select></label>
            <label>Servicio<select name="service">${Object.entries(SERVICES).map(([k, l]) => `<option value="${k}" ${p.service === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
            <label class="full">Título<input name="title" value="${esc(p.title)}" placeholder="Ej: Rediseño web y campañas de lanzamiento"></label>
            <label>Moneda<select name="currency">${["ARS", "USD", "EUR"].map(c => `<option ${p.currency === c ? "selected" : ""}>${c}</option>`).join("")}</select></label>
            <label>Válida hasta<input type="date" name="valid_until" value="${esc(p.valid_until)}"></label>
            <label>Descuento (%)<input name="discount" type="number" min="0" max="100" value="${p.discount || 0}"></label>
            <label class="full">Introducción<textarea name="intro" rows="5">${esc(p.intro)}</textarea></label>
          </div></div>
          <div class="panel"><h2>Ítems <span class="tpl">${Object.keys(TEMPLATES).map(k => `<button class="btn sm" data-tpl="${k}">Plantilla ${SERVICES[k]}</button>`).join("")}</span></h2>
            <div class="items" id="items">${p.items.map((it, i) => `
              <div class="item" data-i="${i}">
                <input class="inp" data-k="title" value="${esc(it.title)}" placeholder="Concepto">
                <input class="inp" data-k="qty" type="number" min="0" step="1" value="${it.qty}" title="Cantidad">
                <input class="inp" data-k="price" type="number" min="0" step="1" value="${it.price}" title="Precio unitario" placeholder="Precio">
                <button class="del" data-del="${i}" title="Quitar">✕</button>
                <textarea class="inp full" data-k="detail" placeholder="Detalle (opcional)">${esc(it.detail)}</textarea>
                <label class="rec"><input type="checkbox" data-k="recurring" ${it.recurring ? "checked" : ""}> Cobro mensual</label>
              </div>`).join("")}</div>
            <button class="btn" id="addItem" style="margin-top:.8rem">+ Agregar ítem</button>
          </div>
          <div class="panel"><div class="form"><label class="full">Condiciones y forma de pago<textarea name="terms" rows="5">${esc(p.terms)}</textarea></label></div></div>
        </div>
        <div class="summary">
          <div class="panel"><h2>Total</h2><div class="totals" id="tot">${totalsHtml()}</div></div>
          <div class="panel" style="display:flex;flex-direction:column;gap:.6rem">
            <button class="btn primary" id="save" style="justify-content:center">${isNew ? "Crear propuesta" : "Guardar cambios"}</button>
            ${isNew ? "" : `
              <div class="share"><input class="inp" readonly value="${shareUrl(p)}" id="link"><button class="btn sm" id="copy">Copiar</button></div>
              <a class="btn" href="/p/${p.token}" target="_blank" style="justify-content:center">Ver como cliente ↗</a>
              <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                ${p.status === "borrador" ? `<button class="btn gold" data-status="enviada">Marcar enviada</button>` : ""}
                ${p.status === "enviada" ? `<button class="btn" data-status="aceptada">Aceptada</button><button class="btn" data-status="rechazada">Rechazada</button>` : ""}
                ${["aceptada", "rechazada"].includes(p.status) ? `<button class="btn sm" data-status="enviada">Reabrir</button>` : ""}
              </div>
              <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                <button class="btn sm" id="sendWa">Enviar por WhatsApp</button>
                <button class="btn sm" id="sendMail">Enviar por email</button>
              </div>
              <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.4rem">
                <button class="btn sm" id="dup">Duplicar</button>
                <button class="btn sm danger" id="del">Eliminar</button>
              </div>`}
          </div>
        </div>
      </div>`;
    bind();
  };

  const sync = () => {
    $$(".editor [name]").forEach(el => { p[el.name] = el.name === "discount" ? +el.value || 0 : el.value; });
    p.items = $$(".item").map(row => ({
      title: $('[data-k="title"]', row).value, detail: $('[data-k="detail"]', row).value,
      qty: +$('[data-k="qty"]', row).value || 0, price: +$('[data-k="price"]', row).value || 0, recurring: $('[data-k="recurring"]', row).checked
    }));
  };

  const bind = () => {
    // recalcular totales sin perder el foco
    $(".editor").addEventListener("input", () => { sync(); $("#tot").innerHTML = totalsHtml(); });
    $("#addItem").addEventListener("click", () => { sync(); p.items.push({ title: "", detail: "", qty: 1, price: 0 }); render(); $$(".item").at(-1)?.querySelector("input").focus(); });
    $$("[data-del]").forEach(b => b.addEventListener("click", () => { sync(); p.items.splice(+b.dataset.del, 1); render(); }));
    $$("[data-tpl]").forEach(b => b.addEventListener("click", () => {
      sync();
      const t = TEMPLATES[b.dataset.tpl];
      if (p.items.some(i => i.title) && !confirm("¿Reemplazar los ítems actuales por la plantilla?")) return;
      Object.assign(p, { service: b.dataset.tpl, items: structuredClone(t.items), terms: p.terms || t.terms, intro: p.intro || t.intro.replace("{objetivo}", "tus objetivos comerciales"), title: p.title || t.title });
      render();
    }));
    $("[name=client_id]").addEventListener("change", e => {
      const cl = clients.find(c => c.id === +e.target.value);
      if (cl && isNew && TEMPLATES[cl.service] && !p.items.some(i => i.price)) { sync(); location.hash = `#/propuestas/nueva?cliente=${cl.id}`; }
    });
    $("#save").addEventListener("click", async () => {
      sync();
      if (!p.title.trim()) return toast("Poné un título", true);
      try {
        const saved = isNew ? await api("POST", "/proposals", p) : await api("PUT", `/proposals/${p.id}`, p);
        toast("Propuesta guardada");
        if (isNew) location.hash = `#/propuestas/${saved.id}`; else { p = saved; render(); }
      } catch (err) { toast(err.message, true); }
    });
    if (isNew) return;
    $("#copy").addEventListener("click", () => { navigator.clipboard?.writeText(shareUrl(p)); $("#link").select(); toast("Link copiado"); });
    $$("[data-status]").forEach(b => b.addEventListener("click", async () => {
      sync(); await api("PUT", `/proposals/${p.id}`, p);
      p = await api("POST", `/proposals/${p.id}/status`, { status: b.dataset.status }); toast(`Propuesta ${PSTATUS[p.status].toLowerCase()}`); render();
    }));
    const client = clients.find(c => c.id === +p.client_id);
    const msg = `Hola${client ? " " + client.name.split(" ")[0] : ""}, te comparto la propuesta “${p.title}”: ${shareUrl(p)}`;
    const markSent = async () => { if (p.status === "borrador") { p = await api("POST", `/proposals/${p.id}/status`, { status: "enviada" }); render(); } };
    $("#sendWa").addEventListener("click", () => { open(`https://wa.me/${(client?.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank"); markSent(); });
    $("#sendMail").addEventListener("click", () => { location.href = `mailto:${client?.email || ""}?subject=${encodeURIComponent("Propuesta · " + p.title)}&body=${encodeURIComponent(msg)}`; markSent(); });
    $("#dup").addEventListener("click", async () => { const d = await api("POST", `/proposals/${p.id}/duplicate`); toast("Duplicada"); location.hash = `#/propuestas/${d.id}`; });
    $("#del").addEventListener("click", async () => { if (confirm("¿Eliminar esta propuesta?")) { await api("DELETE", `/proposals/${p.id}`); toast("Eliminada"); location.hash = "#/propuestas"; } });
  };
  render();
}

start();
