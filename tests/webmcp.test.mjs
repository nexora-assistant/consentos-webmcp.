import assert from 'node:assert/strict';

const tools = [];
globalThis.document = {
  modelContext: {
    async registerTool(tool) { tools.push(tool); },
    async getTools() { return tools; },
  }
};
globalThis.window = { addEventListener() {}, dispatchEvent() {} };
globalThis.CustomEvent = class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };

const { registerWebMCP, unregisterWebMCP, TOOL_DOCS } = await import('../src/webmcp.js');
const registration = await registerWebMCP();

assert.equal(TOOL_DOCS.length, 13, 'exactly 13 documented tools expected');
assert.equal(tools.length, 13, 'exactly 13 WebMCP tools must register');
assert.equal(registration.count, 13, 'post-registration verification should find all ConsentOS tools');
assert.ok(tools.some(t => t.name === 'request_delete_data_category'));
assert.ok(tools.some(t => t.name === 'request_sign_out_session'));
assert.ok(!tools.some(t => /approve/i.test(t.name)), 'agent must not receive an approval tool');
assert.equal(tools.find(t => t.name === 'get_privacy_state').annotations.readOnlyHint, true);
assert.equal(tools.find(t => t.name === 'revoke_app_access').annotations.readOnlyHint, false);
assert.ok(tools.every(t => typeof t.title === 'string' && t.title.length > 0), 'every tool should expose a human-readable title');

const call = async (name, input = {}) => {
  const tool = tools.find(t => t.name === name);
  assert.ok(tool, `missing tool: ${name}`);
  return tool.execute(input);
};

const initial = await call('get_privacy_state');
assert.equal(initial.score, 54, 'agent should read the deterministic seed score');

const personalization = await call('toggle_ad_personalization', { enabled: false });
assert.equal(personalization.ok, true);
assert.equal(personalization.state.toggles.adPersonalization, false);

const protectedApp = await call('revoke_app_access', { appId: 'app_mail' });
assert.equal(protectedApp.ok, false, 'essential app revocation must be blocked');

const staleApp = await call('revoke_app_access', { appId: 'app_shop' });
assert.equal(staleApp.ok, true, 'agent should be able to revoke a non-essential stale app');

const deletionRequest = await call('request_delete_data_category', { categoryId: 'data_location' });
assert.equal(deletionRequest.ok, true);
assert.equal(deletionRequest.state.pendingApprovals.length, 1, 'destructive request should enter approval queue');
assert.equal(deletionRequest.state.dataCategories.find(c => c.id === 'data_location').deleted, false, 'requesting deletion must not execute deletion');

const approvals = await call('get_pending_approvals');
assert.equal(approvals.length, 1);
assert.equal(approvals[0].kind, 'delete_data');

unregisterWebMCP();
console.log('webmcp.test: PASS — 13 tools execute correctly; destructive approval remains human-only');
