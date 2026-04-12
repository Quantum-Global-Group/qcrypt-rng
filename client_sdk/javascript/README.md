# QCrypt RNG JavaScript SDK

The official JavaScript/TypeScript client for the QCrypt RNG API.

## Features

- Quantum random byte generation
- PQC key generation, sign, and verify
- Hybrid PQC signing, CSR generation, and hybrid KEM
- Oracle randomness request/status helpers
- Quantum VRF helpers

## Quick Start

```ts
import { QCryptClient, Algorithm } from "@qcrypt/client-sdk";

const client = new QCryptClient({
  baseUrl: "http://localhost:8000",
  apiKey: "your-api-key",
});

const bytes = await client.generateBytes({ length: 32 });
console.log(bytes.data.bytes);

const hybrid = await client.generateHybridKeypair();
console.log(hybrid.data.algorithm);
```

## Build

```bash
npm run build
```

The compiled SDK is emitted to `dist/`.
