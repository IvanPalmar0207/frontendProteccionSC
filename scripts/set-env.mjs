// Generates src/environments/environment.ts for production builds from the
// host's environment variables. Fails the build if API_URL/WS_URL are missing
// or still point to localhost, so no production bundle can reference localhost.
//
// Used by Netlify via netlify.toml:  node scripts/set-env.mjs && npm run build

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../src/environments/environment.ts');

const apiUrl = (process.env.API_URL || '').trim();
const wsUrl = (process.env.WS_URL || '').trim();

function fail(motivo) {
  console.error(`[set-env] ${motivo}`);
  process.exit(1);
}

if (!apiUrl || !wsUrl) {
  fail('Faltan API_URL y/o WS_URL. No se publica un build sin la URL real del backend.');
}
if (!/^https:\/\//.test(apiUrl) || !/^wss:\/\//.test(wsUrl)) {
  fail('API_URL debe usar https:// y WS_URL debe usar wss:// en producción.');
}
if (apiUrl.includes('localhost') || wsUrl.includes('localhost')) {
  fail('API_URL/WS_URL apuntan a localhost. Abortando la compilación de producción.');
}

const contenido = `export const environment = {\n  production: true,\n  apiUrl: '${apiUrl}',\n  wsUrl: '${wsUrl}',\n};\n`;

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, contenido, 'utf8');
console.log('[set-env] environment.ts generado para producción.');
