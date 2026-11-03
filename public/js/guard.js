/* ==========================================================
   Protección anti-bots para formularios.
   - Agrega un campo trampa invisible y la hora en que se mostró el formulario.
   - Si el servidor tiene configurado Cloudflare Turnstile, muestra el
     verificador en los elementos [data-captcha].
   Uso:  const g = Guard.attach(form);  … body: { ...datos, ...g.fields() }  … g.reset()
   ========================================================== */
window.Guard = (function () {
  let configP;
  const config = () => configP ||= fetch("/api/config").then(r => r.ok ? r.json() : {}).catch(() => ({}));
  let scriptP;
  const loadTurnstile = () => scriptP ||= new Promise((ok, ko) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true; s.onload = ok; s.onerror = ko;
    document.head.appendChild(s);
  });

  function attach(form, { theme = "auto" } = {}) {
    let shownAt = Date.now();
    let widgetId = null;
    if (!form.querySelector("input[name=_hp]")) {
      form.insertAdjacentHTML("afterbegin",
        `<div style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true">
          <label>No completar este campo <input name="_hp" tabindex="-1" autocomplete="off"></label></div>`);
    }
    const box = form.querySelector("[data-captcha]");
    if (box) {
      config().then(async c => {
        if (!c.turnstileSiteKey) { box.remove(); return; }
        await loadTurnstile();
        widgetId = window.turnstile.render(box, { sitekey: c.turnstileSiteKey, theme, language: "es" });
      }).catch(() => {});
    }
    return {
      fields() {
        return {
          _hp: form.querySelector("input[name=_hp]")?.value || "",
          _t: shownAt,
          _ts: widgetId != null && window.turnstile ? window.turnstile.getResponse(widgetId) : ""
        };
      },
      reset() {
        shownAt = Date.now();
        if (widgetId != null && window.turnstile) window.turnstile.reset(widgetId);
      }
    };
  }
  return { attach };
})();
