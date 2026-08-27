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
  { name: 'get_privacy_state', readOnly: true, description: 'Read the full simulated privacy state including connected apps, data categories, sessions, privacy toggles, score and pending approvals.' },
  { name: 'get_privacy_score_details', readOnly: true, description: 'Explain the current privacy score and each factor that contributes to it.' },
  { name: 'list_connected_apps', readOnly: true, description: 'List linked apps, last-used times, scopes, whether each app is essential, and risk labels.' },
  { name: 'revoke_app_access', readOnly: false, description: 'Revoke a non-essential connected app immediately. Essential apps are blocked from revocation.' },
  { name: 'toggle_ad_personalization', readOnly: false, description: 'Enable or disable ad personalization and related targeting.' },
  { name: 'change_data_retention', readOnly: false, description: 'Change retention for a specific data category to a supported preset.' },
  { name: 'request_data_export', readOnly: false, description: 'Prepare a privacy export request and add it to the audit timeline.' },
  { name: 'request_delete_data_category', readOnly: false, description: 'Queue deletion of a data category. The human must approve it in the ConsentOS interface.' },
  { name: 'list_active_sessions', readOnly: true, description: 'List active sessions, device locations and whether each session is familiar or suspicious.' },
  { name: 'request_sign_out_session', readOnly: false, description: 'Queue sign-out of a non-current session for explicit human approval.' },
  { name: 'get_pending_approvals', readOnly: true, description: 'List destructive actions that are currently awaiting a human decision.' },
  { name: 'reject_pending_action', readOnly: false, description: 'Cancel a queued destructive request. Approval itself is intentionally not exposed to agents.' },
  { name: 'undo_last_change', readOnly: false, description: 'Restore the immediately previous privacy state snapshot.' },
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

  const register = async ({ name, description, inputSchema, execute, annotations = {} }) => {
    await ctx.registerTool({ name, description, inputSchema, execute, annotations }, { signal });
  };

  await register({
    name: 'get_privacy_state', description: TOOL_DOCS[0].description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true }, execute: () => getStateSnapshot(),
  });
  await register({
    name: 'get_privacy_score_details', description: TOOL_DOCS[1].description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true }, execute: () => scoreState(),
  });
  await register({
    name: 'list_connected_apps', description: TOOL_DOCS[2].description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true }, execute: () => state.apps.filter(a => a.connected),
  });
  await register({
    name: 'revoke_app_access', description: TOOL_DOCS[3].description,
    inputSchema: { type: 'object', properties: { appId: { type: 'string' } }, required: ['appId'], additionalProperties: false },
    execute: ({ appId }) => revokeApp(appId, 'agent'),
  });
  await register({
    name: 'toggle_ad_personalization', description: TOOL_DOCS[4].description,
    inputSchema: { type: 'object', properties: { enabled: { type: 'boolean' } }, required: ['enabled'], additionalProperties: false },
    execute: ({ enabled }) => setPersonalization(enabled, 'agent'),
  });
  await register({
    name: 'change_data_retention', description: TOOL_DOCS[5].description,
    inputSchema: { type: 'object', properties: { categoryId: { type: 'string' }, retention: { type: 'string', enum: ['indefinite','24 months','12 months','6 months','3 months','30 days'] } }, required: ['categoryId','retention'], additionalProperties: false },
    execute: ({ categoryId, retention }) => changeRetention(categoryId, retention, 'agent'),
  });
  await register({
    name: 'request_data_export', description: TOOL_DOCS[6].description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => requestExport('agent'),
  });
  await register({
    name: 'request_delete_data_category', description: TOOL_DOCS[7].description,
    inputSchema: { type: 'object', properties: { categoryId: { type: 'string' } }, required: ['categoryId'], additionalProperties: false },
    execute: ({ categoryId }) => requestDeleteData(categoryId, 'agent'),
  });
  await register({
    name: 'list_active_sessions', description: TOOL_DOCS[8].description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true }, execute: () => state.sessions.filter(s => s.active),
  });
  await register({
    name: 'request_sign_out_session', description: TOOL_DOCS[9].description,
    inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'], additionalProperties: false },
    execute: ({ sessionId }) => requestSignOut(sessionId, 'agent'),
  });
  await register({
    name: 'get_pending_approvals', description: TOOL_DOCS[10].description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true }, execute: () => state.pendingApprovals,
  });
  await register({
    name: 'reject_pending_action', description: TOOL_DOCS[11].description,
    inputSchema: { type: 'object', properties: { approvalId: { type: 'string' } }, required: ['approvalId'], additionalProperties: false },
    execute: ({ approvalId }) => rejectPending(approvalId, 'agent'),
  });
  await register({
    name: 'undo_last_change', description: TOOL_DOCS[12].description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => undoLast('agent'),
  });
  return true;
}

export function unregisterWebMCP() {
  controller?.abort();
  controller = null;
}
