// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Define deployment parameters
  const fee = ethers.utils.parseEther("0.01"); // 0.01 ETH per request
  const oracleNodeAddress = deployer.address; // For testing, use deployer as oracle
  
  console.log(`Deploying with fee: ${ethers.utils.formatEther(fee)} ETH`);
  console.log(`Oracle node address: ${oracleNodeAddress}`);

  // Deploy the QuantumRandomnessOracle contract
  const QuantumRandomnessOracle = await ethers.getContractFactory("QuantumRandomnessOracle");
  const oracleContract = await QuantumRandomnessOracle.deploy(fee, oracleNodeAddress);
  
  await oracleContract.deployed();

  console.log("QuantumRandomnessOracle deployed to:", oracleContract.address);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: oracleContract.address,
    deployer: deployer.address,
    fee: fee.toString(),
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync("deployments/deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployments/deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });