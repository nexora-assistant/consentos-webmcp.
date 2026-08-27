import {
  state,
  history,
  scoreState,
  resetDemo,
  revokeApp,
  setPersonalization,
  changeRetention,
  requestExport,
  requestDeleteData,
  requestSignOut,
  approvePending,
  rejectPending,
  undoLast,
} from './state.js';
import { TOOL_DOCS, webMCPAvailable } from './webmcp.js';

let currentTab = 'overview';
let webMCPStatus = { available: webMCPAvailable(), count: null };

const els = {
  webmcpStatus: document.getElementById('webmcpStatus'), scoreValue: document.getElementById('scoreValue'), riskCount: document.getElementById('riskCount'), scoreArc: document.getElementById('scoreArc'),
  appsMetric: document.getElementById('appsMetric'), appsMetricNote: document.getElementById('appsMetricNote'), sessionsMetric: document.getElementById('sessionsMetric'), sessionsMetricNote: document.getElementById('sessionsMetricNote'),
  dataMetric: document.getElementById('dataMetric'), dataMetricNote: document.getElementById('dataMetricNote'), heroSummary: document.getElementById('heroSummary'), exposureMap: document.getElementById('exposureMap'),
  postureLabel: document.getElementById('postureLabel'), workspace: document.getElementById('workspace'), activityList: document.getElementById('activityList'), approvalSheet: document.getElementById('approvalSheet'),
  approvalBadge: document.getElementById('approvalBadge'), toolsDialog: document.getElementById('toolsDialog'), toolsList: document.getElementById('toolsList'), scoreDialog: document.getElementById('scoreDialog'), scoreFactors: document.getElementById('scoreFactors'), toastRegion: document.getElementById('toastRegion'),
};

export function initUI() {
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
    currentTab = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === btn));
    renderWorkspace();
  }));
  document.getElementById('toolsButton').addEventListener('click', () => els.toolsDialog.showModal());
  document.getElementById('scoreButton').addEventListener('click', () => els.scoreDialog.showModal());
  document.getElementById('resetButton').addEventListener('click', () => {
    if (!confirm('Reset the ConsentOS demo to the original state?')) return;
    resetDemo('human'); toast('Demo reset', 'ConsentOS returned to the original simulated privacy state.');
  });
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => document.getElementById(btn.dataset.close).close()));
  window.addEventListener('consentos:change', renderAll);
  window.addEventListener('consentos:webmcp', event => {
    webMCPStatus = { available: Boolean(event.detail?.available), count: Number.isInteger(event.detail?.count) ? event.detail.count : null };
    renderStatus();
  });
  injectScoreGradient();
  renderAll();
}

function renderAll() {
  renderStatus(); renderScore(); renderMetrics(); renderExposure(); renderWorkspace(); renderActivity(); renderApprovals(); renderTools(); renderScoreFactors(); attachTilts();
}

function renderStatus() {
  const supported = webMCPStatus.available;
  els.webmcpStatus.classList.toggle('ok', supported);
  const suffix = supported && webMCPStatus.count !== null ? ` · ${webMCPStatus.count} tools` : '';
  els.webmcpStatus.innerHTML = `<span class="status-dot"></span>${supported ? `WebMCP connected${suffix}` : 'WebMCP unavailable in this browser'}`;
}

function renderScore() {
  const summary = scoreState();
  els.scoreValue.textContent = String(summary.score); els.riskCount.textContent = String(summary.riskCount);
  const circumference = 364.42;
  els.scoreArc.style.strokeDashoffset = String(circumference - (circumference * summary.score) / 100);
  const apps = state.apps.filter(a => a.connected && !a.essential && a.lastUsedDays > 45).length;
  const sessions = state.sessions.filter(s => s.active && !s.familiar).length;
  const approvals = state.pendingApprovals.length;
  els.heroSummary.textContent = `ConsentOS exposes structured privacy actions to your agent while keeping destructive decisions under human control. ${apps} stale app${apps===1?'':'s'}, ${sessions} suspicious session${sessions===1?'':'s'} and ${approvals} queued approval${approvals===1?'':'s'} currently need attention.`;
}

