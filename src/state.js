const STORAGE_KEY = 'consentos_state_v3';
const HISTORY_KEY = 'consentos_history_v3';

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function initialState() {
  return {
    profileName: 'Avery Jordan',
    toggles: { adPersonalization: true, preciseAds: true, searchPersonalization: true },
    apps: [
      { id: 'app_mail', name: 'MailBridge', essential: true, lastUsedDays: 2, scopes: ['email', 'calendar'], risk: 'low', connected: true },
      { id: 'app_shop', name: 'FlashCart', essential: false, lastUsedDays: 164, scopes: ['purchase history', 'profile'], risk: 'high', connected: true },
      { id: 'app_fit', name: 'StrideFit', essential: false, lastUsedDays: 71, scopes: ['health', 'location'], risk: 'high', connected: true },
      { id: 'app_music', name: 'PulseMusic', essential: false, lastUsedDays: 30, scopes: ['profile'], risk: 'medium', connected: true },
      { id: 'app_storage', name: 'VaultDrive', essential: true, lastUsedDays: 5, scopes: ['files'], risk: 'low', connected: true },
      { id: 'app_food', name: 'QuickBite', essential: false, lastUsedDays: 194, scopes: ['location', 'payment token'], risk: 'high', connected: true },
      { id: 'app_social', name: 'CircleConnect', essential: false, lastUsedDays: 49, scopes: ['contacts', 'ads profile'], risk: 'medium', connected: true },
    ],
    dataCategories: [
      { id: 'data_location', name: 'Location history', retention: 'indefinite', sensitivity: 'high', exportable: true, deleted: false },
      { id: 'data_voice', name: 'Voice recordings', retention: '24 months', sensitivity: 'high', exportable: true, deleted: false },
      { id: 'data_search', name: 'Search history', retention: '12 months', sensitivity: 'medium', exportable: true, deleted: false },
      { id: 'data_ads', name: 'Ad profile', retention: 'indefinite', sensitivity: 'high', exportable: true, deleted: false },
      { id: 'data_payments', name: 'Payment activity', retention: '7 years', sensitivity: 'high', exportable: true, deleted: false },
      { id: 'data_photos', name: 'Photos metadata', retention: '12 months', sensitivity: 'medium', exportable: true, deleted: false },
      { id: 'data_diagnostics', name: 'Diagnostics', retention: '6 months', sensitivity: 'low', exportable: true, deleted: false },
      { id: 'data_contacts', name: 'Contacts sync', retention: 'indefinite', sensitivity: 'medium', exportable: true, deleted: false },
      { id: 'data_devices', name: 'Known devices', retention: '18 months', sensitivity: 'low', exportable: true, deleted: false },
    ],
    sessions: [
      { id: 'sess_current', device: 'Chrome on Redmi Note 12', location: 'Aurangabad, India', current: true, familiar: true, active: true },
      { id: 'sess_laptop', device: 'Windows laptop', location: 'Aurangabad, India', current: false, familiar: true, active: true },
      { id: 'sess_tablet', device: 'Android tablet', location: 'Pune, India', current: false, familiar: true, active: true },
      { id: 'sess_unknown', device: 'Unknown browser session', location: 'Singapore', current: false, familiar: false, active: true },
    ],
    pendingApprovals: [],
    exportRequestedAt: null,
    activity: [{ id: uid('act'), source: 'system', title: 'ConsentOS ready', detail: 'Privacy state loaded. 8 avoidable risks detected.', at: Date.now() - 60000 }],
    audit: [{ id: uid('aud'), source: 'system', title: 'ConsentOS initialized', detail: 'Initial simulated account state restored.', at: Date.now() - 60000 }],
  };
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export let state = load(STORAGE_KEY, initialState());
export let history = load(HISTORY_KEY, []);

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40)));
  } catch {}
}

function emit() {
  persist();
  window.dispatchEvent(new CustomEvent('consentos:change'));
}

