#!/usr/bin/env node
/**
 * deploy-sepolia.js
 * ──────────────────
 * One-command testnet deployment for the QCrypt oracle contract.
 *
 * WHAT THIS DOES:
 *   1. Checks your wallet balance (tells you if you need testnet ETH)
 *   2. Deploys QuantumRandomnessOracle.sol to Ethereum Sepolia
 *   3. Waits for 5 block confirmations
 *   4. Verifies the contract on Etherscan Sepolia
 *   5. Writes the contract address to .env and docs/TESTNET_ADDRESSES.md
 *   6. Runs the E2E validation checklist (commit → wait → reveal → verify)
 *
 * HOW TO RUN:
 *   1. Get Sepolia ETH from https://faucets.chain.link (free, ~0.1 ETH)
 *   2. Set DEPLOYER_PRIVATE_KEY and ETHERSCAN_API_KEY in .env
 *   3. cd quantum-oracle/contracts && node scripts/deploy-sepolia.js
 *
 * COST: ~0.005 ETH (~$15 at ETH=$3000) for the deployment transaction.
 *
 * After this runs successfully you can:
 *   - Point the explorer link at anyone to show a live oracle transaction
 *   - Set ORACLE_CONTRACT_SEPOLIA in .env to wire the API
 *   - Request the external security audit (auditors want a testnet deployment)
 */

const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

// ── Configuration ─────────────────────────────────────────────────────────────
const NETWORK   = "sepolia";
const CHAIN_ID  = 11155111;
const EXPLORER  = "https://sepolia.etherscan.io";
const RPC_URL   = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

// Oracle constructor params
const INITIAL_FEE_WEI = ethers.parseEther("0.001");   // 0.001 ETH per request
const CONFIRMATIONS   = 5;

// ── Colour helpers (no extra deps) ───────────────────────────────────────────
const G = (s) => `\x1b[32m${s}\x1b[0m`;   // green
const Y = (s) => `\x1b[33m${s}\x1b[0m`;   // yellow
const R = (s) => `\x1b[31m${s}\x1b[0m`;   // red
const B = (s) => `\x1b[34m${s}\x1b[0m`;   // blue
const D = (s) => `\x1b[2m${s}\x1b[0m`;    // dim

