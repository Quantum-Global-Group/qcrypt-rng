"""
Shared IBM Quantum Runtime logic (IBM Cloud API key + instance CRN).

Used by FastAPI (`app.api.v2.endpoints.ibm_runtime`) and the Hugging Face Gradio demo
(`hf_space/app.py`). Credentials are in-memory only for each call.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class IBMRuntimeOperationError(Exception):
    """Maps to HTTP errors in the API; shown as user-visible text in Gradio."""

    def __init__(self, detail: str, status_code: int = 400) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def sdk_available() -> Tuple[bool, Optional[str]]:
    try:
        import qiskit_ibm_runtime  # noqa: F401

        from importlib.metadata import version

        v = version("qiskit-ibm-runtime")
        return True, v
    except Exception:
        return False, None


def sdk_info_payload() -> Dict[str, Any]:
    ok, ver = sdk_available()
    return {
        "sdk_installed": ok,
        "qiskit_ibm_runtime_version": ver,
    }


def proof_digest(payload: Dict[str, Any]) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def connect_backends(api_key: str, instance: str) -> Dict[str, Any]:
    """
    Validate IBM Cloud credentials and return a short sample of accessible backends.
    """
    if not sdk_available()[0]:
        raise IBMRuntimeOperationError(
            "IBM Runtime SDK not installed. Install with: pip install qiskit qiskit-ibm-runtime",
            status_code=503,
        )

    from qiskit_ibm_runtime import QiskitRuntimeService

    try:
        service = QiskitRuntimeService(
            channel="ibm_cloud",
            token=api_key,
            instance=instance,
        )
    except Exception as e:
        logger.warning("IBM Runtime connect failed: %s", e, exc_info=True)
        raise IBMRuntimeOperationError(f"Could not open service: {e!s}", status_code=401) from e

    try:
        backends = service.backends()
        sample: List[Dict[str, Any]] = []
        for b in list(backends)[:24]:
            try:
                cfg = b.configuration()
                sample.append(
                    {
                        "name": b.name,
                        "n_qubits": getattr(cfg, "n_qubits", None),
                        "simulator": getattr(cfg, "simulator", None),
                    }
                )
            except Exception:
                sample.append({"name": getattr(b, "name", "?")})
    except Exception as e:
        logger.warning("IBM Runtime backends listing failed: %s", e, exc_info=True)
        raise IBMRuntimeOperationError(f"Backends listing failed: {e!s}", status_code=502) from e

    return {
        "channel": "ibm_cloud",
        "backend_count": len(backends),
        "backends_sample": sample,
    }


def run_bell_sampler_workflow(
    api_key: str,
    instance: str,
    *,
    backend_name: Optional[str] = None,
    prefer_simulator: bool = True,
    shots: int = 1024,
) -> Dict[str, Any]:
    """
    Run a minimal Bell-state workflow on IBM Runtime (Sampler) and return counts + proof digest.
    """
    if not sdk_available()[0]:
        raise IBMRuntimeOperationError(
            "IBM Runtime SDK not installed. Install with: pip install qiskit qiskit-ibm-runtime",
            status_code=503,
        )

    from qiskit import QuantumCircuit
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler

    try:
        service = QiskitRuntimeService(
            channel="ibm_cloud",
            token=api_key,
            instance=instance,
        )
    except Exception as e:
        logger.warning("IBM Runtime run: service open failed: %s", e, exc_info=True)
        raise IBMRuntimeOperationError(f"Could not open service: {e!s}", status_code=401) from e

    if backend_name:
        try:
            backend = service.backend(backend_name)
        except Exception as e:
            raise IBMRuntimeOperationError(f"Unknown backend: {e!s}", status_code=400) from e
    else:
        try:
            backend = service.least_busy(
                operational=True,
                simulator=prefer_simulator,
                min_num_qubits=2,
            )
        except Exception as e:
            raise IBMRuntimeOperationError(
                f"No suitable backend (try prefer_simulator or set backend_name): {e!s}",
                status_code=503,
            ) from e

    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0, 1)
    qc.measure_all()

    try:
        pm = generate_preset_pass_manager(optimization_level=1, target=backend.target)
        isa = pm.run(qc)
    except Exception as e:
        logger.warning("Transpile failed: %s", e, exc_info=True)
        raise IBMRuntimeOperationError(f"Transpile failed: {e!s}", status_code=500) from e

    sampler = Sampler(mode=backend)
    try:
        runtime_job = sampler.run([isa], shots=shots)
        job_id = runtime_job.job_id()
        primitive_result = runtime_job.result()
        pub_result = primitive_result[0]
    except Exception as e:
        logger.warning("Sampler run failed: %s", e, exc_info=True)
        raise IBMRuntimeOperationError(f"Runtime execution failed: {e!s}", status_code=502) from e

    counts: Dict[str, Any] = {}
    try:
        meas = pub_result.data.meas
        if hasattr(meas, "get_counts"):
            counts = {str(k): int(v) for k, v in meas.get_counts().items()}
        else:
            arr = getattr(meas, "array", meas)
            import numpy as np

            flat = np.asarray(arr).ravel()
            for bit in flat:
                key = str(int(bit))
                counts[key] = counts.get(key, 0) + 1
    except Exception as e:
        logger.warning("Could not normalize counts: %s", e, exc_info=True)
        counts = {"_parse_error": str(e), "raw": repr(pub_result.data)}

    inst_fp = hashlib.sha256(instance.encode("utf-8")).hexdigest()
    proof_payload = {
        "job_id": job_id,
        "backend": backend.name,
        "instance_sha256": inst_fp,
        "shots": shots,
        "counts": counts,
        "circuit": "bell_hadamard_cnot_measure_all",
    }
    digest = proof_digest(proof_payload)

    return {
        "workflow": "bell_sampler_v1",
        "job_id": job_id,
        "backend": backend.name,
        "channel": "ibm_cloud",
        "shots": shots,
        "counts": counts,
        "instance_fingerprint_sha256": inst_fp,
        "proof": {
            "algorithm": "SHA-256",
            "digest_hex": digest,
            "signed_fields": list(proof_payload.keys()),
            "note": "Digest binds job id, backend, hashed instance CRN, shots, and measurement counts.",
        },
    }
