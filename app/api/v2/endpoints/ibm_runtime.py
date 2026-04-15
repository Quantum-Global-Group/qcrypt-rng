"""
IBM Quantum Runtime — connect with IBM Cloud API key + instance CRN and run a verifiable workflow.

Credentials are accepted per request only (not persisted). Requires optional deps:
  pip install qiskit qiskit-ibm-runtime

Core logic lives in `app.quantum.ibm_runtime_core` (shared with `hf_space` Gradio demo).
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.v2.models.responses import ResponseStatus
from app.quantum.ibm_runtime_core import (
    IBMRuntimeOperationError,
    connect_backends,
    run_bell_sampler_workflow,
    sdk_info_payload,
)
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
    backend_name: str | None = Field(
        default=None,
        description="Optional backend name; default picks least busy matching filters.",
    )
    prefer_simulator: bool = Field(
        default=True,
        description="Prefer simulator backends when True (lower cost for trials).",
    )
    shots: int = Field(default=1024, ge=1, le=10_000)


@router.get("/sdk", tags=["IBM Quantum Runtime"])
async def ibm_runtime_sdk_status() -> Dict[str, Any]:
    """Whether qiskit-ibm-runtime is installed (no credentials required)."""
    payload = sdk_info_payload()
    return {
        "status": ResponseStatus.SUCCESS,
        **payload,
    }


@router.post("/connect", tags=["IBM Quantum Runtime"])
async def ibm_runtime_connect(body: IBMRuntimeConnectRequest) -> Dict[str, Any]:
    """
    Validate IBM Cloud credentials and list a short sample of accessible backends.
    """
    try:
        data = connect_backends(body.api_key, body.instance)
    except IBMRuntimeOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail) from e

    return {
        "status": ResponseStatus.SUCCESS,
        **data,
    }


@router.post("/run", tags=["IBM Quantum Runtime"])
async def ibm_runtime_run_workflow(body: IBMRuntimeRunRequest) -> Dict[str, Any]:
    """
    Run a minimal Bell-state workflow on IBM Runtime (Sampler primitive) and return
    a reproducible proof digest over job metadata and measurement statistics.
    """
    try:
        data = run_bell_sampler_workflow(
            body.api_key,
            body.instance,
            backend_name=body.backend_name,
            prefer_simulator=body.prefer_simulator,
            shots=body.shots,
        )
    except IBMRuntimeOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail) from e

    return {
        "status": ResponseStatus.SUCCESS,
        **data,
    }
