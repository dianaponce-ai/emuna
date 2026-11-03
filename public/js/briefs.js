/* ==========================================================
   PLANILLAS POR SERVICIO
   Cada servicio define sus pasos y preguntas. Para cambiar una
   pregunta, editá este archivo: el formulario, la validación y
   lo que se guarda en el CRM se generan solos.
   Tipos: text, email, tel, url, textarea, select, date,
          chips (varias opciones), cards (una opción con detalle),
          range (escala con valor)
   ========================================================== */

const BUDGET = ["Menos de USD 500", "USD 500 – 1.500", "USD 1.500 – 4.000", "Más de USD 4.000", "Prefiero conversarlo"];

const CONTACT_STEP = {
  title: "Tus datos",
  hint: "Para saber con quién hablamos y cómo responderte.",
  fields: [
    { name: "name", label: "Nombre y apellido", type: "text", required: true, half: true, autocomplete: "name" },
    { name: "email", label: "Email", type: "email", required: true, half: true, autocomplete: "email" },
    { name: "phone", label: "WhatsApp / teléfono", type: "tel", half: true, autocomplete: "tel" },
    { name: "company", label: "Empresa o marca", type: "text", half: true, autocomplete: "organization" },
    { name: "website", label: "Sitio web o Instagram", type: "text", placeholder: "www.tumarca.com o @tumarca" }
  ]
};

const BRIEFS = {
  "paid-media": {
    title: "Planilla de Paid Media",
    steps: [
      CONTACT_STEP,
      {
        title: "Objetivo y punto de partida",
        hint: "Así sabemos qué campaña conviene y qué medir.",
        fields: [
          { name: "objetivo", label: "¿Qué querés lograr primero?", type: "cards", required: true, options: [
            ["Ventas online", "Compras en tienda o checkout"], ["Leads o consultas", "Formularios, WhatsApp, llamadas"],
            ["Reservas o turnos", "Agenda, reservas, citas"], ["Reconocimiento", "Que más gente conozca la marca"]] },
          { name: "plataformas", label: "Plataformas que te interesan", type: "chips", options: [
            "Meta Ads (Instagram / Facebook)", "Google Search", "Google Shopping / PMax", "YouTube", "TikTok Ads", "LinkedIn Ads", "No sé, recomiéndenme"] },
          { name: "experiencia", label: "Experiencia previa con anuncios", type: "cards", required: true, options: [
            ["Nunca invertí", "Arrancamos de cero"], ["Por mi cuenta", "Botón promocionar o campañas propias"],
            ["Con otra agencia", "Quiero mejorar resultados"], ["Campañas activas", "Necesito optimizar lo que corre"]] },
          { name: "tracking", label: "Medición instalada", type: "chips", options: [
            "Píxel de Meta", "Google Analytics 4", "Google Tag Manager", "API de conversiones", "Ninguna / no sé"] }
        ]
      },
      {
        title: "Números y mercado",
        hint: "Valores aproximados alcanzan. Nos sirven para proyectar resultados realistas.",
        fields: [
          { name: "inversion", label: "Inversión mensual en pauta", type: "select", required: true, half: true, options: [
            "Menos de USD 300", "USD 300 – 1.000", "USD 1.000 – 3.000", "USD 3.000 – 10.000", "Más de USD 10.000", "A definir"] },
          { name: "ticket", label: "Ticket promedio de venta", type: "text", half: true, placeholder: "Ej: $45.000" },
          { name: "cpa", label: "¿Cuánto podrías pagar por cliente o lead?", type: "text", half: true, placeholder: "Ej: USD 8 por lead" },
          { name: "zonas", label: "Zonas donde vendés", type: "text", half: true, placeholder: "CABA, AMBA, todo el país…" },
          { name: "destino", label: "¿A dónde llegarían los anuncios?", type: "cards", options: [
            ["Mi sitio web", ""], ["Tienda online", ""], ["WhatsApp", ""], ["Formulario de Meta", ""], ["Necesito una landing", ""]] },
          { name: "publico", label: "Describí a tu cliente ideal", type: "textarea", placeholder: "Edad, intereses, qué problema resolvés, por qué te eligen…" },
          { name: "message", label: "¿Algo más que debamos saber?", type: "textarea" }
        ]
      }
    ]
  },

  "diseno-web": {
    title: "Planilla de Diseño Web",
    steps: [
      CONTACT_STEP,
      {
        title: "El proyecto",
        hint: "Qué tipo de sitio necesitás y qué tiene que poder hacer.",
        fields: [
          { name: "tipo", label: "Tipo de proyecto", type: "cards", required: true, options: [
            ["Landing page", "Una página enfocada en convertir"], ["Sitio institucional", "Varias secciones, servicios, contacto"],
            ["Tienda online", "Catálogo, carrito y pagos"], ["Rediseño", "Mejorar una web que ya existe"]] },
          { name: "paginas", label: "Cantidad aproximada de secciones o páginas", type: "range", min: 1, max: 20, value: 5, suffix: " páginas" },
          { name: "plataforma", label: "Plataforma", type: "cards", options: [
            ["WordPress", ""], ["Tiendanube", ""], ["Shopify", ""], ["A medida", ""], ["Me asesoran", ""]] },
          { name: "funciones", label: "Funcionalidades necesarias", type: "chips", options: [
            "Formulario de contacto", "Botón de WhatsApp", "Blog / novedades", "Catálogo", "Carrito y pagos", "Reservas o turnos",
            "Multi-idioma", "Área de clientes", "Integración con CRM / email", "Newsletter"] }
        ]
      },
      {
        title: "Contenido y plazos",
        hint: "Para estimar tiempos y qué tenemos que producir nosotros.",
        fields: [
          { name: "contenido", label: "¿Qué tenés listo?", type: "chips", options: [
            "Textos", "Fotos profesionales", "Logo e identidad", "Videos", "Nada todavía"] },
          { name: "dominio", label: "Dominio y hosting", type: "cards", options: [
            ["Tengo ambos", ""], ["Solo el dominio", ""], ["Nada todavía", ""], ["No sé", ""]] },
          { name: "actual", label: "Si ya tenés web, ¿qué no te gusta?", type: "textarea" },
          { name: "referencias", label: "Sitios de referencia y qué te gusta de cada uno", type: "textarea", placeholder: "Pegá links y contanos por qué" },
          { name: "fecha", label: "¿Para cuándo lo necesitás?", type: "date", half: true },
          { name: "presupuesto", label: "Presupuesto del proyecto", type: "select", half: true, options: BUDGET },
          { name: "message", label: "¿Algo más?", type: "textarea" }
        ]
      }
    ]
  },

  "branding": {
    title: "Planilla de Branding",
    steps: [
      CONTACT_STEP,
      {
        title: "La marca",
        hint: "Quién es tu marca hoy y cómo querés que se perciba.",
        fields: [
          { name: "situacion", label: "Situación", type: "cards", required: true, options: [
            ["Marca nueva", "Todavía no existe o recién nace"], ["Rebranding", "Cambio profundo de identidad"],
            ["Actualización", "Refrescar sin perder reconocimiento"], ["Ordenar comunicación", "La marca está, falta coherencia"]] },
          { name: "marca", label: "Nombre de la marca", type: "text", half: true },
          { name: "rubro", label: "Rubro", type: "text", half: true, placeholder: "Gastronomía, salud, moda…" },
          { name: "personalidad", label: "¿Cómo debería sentirse? (elegí hasta 4)", type: "chips", max: 4, options: [
            "Cercana", "Premium", "Sofisticada", "Natural", "Divertida", "Técnica", "Audaz", "Minimalista", "Cálida", "Confiable"] },
          { name: "publico", label: "¿A quién le habla?", type: "textarea" },
          { name: "competencia", label: "Competidores o marcas que admirás", type: "textarea" }
        ]
      },
      {
        title: "Entregables y contenido",
        hint: "Qué piezas necesitás y cómo comunicás hoy.",
        fields: [
          { name: "entregables", label: "Entregables", type: "chips", required: true, options: [
            "Logo y variantes", "Paleta y tipografías", "Manual de marca", "Papelería", "Packaging", "Plantillas para redes",
            "Tono de voz", "Estrategia de contenidos", "Dirección de arte / fotos"] },
          { name: "redes", label: "Canales activos", type: "chips", options: ["Instagram", "TikTok", "LinkedIn", "Facebook", "YouTube", "Newsletter", "Ninguno"] },
          { name: "frecuencia", label: "Frecuencia de publicación actual", type: "select", half: true, options: [
            "No publico", "Esporádica", "1–2 por semana", "3 o más por semana"] },
          { name: "presupuesto", label: "Presupuesto", type: "select", half: true, options: BUDGET },
          { name: "fecha", label: "Fecha ideal de lanzamiento", type: "date", half: true },
          { name: "message", label: "¿Algo más?", type: "textarea" }
        ]
      }
    ]
  },

  "consultoria": {
    title: "Planilla de Consultoría",
    steps: [
      CONTACT_STEP,
      {
        title: "Situación actual",
        hint: "Dónde estás hoy y qué te está frenando.",
        fields: [
          { name: "formato", label: "Formato que buscás", type: "cards", required: true, options: [
            ["Auditoría puntual", "Informe con hallazgos y prioridades"], ["Diagnóstico + plan", "Hoja de ruta de 90 días"],
            ["Acompañamiento", "Reuniones y seguimiento mensual"]] },
          { name: "areas", label: "Áreas a revisar", type: "chips", required: true, options: [
            "Sitio web y conversión", "Campañas pagas", "SEO", "Redes sociales", "Embudo de ventas", "Analítica y medición",
            "Email marketing", "Procesos y herramientas"] },
          { name: "canales", label: "¿De dónde llegan hoy tus clientes?", type: "chips", options: [
            "Recomendación", "Instagram", "Google orgánico", "Anuncios pagos", "Marketplaces", "Venta directa"] },
          { name: "problema", label: "¿Cuál es el principal problema hoy?", type: "textarea", required: true,
            placeholder: "Ej: tenemos tráfico pero no vende, no sabemos qué campaña funciona…" }
        ]
      },
      {
        title: "Datos y accesos",
        hint: "Con qué información vamos a poder trabajar.",
        fields: [
          { name: "herramientas", label: "Herramientas que usás", type: "chips", options: [
            "Google Analytics 4", "Search Console", "Meta Business", "Google Ads", "CRM", "Tiendanube / Shopify", "Ninguna"] },
          { name: "visitas", label: "Visitas mensuales al sitio", type: "select", half: true, options: [
            "Menos de 1.000", "1.000 – 10.000", "10.000 – 50.000", "Más de 50.000", "No sé"] },
          { name: "madurez", label: "¿Qué tan ordenado está tu marketing? (1 a 5)", type: "range", min: 1, max: 5, value: 3, half: true, suffix: " / 5" },
          { name: "urgencia", label: "Urgencia", type: "cards", options: [
            ["Esta semana", ""], ["Este mes", ""], ["Próximos 3 meses", ""], ["Explorando", ""]] },
          { name: "message", label: "¿Algo más?", type: "textarea" }
        ]
      }
    ]
  }
};

