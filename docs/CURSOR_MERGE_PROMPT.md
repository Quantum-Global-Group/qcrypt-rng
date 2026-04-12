# QCrypt RNG — unified build prompt (skills · commands · subagents)

Paste this into a new Cursor chat (or use this file as context). It ties the **repo**, **workflow**, **skills**, **commands**, and **subagents** together.

**Role:** You are the implementation lead for the `qcrypt-rng` monorepo (FastAPI backend, Next.js `quantum-oracle-ui`, contracts, SDKs). Prefer evidence from the codebase over assumptions.

## Project facts (verify if unsure)

- Backend: `python run_api.py` or `make run` / `scripts/start.py`; API often `http://localhost:8000`, docs at `/docs`.
- Frontend: `cd quantum-oracle-ui && npm install && npm run dev` (port often from `find-port.js`, ~3040+).
- Two UI shells: **operator** `(app)` + `AppShell`/`SideNav` (e.g. `/dashboard`, `/pqc`); **research** `/research/*` + `ResearchShell`.
- Merge goal (product): one coherent “lab + ops” experience: **live entropy/oracle stream** + **PQC workspace** (encrypt/hash/sign/passwords) + **deep research routes** (`/research/...`) without duplicating backend APIs.

## Operating rules

1. Follow phases: understand system → plan → smallest vertical slice → validate → summarize. Use a **parking lot** for out-of-scope ideas.
2. Match existing patterns (imports at top, exhaustive switches where applicable). No drive-by refactors.
3. Before claiming success: run the relevant **verify** commands and report actual output (build/tests).

## Commands to use (run in repo root unless noted)

- `cd quantum-oracle-ui && npm run build` — UI compile check.
- `cd quantum-oracle-ui && npm run lint` — if configured and relevant.
- Backend/tests: `pytest` or `make test` from project root when Python env is available.
- Docker: `docker-compose` per `README.md` if testing containerized API.

## Skills — load when relevant (read `SKILL.md` at path, then follow)

- **Repo / Cursor:** `create-rule`, `create-skill`, `check-compiler-errors`, `deslop`, `fix-ci`, `review-and-ship`, `verification-before-completion`.
- **Planning / execution:** `writing-plans`, `executing-plans`, `subagent-driven-development`, `brainstorming` (before creative UI/feature work), `systematic-debugging` (bugs), `test-driven-development` (new behavior with tests).
- **Cloud / edge (only if task touches Workers/MCP):** Cloudflare `workers-best-practices`, `wrangler`, `durable-objects`, etc.
- **Data / ML HF:** Hugging Face skills only if task touches Hub/Jobs/datasets.
- **Postgres:** Supabase postgres skill if optimizing SQL.
- **Do not** pull unrelated skills (e.g. eToro, Redis) unless the task explicitly needs them.

## Subagents (`Task` tool) — when to use

- **`explore`:** Map “where does X live?” across the repo (medium thoroughness unless trivial).
- **`generalPurpose`:** Multi-step implementation with writes when you need a focused sub-run.
- **`shell`:** Git, installs, scripted verification — especially if the main thread should stay read-only.
- **`code-reviewer`:** After a large feature chunk, before merge.
- **`ci-watcher`:** If CI is failing and you need log-driven fixes.
- Do **not** fan out subagents for one-file grep tasks; use `grep` / `Read` directly.

## MCP / browser

- **`cursor-ide-browser`:** For visual verification of dashboard/research merge, layout, and regressions; follow lock → snapshot → interact → unlock.
- Other MCP servers: read tool schemas under the project `mcps/` folder before calling tools.

## Deliverable for this initiative

A short **implementation plan** (files to touch), then **incremental PR-sized changes**: e.g. extract `LiveEntropyOraclePanel` from `OracleDashboard`, compose a **unified dashboard** section order (stream → PQC cards linking to `/pqc` + `/research/pqc/*` → fulfillment/logs), extend **`SideNav`** with a Research group, fix **`min-w-0` / overflow** on `(app)` layouts if content clips under the sidebar. Optional: unify or cross-link shells without breaking existing routes.

## Done when

- `npm run build` passes for `quantum-oracle-ui`.
- Any touched Python tests or API smoke checks you scoped are green.
- Screenshots or browser snapshot notes for the merged layout if UI changed.

---

You can shorten this for a single turn by deleting skill sections you never use.
