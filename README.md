# EMUNÁ · Sitio + CRM

Sitio público de EMUNÁ (misma estética del diseño original) con una página por servicio y un panel privado para gestionar leads, clientes, pipeline y propuestas.

## Qué incluye

**Sitio público**
- `/`: la home original. El formulario de contacto ahora carga el lead directo en el CRM (si falla, ofrece WhatsApp con el mensaje armado).
- `/servicios/paid-media`, `/servicios/diseno-web`, `/servicios/branding` y `/servicios/consultoria`: cada página tiene su hero, qué incluye, formas de trabajar, preguntas frecuentes y una **planilla por pasos con preguntas propias del servicio**. Por ejemplo, Paid Media pregunta por la inversión en pauta, el ticket y la medición instalada, y Diseño Web por el tipo de sitio, la plataforma, las funcionalidades y los contenidos.
- `/p/<código>`: propuesta pública que se comparte con el cliente. Se puede descargar en PDF y aceptar online.

**Panel `/admin`**
- **Resumen**: contactos, negociaciones abiertas, monto en propuestas, monto ganado, tasa de cierre, embudo, leads por servicio, leads sin contactar y tareas pendientes.
- **Pipeline**: tablero tipo kanban (Nuevo → Contactado → Reunión → Propuesta → Ganado / Perdido). Las tarjetas se arrastran entre columnas.
- **Clientes**: buscador y filtros. Cada ficha muestra la planilla que completó el cliente, la actividad (notas, llamadas, emails, WhatsApp, reuniones y tareas con vencimiento), sus propuestas y sus datos editables.
- **Propuestas**: editor con plantillas por servicio, ítems con pago único o mensual, descuento, moneda (ARS/USD/EUR), validez y condiciones. Genera un link para compartir, que se puede mandar por WhatsApp o email. El panel registra cuándo el cliente la abre y cuándo la acepta.

**Automatismos**
- Cuando alguien completa una planilla, se crea el lead en *Nuevo* junto con sus respuestas.
- Si registrás una llamada, un email, un WhatsApp o una reunión con un lead nuevo, pasa a *Contactado*.
- Al marcar una propuesta como enviada, el cliente pasa a *Propuesta*.
- Cuando el cliente acepta online, la propuesta queda *Aceptada*, el cliente pasa a *Ganado* y su valor se actualiza.

## Usuarios y permisos

El panel acepta varios usuarios, cada uno con un rol:

| Rol | Puede |
|---|---|
| `admin` | Todo, incluso borrar |
| `editor` (comercial) | Crear y editar clientes, actividades y propuestas, pero no borrar |
| `lectura` | Solo ver |

- **Administrador principal**: se define con las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
- **Usuarios de prueba**: están en `src/test-users.js` (`admin.prueba@`, `comercial.prueba@` y `lectura.prueba@emuna.com`). Se crean solos en la base la primera vez que arranca el sitio. El repositorio guarda solo las contraseñas cifradas, así que las contraseñas no son públicas.
- **Borrar los usuarios de prueba**: cuando termines el desarrollo, cargá `DISABLE_TEST_USERS=1` en Vercel y volvé a desplegar.

## Recuperar contraseña

En el ingreso al panel está la opción **"¿Olvidaste tu contraseña?"**. El sistema envía al usuario un enlace que vence en 1 hora y se puede usar una sola vez. Siempre muestra el mismo mensaje, exista o no el email, para no revelar qué cuentas hay registradas.

