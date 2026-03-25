# Quick Reference: Testnet Deployment

## One-Liner Deployment

```bash
cd quantum-oracle/contracts && npx hardhat run scripts/deploy-all-testnets.js --network sepolia
```

## Contract Addresses Template

Copy and fill in after deployment:

```bash
# .env (project root)
ORACLE_CONTRACT_SEPOLIA=0x
ORACLE_CONTRACT_POLYGON_AMOY=0x
ORACLE_CONTRACT_BSC_TESTNET=0x
ORACLE_CONTRACT_AVALANCHE_FUJI=0x
ORACLE_CONTRACT_FANTOM_TESTNET=0x
```

## Test Faucets

| Network | Faucet |
|---------|--------|
| Sepolia | [faucet.sepolia.org](https://faucet.sepolia.org) |
| Polygon Amoy | [faucet.polygon.technology](https://faucet.polygon.technology) |
| BSC Testnet | [testnet.binance.org/faucet](https://testnet.binance.org/faucet) |
| Avalanche Fuji | [faucet.avax.network](https://faucet.avax.network) |
| Fantom | [faucet.fantom.network](https://faucet.fantom.network) |

## Block Explorers

| Network | Explorer |
|---------|----------|
| Sepolia | [sepolia.etherscan.io](https://sepolia.etherscan.io) |
| Polygon Amoy | [amoy.polygonscan.com](https://amoy.polygonscan.com) |
| BSC Testnet | [testnet.bscscan.com](https://testnet.bscscan.com) |
| Avalanche Fuji | [testnet.snowtrace.io](https://testnet.snowtrace.io) |
| Fantom | [testnet.ftmscan.com](https://testnet.ftmscan.com) |

## Validation Commands

```bash
# Validate all deployments
npx hardhat run scripts/validate-deployment.js --network sepolia

# Check single contract
npx hardhat console --network sepolia
> const contract = await ethers.getContractAt("QuantumRandomnessOracle", "0x...")
> await contract.owner()
> await contract.requestCounter()
```

## API Test

```bash
# Configure chain
curl -X POST "http://localhost:8000/api/v2/oracle/fulfillment/configure-chain" \
  -d "chain=ethereum" \
  -d "rpc_url=https://rpc.sepolia.org" \
  -d "private_key=YOUR_KEY" \
  -d "explorer_url=https://sepolia.etherscan.io" \
  -d "chain_id=11155111" \
  -d "currency_symbol=SepoliaETH"

# Create request
curl -X POST "http://localhost:8000/api/v2/oracle/fulfillment/request" \
  -d "chain=ethereum" \
  -d "contract_address=0xYOUR_CONTRACT" \
  -d "num_bytes=32" \
  -d "num_qubits=16"

# Check status
curl "http://localhost:8000/api/v2/oracle/fulfillment/status/REQUEST_ID"
```

## Gas Costs (Estimated)

| Operation | Gas | Sepolia Cost (20 gwei) |
|-----------|-----|------------------------|
| Commit | 50,000 | 0.001 ETH |
| Reveal | 100,000 | 0.002 ETH |
| **Total** | **150,000** | **~0.003 ETH** |

## Troubleshooting

| Error | Solution |
|-------|----------|
| "insufficient funds" | Fund account with testnet tokens |
| "nonce too low" | Wait for pending txns or increase gas |
| "contract not verified" | Run with ETHERSCAN_API_KEY set |
| "commitment mismatch" | Check randomness matches commitment hash |

---

**Full Guide:** [TESTNET_DEPLOYMENT.md](TESTNET_DEPLOYMENT.md)
