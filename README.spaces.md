---
title: QCrypt RNG
emoji: "\U0001F510"
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# QCrypt RNG - Quantum Security and Blockchain Resilience Platform

Interactive demo of a quantum-enhanced random number generation, post-quantum cryptography, and blockchain security platform.

## What you can try

- **Blockchain Security** -- Create quantum-safe wallets, generate and verify quantum VRF proofs
- **Data Protection** -- Encrypt/decrypt text and files with quantum keys, PQC sign/verify, quantum-salted hashing
- **Key and Entropy Tools** -- Generate random bytes, keys, UUIDs, passwords, session tokens, and batch operations
- **Threat Intelligence** -- Scan algorithms for quantum vulnerability, simulate attacks, compare blockchains
- **Network Status** -- Monitor platform health, entropy quality, and oracle request fulfillment

## Deployment to Hugging Face Spaces

### Quick deploy

1. Create a new Space at [huggingface.co/new-space](https://huggingface.co/new-space) with **Docker** SDK.

2. Clone this repo and prepare it for Spaces:

   ```bash
   git clone <your-repo-url> qcrypt-rng
   cd qcrypt-rng

   # Rename Spaces-specific files
   cp Dockerfile.spaces Dockerfile
   cp README.spaces.md README.md
   ```

3. Push to your Space:

   ```bash
   git remote add space https://huggingface.co/spaces/YOUR_USERNAME/qcrypt-rng
   git add -A
   git commit -m "Deploy to HF Spaces"
   git push space main
   ```

4. HF Spaces builds the Docker image and deploys automatically. The app will be available at `https://YOUR_USERNAME-qcrypt-rng.hf.space`.

### Architecture

A single Docker container runs three services behind Nginx on port 7860:

- **Nginx** (port 7860) -- reverse proxy and entry point
- **FastAPI** (port 8000) -- quantum RNG API backend
- **Next.js** (port 3000) -- interactive web dashboard

Nginx routes `/api/*` and `/health` to FastAPI, everything else to Next.js.

### Environment

The demo runs with `REQUIRE_API_KEY=false` so all features are accessible without authentication. In production, set `REQUIRE_API_KEY=true` and configure API keys.

## Source

Full source code, documentation, and local development instructions are in the main repository README.
