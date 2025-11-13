const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Updating .env file with contract addresses...\n");

  // Read deployment.json
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Error: deployment.json not found!");
    console.error("   Please deploy contracts first: npm run deploy:payroll");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const payrollInfo = deployment.payrollManagement;

  if (!payrollInfo || !payrollInfo.payrollContract) {
    console.error("❌ Error: PayrollManagement contract address not found in deployment.json");
    process.exit(1);
  }

  const payrollAddress = payrollInfo.payrollContract;
  console.log("Found PayrollManagement contract:", payrollAddress);
  console.log("");

  // Read or create .env file
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    console.log("✓ Found existing .env file");
  } else {
    console.log("⚠ No .env file found, creating new one...");
    envContent = `# Blockchain Network Configuration
PRIVATE_KEY=
SEPOLIA_RPC_URL=

# Contract Addresses
PAYROLL_CONTRACT=
KPI_CONTRACT=0x0000000000000000000000000000000000000000
ATTENDANCE_CONTRACT=0x0000000000000000000000000000000000000000
PAYROLL_TOKEN=0x0000000000000000000000000000000000000000
`;
  }

  // Update PAYROLL_CONTRACT
  const payrollRegex = /^PAYROLL_CONTRACT=.*$/m;
  if (payrollRegex.test(envContent)) {
    envContent = envContent.replace(payrollRegex, `PAYROLL_CONTRACT=${payrollAddress}`);
    console.log("✓ Updated PAYROLL_CONTRACT");
  } else {
    envContent += `\nPAYROLL_CONTRACT=${payrollAddress}\n`;
    console.log("✓ Added PAYROLL_CONTRACT");
  }

  // Update other contract addresses if available
  if (deployment.kpiManagement?.kpiContract) {
    const kpiRegex = /^KPI_CONTRACT=.*$/m;
    if (kpiRegex.test(envContent)) {
      envContent = envContent.replace(kpiRegex, `KPI_CONTRACT=${deployment.kpiManagement.kpiContract}`);
      console.log("✓ Updated KPI_CONTRACT");
    }
  }

  if (deployment.consentManagement?.consentContract) {
    // Handle consent if needed
  }

  // Write updated .env
  fs.writeFileSync(envPath, envContent);
  console.log("");
  console.log("✅ .env file updated successfully!");
  console.log("");
  console.log("Next steps:");
  console.log("1. Review .env file and add any missing values (PRIVATE_KEY, etc.)");
  console.log("2. Restart backend server: npm run dev");
  console.log("3. Test from frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });

