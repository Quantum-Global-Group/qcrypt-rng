# Product owners (RACI-lite)

**Purpose:** Clear ownership of backlog **themes**, escalation, **decision rights**, and **interfaces** to engineering and design. Roles are titles, not named individuals.

For theme definitions see [`BUILD_SCOPE.md`](./BUILD_SCOPE.md). For timing see [`MILESTONES.md`](./MILESTONES.md) and [`SPRINTS.md`](./SPRINTS.md).

---

## PO roster (logical roles)

| Role | Mission | Owns themes (from BUILD_SCOPE) |
|------|---------|--------------------------------|
| **Platform/API PO** | One primary product stack, fast reliable APIs, developer experience | T1, T2 (with Security/Trust), T5 (API contract for demo) |
| **UX/Scenario PO** | Integrated Prove/Protect/Randomize flows, flagship scenarios, analyst-grade UI | T4, M3 outcomes, Gradio UX (subset) |
| **Security/Trust PO** | Trust narrative, RNG methodology, safe defaults, cryptographic accuracy of product | T2 (security slice), T3, review of T4/T6 crypto claims |
| **GTM/Docs PO** | External readability, launch docs, Protect-gap documentation, Space README | T6, M4 packaging, cross-doc consistency |

---

## RACI-lite by work type

Legend: **R** = Responsible (does/drives), **A** = Accountable (decides), **C** = Consulted, **I** = Informed.

| Work type | A | R | C | I |
|-----------|---|---|---|---|
| Primary UI path (Next vs legacy Streamlit) | Platform/API PO | Eng lead | UX/Scenario PO, GTM/Docs PO | Security/Trust PO |
| API shape / versioning / breaking changes | Platform/API PO | Backend eng | Security/Trust PO, UX/Scenario PO | GTM/Docs PO |
| Security defaults & key handling | Security/Trust PO | Backend + security champ | Platform/API PO | GTM/Docs PO |
| Scenario copy & flow structure | UX/Scenario PO | Design + frontend eng | Security/Trust PO, Platform/API PO | GTM/Docs PO |
| RNG trust / transparency narrative | Security/Trust PO | Tech writer / eng | Platform/API PO, GTM/Docs PO | UX/Scenario PO |
| Public docs & launch messaging | GTM/Docs PO | Tech writer | UX/Scenario PO, Security/Trust PO | Platform/API PO |
| Gradio scope & researcher positioning | GTM/Docs PO | ML/demo eng | UX/Scenario PO, Platform/API PO | Security/Trust PO |

*If a single person holds multiple hats, document which **hat** they wear per decision to avoid ambiguous accountability.*

---

## Decision rights (non-exhaustive)

| Decision | Owner | Notes |
|----------|-------|-------|
| Deprecate or remove Streamlit from compose | Platform/API PO | A; consult UX for any interim dual-run |
| Merge PR that weakens auth defaults | Security/Trust PO | Veto or required remediation |
| Ship a flagship scenario with weak audit story | Security/Trust PO + UX/Scenario PO | Joint: narrative must be honest |
| Docs that claim cryptographic properties | Security/Trust PO | A for technical accuracy |
| Sprint goal trade-offs (scope vs date) | Milestone PO ([`MILESTONES.md`](./MILESTONES.md)) | Escalate to product steering if cross-milestone |

---

## Escalation paths

1. **Within sprint:** Eng ↔ owning PO daily; blockers in standup or async channel.
2. **Cross-PO conflict (e.g. API vs UX):** Milestone PO for current phase mediates; document outcome in sprint retro notes.
3. **Security / trust dispute:** Security/Trust PO escalates to steering with written risk summary; release can be held pending resolution.

---

## Interfaces to engineering and design

| Role | To engineering | To design |
|------|----------------|-----------|
| Platform/API PO | Prioritized API/backlog, acceptance on contracts & perf | N/A (unless design-system tokens affect API pagination, etc.) |
| UX/Scenario PO | Written scenarios, acceptance on flows & a11y basics | Journeys, wireframes priority, UX copy deck |
| Security/Trust PO | Threat assumptions, review checkpoints for crypto/features | Warnings, disclosures, error states |
| GTM/Docs PO | Example requests, doc builds, changelog | Marketing pages alignment |

---

## Backlog theme → default PO (quick reference)

| Theme | Default A |
|-------|-----------|
| T1 Unified platform | Platform/API PO |
| T2 API hardening | Platform/API PO (+ Security/Trust for defaults) |
| T3 Trust & RNG | Security/Trust PO |
| T4 Scenario UX | UX/Scenario PO |
| T5 Gradio | GTM/Docs PO (A), UX/Scenario PO (R for UX) |
| T6 Docs gaps | GTM/Docs PO |
