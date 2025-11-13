const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Granting HR Role to addresses...\n");

  // Get network
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("Error: deployment.json not found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const payrollAddress = deployment.payrollManagement?.payrollContract;

  if (!payrollAddress) {
    console.error("Error: PayrollManagement contract address not found in deployment.json");
    process.exit(1);
  }

  console.log("PayrollManagement contract:", payrollAddress);
  console.log("");

  // Get contract
  const PayrollManagement = await ethers.getContractFactory("PayrollManagement");
  const payroll = PayrollManagement.attach(payrollAddress);

  // Get addresses from environment or command line args
  const hrAddresses = process.env.HR_ADDRESSES 
    ? process.env.HR_ADDRESSES.split(",").map(addr => addr.trim())
    : process.argv.slice(2);

  if (hrAddresses.length === 0) {
    console.log("Usage: npx hardhat run scripts/grant-hr-role.js --network <network> <address1> <address2> ...");
    console.log("Or set HR_ADDRESSES environment variable (comma-separated)");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Granting HR role with account:", deployer.address);
  console.log("");

  for (const address of hrAddresses) {
    if (!ethers.isAddress(address)) {
      console.warn(`⚠ Invalid address: ${address}, skipping...`);
      continue;
    }

    try {
      const checksumAddress = ethers.getAddress(address);
      console.log(`Granting HR role to: ${checksumAddress}...`);
      
      const tx = await payroll.grantHRRole(checksumAddress);
      await tx.wait();
      
      console.log(`✓ HR role granted to ${checksumAddress}`);
      console.log(`  Transaction: ${tx.hash}\n`);
    } catch (error) {
      console.error(`✗ Failed to grant HR role to ${address}:`, error.message);
    }
  }

  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

