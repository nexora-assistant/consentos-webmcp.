import { initUI } from './ui.js';
import { registerWebMCP, unregisterWebMCP } from './webmcp.js';

initUI();
registerWebMCP().catch(error => {
  console.warn('[ConsentOS] WebMCP registration failed', error);
  window.dispatchEvent(new CustomEvent('consentos:webmcp', { detail: { available: false, count: 0 } }));
});
window.addEventListener('beforeunload', unregisterWebMCP, { once: true });
