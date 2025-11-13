const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Helper function to wait for node to be ready
async function waitForNode(provider, maxRetries = 10, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await provider.getBlockNumber();
      return true;
    } catch (error) {
      if (i < maxRetries - 1) {
        console.log(`Waiting for node to be ready... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`Cannot connect to node after ${maxRetries} attempts. Make sure Hardhat node is running on http://127.0.0.1:8545`);
      }
    }
  }
}

async function main() {
  console.log("==========================================");
  console.log("Deploying PayrollManagement Contract");
  console.log("==========================================\n");

  // Get provider and wait for connection
  const provider = ethers.provider;
  console.log("Checking connection to Hardhat node...");
  await waitForNode(provider);
  console.log("✓ Connected to Hardhat node\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString(), "\n");

  // Contract addresses (can be set to address(0) if not deployed yet)
  const payrollToken = process.env.PAYROLL_TOKEN || ethers.ZeroAddress; // ERC20 token address (0x0 for ETH)
  const kpiContract = process.env.KPI_CONTRACT || ethers.ZeroAddress; // KPI contract address (0x0 if not deployed)
  const attendanceContract = process.env.ATTENDANCE_CONTRACT || ethers.ZeroAddress; // Attendance contract address (0x0 if not deployed)

  console.log("Contract Parameters:");
  console.log("  Payroll Token:", payrollToken);
  console.log("  KPI Contract:", kpiContract);
  console.log("  Attendance Contract:", attendanceContract);
  console.log("");

  // Deploy PayrollManagement contract
  console.log("Deploying PayrollManagement...");
  const PayrollManagement = await ethers.getContractFactory("PayrollManagement");
  const payrollManagement = await PayrollManagement.deploy(
    payrollToken,
    kpiContract,
    attendanceContract
  );
  
  await payrollManagement.waitForDeployment();
  const payrollAddress = await payrollManagement.getAddress();
  
  console.log("✓ PayrollManagement deployed to:", payrollAddress);
  console.log("");

  // Get deployment transaction
  const deploymentTx = payrollManagement.deploymentTransaction();
  if (deploymentTx) {
    console.log("Deployment transaction hash:", deploymentTx.hash);
    console.log("Waiting for confirmation...");
    await deploymentTx.wait();
    console.log("✓ Contract confirmed\n");
  }

  // Grant roles to deployer (optional - deployer already has admin role from constructor)
  console.log("Setting up roles...");
  try {
    // Deployer already has ADMIN_ROLE and HR_ROLE from constructor
    console.log("✓ Deployer has ADMIN_ROLE and HR_ROLE");
    
    // If you want to grant HR role to another address, uncomment below:
    // const hrAddress = process.env.HR_ADDRESS;
    // if (hrAddress && ethers.isAddress(hrAddress)) {
    //   await payrollManagement.grantHRRole(hrAddress);
    //   console.log("✓ HR_ROLE granted to:", hrAddress);
    // }
  } catch (error) {
    console.warn("Warning: Could not set up roles:", error.message);
  }
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    payrollContract: payrollAddress,
    deployer: deployer.address,
    payrollToken: payrollToken,
    kpiContract: kpiContract,
    attendanceContract: attendanceContract,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  // Save to deployment.json
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  let existingDeployment = {};
  
  if (fs.existsSync(deploymentPath)) {
    try {
      existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    } catch (error) {
      console.warn("Could not read existing deployment.json, creating new one");
    }
  }

  existingDeployment.payrollManagement = deploymentInfo;
  fs.writeFileSync(deploymentPath, JSON.stringify(existingDeployment, null, 2));
  console.log("✓ Deployment info saved to deployment.json");
  console.log("");

  // Print summary
  console.log("==========================================");
  console.log("Deployment Summary");
  console.log("==========================================");
  console.log("Contract Address:", payrollAddress);
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("==========================================\n");

  // Instructions
  console.log("Next steps:");
  console.log("1. Update your .env file with:");
  console.log(`   PAYROLL_CONTRACT=${payrollAddress}`);
  console.log("");
  console.log("2. If deploying other contracts, update:");
  console.log(`   KPI_CONTRACT=${kpiContract || "<deploy-first>"}`);
  console.log(`   ATTENDANCE_CONTRACT=${attendanceContract || "<deploy-first>"}`);
  console.log("");
  console.log("3. Grant HR role to admin accounts:");
  console.log(`   npx hardhat run scripts/grant-hr-role.js --network ${network.name}`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exit(1);
  });