function renderMetrics() {
  const connectedApps = state.apps.filter(a => a.connected), flaggedApps = connectedApps.filter(a => !a.essential && a.lastUsedDays > 45).length;
  const sessions = state.sessions.filter(s => s.active), unknown = sessions.filter(s => !s.familiar).length;
  const data = state.dataCategories.filter(d => !d.deleted), sensitive = data.filter(d => d.sensitivity === 'high').length;
  els.appsMetric.textContent = connectedApps.length; els.appsMetricNote.textContent = `${flaggedApps} need review`;
  els.sessionsMetric.textContent = sessions.length; els.sessionsMetricNote.textContent = `${unknown} unfamiliar`;
  els.dataMetric.textContent = data.length; els.dataMetricNote.textContent = `${sensitive} high sensitivity`;
}

function renderExposure() {
  const summary = scoreState();
  const staleApps = state.apps.filter(a => a.connected && !a.essential && a.lastUsedDays > 45).length;
  const highRetention = state.dataCategories.filter(c => !c.deleted && c.retention === 'indefinite').length;
  const suspicious = state.sessions.filter(s => s.active && !s.familiar).length;
  const approvals = state.pendingApprovals.length;
  els.postureLabel.textContent = summary.score >= 90 ? 'Strong posture' : summary.score >= 75 ? 'Improving' : 'Needs attention';
  const cards = [
    ['Profile targeting', state.toggles.adPersonalization ? 'ON' : 'OFF', state.toggles.adPersonalization ? 'Ad systems can personalize based on your activity.' : 'Ad targeting has been reduced for this account.', state.toggles.adPersonalization ? 'med' : 'low'],
    ['Stale app access', staleApps, staleApps ? 'Old third-party connections still retain scopes.' : 'No stale third-party connections remain.', staleApps ? 'high' : 'low'],
    ['Long-lived data', highRetention, highRetention ? 'Sensitive categories still kept indefinitely.' : 'No sensitive category is kept indefinitely.', highRetention ? 'high' : 'low'],
    ['Pending approvals', approvals, approvals ? 'Destructive actions are waiting for human confirmation.' : 'No destructive action is waiting in the queue.', approvals ? 'med' : 'low'],
    ['Suspicious sessions', suspicious, suspicious ? 'A session from an unfamiliar location is still active.' : 'All active sessions look familiar.', suspicious ? 'high' : 'low'],
    ['Export readiness', state.exportRequestedAt ? 'READY' : 'IDLE', state.exportRequestedAt ? 'A data export request has already been prepared.' : 'No export request has been prepared yet.', state.exportRequestedAt ? 'low' : 'med'],
    ['Human control', approvals ? 'ACTIVE' : 'STANDBY', 'ConsentOS keeps risky actions behind explicit approval.', 'low'],
    ['Score momentum', `${summary.score}/96`, 'The score updates deterministically after every state change.', summary.score >= 90 ? 'low' : summary.score >= 75 ? 'med' : 'high'],
  ];
  els.exposureMap.innerHTML = cards.map(([title,value,desc,tone]) => `<article class="exposure-card tilt risk-glow-${tone}"><h3>${escapeHtml(title)}</h3><strong>${escapeHtml(String(value))}</strong><p>${escapeHtml(desc)}</p></article>`).join('');
}

function renderWorkspace() {
  const renderers = { overview: renderOverview, apps: renderApps, data: renderData, sessions: renderSessions, approvals: renderApprovalsTab, audit: renderAudit };
  els.workspace.innerHTML = renderers[currentTab](); bindWorkspaceActions();
}