function snapshot() {
  history.push(JSON.parse(JSON.stringify(state)));
  history = history.slice(-40);
}

function addActivity(source, title, detail) {
  const entry = { id: uid('act'), source, title, detail, at: Date.now() };
  state.activity.unshift(entry);
  state.audit.unshift({ ...entry, id: uid('aud') });
}

export function scoreState(s = state) {
  let score = 96;
  const factors = [];

  if (s.toggles.adPersonalization || s.toggles.preciseAds) {
    score -= 12;
    factors.push({ label: 'Personalized advertising enabled', impact: -12 });
  }
  if (s.toggles.searchPersonalization) {
    score -= 4;
    factors.push({ label: 'Search personalization enabled', impact: -4 });
  }

  const riskyApps = s.apps.filter(a => a.connected && !a.essential && a.lastUsedDays > 45);
  if (riskyApps.length) {
    const impact = riskyApps.length * 3;
    score -= impact;
    factors.push({ label: `${riskyApps.length} stale third-party app${riskyApps.length > 1 ? 's' : ''} still connected`, impact: -impact });
  }

  const suspicious = s.sessions.filter(sess => sess.active && !sess.familiar);
  if (suspicious.length) {
    const impact = suspicious.length * 8;
    score -= impact;
    factors.push({ label: `${suspicious.length} unfamiliar active session${suspicious.length > 1 ? 's' : ''}`, impact: -impact });
  }

  const retentionPenalties = {
    data_location: { indefinite: 2 },
    data_ads: { indefinite: 2 },
    data_contacts: { indefinite: 1 },
    data_voice: { '24 months': 1 },
  };
  for (const cat of s.dataCategories.filter(c => !c.deleted)) {
    const penalty = retentionPenalties[cat.id]?.[cat.retention] ?? 0;
    if (penalty > 0) {
      score -= penalty;
      factors.push({ label: `${cat.name} retained for ${cat.retention}`, impact: -penalty });
    }
  }

  score = Math.max(0, Math.min(96, score));
  return { score, factors, riskCount: factors.length };
}

export function getStateSnapshot() {
  const scored = scoreState();
  return JSON.parse(JSON.stringify({ ...state, score: scored.score, scoreDetails: scored.factors }));
}

export function resetDemo(source = 'human') {
  state = initialState();
  history = [];
  addActivity(source, 'Reset demo', 'ConsentOS restored the original simulated privacy account.');
  emit();
}

export function mutate(source, title, detail, fn) {
  snapshot();
  fn(state);
  addActivity(source, title, detail);
  emit();
}

export function revokeApp(appId, source = 'agent') {
  const app = state.apps.find(a => a.id === appId);
  if (!app) return { ok: false, error: 'App not found' };
  if (!app.connected) return { ok: false, error: 'App is already revoked' };
  if (app.essential) return { ok: false, error: 'Essential apps cannot be revoked in this demo.' };
  mutate(source, `Revoked ${app.name}`, `${source === 'agent' ? 'Agent' : 'Human'} revoked access for ${app.name}.`, s => {
    s.apps.find(a => a.id === appId).connected = false;
  });
  return { ok: true, state: getStateSnapshot() };
}

export function setPersonalization(enabled, source = 'agent') {
  mutate(source, enabled ? 'Enabled ad personalization' : 'Disabled ad personalization', `${source === 'agent' ? 'Agent' : 'Human'} ${enabled ? 'enabled' : 'disabled'} account targeting controls.`, s => {
    s.toggles.adPersonalization = Boolean(enabled);
    s.toggles.preciseAds = Boolean(enabled);
    if (!enabled) s.toggles.searchPersonalization = false;
  });
  return { ok: true, state: getStateSnapshot() };
}