- Los emails se envían con [Resend](https://resend.com). Cargá `RESEND_API_KEY` y `MAIL_FROM` (por ejemplo `EMUNÁ <hola@tudominio.com>`, con el dominio verificado en Resend).
- Si falta `RESEND_API_KEY`, el enlace aparece en los logs del servidor (en Vercel: *Logs*), así que igual podés usarlo durante el desarrollo.
- `SITE_URL` (opcional) define el dominio de los enlaces, por ejemplo `https://emuna.com`.
- El administrador principal de las variables `ADMIN_EMAIL`/`ADMIN_PASSWORD` no recupera por email: su contraseña se cambia en Vercel.

## Protección anti-bots

Cubre el login, "olvidé mi contraseña", el formulario de contacto y las cuatro planillas:

1. **Campo trampa invisible**: los bots lo completan y el envío se descarta sin avisarles.
2. **Tiempo mínimo de llenado**: rechaza envíos hechos al instante de abrir la página.
3. **Límite de intentos guardado en la base de datos**, para que funcione también en Vercel:
   - Login: 6 intentos fallidos por usuario o 20 por IP cada 15 minutos.
   - Recuperar contraseña: 3 pedidos por email por hora.
   - Formularios: 15 envíos por IP por hora.
4. **Cloudflare Turnstile** (el "no soy un robot" de Cloudflare, sin acertijos), opcional:
   1. Creá un widget gratis en Cloudflare → Turnstile para tu dominio.
   2. Cargá `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` en Vercel.
   3. Volvé a desplegar. El verificador aparece solo en todos los formularios.

## Correr en tu computadora

Necesitás Node 18 o superior.

```bash
npm install
npm start
```

- Sitio: http://localhost:3000
- Panel: http://localhost:3000/admin
- Usuario de prueba: `admin@emuna.com` / `emuna2026`

En local, la base de datos es un Postgres embebido (PGlite) que se guarda en `data/`. No hace falta instalar nada.

## Publicar en Vercel

1. Subí el proyecto a un repositorio de GitHub e importalo en Vercel. No hay que configurar el framework: usá la opción *Other*.
2. En el proyecto de Vercel, entrá a **Storage → Create Database → Neon (Postgres)** y conectala al proyecto. Vercel agrega `DATABASE_URL` sola. Las tablas se crean automáticamente la primera vez.
3. En **Settings → Environment Variables**, agregá:
   - `ADMIN_EMAIL`: el email con el que vas a entrar al panel.
   - `ADMIN_PASSWORD`: una contraseña segura.
   - `SESSION_SECRET`: un texto largo y aleatorio (por ejemplo, el resultado de `openssl rand -base64 32`).
4. Volvé a desplegar.

> Sin `DATABASE_URL`, Vercel guarda los datos en un disco temporal y **se pierden**. En producción, el panel no deja entrar si faltan `ADMIN_PASSWORD` o `SESSION_SECRET`.

El proyecto también funciona en Render, Railway o un VPS con `npm start`. Si no definís `DATABASE_URL`, usa la base embebida en `data/`.

## Qué editar y dónde

| Querés cambiar… | Archivo |
|---|---|
| Número de WhatsApp y email de contacto | `public/js/site.js` → `CONFIG` |
| Menú, header y footer (compartidos por todas las páginas) | `public/js/site.js` → función `chrome()` |
| Preguntas de cada planilla | `public/js/briefs.js` → `BRIEFS` |
| Textos de cada página de servicio | `public/servicios/*.html` |
| Plantillas de propuestas (ítems, introducción, condiciones) | `public/admin/app.js` → `TEMPLATES` |
| Colores y tipografías | `public/css/site.css` (`:root`) y `public/admin/admin.css` |
| Etapas del pipeline | `src/app.js` → `STAGES` y `public/admin/app.js` → `STAGE_LABEL` |

Las plantillas de propuestas tienen los precios en 0 para que cargues los tuyos.

## Estructura

```
api/index.js        Función de Vercel (usa src/app.js)
server.js           Servidor para correr en local, Render o Railway
src/app.js          API: leads, clientes, actividades, propuestas y métricas
src/db.js           Postgres (DATABASE_URL) o PGlite en local
src/auth.js         Login con cookie firmada y límite de intentos
public/             Sitio, planillas, panel y propuesta pública
vercel.json         Rutas limpias y reescrituras
```

## Seguridad

- El panel y la API privada exigen sesión. La cookie es HttpOnly, está firmada y dura 7 días.
- Hay límite de intentos de login y de envíos de planillas por IP, y un campo trampa contra spam en los formularios.
- Los links de propuestas usan un código aleatorio. Las propuestas en borrador no se pueden ver desde afuera.