function renderOverview() {
  const summary = scoreState();
  const staleApps = state.apps.filter(a => a.connected && !a.essential && a.lastUsedDays > 45).length;
  const suspicious = state.sessions.filter(s => s.active && !s.familiar).length;
  return `<section class="overview-grid">
    <article class="overview-card tilt"><p class="eyebrow">AUTOMATION OUTCOME</p><strong>From 54 to 96 with human consent</strong><p>ConsentOS lets an agent inspect the account, reduce tracking, revoke stale apps, shorten retention, queue destructive requests, and leave the risky final decision to the human.</p><div class="mini-grid"><div class="mini-stat"><span>Current score</span><strong>${summary.score}</strong></div><div class="mini-stat"><span>Stale apps</span><strong>${staleApps}</strong></div><div class="mini-stat"><span>Suspicious sessions</span><strong>${suspicious}</strong></div></div></article>
    <article class="overview-card tilt"><p class="eyebrow">SUGGESTED DEMO FLOW</p><strong>One prompt, many safe tool calls</strong><p>“Make my account private, disconnect unused apps, disable ad personalization, reduce long retention, prepare a data export, and queue destructive actions for my approval.”</p><div class="kv"><span>• Read state first</span><span>• Perform reversible edits</span><span>• Queue destructive actions</span><span>• Wait for human approval</span></div></article>
    <article class="overview-card tilt authority-card"><p class="eyebrow">AUTHORITY BOUNDARY</p><strong>Automation without surrendering consent</strong><p>The tool surface is intentionally asymmetric: the agent can prepare consequential work, but the final destructive authorization stays human-only.</p><div class="authority-grid"><div class="authority-panel agent-zone"><span>AGENT CAN</span><b>Inspect · revoke stale apps · shorten retention · prepare export · request deletion</b></div><div class="authority-panel human-zone"><span>HUMAN ONLY</span><b>Approve data deletion · approve session termination</b></div></div></article>
    <article class="overview-card tilt"><p class="eyebrow">INSTANT ACTIONS</p><strong>Quick hardening</strong><div class="list-actions" style="margin-top:14px"><button class="button small" data-action="toggle-ads-off">Disable ads</button><button class="button small" data-action="queue-location-delete">Queue location deletion</button><button class="button small" data-action="queue-signout-unknown">Queue unknown sign-out</button><button class="button small" data-action="export-data">Prepare export</button><button class="button small" data-action="undo">Undo last change</button></div></article>
  </section>`;
}

function renderApps() {
  return state.apps.map(app => `<article class="list-card tilt"><div class="list-row"><div><strong>${escapeHtml(app.name)}</strong><p>${app.essential ? 'Essential integration' : 'Third-party integration'} · scopes: ${escapeHtml(app.scopes.join(', '))}</p><div class="kv"><span>Last used: ${app.lastUsedDays} days ago</span><span>Connected: ${app.connected ? 'Yes' : 'No'}</span><span><span class="risk-pill ${app.risk}">${app.risk} risk</span></span></div></div><div class="list-actions"><button class="button small ${app.connected ? '' : 'button-ghost'}" data-action="revoke-app" data-id="${app.id}" ${!app.connected ? 'disabled' : ''}>${app.connected ? 'Revoke access' : 'Revoked'}</button></div></div></article>`).join('');
}

function renderData() {
  const options = ['indefinite','24 months','12 months','6 months','3 months','30 days'];
  return state.dataCategories.map(cat => `<article class="list-card tilt"><div class="list-row"><div><strong>${escapeHtml(cat.name)}</strong><p>${cat.deleted ? 'Deleted from this simulated account.' : `Retention: ${cat.retention} · sensitivity: ${cat.sensitivity}`}</p><div class="kv"><span>Exportable: ${cat.exportable ? 'Yes' : 'No'}</span><span>Status: ${cat.deleted ? 'Deleted' : 'Active'}</span></div></div><div class="list-actions"><select data-action="change-retention" data-id="${cat.id}" ${cat.deleted ? 'disabled' : ''}>${options.map(opt => `<option ${opt===cat.retention?'selected':''}>${opt}</option>`).join('')}</select><button class="button small warn" data-action="queue-delete-data" data-id="${cat.id}" ${cat.deleted ? 'disabled' : ''}>Queue deletion</button></div></div></article>`).join('');
}

function renderSessions() {
  return state.sessions.map(sess => `<article class="list-card tilt"><div class="list-row"><div><strong>${escapeHtml(sess.device)}</strong><p>${escapeHtml(sess.location)}${sess.current ? ' · Current session' : ''}</p><div class="kv"><span>Status: ${sess.active ? 'Active' : 'Signed out'}</span><span><span class="risk-pill ${sess.familiar ? 'low' : 'high'}">${sess.familiar ? 'familiar' : 'suspicious'}</span></span></div></div><div class="list-actions"><button class="button small ${sess.familiar ? 'warn' : 'bad'}" data-action="queue-signout-session" data-id="${sess.id}" ${(!sess.active || sess.current) ? 'disabled' : ''}>${sess.current ? 'Current session' : sess.active ? 'Queue sign-out' : 'Signed out'}</button></div></div></article>`).join('');
}

