import { initUI } from './ui.js';
import { registerWebMCP, unregisterWebMCP } from './webmcp.js';

initUI();
registerWebMCP().catch(error => console.warn('[ConsentOS] WebMCP registration failed', error));
window.addEventListener('beforeunload', unregisterWebMCP, { once: true });
