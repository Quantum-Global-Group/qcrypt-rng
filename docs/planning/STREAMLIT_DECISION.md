# Streamlit decision (M1 / T1)

**Purpose:** Record the program stance on `dashboard.py` and Streamlit relative to the **single Next.js shell** and the **separate Hugging Face Gradio** researcher slice ([`BUILD_SCOPE.md`](./BUILD_SCOPE.md), [`MILESTONES.md`](./MILESTONES.md) M1).

---

## Evidence (repo)

- **Product dashboard:** [`quantum-oracle-ui`](../README.md) (Next.js) is described as the primary web surface in root [`README.md`](../../README.md) and [`BUILD_SCOPE.md`](./BUILD_SCOPE.md).
- **Streamlit app:** [`dashboard.py`](../../dashboard.py) exists; [`commands.md`](../../commands.md) documents local `streamlit run` usage.
- **Dependencies:** `streamlit` is **not** listed in [`requirements.txt`](../../requirements.txt). The root [`Dockerfile`](../../Dockerfile) builds **Nginx + FastAPI + Next.js** for Hugging Face Spaces on port **7860** (see header comment and `EXPOSE 7860`) — no Streamlit install step.
- **Docker Compose (prior state):** A `dashboard` service ran `streamlit run dashboard.py` using the same image as `api`, which does not install Streamlit — the service was **not runnable** as committed.

---

## Decision (2026-05, Platform/API track)

**Stance: Lab-only legacy UI — not the product path, not in default Compose, not in the Spaces image.**

| Surface | Role |
|--------|------|
| **Next.js (`quantum-oracle-ui`)** | Primary operator/research shell; all new UX and scenarios. |
| **Gradio (planned Space, T5)** | Dependency-light **external** demo; subset of flows — not a dashboard clone. |
| **Streamlit (`dashboard.py`)** | **Optional local/lab** experimentation only; **no new features**; not supported as a deployment target alongside the primary stack. |

**Rationale:** Matches [`BUILD_SCOPE.md`](./BUILD_SCOPE.md) north star (one mental model, fence alternate UIs) and dual surface (full product vs Gradio). Keeping Streamlit out of the default Compose file and out of the production/Spaces Dockerfile avoids a second, drifting UX path and avoids bloating the HF image with an unused stack. Removing the broken Compose service makes **`docker-compose up`** honest for the API + data stores.

---

## Options considered (for audit trail)

| Option | Pros | Cons |
|--------|------|------|
| **Deprecate + remove artifacts** | Single codebase story | Loses a quick local scratch UI until Gradio/Next cover those flows; larger M1 deletion. |
| **Lab-only (chosen)** | Preserves `dashboard.py` for ad-hoc use without endorsing it in production paths | Requires discipline: no product commitments on Streamlit. |
| **Keep in Compose** | One-command local dual UI | Needs a **dedicated** image or `requirements` split; previous default was broken; conflicts with Spaces image minimalism. |

---

## Open question (Platform / API PO)

If teams still want **containerized** Streamlit for internal labs, should we add an **optional** `docker-compose.streamlit.yml` (or Compose **profile**) that installs Streamlit in a **small, dedicated** image — rather than folding Streamlit into the root `requirements.txt` / Spaces `Dockerfile`? **Recommend:** yes, if demand appears; **default** remains API + Next only.

---

## Related

- [`BUILD_SCOPE.md`](./BUILD_SCOPE.md) — T1 Streamlit vs Next, T5 Gradio.
- [`SPRINTS.md`](./SPRINTS.md) — S1–S2 alignment and CI baseline.
- Root [`README.md`](../../README.md), [`PRODUCTION.md`](../../PRODUCTION.md) — primary path wording.
