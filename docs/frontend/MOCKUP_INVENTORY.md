# Mockup inventory → routes

Base path (nested folder in repo):

`stitch_quantum_oracle_prd_cybersecurity/stitch_quantum_oracle_prd_cybersecurity/<folder>/code.html`

**App:** `quantum-oracle-ui/` (Next.js App Router under `src/app/`).

Status values: `not started` | `wip` | `done` (update as you implement).

| Mockup folder | Purpose | Suggested route | Status |
|---------------|---------|-----------------|--------|
| `main_dashboard_oracle_pqc_overview_1` | Primary dashboard layout | `/` | done — `OracleDashboard` (stream, gauge, PQC cards, fulfillment, workspace) |
| `main_dashboard_oracle_pqc_overview_2` | Dashboard alternate | `/` | reference only |
| `quantum_oracle_navigation_flow` | Nav / IA reference | Shell | done — `AppShell` / `SideNav` + Oracle/PQC subnav |
| `oracle_request_randomness_config` | Oracle randomness request UI | `/oracle/request` or `/oracle/randomness` | done — `OracleRequestPage` |
| `pqc_key_generation_options` | PQC key generation options | `/pqc/keys` | done — `PqcKeyGenerationPage` |
| `pqc_suite_kyber_kem_flow` | Kyber KEM flow | `/pqc/kyber` or `/pqc/kem` | done — `KyberKemFlowPage` |
| `fulfillment_on_chain_request_wizard` | On-chain fulfillment wizard | `/fulfillment` | done — `FulfillmentWizard` + API hooks + status polling + retry |
| `fulfillment_wizard_v1` | Fulfillment wizard iteration | `/fulfillment` | merged into wizard |
| `fulfillment_wizard_v2` | Fulfillment wizard iteration | `/fulfillment` | merged into wizard |
| `fulfillment_wizard_v3` | Fulfillment wizard iteration | `/fulfillment` | merged into wizard |
| `api_reference_v1` | API reference layout | `/docs/api` | reference only |
| `api_reference_v2` | API reference layout | `/docs/api` | reference only |
| `api_reference_v3` | API reference layout | `/docs/api` | wip — split terminal layout (canonical v3) |
| `documentation_api_reference_integration` | Docs + integration narrative | `/docs` | wip — top bar + in-doc sidebar + TOC |

## Notes

- **Dashboard:** Choose either `main_dashboard_oracle_pqc_overview_1` or `_2` as the single source; archive the other as a variant reference.
- **API reference:** Three versions likely explore layout; pick one, document the decision in a PR or here.
- **Fulfillment:** Multiple wizard versions → one implementation path (state machine or nested routes), others reference-only.
- **Navigation flow:** Use to align sidebar labels (Oracle, PQC Suite, Fulfillment, Documentation, Settings) with real routes.