export function changeRetention(categoryId, retention, source = 'agent') {
  const cat = state.dataCategories.find(c => c.id === categoryId && !c.deleted);
  if (!cat) return { ok: false, error: 'Category not found' };
  const allowed = ['indefinite', '24 months', '12 months', '6 months', '3 months', '30 days'];
  if (!allowed.includes(retention)) return { ok: false, error: `Unsupported retention preset. Use: ${allowed.join(', ')}` };
  mutate(source, `Changed retention for ${cat.name}`, `${source === 'agent' ? 'Agent' : 'Human'} changed retention for ${cat.name} to ${retention}.`, s => {
    s.dataCategories.find(c => c.id === categoryId).retention = retention;
  });
  return { ok: true, state: getStateSnapshot() };
}

export function requestExport(source = 'agent') {
  mutate(source, 'Prepared data export', `${source === 'agent' ? 'Agent' : 'Human'} prepared a privacy export package.`, s => {
    s.exportRequestedAt = Date.now();
  });
  return { ok: true, state: getStateSnapshot() };
}

export function queueApproval({ kind, targetId, title, detail }, source = 'agent') {
  if (state.pendingApprovals.some(a => a.kind === kind && a.targetId === targetId)) {
    return { ok: false, error: 'That action is already waiting for human approval.' };
  }
  mutate(source, `Queued approval: ${title}`, detail, s => {
    s.pendingApprovals.unshift({ kind, targetId, title, detail, id: uid('approve') });
  });
  return { ok: true, state: getStateSnapshot() };
}

export function requestDeleteData(categoryId, source = 'agent') {
  const cat = state.dataCategories.find(c => c.id === categoryId && !c.deleted);
  if (!cat) return { ok: false, error: 'Category not found' };
  return queueApproval({ kind: 'delete_data', targetId: categoryId, title: `Delete ${cat.name}`, detail: `${cat.name} will be deleted only after a human approves the request.` }, source);
}

export function requestSignOut(sessionId, source = 'agent') {
  const sess = state.sessions.find(s => s.id === sessionId);
  if (!sess || !sess.active) return { ok: false, error: 'Session not found or already signed out' };
  if (sess.current) return { ok: false, error: 'Current session cannot be queued for sign-out.' };
  return queueApproval({ kind: 'sign_out_session', targetId: sessionId, title: `Sign out ${sess.device}`, detail: `${sess.device} from ${sess.location} will be signed out only after human approval.` }, source);
}

export function approvePending(approvalId) {
  const item = state.pendingApprovals.find(a => a.id === approvalId);
  if (!item) return { ok: false, error: 'Approval not found' };
  snapshot();
  state.pendingApprovals = state.pendingApprovals.filter(a => a.id !== approvalId);
  if (item.kind === 'delete_data') {
    const cat = state.dataCategories.find(c => c.id === item.targetId);
    if (cat) cat.deleted = true;
  }
  if (item.kind === 'sign_out_session') {
    const sess = state.sessions.find(s => s.id === item.targetId);
    if (sess) sess.active = false;
  }
  addActivity('human', `Approved: ${item.title}`, 'Human approved and executed the pending destructive action.');
  emit();
  return { ok: true, state: getStateSnapshot() };
}

export function rejectPending(approvalId, source = 'human') {
  const item = state.pendingApprovals.find(a => a.id === approvalId);
  if (!item) return { ok: false, error: 'Approval not found' };
  mutate(source, `Rejected: ${item.title}`, `${source === 'agent' ? 'Agent' : 'Human'} rejected the pending action.`, s => {
    s.pendingApprovals = s.pendingApprovals.filter(a => a.id !== approvalId);
  });
  return { ok: true, state: getStateSnapshot() };
}

export function undoLast(source = 'agent') {
  const previous = history.pop();
  if (!previous) return { ok: false, error: 'Nothing to undo' };
  state = previous;
  addActivity(source, 'Undid last change', `${source === 'agent' ? 'Agent' : 'Human'} restored the previous privacy state.`);
  emit();
  return { ok: true, state: getStateSnapshot() };
}
