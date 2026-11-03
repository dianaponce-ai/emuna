/* ==========================================================
   CONFIGURACIÓN — reemplazar con datos reales de EMUNÁ
   ========================================================== */
const CONFIG = {
  whatsapp: "5490000000000",   // Formato internacional sin + ni espacios
  email: "hola@emuna.com"      // Reemplazar por el email real
};

const SERVICES_NAV = [
  { slug: "paid-media",  n: "01", name: "Marketing & Paid Media" },
  { slug: "diseno-web",  n: "02", name: "Diseño & Desarrollo Web" },
  { slug: "branding",    n: "03", name: "Branding & Content" },
  { slug: "consultoria", n: "04", name: "Consultoría & Optimización" }
];

/* ---------- header, menú móvil, footer y WhatsApp (compartidos) ---------- */
(function chrome() {
  const here = location.pathname.replace(/\.html$/, "");
  const sub = SERVICES_NAV.map(s =>
    `<li><a href="/servicios/${s.slug}" ${here.endsWith(s.slug) ? 'aria-current="page"' : ""}>${s.name}<small>${s.n}</small></a></li>`).join("");
  const header = `
<div class="progress" id="progress"></div>
<div class="cursor" id="cursor"></div>
<header class="header" id="header">
  <div class="wrap nav">
    <a href="/" class="logo" aria-label="EMUNÁ inicio">EMUNÁ<span>.</span></a>
    <ul class="nav-links">
      <li class="has-sub"><a href="/#servicios" ${here.includes("/servicios/") ? 'aria-current="page"' : ""}>Servicios</a><ul class="submenu">${sub}</ul></li>
      <li><a href="/#metodo">Método</a></li>
      <li><a href="/#proyectos">Proyectos</a></li>
      <li><a href="/#sobre">Sobre</a></li>
    </ul>
    <a href="${document.getElementById("brief") ? "#brief-sec" : "/#contacto"}" class="btn btn-primary magnetic">Hablemos <span class="arrow">→</span></a>
    <button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span></button>
  </div>
</header>
<nav class="mobile-menu" id="mobileMenu" aria-label="Menú principal">
  <a href="/#servicios">Servicios</a>
  <div class="sub">${SERVICES_NAV.map(s => `<a href="/servicios/${s.slug}">${s.name}</a>`).join("")}</div>
  <a href="/#metodo">Método</a>
  <a href="/#proyectos">Proyectos</a>
  <a href="/#sobre">Sobre</a>
  <a href="/#contacto">Contacto</a>
  <p class="small">Estrategia digital. Diseño. Crecimiento.</p>
</nav>`;
  const footer = `
<footer>
  <div class="wrap">
    <a href="/" class="logo">EMUNÁ<span>.</span></a>
    <nav aria-label="Pie de página">
      ${SERVICES_NAV.map(s => `<a href="/servicios/${s.slug}">${s.name.split(" ")[0]}</a>`).join("")}
      <a href="/#metodo">Método</a>
      <a href="/#contacto">Contacto</a>
    </nav>
    <span>© ${new Date().getFullYear()} EMUNÁ · Estrategia digital. Diseño. Crecimiento.</span>
  </div>
</footer>
<a href="#" class="wa-float" id="waFloat" aria-label="Escribir por WhatsApp" target="_blank" rel="noopener">
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4 5.4 5.4 0 0 0 2.6.9 2.2 2.2 0 0 0 1.5-1.1 1.9 1.9 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3z"/></svg>
</a>`;
  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);
})();