function approvalCard(item) {
  return `<article class="approval-card"><p class="eyebrow">HUMAN APPROVAL REQUIRED</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p><div class="approval-actions"><button class="button button-primary small" data-action="approve" data-id="${item.id}">Approve</button><button class="button button-ghost small" data-action="reject" data-id="${item.id}">Reject</button></div></article>`;
}
function renderApprovalsTab() { return state.pendingApprovals.length ? state.pendingApprovals.map(approvalCard).join('') : `<div class="approval-empty">No destructive actions are waiting for human approval.</div>`; }
function renderAudit() { return state.audit.map(item => `<article class="audit-item"><div class="audit-meta"><span class="pill-source ${item.source}">${item.source}</span><span>${formatTime(item.at)}</span></div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></article>`).join(''); }
function renderActivity() { els.activityList.innerHTML = state.activity.map(item => `<article class="activity-item"><div class="activity-meta"><span class="pill-source ${item.source}">${item.source}</span><span>${formatTime(item.at)}</span></div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></article>`).join(''); }
function renderApprovals() { const count = state.pendingApprovals.length; els.approvalBadge.textContent = count; els.approvalBadge.classList.toggle('hidden', !count); els.approvalSheet.innerHTML = count ? state.pendingApprovals.map(approvalCard).join('') : '<div class="approval-empty">No actions awaiting human approval.</div>'; }
function renderTools() { els.toolsList.innerHTML = TOOL_DOCS.map(tool => `<article class="tool-item"><header><code>${escapeHtml(tool.name)}</code><span class="risk-pill ${tool.readOnly ? 'low' : 'medium'}">${tool.readOnly ? 'read only' : 'mutation'}</span></header><p>${escapeHtml(tool.description)}</p></article>`).join(''); }
function renderScoreFactors() { const details = scoreState(); els.scoreFactors.innerHTML = details.factors.map(f => `<article class="score-factor"><strong>${escapeHtml(f.label)}</strong><p>${f.impact} points</p></article>`).join('') + `<article class="score-factor"><strong>Final privacy score</strong><p>${details.score}/96</p></article>`; }

function bindWorkspaceActions() {
  document.querySelectorAll('[data-action]').forEach(el => {
    const type = el.dataset.action;
    if (el.tagName === 'SELECT') el.addEventListener('change', () => handleAction(type, el.dataset.id, el.value));
    else el.addEventListener('click', () => handleAction(type, el.dataset.id));
  });
}

function handleAction(type, id, value) {
  let result;
  if (type === 'toggle-ads-off') result = setPersonalization(false, 'human');
  if (type === 'export-data') result = requestExport('human');
  if (type === 'queue-location-delete') result = requestDeleteData('data_location', 'human');
  if (type === 'queue-signout-unknown') result = requestSignOut('sess_unknown', 'human');
  if (type === 'undo') result = undoLast('human');
  if (type === 'revoke-app') result = revokeApp(id, 'human');
  if (type === 'change-retention') result = changeRetention(id, value, 'human');
  if (type === 'queue-delete-data') result = requestDeleteData(id, 'human');
  if (type === 'queue-signout-session') result = requestSignOut(id, 'human');
  if (type === 'approve') { result = approvePending(id); if (result.ok) toast('Approved', 'The human-approved destructive action was executed.'); }
  if (type === 'reject') result = rejectPending(id, 'human');
  if (result && !result.ok) toast('Action blocked', result.error);
}

function toast(title, detail) {
  const box = document.createElement('div'); box.className = 'toast'; box.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p>`; els.toastRegion.prepend(box); setTimeout(() => box.remove(), 3200);
}
function attachTilts() {
  if (window.innerWidth < 900 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.tilt').forEach(card => {
    if (card.dataset.tiltBound) return; card.dataset.tiltBound = '1';
    card.addEventListener('pointermove', e => { const rect = card.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width - .5; const y = (e.clientY - rect.top) / rect.height - .5; card.style.transform = `perspective(900px) rotateX(${(-y*7).toFixed(2)}deg) rotateY(${(x*9).toFixed(2)}deg) translateY(-2px)`; });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}
function injectScoreGradient() {
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); defs.setAttribute('width','0'); defs.setAttribute('height','0'); defs.style.position='absolute'; defs.innerHTML='<defs><linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#55f2ff"/><stop offset="55%" stop-color="#7b80ff"/><stop offset="100%" stop-color="#6df5bc"/></linearGradient></defs>'; document.body.prepend(defs);
}
function formatTime(at) { return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function escapeHtml(value) { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
