# Protección Inmediata SC — Frontend

Cliente **Angular 22** (componentes standalone, SCSS, Vitest) de la plataforma
**Protección Inmediata SC**.

Este repositorio (`frontendProteccionSC`) contiene únicamente la aplicación cliente. La API
Django vive en el repositorio hermano **`backendProteccionSC`** (`../backend`).
La documentación funcional/global del proyecto está en el `README.md` de la raíz del workspace.

---

## Requisitos

- Node 20+ (probado con Node 26) y npm 11+

## Instalación y ejecución

```bash
npm install
npm start          # dev server en http://localhost:4200
npm test           # pruebas unitarias (Vitest, una pasada con --watch=false)
npm run build      # compilación de producción en dist/
```

La app consume la API en `http://localhost:8000/api` y el WebSocket de chat en
`ws://localhost:8000`. Las URLs se configuran en
`src/environments/environment.ts` y `src/environments/environment.development.ts`
(no contienen secretos).

## Estructura del proyecto

```
frontEnd/
├─ angular.json
├─ package.json
├─ public/                     # assets estáticos (logoSC.png, fotos, ilustraciones)
└─ src/
   ├─ main.ts
   ├─ index.html
   ├─ styles.scss
   ├─ styles/                  # sistema de diseño global
   │  ├─ _variables.scss       # tokens (paleta, tipografía, spacing, breakpoints)
   │  ├─ _mixins.scss          # mixins (glass, foco, responsive…)
   │  └─ _base.scss            # reset, layout, utilidades (form-page, select, readonly…)
   ├─ environments/            # environment.ts / environment.development.ts
   └─ app/
      ├─ app.ts / app.html / app.config.ts / app.routes.ts
      ├─ core/                 # núcleo transversal (sin UI)
      │  ├─ guards/            # authGuard, roleGuard, publicOnlyGuard
      │  ├─ interceptors/      # auth, refresh (401 → renovar token), error
      │  ├─ services/          # Auth, Token, Perfil, Denuncia, Chat, ChatSocket,
      │  │                     # Noticia, Podcast, Foro, Notificacion, Alerta…
      │  ├─ models/            # tipos del contrato con la API
      │  ├─ nav/               # configuración de navegación por rol
      │  ├─ directives/        # SoloDigitosDirective (teléfono)
      │  ├─ validators/        # teléfono, fecha de nacimiento, fecha de sucesos
      │  └─ animations/        # directivas de animación (in-view, parallax)
      ├─ shared/               # reutilizable y sin estado de dominio
      │  ├─ components/        # nav-bar, side-nav, footer, modal, paginador,
      │  │                     # image-uploader, empty-state, toast-host
      │  └─ pipes/             # etiquetas legibles (rol, estado, modalidad…)
      └─ features/             # módulos por dominio (lazy-loaded)
         ├─ public/            # landing
         ├─ auth/              # login, register, recuperación de contraseña
         ├─ usuario/           # dashboard, perfil, denuncias (CRUD y detalle)
         ├─ profesional/       # dashboard y casos asignados
         ├─ admin/             # panel, usuarios, casos, noticias, podcasts, foro
         ├─ contenido/         # noticias, podcasts y foro (vista pública/autenticada)
         ├─ chat/              # conversaciones y sala de chat
         └─ notificaciones/    # listado de notificaciones compartido
```

## Arquitectura del cliente

- **Rutas** (`app.routes.ts`): carga diferida por feature; paneles protegidos por `authGuard`
  + `roleGuard(['ROL'])`. Los guards son UX; la autorización real está en Django.
- **Sesión**: `AuthService` centraliza el estado (signals), `app.config.ts` hidrata la sesión
  antes del routing y registra los interceptores y el locale `es-CO`.
- **Interceptores**: `auth` (adjunta el Bearer), `refresh` (renueva el token ante 401 con
  single-flight) y `error` (notificaciones y cierre de sesión).
- **Estado**: Angular **signals** y `ChangeDetectionStrategy.OnPush` en todos los componentes.
- **Notificaciones**: `AlertaService` envuelve **SweetAlert2**; `ToastHostComponent`/`NotificationService`
  para avisos breves.
- **Tiempo real**: `ChatSocketService` (reconexión con backoff) sobre `/ws/chat/...`.

## Pruebas

```bash
npx ng test --watch=false     # Vitest (jsdom)
npm run build                 # además valida tipos y plantillas
```

Cubren: token/sesión, guards, refresh interceptor, `ChatSocketService`, subida de imágenes,
paginador, filtros administrativos, validadores (teléfono, fechas) y registro.

## Backend (repositorio hermano)

El servidor Django (`backendProteccionSC`) se organiza en apps por dominio (`usuarios`,
`perfiles`, `denuncias`, `chat`, `noticias`, `podcasts`, `foro`, `notificaciones`, `core`)
y expone REST + WebSocket con JWT. Se documenta en su propio `README.md`.
