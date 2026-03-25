# Cursor / agent operator prompt (QCrypt RNG)

Paste or reference this when starting a coding session in this repository. It orients assistants on stack, commands, tools, and workflow.

You are working in the **qcrypt-rng** repo (FastAPI backend + Next.js `quantum-oracle-ui` + Hardhat `quantum-oracle/contracts`). Prefer evidence from the codebase over guesses.

### Operating principles

- **Phases:** understand → plan → smallest vertical slice → validate (tests/build) → summarize.
- **Scope:** change only what the task requires; match existing patterns (imports at top, project conventions).
- **Verification:** before claiming success, run the relevant checks and report command output.

### Repo commands (adjust paths if needed)

- **Backend:** `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python run_api.py` — API at http://localhost:8000, docs at /docs.
- **Alt start:** `make run` → `python scripts/start.py`.
- **Tests:** `make test` / `pytest`.
- **Frontend:** `cd quantum-oracle-ui && npm install && npm run dev` — default UI port **3040** (`find-port.js`, not 3000); optional `NEXT_PUBLIC_API_BASE_URL`.
- **Contracts:** `cd quantum-oracle/contracts && npm install` (Hardhat).
- **Docker:** `docker-compose up -d` (see compose file for DB/Redis/API key flags).

**Gotcha:** run Node/npm for the dashboard from `quantum-oracle-ui/`, not `quantum-oracle/` (no root `package.json` there).

### Cursor / Composer tools (conceptual)

- **Explore:** search/read files, grep, semantic codebase search, read lints.
- **Terminal:** run shell commands in the workspace (build, test, dev servers).
- **Edits:** apply patches; keep diffs focused.

### Subagents (Task tool) — when to use which

- **explore:** fast map of structure, “where is X?”, multi-file discovery.
- **generalPurpose:** multi-step research + implementation across the repo.
- **shell:** git operations, scripted terminal workflows.
- **code-reviewer:** after a substantial change, compare to intent and standards.
- **ci-watcher:** watch CI for the branch, summarize failures.
- **best-of-n-runner:** isolated git worktrees for parallel attempts.
- **etoro-trading-assistant / API Readiness Analyzer:** only if the task explicitly touches those domains.

### Skills — how to use them

When a task matches a skill’s description, **read the skill file first** and follow it (path is given in the environment’s available_skills list). Examples of categories you may have installed:

- **Cursor / workflow:** create-rule, create-skill, update-cursor-settings; check-compiler-errors, deslop, fix-ci, fix-merge-conflicts, get-pr-comments, loop-on-ci, new-branch-and-pr, review-and-ship, run-smoke-tests, weekly-review, what-did-i-get-done.
- **Planning / execution:** brainstorming (before creative work), writing-plans, executing-plans, subagent-driven-development, systematic-debugging, test-driven-development, verification-before-completion, finishing-a-development-branch, using-git-worktrees.
- **Cloudflare:** cloudflare, wrangler, workers-best-practices, durable-objects, Agents SDK / building-ai-agent-on-cloudflare, building-mcp-server-on-cloudflare, web-perf, sandbox-sdk.
- **Data / infra:** supabase-postgres-best-practices, redis-development skill, langfuse, hf-* skills, tavily-* / firecrawl (if installed — follow each skill’s rules for web tasks).
- **Security / APIs:** mcp-builder, mcp-security-audit, secure-dependency-health-check, postman-routing / agent-ready-apis.
- **Other:** etoro-apps (eToro only), plugin-builder, etc.

If unsure whether a skill applies, **open its SKILL.md** and follow the “when to use” section.

### MCP

If the user has MCP servers configured, **read the tool schema** before calling a tool; use MCP for external systems (CI, Hub, etc.) when it reduces error and repetition.

### Default task template

1. Restate the task in one sentence; state in/out of scope.
2. Name files to touch and a short plan.
3. Implement the smallest coherent change.
4. Run validation commands; paste relevant output.
5. Summarize what changed, what’s left, follow-ups.
