# ConsentOS

**Human-in-the-loop privacy automation powered by WebMCP.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnexora-assistant%2Fconsentos-webmcp&repository-name=consentos-webmcp&project-name=consentos-webmcp)

ConsentOS is a WebMCP Challenge prototype for agent-managed privacy without agent-controlled consent. All account data in the demo is fictional and stored locally in the browser.

## Core idea

Privacy controls are fragmented across connected apps, personalization, retention, sessions, export workflows, and deletion dialogs. ConsentOS makes those controls agent-native with explicit WebMCP tools while keeping destructive authorization outside the agent's authority.

### Human approval boundary

1. The agent can call `request_delete_data_category` or `request_sign_out_session`.
2. ConsentOS creates a visible approval card and audit entry.
3. **There is no WebMCP approval tool.** Only a human can press Approve in the interface.
4. Human approval executes the destructive action and records who authorized it.
5. Rejections can be issued by either the human or the agent.

## WebMCP

ConsentOS uses the current Chrome imperative API:

```js
await document.modelContext.registerTool(tool, { signal: controller.signal });
```

It intentionally does not use deprecated `navigator.modelContext`. WebMCP is progressive enhancement: the privacy dashboard still works in ordinary browsers.

### Registered tools — 13

| Tool | Mode | Purpose |
|---|---|---|
| `get_privacy_state` | Read | Full account state and score |
| `get_privacy_score_details` | Read | Deterministic scoring factors |
| `list_connected_apps` | Read | Linked apps, scopes and risk |
| `revoke_app_access` | Write / reversible | Revoke non-essential app access |
| `toggle_ad_personalization` | Write / reversible | Reduce targeting |
| `change_data_retention` | Write / reversible | Shorten retention |
| `request_data_export` | Write | Prepare an export |
| `request_delete_data_category` | Write / gated | Queue deletion for human approval |
| `list_active_sessions` | Read | Active/familiar sessions |
| `request_sign_out_session` | Write / gated | Queue session sign-out |
| `get_pending_approvals` | Read | Inspect approval queue |
| `reject_pending_action` | Write | Cancel a queued action |
| `undo_last_change` | Write | Restore previous state |

## Deterministic privacy score

The seeded account begins at **54/100 with 8 avoidable risks**. A complete privacy-hardening flow reaches **96/100 with 0 avoidable risks**. ConsentOS intentionally never claims perfect privacy.

## 3D + motion design

- holographic score instrument with orbiting rings
- animated ambient light fields and grid
- glassmorphism surfaces with layered depth
- pointer-driven 3D card tilt on desktop
- animated score transitions and toasts
- responsive mobile layout
- `prefers-reduced-motion` support

The visual system uses CSS transforms/gradients and lightweight pointer logic, keeping the WebMCP demo fast and easy to inspect.

## Suggested judge prompt

> Make this account as private as possible without breaking essential functionality. Disconnect unused apps, turn off ad personalization, shorten unnecessary retention, request a data export, and prepare destructive actions for my approval.

Ideal demo flow: **agent inspects → reversible changes happen → risky actions become approval cards → human approves → score and audit trail update visibly.**

## Files

- `index.html` — app shell
- `styles.css` — 3D/motion visual system
- `src/state.js` — deterministic state, scoring, undo and approval enforcement
- `src/webmcp.js` — all 13 WebMCP tools and AbortSignal lifecycle
- `src/ui.js` — responsive UI, interactions and 3D tilt
- `src/main.js` — startup lifecycle

## Local run

No build step is required:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`. WebMCP functionality requires an environment that exposes `document.modelContext`.

## Limitations

ConsentOS is a safe hackathon simulation. It does not touch real accounts, third-party services, sessions, or personal data. A production version would require authenticated APIs, server-side authorization, secure approval enforcement, and formal privacy/security review.
