// scripts/deploy-all-testnets.js
// Deploy QuantumRandomnessOracle to all testnets

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  fee: ethers.utils.parseEther("0.01"), // 0.01 native token per request
  oracleNodeAddress: null, // Will be set to deployer address
};

// Testnet configurations
const TESTNETS = [
  {
    name: "sepolia",
    displayName: "Ethereum Sepolia",
    chainId: 11155111,
    explorer: "https://sepolia.etherscan.io",
    explorerApi: "https://api-sepolia.etherscan.io/api"
  },
  {
    name: "polygonAmoy",
    displayName: "Polygon Amoy",
    chainId: 80002,
    explorer: "https://amoy.polygonscan.com",
    explorerApi: "https://api-amoy.polygonscan.com/api"
  },
  {
    name: "bscTestnet",
    displayName: "BSC Testnet",
    chainId: 97,
    explorer: "https://testnet.bscscan.com",
    explorerApi: "https://api-testnet.bscscan.com/api"
  },
  {
    name: "avalancheFuji",
    displayName: "Avalanche Fuji",
    chainId: 43113,
    explorer: "https://testnet.snowtrace.io",
    explorerApi: "https://api-testnet.snowtrace.io/api"
  },
  {
    name: "fantomTestnet",
    displayName: "Fantom Testnet",
    chainId: 4002,
    explorer: "https://testnet.ftmscan.com",
    explorerApi: "https://api-testnet.ftmscan.com/api"
  }
];

async function deployToNetwork(networkName) {
  const networkConfig = TESTNETS.find(n => n.name === networkName);
  if (!networkConfig) {
    throw new Error(`Unknown network: ${networkName}`);
  }

  console.log(`\n========================================`);
  console.log(`Deploying to ${networkConfig.displayName}...`);
  console.log(`========================================`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Set oracle node address to deployer
  DEPLOYMENT_CONFIG.oracleNodeAddress = deployer.address;

  // Deploy contract
  console.log("\nDeploying QuantumRandomnessOracle...");
  console.log("Fee:", ethers.utils.formatEther(DEPLOYMENT_CONFIG.fee), "ETH");
  console.log("Oracle Node:", DEPLOYMENT_CONFIG.oracleNodeAddress);

  const QuantumRandomnessOracle = await ethers.getContractFactory("QuantumRandomnessOracle");
  const oracleContract = await QuantumRandomnessOracle.deploy(
    DEPLOYMENT_CONFIG.fee,
    DEPLOYMENT_CONFIG.oracleNodeAddress
  );

  console.log("Waiting for deployment...");
  await oracleContract.deployed();

  console.log("✓ QuantumRandomnessOracle deployed to:", oracleContract.address);
  console.log("Explorer URL:", `${networkConfig.explorer}/tx/${oracleContract.deployTransaction.hash}`);

  // Wait for additional confirmations
  console.log("Waiting for 5 confirmations...");
  await oracleContract.deployTransaction.wait(5);
  console.log("✓ Deployment confirmed");

  return {
    network: networkName,
    displayName: networkConfig.displayName,
    chainId: networkConfig.chainId,
    contractAddress: oracleContract.address,
    deployerAddress: deployer.address,
    fee: DEPLOYMENT_CONFIG.fee.toString(),
    deploymentTxHash: oracleContract.deployTransaction.hash,
    explorerUrl: `${networkConfig.explorer}/address/${oracleContract.address}`,
    deploymentTimestamp: new Date().toISOString()
  };
}

async function verifyContract(networkName, contractAddress) {
  console.log(`\nVerifying contract on ${networkName}...`);
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [
        DEPLOYMENT_CONFIG.fee,
        DEPLOYMENT_CONFIG.oracleNodeAddress
      ]
    });
    console.log("✓ Contract verified successfully");
    return true;
  } catch (error) {
    console.log("✗ Contract verification failed:", error.message);
    return false;
  }
}

