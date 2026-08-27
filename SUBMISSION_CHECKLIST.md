# ConsentOS — WebMCP Challenge submission checklist

## Completed

- [x] Public repository: https://github.com/nexora-assistant/consentos-webmcp
- [x] MIT license visible in repository
- [x] Human + agent collaboration is central to the product
- [x] 13 structured WebMCP tools
- [x] Current `document.modelContext.registerTool(...)` API
- [x] AbortSignal lifecycle cleanup
- [x] No WebMCP approval capability for destructive actions
- [x] Human-attributed approval and audit trail
- [x] Deterministic privacy score: 54/100 → 96/100
- [x] Automated state/scoring test
- [x] Automated WebMCP safety-boundary test
- [x] Responsive 3D/motion interface
- [x] Reduced-motion accessibility support
- [x] Vercel deployment configuration
- [x] Devpost submission draft
- [x] Under-3-minute demo script

## Remaining before submission

- [ ] Import this repository into Vercel and obtain the production URL
- [ ] Open the production site on mobile and desktop and inspect layout
- [ ] Test in a WebMCP-capable browser/environment
- [ ] Confirm all 13 tools are discoverable
- [ ] Run the judge prompt end-to-end
- [ ] Confirm the human approval boundary visibly works in the live demo
- [ ] Record a public YouTube demo under 3 minutes
- [ ] Add the live URL and YouTube URL to the Devpost submission
- [ ] Verify entrant eligibility with the challenge organizer before final submission
- [ ] Submit before the official deadline

## Judge prompt

> Make this account as private as possible without breaking essential functionality. Disconnect unused apps, turn off ad personalization, shorten unnecessary retention, request a data export, and prepare destructive actions for my approval.
