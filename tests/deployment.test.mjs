import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const headers = Object.fromEntries(config.headers[0].headers.map(h => [h.key, h.value]));
assert.equal(headers['Origin-Agent-Cluster'], '?1');
assert.equal(headers['Permissions-Policy'], 'tools=(self)');
assert.equal(headers['X-Content-Type-Options'], 'nosniff');
console.log('deployment.test: PASS — explicit WebMCP origin + permissions headers');
