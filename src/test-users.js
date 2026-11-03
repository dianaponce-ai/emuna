// Usuarios de prueba del panel. Solo se guardan las contraseñas cifradas (scrypt).
// Para borrarlos en producción: variable DISABLE_TEST_USERS=1 y volver a desplegar.
export const TEST_USERS = [
  {
    "email": "admin.prueba@emuna.com",
    "name": "Admin de prueba",
    "role": "admin",
    "hash": "scrypt$ILniLqxRUVTMZWDtAWC7ag$juKQ742nNruOZ9GXE0gJTt_MLusB9EZRJ11t7hJ0cyE"
  },
  {
    "email": "comercial.prueba@emuna.com",
    "name": "Comercial de prueba",
    "role": "editor",
    "hash": "scrypt$aYyrs2VhFZny5UOJHE1UtQ$QGF9c7aDJmRa0CXN2KHf5F_Ds8wgMvkxhR0ydHefr6Q"
  },
  {
    "email": "lectura.prueba@emuna.com",
    "name": "Solo lectura (prueba)",
    "role": "lectura",
    "hash": "scrypt$kk-rs8_y6ovH9mz-CEIRYQ$0Y5cB7H62O5D7AmG0-LgPCHS4ftHmbPnfJgr5qiXSCg"
  }
];

// Accesos que se muestran en la pantalla de ingreso mientras dure el desarrollo.
// Se ocultan solos cuando se carga DISABLE_TEST_USERS=1.
export const TEST_LOGINS = [
  {
    "email": "admin.prueba@emuna.com",
    "password": "Emuna-SDcPrTCJ",
    "label": "Administrador"
  },
  {
    "email": "comercial.prueba@emuna.com",
    "password": "Emuna-xITExsrI",
    "label": "Comercial"
  },
  {
    "email": "lectura.prueba@emuna.com",
    "password": "Emuna-OuqtQiuS",
    "label": "Solo lectura"
  }
];
