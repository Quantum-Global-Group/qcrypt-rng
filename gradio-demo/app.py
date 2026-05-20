"""QCrypt RNG — researcher-facing Gradio slice (T5 / M4).

Calls the FastAPI v2 API; does not embed quantum logic locally.
"""

from __future__ import annotations

import os

import gradio as gr

from api_client import (
    generate_bytes,
    get_api_base,
    health_check,
    protect_encrypt,
    vrf_full_chain,
)

METHODOLOGY_BLURB = """
**Randomize** — `POST /generate/bytes` samples quantum-backed entropy (see backend metadata in the response).

**Prove (VRF)** — commit → prove → reveal → verify implements the audit path described in the methodology doc.

**Protect** — symmetric encrypt demonstrates one Protect primitive; decrypt and file flows live in the full product.

Full narrative: [RNG methodology](https://github.com/Quantum-Global-Group/qcrypt-rng/blob/main/docs/RNG_METHODOLOGY.md) ·
[Protect API guide](https://github.com/Quantum-Global-Group/qcrypt-rng/blob/main/docs/PROTECT_API_GUIDE.md)
""".strip()

NOT_IN_DEMO = """
This Space is a **thin researcher slice**, not the Next.js dashboard.

| In demo | Not in demo |
|---------|-------------|
| Random bytes, VRF chain, text encrypt | Scenario wizards, blockchain UI, billing |
| Configurable API base URL | API key auth UI (production may require keys) |
| JSON/form calls to `/api/v2` | PQC KEM, file encrypt, oracle batch, full ops tabs |

Run the full stack locally: repo root `python run_api.py` + `quantum-oracle-ui` dev server.
""".strip()


def build_demo() -> gr.Blocks:
    api_base = get_api_base()

    with gr.Blocks(title="QCrypt RNG — Research Demo") as demo:
        gr.Markdown(
            "# QCrypt RNG — Research Demo\n"
            "Dependency-light Gradio front-end for a subset of **Randomize**, **Prove**, and **Protect** APIs."
        )
        gr.Markdown(f"**API base:** `{api_base}` — override with `QCRYPT_API_BASE_URL`.")

        with gr.Accordion("What this demo is / is not", open=False):
            gr.Markdown(NOT_IN_DEMO)
            gr.Markdown(METHODOLOGY_BLURB)

        with gr.Row():
            ping_btn = gr.Button("Check API health", variant="secondary")
            ping_out = gr.Textbox(label="Health", interactive=False)

        ping_btn.click(fn=health_check, outputs=ping_out)

        with gr.Tab("Randomize — bytes"):
            gr.Markdown(
                "Generate cryptographically secure random bytes. "
                "See the repo `docs/RNG_METHODOLOGY.md` for entropy sources and limits."
            )
            with gr.Row():
                byte_len = gr.Slider(1, 256, value=32, step=1, label="Length (bytes)")
                byte_fmt = gr.Dropdown(
                    choices=["hex", "base64", "array"],
                    value="hex",
                    label="Format",
                )
                qbits = gr.Slider(1, 16, value=8, step=1, label="Quantum bits")
            gen_btn = gr.Button("Generate bytes", variant="primary")
            gen_out = gr.Code(label="Response", language="json")

            gen_btn.click(
                fn=generate_bytes,
                inputs=[byte_len, byte_fmt, qbits],
                outputs=gen_out,
            )

        with gr.Tab("Prove — VRF audit trail"):
            gr.Markdown(
                "Run seed → prove → reveal → verify. "
                "Preferred audit path for lottery/committee scenarios."
            )
            alpha = gr.Textbox(
                label="Alpha (round ID / input)",
                value="demo-round-1",
                placeholder="e.g. lottery-round-42",
            )
            chain = gr.Textbox(
                label="Target chain (metadata only)",
                value="ethereum",
            )
            vrf_btn = gr.Button("Run VRF chain", variant="primary")
            vrf_out = gr.Code(label="VRF chain result", language="json")

            vrf_btn.click(fn=vrf_full_chain, inputs=[alpha, chain], outputs=vrf_out)

        with gr.Tab("Protect — encrypt"):
            gr.Markdown(
                "One-shot AES-256-GCM encrypt with a quantum-generated key. "
                "See `docs/PROTECT_API_GUIDE.md` in the main repo for decrypt and hash flows."
            )
            plain = gr.Textbox(
                label="Plaintext",
                value="research-demo-payload",
                lines=2,
            )
            enc_btn = gr.Button("Encrypt", variant="primary")
            enc_out = gr.Code(label="Encrypt response", language="json")

            enc_btn.click(fn=protect_encrypt, inputs=plain, outputs=enc_out)

    return demo


if __name__ == "__main__":
    port = int(os.environ.get("PORT", os.environ.get("GRADIO_SERVER_PORT", "7860")))
    build_demo().launch(server_name="0.0.0.0", server_port=port)