/* ---------------------- motor de la planilla ---------------------- */
(function () {
  const root = document.getElementById("brief");
  if (!root) return;
  const service = root.dataset.service;
  const cfg = BRIEFS[service];
  const aside = document.getElementById("briefSteps");
  const steps = [...cfg.steps, { title: "Revisión", review: true }];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const id = n => `f_${n}`;

  function fieldHTML(f) {
    const req = f.required ? " *" : "";
    const half = f.half ? " half" : "";
    if (f.type === "chips" || f.type === "cards") {
      const multi = f.type === "chips";
      const opts = f.options.map((o, i) => {
        const [t, d] = Array.isArray(o) ? o : [o, ""];
        return multi
          ? `<label class="chip"><input type="checkbox" name="${f.name}" value="${esc(t)}"><span>${esc(t)}</span></label>`
          : `<label class="card-opt"><input type="radio" name="${f.name}" value="${esc(t)}"><span><b>${esc(t)}</b>${d ? `<small>${esc(d)}</small>` : ""}</span></label>`;
      }).join("");
      return `<fieldset class="qgroup${half}" data-field="${f.name}"><legend>${esc(f.label)}${req}</legend>
        <div class="${multi ? "chips" : "cards"}">${opts}</div><span class="msg"></span></fieldset>`;
    }
    if (f.type === "range") {
      return `<div class="qgroup${half}" data-field="${f.name}"><span class="lbl">${esc(f.label)}</span>
        <div class="scale"><input type="range" id="${id(f.name)}" name="${f.name}" min="${f.min}" max="${f.max}" value="${f.value}" aria-label="${esc(f.label)}">
        <output for="${id(f.name)}">${f.value}${f.suffix || ""}</output></div><span class="msg"></span></div>`;
    }
    let input;
    const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : "";
    const ac = f.autocomplete ? ` autocomplete="${f.autocomplete}"` : "";
    if (f.type === "textarea") input = `<textarea id="${id(f.name)}" name="${f.name}" rows="3"${ph}></textarea>`;
    else if (f.type === "select") input = `<select id="${id(f.name)}" name="${f.name}"><option value="">Elegí una opción</option>${f.options.map(o => `<option>${esc(o)}</option>`).join("")}</select>`;
    else input = `<input id="${id(f.name)}" name="${f.name}" type="${f.type}"${ph}${ac}>`;
    return `<div class="field${f.half ? "" : " full"}" data-field="${f.name}"><label for="${id(f.name)}">${esc(f.label)}${req}</label>${input}<span class="msg"></span></div>`;
  }

  root.innerHTML = `
    <form class="bform" id="bform" novalidate>
      <div class="bbar"><i id="bbar"></i></div>
      ${steps.map((s, i) => `
        <div class="bstep${i === 0 ? " on" : ""}" data-step="${i}">
          <h3>${esc(s.title)}</h3>
          ${s.review ? `<p class="hint">Revisá tus respuestas. Si algo no está bien, volvé atrás y corregilo.</p><dl class="review" id="review"></dl><div class="full" data-captcha style="grid-column:1/-1"></div><p class="ferr" id="ferr" hidden></p>`
                     : `<p class="hint">${esc(s.hint || "")}</p>${s.fields.map(fieldHTML).join("")}`}
        </div>`).join("")}
      <div class="bnav">
        <button type="button" class="btn btn-ghost" id="bprev" hidden><span class="arrow">←</span> Atrás</button>
        <small id="bcount"></small>
        <button type="button" class="btn btn-wa magnetic" id="bnext">Siguiente <span class="arrow">→</span></button>
        <button type="submit" class="btn btn-wa magnetic" id="bsend" hidden>Enviar planilla <span class="arrow">→</span></button>
      </div>
    </form>
    <div class="bdone" id="bdone" role="status">
      <h3>¡Gracias! <em>Ya la recibimos.</em></h3>
      <p>Revisamos tu planilla y te escribimos en menos de 48 horas hábiles con los próximos pasos. Si es urgente, escribinos por WhatsApp.</p>
      <a class="btn btn-ghost" style="color:var(--paper);border-color:rgba(247,243,234,.45)" href="#" data-wa-done>Escribir por WhatsApp <span class="arrow">→</span></a>
    </div>`;
  aside.innerHTML = steps.map((s, i) => `<li class="${i === 0 ? "on" : ""}">${esc(s.title)}</li>`).join("");

  const form = document.getElementById("bform");
  const guard = Guard.attach(form, { theme: "dark" });
  let cur = 0;

  form.querySelectorAll('input[type=range]').forEach(r => {
    const f = cfg.steps.flatMap(s => s.fields).find(x => x.name === r.name);
    r.addEventListener("input", () => { r.nextElementSibling.textContent = r.value + (f.suffix || ""); });
  });
  form.querySelectorAll(".qgroup[data-field]").forEach(g => {
    const f = cfg.steps.flatMap(s => s.fields).find(x => x.name === g.dataset.field);
    if (f?.max) g.addEventListener("change", e => {
      const checked = g.querySelectorAll("input:checked");
      if (checked.length > f.max) { e.target.checked = false; g.querySelector(".msg").textContent = `Elegí hasta ${f.max}.`; }
      else g.querySelector(".msg").textContent = "";
    });
  });

  function valueOf(f) {
    if (f.type === "chips") return [...form.querySelectorAll(`input[name="${f.name}"]:checked`)].map(i => i.value);
    if (f.type === "cards") return form.querySelector(`input[name="${f.name}"]:checked`)?.value || "";
    if (f.type === "range") { const v = form.elements[f.name].value; return v + (f.suffix || ""); }
    return (form.elements[f.name]?.value || "").trim();
  }
  function validate(f) {
    const v = valueOf(f);
    let err = "";
    if (f.required && (Array.isArray(v) ? !v.length : !v)) err = f.type === "chips" ? "Elegí al menos una opción." : f.type === "cards" ? "Elegí una opción." : "Este dato es necesario.";
    else if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) err = "Revisá el email.";
    else if (f.name === "name" && v && v.length < 2) err = "Escribí tu nombre.";
    const box = form.querySelector(`[data-field="${f.name}"]`);
    box.classList.toggle("err", !!err);
    const msg = box.querySelector(".msg");
    if (msg) msg.textContent = err;
    return !err;
  }
  form.addEventListener("input", e => {
    const box = e.target.closest("[data-field]");
    if (box?.classList.contains("err")) {
      const f = cfg.steps.flatMap(s => s.fields).find(x => x.name === box.dataset.field);
      validate(f);
    }
  });

  function show(i) {
    cur = i;
    form.querySelectorAll(".bstep").forEach((s, k) => s.classList.toggle("on", k === i));
    aside.querySelectorAll("li").forEach((li, k) => { li.classList.toggle("on", k === i); li.classList.toggle("done", k < i); });
    document.getElementById("bbar").style.setProperty("--p", (i + 1) / steps.length);
    document.getElementById("bprev").hidden = i === 0;
    document.getElementById("bnext").hidden = i === steps.length - 1;
    document.getElementById("bsend").hidden = i !== steps.length - 1;
    document.getElementById("bcount").textContent = `Paso ${i + 1} de ${steps.length}`;
    if (steps[i].review) renderReview();
    const top = root.getBoundingClientRect().top + scrollY - 110;
    if (scrollY > top + 40) scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }
  function collect() {
    return cfg.steps.flatMap(s => s.fields.map(f => {
      const v = valueOf(f);
      return { section: s.title, name: f.name, label: f.label.replace(/\s*\(.*\)$/, ""), value: Array.isArray(v) ? v.join(", ") : v };
    }));
  }
  function renderReview() {
    let last = "";
    document.getElementById("review").innerHTML = collect().filter(x => x.value).map(x => {
      const sec = x.section !== last ? `<div class="sec">${esc(x.section)}</div>` : "";
      last = x.section;
      return `${sec}<div><dt>${esc(x.label)}</dt><dd>${esc(x.value)}</dd></div>`;
    }).join("");
  }

  document.getElementById("bnext").addEventListener("click", () => {
    const ok = steps[cur].fields.map(validate).every(Boolean);
    if (!ok) { form.querySelector(`.bstep.on .err input, .bstep.on .err select, .bstep.on .err textarea`)?.focus(); return; }
    show(cur + 1);
  });
  document.getElementById("bprev").addEventListener("click", () => show(cur - 1));
  form.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.tagName === "INPUT" && cur < steps.length - 1) { e.preventDefault(); document.getElementById("bnext").click(); }
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const answers = collect();
    const get = n => answers.find(a => a.name === n)?.value || "";
    const btn = document.getElementById("bsend"), ferr = document.getElementById("ferr");
    btn.disabled = true; ferr.hidden = true;
    const contact = ["name", "email", "phone", "company", "website", "message"];
    try {
      const r = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service, source: "web", ...guard.fields(),
          name: get("name"), email: get("email"), phone: get("phone"), company: get("company"), website: get("website"), message: get("message"),
          brief: answers.filter(a => !contact.includes(a.name) && a.value).map(({ section, label, value }) => ({ section, label, value }))
        })
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "No pudimos enviar la planilla.");
      form.style.display = "none";
      const done = document.getElementById("bdone");
      done.querySelector("[data-wa-done]").href = waLink(`Hola EMUNÁ, soy ${get("name")}. Acabo de completar la ${cfg.title.toLowerCase()}.`);
      done.querySelector("[data-wa-done]").target = "_blank";
      done.classList.add("show");
      aside.querySelectorAll("li").forEach(li => { li.classList.remove("on"); li.classList.add("done"); });
    } catch (err) {
      const summary = answers.filter(a => a.value).map(a => `${a.label}: ${a.value}`).join("\n");
      ferr.innerHTML = `${esc(err.message)} Podés <a href="${waLink(`Hola EMUNÁ, completé la ${cfg.title.toLowerCase()}:\n${summary}`)}" target="_blank" rel="noopener" style="text-decoration:underline">enviarla por WhatsApp</a>.`;
      ferr.hidden = false;
      guard.reset();
    } finally { btn.disabled = false; }
  });

  show(0);
})();
