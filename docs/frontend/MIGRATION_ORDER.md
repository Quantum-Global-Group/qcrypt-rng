# Migration order: mockups → `quantum-oracle-ui`

Follow this order to avoid rework: **tokens and layout first**, then screens that reuse them.

## Phase 0 — Constraints

1. **Tailwind:** Use **build-time** Tailwind in Next.js. Do **not** rely on `cdn.tailwindcss.com` from mockups in production.
2. **Dark mode:** Mockups assume dark UI; set `class="dark"` on `<html>` in `src/app/layout.tsx` (or equivalent).
3. **Fonts:** Load **Inter** and **JetBrains Mono** (e.g. `next/font/google`) and wire `fontFamily` in Tailwind per [FRONTEND_DESIGN_SYSTEM.md](./FRONTEND_DESIGN_SYSTEM.md).
4. **Single app:** Treat `quantum-oracle-ui` as the only product UI; retire or redirect duplicate frontends once feature parity exists.

## Phase 1 — Design tokens

1. Extend `quantum-oracle-ui/tailwind.config.ts` with the full color map and font/radius extensions from [FRONTEND_DESIGN_SYSTEM.md](./FRONTEND_DESIGN_SYSTEM.md).
2. Set global `body` background and text defaults in `src/app/globals.css` to match tokens (`background` / `on-surface`).
3. Add Material Symbols (or chosen icon library) in root layout if matching mockup icons exactly.

## Phase 2 — Application shell

1. Implement `AppShell` + `SideNav` from `main_dashboard_oracle_pqc_overview_1` or `_2` (pick canonical).
2. Align nav items with [MOCKUP_INVENTORY.md](./MOCKUP_INVENTORY.md) routes; use placeholders where backend is not ready.
3. Reference `quantum_oracle_navigation_flow` only for IA consistency.

## Phase 3 — Primary dashboard

1. Build dashboard main content: metric cards, tables, status regions per chosen dashboard mockup.
2. Connect to live or mock API via existing `src/utils/api.ts` patterns.

## Phase 4 — Documentation & API reference

1. Implement `/docs` from `documentation_api_reference_integration`.
2. Implement `/docs/api` from one of `api_reference_v1`–`v3` (choose canonical; document in MOCKUP_INVENTORY).

## Phase 5 — Feature flows

1. **Oracle:** `oracle_request_randomness_config` → dedicated route under `/oracle/...`.
2. **PQC:** `pqc_key_generation_options`, `pqc_suite_kyber_kem_flow` → `/pqc/...`.
3. **Fulfillment:** Consolidate `fulfillment_*` mockups into one wizard UX (steps as state or nested routes).

## Phase 6 — Cleanup

1. Mark [MOCKUP_INVENTORY.md](./MOCKUP_INVENTORY.md) statuses `done` per route.
2. Remove dead components and duplicate experiments from earlier UIs.
3. Optional: add visual regression or Storybook for shell + key components.

## Checklist before marking “done” on a phase

- [ ] Tokens match hex table (spot-check in DevTools).
- [ ] No accidental 1px section borders unless spec’d as ghost border.
- [ ] Monospace only on technical fields.
- [ ] New screen has a filled copy of [SCREEN_SPEC_TEMPLATE.md](./SCREEN_SPEC_TEMPLATE.md) (or equivalent inline PR description).
