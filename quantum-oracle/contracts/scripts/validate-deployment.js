#!/usr/bin/env node
// scripts/validate-deployment.js
// Validate deployed contracts on each testnet

const { ethers } = require("hardhat");

// Testnet configurations
const TESTNETS = [
  {
    name: "sepolia",
    displayName: "Ethereum Sepolia",
    chainId: 11155111,
    explorer: "https://sepolia.etherscan.io"
  },
  {
    name: "polygonAmoy",
    displayName: "Polygon Amoy",
    chainId: 80002,
    explorer: "https://amoy.polygonscan.com"
  },
  {
    name: "bscTestnet",
    displayName: "BSC Testnet",
    chainId: 97,
    explorer: "https://testnet.bscscan.com"
  },
  {
    name: "avalancheFuji",
    displayName: "Avalanche Fuji",
    chainId: 43113,
    explorer: "https://testnet.snowtrace.io"
  },
  {
    name: "fantomTestnet",
    displayName: "Fantom Testnet",
    chainId: 4002,
    explorer: "https://testnet.ftmscan.com"
  }
];

// Minimal Oracle ABI for validation
const ORACLE_ABI = [
  "function requestCounter() view returns (uint256)",
  "function owner() view returns (address)",
  "function oracleNode() view returns (address)",
  "function fee() view returns (uint256)",
  "function COMMIT_REVEAL_DELAY() view returns (uint256)",
  "function getBalance() view returns (uint256)"
];

async function validateContract(networkName, contractAddress) {
  const networkConfig = TESTNETS.find(n => n.name === networkName);
  if (!networkConfig) {
    throw new Error(`Unknown network: ${networkName}`);
  }

  console.log(`\n========================================`);
  console.log(`Validating ${networkConfig.displayName}`);
  console.log(`========================================`);
  console.log("Contract:", contractAddress);
  console.log("Explorer:", `${networkConfig.explorer}/address/${contractAddress}`);

  // Connect to contract
  const contract = new ethers.Contract(contractAddress, ORACLE_ABI, ethers.provider);

  // Validate contract functions
  console.log("\nChecking contract functions...");
  
  try {
    const [requestCounter, owner, oracleNode, fee, delay, balance] = await Promise.all([
      contract.requestCounter(),
      contract.owner(),
      contract.oracleNode(),
      contract.fee(),
      contract.COMMIT_REVEAL_DELAY(),
      contract.getBalance()
    ]);

    console.log("✓ Contract is responsive");
    console.log("\nContract State:");
    console.log(`  Request Counter: ${requestCounter.toString()}`);
    console.log(`  Owner: ${owner}`);
    console.log(`  Oracle Node: ${oracleNode}`);
    console.log(`  Fee: ${ethers.utils.formatEther(fee)} ETH`);
    console.log(`  Commit-Reveal Delay: ${delay.toString()} blocks`);
    console.log(`  Contract Balance: ${ethers.utils.formatEther(balance)} ETH`);

    // Validate expected values
    const validations = [
      { name: "Owner address", check: owner !== ethers.constants.AddressZero, expected: "non-zero address" },
      { name: "Oracle node address", check: oracleNode !== ethers.constants.AddressZero, expected: "non-zero address" },
      { name: "Commit-reveal delay", check: delay.toString() === "2", expected: "2 blocks" },
      { name: "Fee", check: fee.gt(0), expected: "> 0 ETH" }
    ];

    console.log("\nValidations:");
    let allPassed = true;
    validations.forEach(v => {
      const status = v.check ? "✓" : "✗";
      console.log(`  ${status} ${v.name}: ${v.check ? "PASS" : "FAIL"} (expected: ${v.expected})`);
      if (!v.check) allPassed = false;
    });

    return allPassed;
  } catch (error) {
    console.log("✗ Contract validation failed:", error.message);
    return false;
  }
}

async function main() {
  console.log("==============================================");
  console.log("QuantumRandomnessOracle Deployment Validation");
  console.log("==============================================\n");

  // Load deployment summary
  const fs = require("fs");
  const path = require("path");
  const summaryPath = path.join(__dirname, "../deployments/deployment-summary.json");

  if (!fs.existsSync(summaryPath)) {
    console.log("No deployment summary found. Run deploy-all-testnets.js first.");
    return;
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  console.log(`Loaded ${summary.deployments.length} deployments from ${summary.deploymentDate}\n`);

  const results = [];

  // Validate each deployment
  for (const deployment of summary.deployments) {
    try {
      await hre.network.change(deployment.network);
      const isValid = await validateContract(
        deployment.network,
        deployment.contractAddress
      );
      results.push({
        network: deployment.network,
        displayName: deployment.displayName,
        valid: isValid
      });
    } catch (error) {
      console.log(`\n✗ Validation failed for ${deployment.network}:`, error.message);
      results.push({
        network: deployment.network,
        displayName: deployment.displayName,
        valid: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log("\n==============================================");
  console.log("Validation Summary");
  console.log("==============================================");
  
  const validCount = results.filter(r => r.valid).length;
  console.log(`Valid: ${validCount}/${results.length}`);
  console.log(`Invalid: ${results.length - validCount}/${results.length}`);

  if (validCount === results.length) {
    console.log("\n✓ All contracts validated successfully!");
  } else {
    console.log("\n⚠ Some contracts failed validation. Check the logs above.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
