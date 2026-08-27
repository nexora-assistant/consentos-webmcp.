# ConsentOS — <3 minute demo script

## 0:00–0:20 — Problem
Show the initial dashboard at **54/100** with 8 risks.

Narration: “Privacy controls are spread across apps, tracking settings, retention policies, sessions, exports and deletion flows. Browser agents can try to click through them, but that is brittle — and giving an agent unrestricted destructive access is worse.”

## 0:20–0:40 — WebMCP leverage
Open **Agent tools** and briefly show the 13 registered tools.

Narration: “ConsentOS exposes typed WebMCP actions directly from the page. The agent can inspect state and make reversible changes without hunting through the interface.”

## 0:40–1:35 — One prompt, many tools
Use the prompt:

> Make this account as private as possible without breaking essential functionality. Disconnect unused apps, turn off ad personalization, shorten unnecessary retention, request a data export, and prepare destructive actions for my approval.

Show the agent:
- reading privacy state
- disabling personalization
- revoking stale non-essential apps
- shortening retention
- preparing a data export
- requesting deletion of location history
- requesting sign-out of the unfamiliar session

Keep the live activity rail visible as the score improves.

## 1:35–2:10 — Signature consent moment
Zoom to the approval cards.

Narration: “This is the key boundary. ConsentOS does not expose any WebMCP approval tool. The agent can propose deletion or session termination, but only the human can authorize it.”

Press **Approve** on the risky actions. Show the audit log record `source = human`.

## 2:10–2:35 — Outcome
Show **96/100** and 0 avoidable risks.

Narration: “The result is stronger agent automation without surrendering consent. Every action is visible, reversible where possible, and attributable.”

## 2:35–2:55 — Close
Show the 3D score instrument and activity timeline.

Narration: “ConsentOS turns privacy settings into an agent-native protocol: WebMCP for capability, human approval for authority.”
