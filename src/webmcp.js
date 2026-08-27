import {
  state,
  scoreState,
  getStateSnapshot,
  revokeApp,
  setPersonalization,
  changeRetention,
  requestExport,
  requestDeleteData,
  requestSignOut,
  rejectPending,
  undoLast,
} from './state.js';

export const TOOL_DOCS = [
  { name: 'get_privacy_state', title: 'Inspect privacy state', readOnly: true, description: 'Read the full simulated privacy state including connected apps, data categories, sessions, privacy toggles, score and pending approvals.' },
  { name: 'get_privacy_score_details', title: 'Explain privacy score', readOnly: true, description: 'Explain the current privacy score and each factor that contributes to it.' },
  { name: 'list_connected_apps', title: 'List connected apps', readOnly: true, description: 'List linked apps, last-used times, scopes, whether each app is essential, and risk labels.' },
  { name: 'revoke_app_access', title: 'Revoke app access', readOnly: false, description: 'Revoke a non-essential connected app immediately. Essential apps are blocked from revocation.' },
  { name: 'toggle_ad_personalization', title: 'Toggle ad personalization', readOnly: false, description: 'Enable or disable ad personalization and related targeting.' },
  { name: 'change_data_retention', title: 'Change data retention', readOnly: false, description: 'Change retention for a specific data category to a supported preset.' },
  { name: 'request_data_export', title: 'Prepare data export', readOnly: false, description: 'Prepare a privacy export request and add it to the audit timeline.' },
  { name: 'request_delete_data_category', title: 'Request data deletion', readOnly: false, description: 'Queue deletion of a data category. The human must approve it in the ConsentOS interface.' },
  { name: 'list_active_sessions', title: 'List active sessions', readOnly: true, description: 'List active sessions, device locations and whether each session is familiar or suspicious.' },
  { name: 'request_sign_out_session', title: 'Request session sign-out', readOnly: false, description: 'Queue sign-out of a non-current session for explicit human approval.' },
  { name: 'get_pending_approvals', title: 'Inspect approval queue', readOnly: true, description: 'List destructive actions that are currently awaiting a human decision.' },
  { name: 'reject_pending_action', title: 'Reject pending action', readOnly: false, description: 'Cancel a queued destructive request. Approval itself is intentionally not exposed to agents.' },
  { name: 'undo_last_change', title: 'Undo last privacy change', readOnly: false, description: 'Restore the immediately previous privacy state snapshot.' },
];

let controller = null;

export function webMCPAvailable() {
  return Boolean(document.modelContext?.registerTool);
}

export async function registerWebMCP() {
  const ctx = document.modelContext;
  if (!ctx?.registerTool) return false;
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;

  const register = async ({ name, title, description, inputSchema, execute, annotations = {} }) => {
    await ctx.registerTool({ name, title, description, inputSchema, execute, annotations }, { signal });
  };

  const spec = (index, extras = {}) => ({
    name: TOOL_DOCS[index].name,
    title: TOOL_DOCS[index].title,
    description: TOOL_DOCS[index].description,
    annotations: { readOnlyHint: TOOL_DOCS[index].readOnly },
    ...extras,
  });

  await register({
    ...spec(0),
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => getStateSnapshot(),
  });
  await register({
    ...spec(1),
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => scoreState(),
  });
  await register({
    ...spec(2),
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => state.apps.filter(a => a.connected),
  });
  await register({
    ...spec(3),
    inputSchema: { type: 'object', properties: { appId: { type: 'string' } }, required: ['appId'], additionalProperties: false },
    execute: ({ appId }) => revokeApp(appId, 'agent'),
  });
  await register({
    ...spec(4),
    inputSchema: { type: 'object', properties: { enabled: { type: 'boolean' } }, required: ['enabled'], additionalProperties: false },
    execute: ({ enabled }) => setPersonalization(enabled, 'agent'),
  });
  await register({
    ...spec(5),
    inputSchema: { type: 'object', properties: { categoryId: { type: 'string' }, retention: { type: 'string', enum: ['indefinite','24 months','12 months','6 months','3 months','30 days'] } }, required: ['categoryId','retention'], additionalProperties: false },
    execute: ({ categoryId, retention }) => changeRetention(categoryId, retention, 'agent'),
  });
  await register({
    ...spec(6),
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => requestExport('agent'),
  });
  await register({
    ...spec(7),
    inputSchema: { type: 'object', properties: { categoryId: { type: 'string' } }, required: ['categoryId'], additionalProperties: false },
    execute: ({ categoryId }) => requestDeleteData(categoryId, 'agent'),
  });
  await register({
    ...spec(8),
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => state.sessions.filter(s => s.active),
  });
  await register({
    ...spec(9),
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'], additionalProperties: false },
    execute: ({ sessionId }) => requestSignOut(sessionId, 'agent'),
  });
  await register({
    ...spec(10),
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => state.pendingApprovals,
  });
  await register({
    ...spec(11),
    inputSchema: { type: 'object', properties: { approvalId: { type: 'string' } }, required: ['approvalId'], additionalProperties: false },
    execute: ({ approvalId }) => rejectPending(approvalId, 'agent'),
  });
  await register({
    ...spec(12),
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => undoLast('agent'),
  });

  let count = TOOL_DOCS.length;
  if (typeof ctx.getTools === 'function') {
    const tools = await ctx.getTools();
    const names = new Set(TOOL_DOCS.map(tool => tool.name));
    count = tools.filter(tool => names.has(tool.name)).length;
  }
  window.dispatchEvent(new CustomEvent('consentos:webmcp', { detail: { available: true, count } }));
  return { available: true, count };
}

export function unregisterWebMCP() {
  controller?.abort();
  controller = null;
}