const waLink = (text = "Hola EMUNÁ, quiero hablar sobre un proyecto.") =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
document.getElementById("waFloat").href = waLink();
document.querySelectorAll("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa || undefined); a.target = "_blank"; a.rel = "noopener"; });
document.querySelectorAll("[data-mail]").forEach(a => a.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(a.dataset.mail || "Consulta desde el sitio")}`);

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- split de títulos en palabras ---------- */
document.querySelectorAll(".split").forEach(el => {
  const words = el.innerHTML.split(/(<br>|\s+)/).filter(t => t.trim() !== "" || t === "<br>");
  // une etiquetas <em>…</em> que quedaron partidas para no romper el HTML
  const merged = []; let buf = null;
  words.forEach(w => {
    if (buf !== null) { buf += " " + w; if (w.includes("</em>")) { merged.push(buf); buf = null; } return; }
    if (w.includes("<em>") && !w.includes("</em>")) { buf = w; return; }
    merged.push(w);
  });
  if (buf) merged.push(buf);
  el.innerHTML = merged.map((w, i) => w === "<br>" ? "<br>" : `<span class="w" style="--i:${i}">${w}</span>`).join(" ");
});

/* ---------- revelado al hacer scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: .15, rootMargin: "0px 0px -6% 0px" });
document.querySelectorAll(".reveal, .split, .img-reveal").forEach(el => io.observe(el));

/* ---------- header: sombra + ocultar al bajar ---------- */
const header = document.getElementById("header");
const progress = document.getElementById("progress");
const waFloat = document.getElementById("waFloat");
let lastY = 0;
function onScroll() {
  const y = window.scrollY;
  header.classList.toggle("scrolled", y > 40);
  header.classList.toggle("hide", y > lastY && y > 600 && !document.body.classList.contains("menu-open"));
  lastY = y;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  waFloat.classList.toggle("show", y > 700);
}

/* ---------- parallax + word fill + timeline (solo donde existan) ---------- */
const heroFrame = document.getElementById("heroFrame");
const heroVisual = document.getElementById("heroVisual");
const valueText = document.getElementById("valueText");
const stepsEl = document.getElementById("steps");
const aboutMedia = document.getElementById("aboutMedia");

if (valueText) {
  const fwWords = [];
  valueText.childNodes.forEach(node => {
    if (node.nodeType === 3) {
      node.textContent.split(/(\s+)/).forEach(t => {
        if (!t.trim()) { fwWords.push(document.createTextNode(t)); return; }
        const s = document.createElement("span"); s.className = "fw"; s.textContent = t; fwWords.push(s);
      });
    } else fwWords.push(node.cloneNode(true));
  });
  valueText.innerHTML = "";
  fwWords.forEach(n => valueText.appendChild(n));
}

function onFrame() {
  const y = window.scrollY, vh = innerHeight;
  if (!reduce) {
    if (heroVisual) {
      const hr = heroVisual.getBoundingClientRect();
      if (hr.bottom > 0 && hr.top < vh) {
        heroVisual.style.transform = `translateY(${(-y * .06).toFixed(1)}px)`;
        heroFrame?.querySelectorAll("[data-speed]").forEach(o => {
          o.style.transform = `translateY(${(y * parseFloat(o.dataset.speed)).toFixed(1)}px)`;
        });
      }
    }
    if (aboutMedia) {
      const am = aboutMedia.getBoundingClientRect();
      if (am.bottom > 0 && am.top < vh) {
        const p = (am.top + am.height / 2 - vh / 2) / vh;
        aboutMedia.querySelector(".inner").style.transform = `translateY(${(p * -30).toFixed(1)}px)`;
      }
    }
    document.querySelectorAll("[data-parallax]").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) el.style.transform = `translateY(${(y * parseFloat(el.dataset.parallax)).toFixed(1)}px)`;
    });
  }
  if (valueText) {
    const vr = valueText.getBoundingClientRect();
    const total = vr.height + vh * .5;
    const prog = Math.min(1, Math.max(0, (vh * .75 - vr.top) / total));
    const words = valueText.querySelectorAll(".fw");
    const cut = Math.floor(prog * words.length);
    words.forEach((w, i) => w.classList.toggle("on", i < cut));
  }
  if (stepsEl) {
    const sr = stepsEl.getBoundingClientRect();
    const sp = Math.min(1, Math.max(0, (vh * .6 - sr.top) / (sr.height)));
    stepsEl.style.setProperty("--p", sp.toFixed(3));
    const steps = stepsEl.querySelectorAll(".step");
    steps.forEach((s, i) => s.classList.toggle("on", sp >= i / (steps.length - .4)));
  }
}

let ticking = false;
addEventListener("scroll", () => {
  if (!ticking) { requestAnimationFrame(() => { onScroll(); onFrame(); ticking = false; }); ticking = true; }
}, { passive: true });
onScroll(); onFrame();

/* ---------- spotlight en tarjetas ---------- */
document.querySelectorAll("[data-spot], .incl-card").forEach(card => {
  card.addEventListener("pointermove", e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

/* ---------- magnetic buttons + cursor (desktop) ---------- */
if (matchMedia("(hover:hover) and (pointer:fine)").matches && !reduce) {
  document.querySelectorAll(".magnetic").forEach(btn => {
    btn.addEventListener("pointermove", e => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    btn.addEventListener("pointerleave", () => btn.style.transform = "");
  });
  const cur = document.getElementById("cursor");
  let cx = 0, cy = 0, tx = 0, ty = 0;
  addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() {
    cx += (tx - cx) * .2; cy += (ty - cy) * .2;
    cur.style.left = cx + "px"; cur.style.top = cy + "px";
    requestAnimationFrame(loop);
  })();
  document.addEventListener("pointerover", e => {
    if (e.target.closest("a, button, .svc, .slot, .incl-card, .chip, .card-opt, input, select, textarea")) cur.classList.add("big");
  });
  document.addEventListener("pointerout", e => {
    if (e.target.closest("a, button, .svc, .slot, .incl-card, .chip, .card-opt, input, select, textarea")) cur.classList.remove("big");
  });
}

/* ---------- menú móvil ---------- */
const burger = document.getElementById("burger");
function toggleMenu(force) {
  const open = typeof force === "boolean" ? force : !document.body.classList.contains("menu-open");
  document.body.classList.toggle("menu-open", open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  document.body.style.overflow = open ? "hidden" : "";
}
burger.addEventListener("click", () => toggleMenu());
document.querySelectorAll(".mobile-menu a").forEach(a => a.addEventListener("click", () => toggleMenu(false)));
addEventListener("keydown", e => { if (e.key === "Escape") toggleMenu(false); });

/* ---------- formulario de contacto de la home → CRM ---------- */
const leadForm = document.getElementById("leadForm");
if (leadForm) {
  const rules = {
    name:    v => v.trim().length >= 2 || "Escribí tu nombre.",
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Revisá el email.",
    service: v => !!v || "Elegí un área de interés.",
    message: v => v.trim().length >= 15 || "Contanos un poco más (mín. 15 caracteres)."
  };
  const validateField = input => {
    const field = input.closest(".field"), rule = rules[input.name];
    if (!rule || !field) return true;
    const res = rule(input.value), ok = res === true;
    field.classList.toggle("err", !ok);
    field.querySelector(".msg").textContent = ok ? "" : res;
    return ok;
  };
  leadForm.querySelectorAll("input,select,textarea").forEach(i => {
    i.addEventListener("blur", () => validateField(i));
    i.addEventListener("input", () => { if (i.closest(".field")?.classList.contains("err")) validateField(i); });
  });
  leadForm.addEventListener("submit", async e => {
    e.preventDefault();
    const fields = [...leadForm.querySelectorAll("input:not(.hp input),select,textarea")];
    if (!fields.map(validateField).every(Boolean)) { leadForm.querySelector(".err input, .err select, .err textarea")?.focus(); return; }
    const d = Object.fromEntries(new FormData(leadForm));
    const btn = leadForm.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const r = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name, email: d.email, company: d.company, service: d.service, message: d.message, _hp: d.website_hp, source: "web",
          brief: [{ section: "Contacto", label: "Desafío", value: d.message }]
        })
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "No pudimos enviar.");
      document.getElementById("formOk").classList.add("show");
      leadForm.reset();
    } catch (err) {
      // Sin backend disponible: se ofrece WhatsApp con el mensaje listo
      const text = `Hola EMUNÁ, soy ${d.name}${d.company ? ` (${d.company})` : ""}.\n${d.message}\nEmail: ${d.email}`;
      const ok = document.getElementById("formOk");
      ok.innerHTML = `No pudimos enviar el formulario (${err.message}). <a href="${waLink(text)}" target="_blank" rel="noopener" style="text-decoration:underline">Enviá la consulta por WhatsApp</a>.`;
      ok.classList.add("show");
    } finally { btn.disabled = false; }
  });
}
