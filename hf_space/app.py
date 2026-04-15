#!/usr/bin/env python3
"""
QCrypt RNG — Hugging Face Gradio lite demo (IBM Quantum Runtime).

Run from repository root so `app.*` imports resolve:

  cd /path/to/qcrypt-rng
  pip install -r hf_space/requirements.txt
  python hf_space/app.py

On Hugging Face Spaces, set the Space's main file to this script and the working
directory to the repository root, or duplicate this layout at the Space repo root.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import gradio as gr

# Repository root (parent of hf_space/)
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from app.quantum.ibm_runtime_core import (  # noqa: E402
    IBMRuntimeOperationError,
    connect_backends,
    run_bell_sampler_workflow,
    sdk_info_payload,
)


def _fmt(obj: object) -> str:
    try:
        return json.dumps(obj, indent=2, default=str)
    except Exception:
        return str(obj)


def check_sdk() -> str:
    try:
        return _fmt({"ok": True, **sdk_info_payload()})
    except Exception as e:
        return _fmt({"ok": False, "error": str(e)})


def do_connect(api_key: str, instance_crn: str) -> str:
    api_key = (api_key or "").strip()
    instance_crn = (instance_crn or "").strip()
    if len(api_key) < 8 or len(instance_crn) < 8:
        return _fmt({"error": "API key and instance CRN must each be at least 8 characters."})
    try:
        data = connect_backends(api_key, instance_crn)
        return _fmt({"ok": True, **data})
    except IBMRuntimeOperationError as e:
        return _fmt({"ok": False, "detail": e.detail, "status_code": e.status_code})
    except Exception as e:
        return _fmt({"ok": False, "error": str(e)})


def do_run(
    api_key: str,
    instance_crn: str,
    backend_name: str,
    prefer_simulator: bool,
    shots: int,
) -> str:
    api_key = (api_key or "").strip()
    instance_crn = (instance_crn or "").strip()
    backend_name = (backend_name or "").strip() or None
    if len(api_key) < 8 or len(instance_crn) < 8:
        return _fmt({"error": "API key and instance CRN must each be at least 8 characters."})
    try:
        if shots < 1:
            shots = 1
        if shots > 10_000:
            shots = 10_000
        data = run_bell_sampler_workflow(
            api_key,
            instance_crn,
            backend_name=backend_name,
            prefer_simulator=prefer_simulator,
            shots=int(shots),
        )
        return _fmt({"ok": True, **data})
    except IBMRuntimeOperationError as e:
        return _fmt({"ok": False, "detail": e.detail, "status_code": e.status_code})
    except Exception as e:
        return _fmt({"ok": False, "error": str(e)})


def main() -> None:
    with gr.Blocks(title="QCrypt RNG — IBM Runtime (lite)") as demo:
        gr.Markdown(
            """
# QCrypt RNG — IBM Quantum Runtime (lite)

Research-facing demo: **Bell circuit** on **IBM Runtime** with a verifiable **SHA-256 digest**
over job metadata and counts. Credentials are **not stored**—paste your IBM Cloud API key
and instance CRN per session.

The full product uses **Next.js** + **FastAPI**; this Space is a small **Gradio** slice.
"""
        )

        with gr.Tab("SDK"):
            gr.Markdown("Check that `qiskit-ibm-runtime` is installed in this environment.")
            sdk_out = gr.Code(label="SDK status", language="json")
            gr.Button("Check SDK").click(fn=check_sdk, outputs=sdk_out)

        with gr.Tab("Connect"):
            gr.Markdown("Validate credentials and list a sample of backends.")
            ak1 = gr.Textbox(label="IBM Cloud IAM API key", type="password")
            crn1 = gr.Textbox(label="Quantum service instance CRN", lines=2)
            conn_out = gr.Code(label="Response", language="json")
            gr.Button("Connect").click(
                fn=do_connect,
                inputs=[ak1, crn1],
                outputs=conn_out,
            )

        with gr.Tab("Run Bell circuit"):
            gr.Markdown(
                "Runs H → CX → measure on IBM Runtime (Sampler). "
                "Leave **backend** empty to use least-busy matching your filters."
            )
            ak2 = gr.Textbox(label="IBM Cloud IAM API key", type="password")
            crn2 = gr.Textbox(label="Quantum service instance CRN", lines=2)
            be = gr.Textbox(label="Backend name (optional)", placeholder="e.g. ibm_fez")
            ps = gr.Checkbox(label="Prefer simulator", value=True)
            sh = gr.Number(label="Shots", value=1024, minimum=1, maximum=10000, step=1)
            run_out = gr.Code(label="Response", language="json")
            gr.Button("Run on IBM Runtime").click(
                fn=do_run,
                inputs=[ak2, crn2, be, ps, sh],
                outputs=run_out,
            )

        gr.Markdown(
            """
---

**Docs:** see `docs/HF_GRADIO_LITE.md` and `docs/VENTURE.md` in the repository.
"""
        )

    port = int(os.environ.get("GRADIO_SERVER_PORT", "7860"))
    demo.launch(server_name="0.0.0.0", server_port=port)


if __name__ == "__main__":
    main()