async function saveDeploymentResults(results) {
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save individual network deployments
  results.forEach(result => {
    const filename = `deployment-${result.network}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`✓ Saved deployment info: ${filename}`);
  });

  // Save combined deployment summary
  const summary = {
    deploymentDate: new Date().toISOString(),
    totalNetworks: results.length,
    deployments: results,
    summary: results.map(r => ({
      network: r.network,
      displayName: r.displayName,
      contractAddress: r.contractAddress,
      explorerUrl: r.explorerUrl
    }))
  };

  const summaryPath = path.join(deploymentsDir, "deployment-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✓ Saved deployment summary: deployment-summary.json`);

  // Save as Markdown report
  const mdReport = generateMarkdownReport(summary);
  const mdPath = path.join(deploymentsDir, "DEPLOYMENT_REPORT.md");
  fs.writeFileSync(mdPath, mdReport);
  console.log(`✓ Saved deployment report: DEPLOYMENT_REPORT.md`);
}

function generateMarkdownReport(summary) {
  let md = `# QuantumRandomnessOracle Deployment Report\n\n`;
  md += `**Deployment Date:** ${summary.deploymentDate}\n\n`;
  md += `**Total Networks:** ${summary.totalNetworks}\n\n`;
  md += `---\n\n`;
  md += `## Contract Addresses\n\n`;
  md += `| Network | Contract Address | Explorer |\n`;
  md += `|---------|-----------------|----------|\n`;
  
  summary.deployments.forEach(dep => {
    md += `| ${dep.displayName} | \`${dep.contractAddress}\` | [View](${dep.explorerUrl}) |\n`;
  });
  
  md += `\n---\n\n`;
  md += `## Deployment Details\n\n`;
  
  summary.deployments.forEach(dep => {
    md += `### ${dep.displayName}\n\n`;
    md += `- **Contract Address:** \`${dep.contractAddress}\`\n`;
    md += `- **Chain ID:** ${dep.chainId}\n`;
    md += `- **Deployer:** \`${dep.deployerAddress}\`\n`;
    md += `- **Fee:** ${ethers.utils.formatEther(dep.fee)} ETH\n`;
    md += `- **Deployment TX:** [${dep.deploymentTxHash.slice(0, 10)}...${dep.deploymentTxHash.slice(-8)}](${dep.explorerUrl})\n`;
    md += `- **Timestamp:** ${dep.deploymentTimestamp}\n\n`;
  });
  
  md += `---\n\n`;
  md += `## Usage\n\n`;
  md += `### Add to Configuration\n\n`;
  md += `\`\`\`bash\n`;
  md += `# Add these to your .env file or app/config.py\n`;
  summary.deployments.forEach(dep => {
    const envName = dep.network.toUpperCase().replace('TESTNET', '').replace('FUJI', 'AVALANCHE');
    md += `${envName}_ORACLE_CONTRACT="${dep.contractAddress}"\n`;
  });
  md += `\`\`\`\n\n`;
  
  md += `### API Configuration\n\n`;
  md += `\`\`\`python\n`;
  md += `# app/config.py or environment variables\n`;
  summary.deployments.forEach(dep => {
    const envName = dep.network.toUpperCase().replace('TESTNET', '').replace('FUJI', 'AVALANCHE');
    md += `ORACLE_CONTRACT_${envName} = "${dep.contractAddress}"\n`;
  });
  md += `\`\`\`\n\n`;
  
  return md;
}

async function main() {
  console.log("==============================================");
  console.log("QuantumRandomnessOracle Multi-Network Deploy");
  console.log("==============================================\n");

  const results = [];
  const failed = [];

  // Get deployment targets from command line or deploy to all testnets
  const targetNetworks = process.argv.length > 2 
    ? process.argv.slice(2)
    : TESTNETS.map(n => n.name);

  console.log("Target networks:", targetNetworks.join(", "));

  // Deploy to each network
  for (const networkName of targetNetworks) {
    try {
      // Switch network
      await hre.network.change(networkName);
      
      const result = await deployToNetwork(networkName);
      results.push(result);

      // Verify contract (optional, requires API key)
      if (process.env.SKIP_VERIFICATION !== "true") {
        await verifyContract(networkName, result.contractAddress);
      }
    } catch (error) {
      console.error(`\n✗ Deployment to ${networkName} failed:`, error.message);
      failed.push({ network: networkName, error: error.message });
    }
  }

  // Save results
  if (results.length > 0) {
    await saveDeploymentResults(results);
  }

  // Summary
  console.log("\n==============================================");
  console.log("Deployment Summary");
  console.log("==============================================");
  console.log(`Successful: ${results.length}/${targetNetworks.length}`);
  console.log(`Failed: ${failed.length}/${targetNetworks.length}`);

  if (failed.length > 0) {
    console.log("\nFailed deployments:");
    failed.forEach(f => {
      console.log(`  - ${f.network}: ${f.error}`);
    });
  }

  if (results.length > 0) {
    console.log("\n✓ Deployments complete!");
    console.log("Check deployments/ folder for contract addresses and details.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
