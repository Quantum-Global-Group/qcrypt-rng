# Testnet Deployment Guide (Phase 2 Task 5)

**Document:** Testnet deployment of QuantumRandomnessOracle contracts  
**Last Updated:** 2026-03-23  
**Status:** Ready for deployment

---

## Overview

This guide covers the deployment of the `QuantumRandomnessOracle` smart contract to major testnets and the integration with the QCrypt RNG API for end-to-end validation.

---

## Target Testnets

| Chain | Testnet | Chain ID | RPC URL | Explorer |
|-------|---------|----------|---------|----------|
| Ethereum | Sepolia | 11155111 | `https://rpc.sepolia.org` | [sepolia.etherscan.io](https://sepolia.etherscan.io) |
| Polygon | Amoy | 80002 | `https://rpc.amoy.polygon.technology` | [amoy.polygonscan.com](https://amoy.polygonscan.com) |
| BSC | BSC Testnet | 97 | `https://data-seed-prebsc-1-s1.binance.org:8545` | [testnet.bscscan.com](https://testnet.bscscan.com) |
| Avalanche | Fuji | 43113 | `https://api.avax-test.network/ext/bc/C/rpc` | [testnet.snowtrace.io](https://testnet.snowtrace.io) |
| Fantom | Fantom Testnet | 4002 | `https://rpc.testnet.fantom.network` | [testnet.ftmscan.com](https://testnet.ftmscan.com) |

---

## Prerequisites

### 1. Node.js and Dependencies

```bash
cd quantum-oracle/contracts
npm install
```

### 2. Environment Variables

Create a `.env` file in `quantum-oracle/contracts/`:

```bash
# Deployment private key (DO NOT use production keys on testnets)
PRIVATE_KEY=your_testnet_deployer_private_key

# RPC URLs (optional, defaults are configured)
SEPOLIA_RPC_URL=https://rpc.sepolia.org
POLYGON_AMOY_RPC_URL=https://rpc.amoy.polygon.technology
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
FANTOM_TESTNET_RPC_URL=https://rpc.testnet.fantom.network

# Block explorer API keys (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
SNOWTRACE_API_KEY=your_snowtrace_api_key
FTMSCAN_API_KEY=your_ftmscan_api_key
```

### 3. Fund Deployer Account

Obtain testnet tokens for each network:

- **Sepolia ETH:** [faucet.sepolia.org](https://faucet.sepolia.org) or [sepoliafaucet.com](https://sepoliafaucet.com)
- **Polygon Amoy MATIC:** [faucet.polygon.technology](https://faucet.polygon.technology)
- **BSC Testnet BNB:** [testnet.binance.org/faucet](https://testnet.binance.org/faucet)
- **Avalanche Fuji AVAX:** [faucet.avax.network](https://faucet.avax.network)
- **Fantom Testnet FTM:** [faucet.fantom.network](https://faucet.fantom.network)

**Recommended funding:** 0.1-0.5 native tokens per network for deployment and testing.

---

## Deployment Steps

### Option 1: Deploy to All Testnets (Recommended)

```bash
cd quantum-oracle/contracts
npx hardhat run scripts/deploy-all-testnets.js --network sepolia
```

This script:
1. Deploys to all 5 testnets sequentially
2. Waits for 5 confirmations per deployment
3. Verifies contracts on block explorers (if API keys provided)
4. Saves deployment info to `deployments/` folder

### Option 2: Deploy to Single Network

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to Polygon Amoy
npx hardhat run scripts/deploy.js --network polygonAmoy

# Deploy to BSC Testnet
npx hardhat run scripts/deploy.js --network bscTestnet
```

### Option 3: Deploy to Specific Networks

```bash
# Deploy to selected networks only
npx hardhat run scripts/deploy-all-testnets.js --network sepolia sepolia polygonAmoy bscTestnet
```

---

## Contract Addresses

**After deployment, update this table:**

| Chain | Contract | Address | Deployment TX | Verified |
|-------|----------|---------|---------------|----------|
| Sepolia | QuantumRandomnessOracle | `TBD` | `TBD` | ☐ |
| Polygon Amoy | QuantumRandomnessOracle | `TBD` | `TBD` | ☐ |
| BSC Testnet | QuantumRandomnessOracle | `TBD` | `TBD` | ☐ |
| Avalanche Fuji | QuantumRandomnessOracle | `TBD` | `TBD` | ☐ |
| Fantom Testnet | QuantumRandomnessOracle | `TBD` | `TBD` | ☐ |

Deployment artifacts are saved to `quantum-oracle/contracts/deployments/`:
- `deployment-{network}.json` - Individual network deployment
- `deployment-summary.json` - Combined summary
- `DEPLOYMENT_REPORT.md` - Human-readable report

---

## API Configuration

### Update Environment Variables

Add deployed contract addresses to your `.env` file in the main project root:

```bash
# Oracle contract addresses (testnets)
ORACLE_CONTRACT_SEPOLIA=0x...
ORACLE_CONTRACT_POLYGON_AMOY=0x...
ORACLE_CONTRACT_BSC_TESTNET=0x...
ORACLE_CONTRACT_AVALANCHE_FUJI=0x...
ORACLE_CONTRACT_FANTOM_TESTNET=0x...

# Testnet RPC URLs (for API backend)
TESTNET_RPC_SEPOLIA=https://rpc.sepolia.org
TESTNET_RPC_POLYGON_AMOY=https://rpc.amoy.polygon.technology
TESTNET_RPC_BSC_TESTNET=https://data-seed-prebsc-1-s1.binance.org:8545
TESTNET_RPC_AVALANCHE_FUJI=https://api.avax-test.network/ext/bc/C/rpc
TESTNET_RPC_FANTOM_TESTNET=https://rpc.testnet.fantom.network

# Chain IDs
TESTNET_CHAIN_ID_SEPOLIA=11155111
TESTNET_CHAIN_ID_POLYGON_AMOY=80002
TESTNET_CHAIN_ID_BSC_TESTNET=97
TESTNET_CHAIN_ID_AVALANCHE_FUJI=43113
TESTNET_CHAIN_ID_FANTOM_TESTNET=4002
```

### Update `app/config.py`

Add testnet configuration to the settings:

```python
# Testnet Oracle Configuration
testnet_oracle_contracts = {
    "sepolia": os.getenv("ORACLE_CONTRACT_SEPOLIA", ""),
    "polygon_amoy": os.getenv("ORACLE_CONTRACT_POLYGON_AMOY", ""),
    "bsc_testnet": os.getenv("ORACLE_CONTRACT_BSC_TESTNET", ""),
    "avalanche_fuji": os.getenv("ORACLE_CONTRACT_AVALANCHE_FUJI", ""),
    "fantom_testnet": os.getenv("ORACLE_CONTRACT_FANTOM_TESTNET", ""),
}
```

---

## End-to-End Validation

### 1. Configure Chain in API

Use the `/oracle/fulfillment/configure-chain` endpoint:

```bash
# Configure Sepolia
curl -X POST "http://localhost:8000/api/v2/oracle/fulfillment/configure-chain" \
  -d "chain=ethereum" \
  -d "rpc_url=https://rpc.sepolia.org" \
  -d "private_key=YOUR_TEST_KEY" \
  -d "explorer_url=https://sepolia.etherscan.io" \
  -d "chain_id=11155111" \
  -d "currency_symbol=SepoliaETH"
```

### 2. Create Oracle Request

```bash
curl -X POST "http://localhost:8000/api/v2/oracle/fulfillment/request" \
  -d "chain=ethereum" \
  -d "contract_address=0xYOUR_CONTRACT_ADDRESS" \
  -d "num_bytes=32" \
  -d "num_qubits=16" \
  -d "async_fulfillment=true"
```

### 3. Check Request Status

```bash
curl "http://localhost:8000/api/v2/oracle/fulfillment/status/{request_id}"
```

### 4. Verify On-Chain

Check the transaction on the block explorer:
- Commitment submission transaction
- Reveal transaction (after 2-block delay)
- Randomness value matches API response

### Validation Checklist

- [ ] Contract deployed and verified on block explorer
- [ ] API can connect to testnet RPC
- [ ] Commitment transaction submitted successfully
- [ ] Reveal transaction submitted after delay
- [ ] Randomness delivered to requester contract
- [ ] On-chain randomness matches API-generated value
- [ ] Gas costs within expected range (< 0.01 ETH per fulfillment)

---

## Gas Requirements

Estimated gas costs for oracle operations:

| Operation | Gas Limit | Sepolia (gwei) | Cost (ETH) |
|-----------|-----------|----------------|------------|
| Commit | ~50,000 | 20 | 0.001 |
| Reveal | ~100,000 | 20 | 0.002 |
| **Total** | **~150,000** | **20** | **~0.003** |

**Note:** Actual gas costs vary by network congestion and contract complexity.

---

## Troubleshooting

### Deployment Fails

**Error: "insufficient funds for gas * price + value"**
- Solution: Fund deployer account with more testnet tokens

**Error: "nonce too low"**
- Solution: Wait for pending transactions to confirm or increase gas price

**Error: "contract creation code storage out of gas"**
- Solution: Increase gas limit in deployment script

### API Cannot Connect

**Error: "Could not detect network"**
- Solution: Verify RPC URL is correct and accessible

**Error: "invalid sender"**
- Solution: Ensure private key matches the account funding transactions

### Fulfillment Fails

**Error: "Commitment not yet submitted"**
- Solution: Check that commit transaction was confirmed before reveal

**Error: "Commit-reveal delay not elapsed"**
- Solution: Wait 2 blocks between commit and reveal

**Error: "Commitment mismatch"**
- Solution: Verify randomness value matches the commitment hash

---

## Security Notes

⚠️ **Testnet Only:** These deployments are for testing and development. Do not use testnet contracts or keys in production.

⚠️ **Private Key Security:** Never commit private keys to version control. Use environment variables or secure key management.

⚠️ **Gas Limits:** Set appropriate gas limits to prevent front-running and MEV attacks in production.

---

## Next Steps

After successful testnet deployment and validation:

1. **Mainnet Deployment:** Deploy to production networks (Ethereum, Polygon, BSC, etc.)
2. **Security Audit:** Complete security review per `docs/next-phase/SECURITY_AUDIT_CHECKLIST.md`
3. **Monitoring:** Set up alerts for oracle fulfillment failures
4. **Documentation:** Update user-facing docs with contract addresses

---

## References

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org)
- [Chainlist](https://chainlist.org) - Network RPCs and Chain IDs
- [QCrypt Oracle Service](../../app/blockchain/oracle_service.py)

---

*Last updated: 2026-03-23*
