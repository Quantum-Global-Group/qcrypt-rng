# Screen spec template

Copy this file per screen (e.g. `SCREEN_DASHBOARD.md`) or fill one section below before implementing a route.

## Metadata

- **Screen name:**
- **Route:** `quantum-oracle-ui/src/app/...`
- **Primary mockup:** `stitch_quantum_oracle_prd_cybersecurity/.../code.html`
- **Owner / status:**

## Layout

- [ ] Uses `AppShell` + `SideNav` (or documented exception)
- [ ] `html` has `class="dark"` (via root layout)
- [ ] Regions: sidebar / header / main / footer (describe)

## Tokens & typography

- [ ] Surfaces follow tier rules (no-line sectioning where possible)
- [ ] Inter for UI copy; JetBrains Mono for technical strings
- [ ] Label style for metadata (uppercase, tracking per design system)

## Components

List components from [COMPONENT_MAP.md](./COMPONENT_MAP.md) used on this screen:

| Component | Notes |
|-----------|--------|
| | |

## Data & API

- **Endpoints:** (e.g. from `src/utils/api.ts`)
- **Types:** (`src/types/index.ts` entries)
- **Loading state:**
- **Empty state:**
- **Error state:**

## Behavior

- **User actions:** (buttons, navigation)
- **Validation:** (if forms)

## Acceptance

- [ ] Visual parity with mockup (spacing, hierarchy, density)
- [ ] Keyboard focus visible (ghost/primary borders)
- [ ] Responsive behavior defined (mockups are desktop-first; note breakpoints if adapted)

## Out of scope

- Items explicitly deferred for later phases
