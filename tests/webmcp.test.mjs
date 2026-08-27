import assert from 'node:assert/strict';

const tools = [];
globalThis.document = {
  modelContext: {
    async registerTool(tool) { tools.push(tool); }
  }
};
globalThis.window = { addEventListener() {}, dispatchEvent() {} };
globalThis.CustomEvent = class CustomEvent { constructor(type) { this.type = type; } };

const { registerWebMCP, unregisterWebMCP, TOOL_DOCS } = await import('../src/webmcp.js');
await registerWebMCP();

assert.equal(TOOL_DOCS.length, 13, 'exactly 13 documented tools expected');
assert.equal(tools.length, 13, 'exactly 13 WebMCP tools must register');
assert.ok(tools.some(t => t.name === 'request_delete_data_category'));
assert.ok(tools.some(t => t.name === 'request_sign_out_session'));
assert.ok(!tools.some(t => /approve/i.test(t.name)), 'agent must not receive an approval tool');
assert.equal(tools.find(t => t.name === 'get_privacy_state').annotations.readOnlyHint, true);
assert.equal(tools.find(t => t.name === 'revoke_app_access').annotations.readOnlyHint, false);
assert.ok(tools.every(t => typeof t.title === 'string' && t.title.length > 0), 'every tool should expose a human-readable title');

unregisterWebMCP();
console.log('webmcp.test: PASS — 13 tools, no agent approval capability');
