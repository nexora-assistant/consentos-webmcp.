# ConsentOS — Devpost draft

## Tagline
Agent-managed privacy without agent-controlled consent.

## Public source
https://github.com/nexora-assistant/consentos-webmcp

## Live demo
To be added after the Vercel production deployment.

## Inspiration
Privacy settings are fragmented across connected apps, tracking controls, retention policies, active sessions, exports and deletion workflows. That is frustrating for humans and brittle for visual browser agents. We wanted to explore a more agent-native model without solving usability by giving an agent unlimited authority.

## What it does
ConsentOS is a simulated privacy control center that exposes 13 structured WebMCP tools. An agent can inspect privacy posture, disable personalization, revoke stale non-essential apps, shorten retention, prepare exports, and queue sensitive operations. Destructive actions such as deleting location history or signing out a session are deliberately separated from agent authority: the agent can request them, but only a human can approve them in the interface.

The dashboard has a deterministic privacy score that starts at 54/100 with 8 avoidable risks and can reach 96/100 with 0 avoidable risks through specific state changes. Every action appears in a live activity rail and audit history.

## How we used WebMCP
ConsentOS uses the current imperative API through `document.modelContext.registerTool(...)`. The tools cover read-only state discovery, reversible mutations, sensitive-action requests, approval-queue inspection, rejection and undo. Tool lifecycle cleanup uses `AbortSignal`.

The key design choice is what is **not** a tool: approval. There is intentionally no agent-callable approval action. Human consent remains a separate authority boundary in the UI.

## Challenges
The main design challenge was balancing automation and authority. It is easy to make an agent powerful by exposing more actions; it is harder to make the boundary understandable and testable. We also calibrated the privacy score so the demo is deterministic rather than a decorative random number.

## Accomplishments
- 13 WebMCP tools
- no agent-accessible approval capability
- deterministic 54 → 96 privacy-hardening flow
- human-attributed audit log
- local persistence and undo
- responsive 3D/motion interface
- progressive enhancement when WebMCP is unavailable
- automated tests for scoring and the tool boundary

## What we learned
Agent-native websites benefit from explicit typed actions, but consequential actions need a separate authorization model. WebMCP is useful not only as a way to make agents more capable, but as a way to make capability boundaries explicit.

## What's next
A production ConsentOS would connect to authenticated privacy APIs from real services, enforce approvals server-side, support policy templates, cryptographically signed audit records, and scoped organization controls.
