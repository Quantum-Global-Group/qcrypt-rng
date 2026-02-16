# Quantum Randomness Oracle Dashboard

## Overview
The QCrypt RNG dashboard provides a comprehensive interface for the Quantum Randomness Oracle and related quantum security features. The dashboard demonstrates:

1. **Quantum Random Number Generation** - Generate cryptographically secure random data using quantum mechanics
2. **Blockchain Security Analysis** - Demonstrate quantum threats to blockchain and quantum-safe alternatives
3. **Post-Quantum Cryptography** - NIST-standardized quantum-resistant algorithms

## Dashboard Features

### 1. Quantum RNG Tab
- **Random Bytes Generation**: Create quantum-random bytes with customizable length, qubits, and format
- **Cryptographic Keys**: Generate quantum-enhanced keys for AES, RSA, and ECDSA
- **Session Tokens**: Create secure quantum-random session tokens
- **Quantum UUIDs**: Generate RFC4122-compliant UUIDs with quantum randomness
- **Secure Passwords**: Generate cryptographically strong passwords with quantum randomness

### 2. Blockchain Security Tab
- **Wallet Creation**: Create both vulnerable (RSA-2048) and quantum-safe (DILITHIUM3) wallets
- **Quantum Attack Simulation**: Simulate Shor's algorithm attacks on different cryptographic algorithms
- **Blockchain Comparison**: Compare vulnerable vs quantum-safe blockchain implementations

### 3. Post-Quantum Cryptography Tab
- **Quantum-Safe Keys**: Generate NIST-standardized PQC keys (DILITHIUM, KYBER)
- **Threat Assessment**: Analyze quantum vulnerability of different algorithms
- **Migration Guidance**: Recommendations for transitioning to quantum-safe algorithms

## Quantum Randomness Oracle Integration

The dashboard seamlessly integrates with the Quantum Randomness Oracle through:

- **API Endpoints**: `/api/v2/oracle/` endpoints for requesting quantum randomness
- **Commit-Reveal Scheme**: Demonstrates the tamper-proof mechanism
- **Network Information**: Shows oracle network status and capabilities
- **Performance Metrics**: Tracks generation speed and entropy quality

## Access Information

- **Dashboard**: http://localhost:8501
- **API Documentation**: http://localhost:8000/docs
- **Oracle Network Info**: http://localhost:8000/api/v2/oracle/network-info
- **Oracle Request Endpoint**: http://localhost:8000/api/v2/oracle/request

## Use Cases Demonstrated

- **Gaming**: Fair loot drops, tournament brackets, random matchmaking
- **NFTs**: Verifiable randomness for minting and trait distribution
- **DeFi**: Lotteries, random selection for governance, incentive distribution
- **DAOs**: Random sampling for committees, fair voting mechanisms
- **Prediction Markets**: Unpredictable resolution criteria

## Security Features

- **True Quantum Randomness**: From quantum mechanical processes
- **Verifiable Origin**: Mathematical proofs of quantum origin
- **Decentralized Network**: Distributed oracle network
- **Commit-Reveal Scheme**: Prevents manipulation
- **Hardware Abstraction**: Supports multiple quantum hardware providers

The dashboard provides a user-friendly interface to explore the capabilities of the Quantum Randomness Oracle and understand how quantum technologies enhance blockchain security.