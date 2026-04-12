"""
Integration tests for runtime extensions added after the repo audit.

These focus on router wiring and newly exposed hybrid KEM endpoints.
"""

from fastapi.testclient import TestClient
import pytest

from app.config import settings
from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_stripe_webhook_route_is_mounted(client, monkeypatch):
    """
    The Stripe webhook handler should be reachable through the main app.

    With billing configured and an invalid signature, the route should return
    a Stripe validation error rather than 404.
    """

    monkeypatch.setattr(settings, "stripe_webhook_secret", "whsec_test")

    response = client.post(
        "/api/v2/stripe/webhook",
        content=b'{"type":"checkout.session.completed","data":{"object":{}}}',
        headers={"Stripe-Signature": "t=1,v1=invalid"},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "http_400"
    assert response.json()["message"] == "Invalid signature"


def test_hybrid_kem_generate_endpoint(client):
    response = client.post("/api/v2/pqc/hybrid/kem/generate", data={"encoding": "base64"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["data"]["algorithm"] == "Kyber768+X25519"
    assert "kyber_public_key" in payload["data"]
    assert "kyber_private_key" in payload["data"]
    assert "x25519_public_key" in payload["data"]
    assert "x25519_private_key" in payload["data"]


def test_hybrid_kem_encapsulate_endpoint(client):
    generated = client.post("/api/v2/pqc/hybrid/kem/generate", data={"encoding": "base64"})
    assert generated.status_code == 200

    keys = generated.json()["data"]
    response = client.post(
        "/api/v2/pqc/hybrid/kem/encapsulate",
        data={
            "kyber_public_key": keys["kyber_public_key"],
            "x25519_public_key": keys["x25519_public_key"],
            "encoding": "base64",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["data"]["algorithm"] == "Kyber768+X25519"
    assert "kyber_ciphertext" in payload["data"]
    assert "x25519_ciphertext" in payload["data"]
    assert "combined_secret" in payload["data"]


def test_hybrid_kem_decapsulate_endpoint(client):
    generated = client.post("/api/v2/pqc/hybrid/kem/generate", data={"encoding": "base64"})
    assert generated.status_code == 200
    keys = generated.json()["data"]

    encapsulated = client.post(
        "/api/v2/pqc/hybrid/kem/encapsulate",
        data={
            "kyber_public_key": keys["kyber_public_key"],
            "x25519_public_key": keys["x25519_public_key"],
            "encoding": "base64",
        },
    )
    assert encapsulated.status_code == 200
    enc = encapsulated.json()["data"]

    decapsulated = client.post(
        "/api/v2/pqc/hybrid/kem/decapsulate",
        data={
            "kyber_private_key": keys["kyber_private_key"],
            "x25519_private_key": keys["x25519_private_key"],
            "kyber_ciphertext": enc["kyber_ciphertext"],
            "x25519_ciphertext": enc["x25519_ciphertext"],
            "encoding": "base64",
        },
    )

    assert decapsulated.status_code == 200
    payload = decapsulated.json()
    assert payload["status"] == "success"
    assert payload["data"]["algorithm"] == "Kyber768+X25519"
    assert payload["data"]["combined_secret"] == enc["combined_secret"]
