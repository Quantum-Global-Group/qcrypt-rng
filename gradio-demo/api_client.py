"""Thin HTTP client for the QCrypt FastAPI v2 surface (Gradio demo only)."""

from __future__ import annotations

import json
import os
from typing import Any

import httpx

DEFAULT_API_BASE = "http://localhost:8000/api/v2"
API_PREFIX = "/api/v2"


def normalize_api_base(url: str) -> str:
    base = url.strip().rstrip("/")
    if base.endswith(API_PREFIX):
        return base
    return f"{base}{API_PREFIX}"


def get_api_base() -> str:
    return normalize_api_base(os.environ.get("QCRYPT_API_BASE_URL", DEFAULT_API_BASE))


def _request_error(exc: Exception) -> str:
    if isinstance(exc, httpx.ConnectError):
        return (
            f"Could not reach the API at {get_api_base()}. "
            "Start it with `python run_api.py` from the repo root, "
            "or set QCRYPT_API_BASE_URL."
        )
    if isinstance(exc, httpx.HTTPStatusError):
        detail = exc.response.text
        try:
            payload = exc.response.json()
            detail = payload.get("detail", detail)
        except json.JSONDecodeError:
            pass
        return f"API error {exc.response.status_code}: {detail}"
    return str(exc)



def _post_json(path: str, payload: dict[str, Any] | None = None, timeout: float = 60.0) -> dict[str, Any]:
    url = f"{get_api_base()}{path}"
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, json=payload or {})
            response.raise_for_status()
            return response.json()
    except Exception as exc:
        raise RuntimeError(_request_error(exc)) from exc


def _post_form(path: str, data: dict[str, str], timeout: float = 60.0) -> dict[str, Any]:
    url = f"{get_api_base()}{path}"
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, data=data)
            response.raise_for_status()
            return response.json()
    except Exception as exc:
        raise RuntimeError(_request_error(exc)) from exc


def health_check() -> str:
    base = get_api_base().removesuffix(API_PREFIX)
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{base}/health")
            if response.status_code == 200:
                return f"OK — API reachable at {get_api_base()}"
            return f"API responded with HTTP {response.status_code} at {base}/health"
    except Exception as exc:
        return _request_error(exc)


def generate_bytes(length: int, output_format: str, quantum_bits: int) -> str:
    body = _post_json(
        "/generate/bytes",
        {
            "length": length,
            "format": output_format,
            "quantum_bits": quantum_bits,
        },
    )
    data = body.get("data", {})
    metadata = body.get("metadata", {})
    return json.dumps(
        {
            "request_id": body.get("request_id"),
            "bytes": data.get("bytes"),
            "format": data.get("format"),
            "length": data.get("length"),
            "entropy_bits": data.get("entropy_bits"),
            "quantum_backend": metadata.get("quantum_backend"),
            "generation_time_ms": metadata.get("generation_time_ms"),
        },
        indent=2,
    )


def vrf_full_chain(alpha: str, target_chain: str) -> str:
    seed_body = _post_json(
        "/oracle/vrf/seed",
        {"target_chain": target_chain or None},
    )
    seed_data = seed_body.get("data", {})
    request_id = seed_data["request_id"]
    commitment = seed_data["commitment"]

    prove_body = _post_json(
        "/oracle/vrf/prove",
        {"request_id": request_id, "alpha": alpha},
    )
    prove_data = prove_body.get("data", {})

    reveal_body = _post_json(
        "/oracle/vrf/reveal",
        {"request_id": request_id},
    )
    reveal_data = reveal_body.get("data", {})

    verify_body = _post_json(
        "/oracle/vrf/verify",
        {
            "commitment": commitment,
            "alpha": alpha,
            "output": prove_data["output"],
            "seed": reveal_data["seed"],
        },
    )
    verify_data = verify_body.get("data", {})

    return json.dumps(
        {
            "request_id": request_id,
            "alpha": alpha,
            "commitment": commitment,
            "output": prove_data.get("output"),
            "seed_revealed": reveal_data.get("seed"),
            "verify": verify_data,
            "note": "VRF store is in-memory on the API — state is lost on API restart.",
        },
        indent=2,
    )


def protect_encrypt(plaintext: str) -> str:
    body = _post_form(
        "/protect/encrypt",
        {
            "data": plaintext,
            "use_quantum_key": "true",
            "algorithm": "AES-256-GCM",
        },
    )
    data = body.get("data", {})
    safe = {
        "request_id": body.get("request_id"),
        "algorithm": data.get("algorithm"),
        "quantum_enhanced": data.get("quantum_enhanced"),
        "ciphertext_preview": (data.get("ciphertext") or "")[:48] + "…",
        "fields_for_decrypt": ["ciphertext", "key", "iv", "tag", "algorithm"],
        "full_ciphertext": data.get("ciphertext"),
        "key": data.get("key"),
        "iv": data.get("iv"),
        "tag": data.get("tag"),
    }
    return json.dumps(safe, indent=2)