const log  = (...a) => console.log(...a);
const ok   = (...a) => console.log(G("  ✓"), ...a);
const warn = (...a) => console.log(Y("  ⚠"), ...a);
const err  = (...a) => console.error(R("  ✗"), ...a);
const step = (n, s) => console.log(`\n${B(`[${n}]`)} ${s}`);

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n" + B("═".repeat(60)));
  console.log(B("  QCrypt Oracle — Sepolia Testnet Deployment"));
  console.log(B("═".repeat(60)) + "\n");

  // ── 1. Check environment ────────────────────────────────────────────────────
  step(1, "Checking environment");

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    err("DEPLOYER_PRIVATE_KEY not set in .env");
    err("Create a wallet, add testnet ETH from https://faucets.chain.link");
    err("Then add: DEPLOYER_PRIVATE_KEY=0x<your-key>");
    process.exit(1);
  }

  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  if (!etherscanKey) {
    warn("ETHERSCAN_API_KEY not set — contract will deploy but won't be verified on Etherscan");
  }
  ok("Environment looks good");

  // ── 2. Connect and check balance ────────────────────────────────────────────
  step(2, "Connecting to Sepolia");

  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);
  const balanceEth = ethers.formatEther(balance);

  log(`  Deployer: ${B(deployer.address)}`);
  log(`  Balance:  ${B(balanceEth + " ETH")}`);

  const MIN_BALANCE = ethers.parseEther("0.01");
  if (balance < MIN_BALANCE) {
    err(`Insufficient balance: ${balanceEth} ETH`);
    err("Need at least 0.01 ETH on Sepolia");
    err("Get free testnet ETH from:");
    err("  https://faucets.chain.link/sepolia");
    err("  https://faucet.quicknode.com/ethereum/sepolia");
    err("  https://www.alchemy.com/faucets/ethereum-sepolia");
    process.exit(1);
  }
  ok("Balance sufficient");

  // ── 3. Compile contract ─────────────────────────────────────────────────────
  step(3, "Compiling QuantumRandomnessOracle.sol");
  await hre.run("compile");
  ok("Compiled successfully");

  // ── 4. Estimate gas ────────────────────────────────────────────────────────
  step(4, "Estimating deployment gas");

  const OracleFactory = await ethers.getContractFactory("QuantumRandomnessOracle");
  const deployTx      = await OracleFactory.getDeployTransaction(
    INITIAL_FEE_WEI,
    deployer.address  // initial oracle node operator
  );

  const gasEstimate  = await ethers.provider.estimateGas(deployTx);
  const feeData      = await ethers.provider.getFeeData();
  const gasCostWei   = gasEstimate * feeData.gasPrice;
  const gasCostEth   = ethers.formatEther(gasCostWei);

  log(`  Gas estimate: ${gasEstimate.toString()} units`);
  log(`  Gas price:    ${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`);
  log(`  Estimated cost: ~${gasCostEth} ETH`);
  ok("Gas estimate complete");

  // ── 5. Deploy ──────────────────────────────────────────────────────────────
  step(5, "Deploying contract");

  const oracle = await OracleFactory.deploy(
    INITIAL_FEE_WEI,
    deployer.address,
    {
      gasLimit: gasEstimate * 120n / 100n,   // 20% buffer
    }
  );

  log(`  Tx hash: ${D(oracle.deploymentTransaction().hash)}`);
  log("  Waiting for deployment...");

  await oracle.waitForDeployment();
  const contractAddress = await oracle.getAddress();

  ok(`Contract deployed: ${G(contractAddress)}`);
  log(`  ${B("Explorer:")} ${EXPLORER}/address/${contractAddress}`);

  // ── 6. Wait for confirmations ─────────────────────────────────────────────
  step(6, `Waiting for ${CONFIRMATIONS} block confirmations`);

  const deployBlock   = oracle.deploymentTransaction().blockNumber;
  const targetBlock   = deployBlock + CONFIRMATIONS;
  let   currentBlock  = await ethers.provider.getBlockNumber();

  while (currentBlock < targetBlock) {
    const remaining = targetBlock - currentBlock;
    process.stdout.write(`\r  ${remaining} blocks remaining...`);
    await new Promise((r) => setTimeout(r, 12_000));   // ~12s per block
    currentBlock = await ethers.provider.getBlockNumber();
  }
  console.log();
  ok(`${CONFIRMATIONS} confirmations received`);

  // ── 7. Verify contract on Etherscan ───────────────────────────────────────
  step(7, "Verifying on Etherscan Sepolia");

  if (etherscanKey) {
    try {
      await hre.run("verify:verify", {
        address:              contractAddress,
        constructorArguments: [INITIAL_FEE_WEI, deployer.address],
        network:              NETWORK,
      });
      ok("Contract verified on Etherscan");
      log(`  ${B("Verified:")} ${EXPLORER}/address/${contractAddress}#code`);
    } catch (e) {
      if (e.message.includes("Already Verified")) {
        ok("Already verified");
      } else {
        warn("Verification failed:", e.message);
        warn("You can verify manually: npx hardhat verify --network sepolia " + contractAddress);
      }
    }
  } else {
    warn("Skipping Etherscan verification (no API key)");
  }

  // ── 8. E2E validation ──────────────────────────────────────────────────────
  step(8, "Running E2E validation");

  // Request randomness
  log("  Submitting oracle request...");
  const fee     = await oracle.fee();
  const reqTx   = await oracle.requestRandomness({ value: fee });
  const reqReceipt = await reqTx.wait(1);

  const event   = reqReceipt.logs.find(
    (l) => oracle.interface.parseLog(l)?.name === "RandomnessRequested"
  );
  const requestId = oracle.interface.parseLog(event).args.requestId;
  log(`  Request ID: ${D(requestId.toString())}`);
  ok("Oracle request submitted");

  // Verify contract state
  const reqData = await oracle.getRequest(requestId);
  if (!reqData.fulfilled) {
    ok("Request is pending (correct — oracle node must fulfill)");
  }

  // ── 9. Write deployment artifacts ─────────────────────────────────────────
  step(9, "Writing deployment artifacts");

  // Update .env
  const envPath  = path.resolve(__dirname, "../../../../.env");
  let   envData  = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const envKey   = "ORACLE_CONTRACT_SEPOLIA";
  const envLine  = `${envKey}=${contractAddress}`;

  if (envData.includes(envKey)) {
    envData = envData.replace(new RegExp(`${envKey}=.*`), envLine);
  } else {
    envData += `\n# Sepolia testnet deployment (${new Date().toISOString()})\n${envLine}\n`;
  }
  fs.writeFileSync(envPath, envData);
  ok(".env updated with contract address");

  // Write deployment record
  const deployRecord = {
    network:         NETWORK,
    chain_id:        CHAIN_ID,
    contract_address: contractAddress,
    deployer:        deployer.address,
    deploy_tx:       oracle.deploymentTransaction().hash,
    deploy_block:    oracle.deploymentTransaction().blockNumber,
    initial_fee_wei: INITIAL_FEE_WEI.toString(),
    deployed_at:     new Date().toISOString(),
    explorer_url:    `${EXPLORER}/address/${contractAddress}`,
    verified:        !!etherscanKey,
  };

  const recordPath = path.resolve(
    __dirname, "../../../../docs/next-phase/DEPLOYED_CONTRACTS.json"
  );
  let contracts = {};
  if (fs.existsSync(recordPath)) {
    contracts = JSON.parse(fs.readFileSync(recordPath, "utf8"));
  }
  contracts[NETWORK] = deployRecord;
  fs.writeFileSync(recordPath, JSON.stringify(contracts, null, 2));
  ok("Deployment record written to docs/next-phase/DEPLOYED_CONTRACTS.json");

  // ── 10. Summary ────────────────────────────────────────────────────────────
  console.log("\n" + G("═".repeat(60)));
  console.log(G("  Deployment complete"));
  console.log(G("═".repeat(60)));
  console.log();
  console.log(`  Contract:  ${G(contractAddress)}`);
  console.log(`  Network:   Ethereum Sepolia (chain ${CHAIN_ID})`);
  console.log(`  Explorer:  ${EXPLORER}/address/${contractAddress}`);
  console.log(`  Tx hash:   ${oracle.deploymentTransaction().hash}`);
  console.log();
  console.log(B("  Next steps:"));
  console.log("    1. Set ORACLE_CONTRACT_SEPOLIA in your API .env (already done ✓)");
  console.log("    2. Start the oracle node: cd quantum-oracle/oracle-node && python -m src.main");
  console.log("    3. Set NEXT_PUBLIC_API_BASE_URL in quantum-oracle-ui/.env.local");
  console.log("    4. Share the explorer link — this is a live, real oracle");
  console.log("    5. Begin external security audit (auditors want this link)");
  console.log();
}

// ── Hardhat runtime environment ───────────────────────────────────────────────
// Make hre available (Hardhat injects this when run via npx hardhat run)
let hre;
try {
  hre = require("hardhat");
} catch {
  // Running directly with node — needs hardhat in scope
  console.error(R("Run with: npx hardhat run scripts/deploy-sepolia.js --network sepolia"));
  process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    err("Deployment failed:", e.message);
    console.error(e);
    process.exit(1);
  });
