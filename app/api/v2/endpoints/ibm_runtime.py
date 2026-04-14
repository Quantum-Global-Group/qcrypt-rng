"""
IBM Quantum Runtime — connect with IBM Cloud API key + instance CRN and run a verifiable workflow.

Credentials are accepted per request only (not persisted). Requires optional deps:
  pip install qiskit qiskit-ibm-runtime
"""

from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.v2.models.responses import ResponseStatus
from app.utils.logging import logger

router = APIRouter()


class IBMCloudCredentials(BaseModel):
    """IBM Cloud channel auth: IAM API key + service instance CRN."""

    api_key: str = Field(..., min_length=8, description="IBM Cloud IAM API key")
    instance: str = Field(
        ...,
        min_length=8,
        description="Quantum service instance CRN (ibm_cloud channel)",
    )


class IBMRuntimeConnectRequest(IBMCloudCredentials):
    pass


class IBMRuntimeRunRequest(IBMCloudCredentials):
    backend_name: Optional[str] = Field(
        default=None,
        description="Optional backend name; default picks least busy matching filters.",
    )
    prefer_simulator: bool = Field(
        default=True,
        description="Prefer simulator backends when True (lower cost for trials).",
    )
    shots: int = Field(default=1024, ge=1, le=10_000)


def _sdk_available() -> tuple[bool, Optional[str]]:
    try:
        import qiskit_ibm_runtime  # noqa: F401

        from importlib.metadata import version

        v = version("qiskit-ibm-runtime")
        return True, v
    except Exception:
        return False, None


@router.get("/sdk", tags=["IBM Quantum Runtime"])
async def ibm_runtime_sdk_status() -> Dict[str, Any]:
    """Whether qiskit-ibm-runtime is installed (no credentials required)."""
    ok, ver = _sdk_available()
    return {
        "status": ResponseStatus.SUCCESS,
        "sdk_installed": ok,
        "qiskit_ibm_runtime_version": ver,
    }


@router.post("/connect", tags=["IBM Quantum Runtime"])
async def ibm_runtime_connect(body: IBMRuntimeConnectRequest) -> Dict[str, Any]:
    """
    Validate IBM Cloud credentials and list a short sample of accessible backends.
    """
    if not _sdk_available()[0]:
        raise HTTPException(
            status_code=503,
            detail="IBM Runtime SDK not installed. Install with: pip install qiskit qiskit-ibm-runtime",
        )

    from qiskit_ibm_runtime import QiskitRuntimeService

    try:
        service = QiskitRuntimeService(
            channel="ibm_cloud",
            token=body.api_key,
            instance=body.instance,
        )
    except Exception as e:
        logger.warning("IBM Runtime connect failed: %s", e, exc_info=True)
        raise HTTPException(status_code=401, detail=f"Could not open service: {e!s}") from e

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
        raise HTTPException(status_code=502, detail=f"Backends listing failed: {e!s}") from e

    return {
        "status": ResponseStatus.SUCCESS,
        "channel": "ibm_cloud",
        "backend_count": len(backends),
        "backends_sample": sample,
    }


def _proof_digest(payload: Dict[str, Any]) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


@router.post("/run", tags=["IBM Quantum Runtime"])
async def ibm_runtime_run_workflow(body: IBMRuntimeRunRequest) -> Dict[str, Any]:
    """
    Run a minimal Bell-state workflow on IBM Runtime (Sampler primitive) and return
    a reproducible proof digest over job metadata and measurement statistics.
    """
    if not _sdk_available()[0]:
        raise HTTPException(
            status_code=503,
            detail="IBM Runtime SDK not installed. Install with: pip install qiskit qiskit-ibm-runtime",
        )

    from qiskit import QuantumCircuit
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler

    try:
        service = QiskitRuntimeService(
            channel="ibm_cloud",
            token=body.api_key,
            instance=body.instance,
        )
    except Exception as e:
        logger.warning("IBM Runtime run: service open failed: %s", e, exc_info=True)
        raise HTTPException(status_code=401, detail=f"Could not open service: {e!s}") from e

    if body.backend_name:
        try:
            backend = service.backend(body.backend_name)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Unknown backend: {e!s}") from e
    else:
        try:
            backend = service.least_busy(
                operational=True,
                simulator=body.prefer_simulator,
                min_num_qubits=2,
            )
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"No suitable backend (try prefer_simulator or set backend_name): {e!s}",
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
        raise HTTPException(status_code=500, detail=f"Transpile failed: {e!s}") from e

    sampler = Sampler(mode=backend)
    try:
        runtime_job = sampler.run([isa], shots=body.shots)
        job_id = runtime_job.job_id()
        primitive_result = runtime_job.result()
        pub_result = primitive_result[0]
    except Exception as e:
        logger.warning("Sampler run failed: %s", e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Runtime execution failed: {e!s}") from e

    counts: Dict[str, Any] = {}
    try:
        meas = pub_result.data.meas
        if hasattr(meas, "get_counts"):
            counts = {str(k): int(v) for k, v in meas.get_counts().items()}
        else:
            # BitArray / ndarray fallback
            arr = getattr(meas, "array", meas)
            import numpy as np

            flat = np.asarray(arr).ravel()
            for bit in flat:
                key = str(int(bit))
                counts[key] = counts.get(key, 0) + 1
    except Exception as e:
        logger.warning("Could not normalize counts: %s", e, exc_info=True)
        counts = {"_parse_error": str(e), "raw": repr(pub_result.data)}

    inst_fp = hashlib.sha256(body.instance.encode("utf-8")).hexdigest()
    proof_payload = {
        "job_id": job_id,
        "backend": backend.name,
        "instance_sha256": inst_fp,
        "shots": body.shots,
        "counts": counts,
        "circuit": "bell_hadamard_cnot_measure_all",
    }
    digest = _proof_digest(proof_payload)

    return {
        "status": ResponseStatus.SUCCESS,
        "workflow": "bell_sampler_v1",
        "job_id": job_id,
        "backend": backend.name,
        "channel": "ibm_cloud",
        "shots": body.shots,
        "counts": counts,
        "instance_fingerprint_sha256": inst_fp,
        "proof": {
            "algorithm": "SHA-256",
            "digest_hex": digest,
            "signed_fields": list(proof_payload.keys()),
            "note": "Digest binds job id, backend, hashed instance CRN, shots, and measurement counts.",
        },
    }
