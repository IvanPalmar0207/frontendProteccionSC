# Protección Inmediata SC — Frontend

Aplicación Angular 22 (componentes standalone, SCSS, Vitest) para la plataforma
Protección Inmediata SC.

La documentación completa del proyecto (arquitectura, backend, API, instalación,
roles, credenciales de demostración y estado de implementación) vive en el
`README.md` de la raíz del repositorio del proyecto.

```bash
npm install
npm start     # servidor de desarrollo en http://localhost:4200
npm test      # pruebas unitarias (Vitest)
npm run build # compilación de producción
```

El frontend consume la API Django en `http://localhost:8000/api` y el WebSocket
de chat en `ws://localhost:8000`. Ambas URLs se configuran en
`src/environments/environment.ts` y `src/environments/environment.development.ts`.
