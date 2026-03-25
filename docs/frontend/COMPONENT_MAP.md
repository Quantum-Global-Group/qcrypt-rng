# Component map (mockup → React)

Extract reusable pieces from the Stitch `code.html` files into `quantum-oracle-ui/src/components/` (exact filenames are suggestions).

## Layout shell

| Piece | Description | Source mockups |
|-------|-------------|----------------|
| `AppShell` | Full-height layout: optional fixed sidebar + main scroll area | `main_dashboard_oracle_pqc_overview_*` |
| `SideNav` | NODE/session header, nav links, settings footer | Dashboard, `quantum_oracle_navigation_flow` |
| `MainHeader` | Page title row, actions, breadcrumbs if any | Dashboard, API docs |

## Oracle & metrics

| Piece | Description | Source mockups |
|-------|-------------|----------------|
| `MetricCard` | Label + large value + optional delta / status | Dashboard |
| `StatusChip` | Subtle-fill accent (verified / simulated / degraded) | DESIGN.md §5 + dashboard |
| `SessionNode` | Small node indicator (e.g. `NODE_01`, active session) | Dashboard sidebar |

## Data display

| Piece | Description | Source mockups |
|-------|-------------|----------------|
| `DataTable` | No dividers; row hover surface; monospace column for technical fields | Dashboard, API reference |
| `CodeBlock` / `MonoField` | JetBrains Mono for hashes, keys, JSON | API reference, docs |
| `EndpointRow` | Method badge + path + short description | `api_reference_*` |

## Forms & flows

| Piece | Description | Source mockups |
|-------|-------------|----------------|
| `LabeledInput` | Label above, ghost border, focus primary | DESIGN.md |
| `WizardFrame` | Step indicator + content + prev/next | `fulfillment_wizard_*`, `fulfillment_on_chain_request_wizard` |
| `WizardStep` | Single step content wrapper | Same |

## Docs

| Piece | Description | Source mockups |
|-------|-------------|----------------|
| `DocsLayout` | Side nav for doc sections + content | `documentation_api_reference_integration` |
| `ApiReferenceLayout` | Sidebar groups + main reference column | `api_reference_*` |

## Shared utilities

| Piece | Description |
|-------|-------------|
| `cn()` helper | Merge Tailwind classes (e.g. `clsx` + `tailwind-merge`) for variants |
| Icon wrapper | Consistent size (e.g. 18px) for Material Symbols or replacement set |

---

**Rule:** Build the shell and tokens first; then add page-specific sections as compositions of these primitives rather than copying whole HTML pages into one component.
