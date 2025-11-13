# Hướng dẫn Deploy Smart Contract PayrollManagement

## Bước 1: Chuẩn bị môi trường

### 1.1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 1.2. Cấu hình môi trường

Tạo file `.env` trong thư mục `backend`:

```env
# Blockchain Network Configuration
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Contract Addresses (sẽ được cập nhật sau khi deploy)
PAYROLL_CONTRACT=0x0000000000000000000000000000000000000000
KPI_CONTRACT=0x0000000000000000000000000000000000000000
ATTENDANCE_CONTRACT=0x0000000000000000000000000000000000000000
PAYROLL_TOKEN=0x0000000000000000000000000000000000000000
```

**Lưu ý:** 
- `PRIVATE_KEY`: Private key của account dùng để deploy (không có `0x` prefix)
- `PAYROLL_TOKEN`: Địa chỉ ERC20 token (để `0x0000...` nếu dùng ETH)
- `KPI_CONTRACT` và `ATTENDANCE_CONTRACT`: Có thể để `0x0000...` nếu chưa deploy

## Bước 2: Khởi động Hardhat Local Node (Development)

Mở terminal mới và chạy:

```bash
cd backend
npm run node
```

Hoặc:

```bash
npx hardhat node
```

Node sẽ chạy trên `http://localhost:8545` với 20 accounts được unlock sẵn.

**Lưu ý:** Giữ terminal này mở trong khi development.

## Bước 3: Deploy Contract

### 3.1. Compile Contract

```bash
npm run compile
```

### 3.2. Deploy lên Localhost

```bash
npm run deploy:payroll
```

Hoặc:

```bash
npx hardhat run scripts/deploy-payroll.js --network localhost
```

### 3.3. Deploy lên Sepolia Testnet (Production-like)

```bash
npm run deploy:payroll:sepolia
```

Hoặc:

```bash
npx hardhat run scripts/deploy-payroll.js --network sepolia
```

**Lưu ý:** Cần có Sepolia ETH trong account để trả gas fee.

## Bước 4: Cập nhật .env

Sau khi deploy thành công, bạn sẽ thấy output như sau:

```
==========================================
Deployment Summary
==========================================
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Network: localhost
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
==========================================
```

Cập nhật file `.env`:

```env
PAYROLL_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## Bước 5: Grant HR Role

Sau khi deploy, deployer account đã có ADMIN_ROLE và HR_ROLE. Nếu muốn grant HR role cho các accounts khác:

```bash
# Grant cho một address
npm run grant:hr 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Hoặc với nhiều addresses
HR_ADDRESSES=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,0x8ba1f109551bD432803012645Hac136c22C9e00 npm run grant:hr
```

## Bước 6: Kiểm tra Deployment

Kiểm tra file `deployment.json` đã được tạo với thông tin deployment:

```json
{
  "payrollManagement": {
    "network": "localhost",
    "chainId": "31337",
    "payrollContract": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Bước 7: Khởi động Backend Server

```bash
npm run dev
```

Backend sẽ đọc `PAYROLL_CONTRACT` từ `.env` và kết nối với contract.

## Troubleshooting

### Lỗi: "Cannot connect to blockchain node"

**Nguyên nhân:** Hardhat node chưa chạy hoặc đang chạy trên port khác.

**Giải pháp:**
1. Kiểm tra Hardhat node đang chạy: `npm run node`
2. Kiểm tra port trong `hardhat.config.js` là `8545`
3. Kiểm tra `backend/config/web3.js` có đúng provider URL

### Lỗi: "Payroll contract is not deployed"

**Nguyên nhân:** `PAYROLL_CONTRACT` trong `.env` chưa được cập nhật hoặc sai địa chỉ.

**Giải pháp:**
1. Kiểm tra `deployment.json` để lấy địa chỉ contract
2. Cập nhật `PAYROLL_CONTRACT` trong `.env`
3. Restart backend server

### Lỗi: "Account is not unlocked"

**Nguyên nhân:** Account không có trong Hardhat node hoặc không được unlock.

**Giải pháp:**
1. Với Hardhat local node, tất cả accounts đều được unlock
2. Kiểm tra wallet address trong database có đúng format
3. Đảm bảo account có trong danh sách accounts của Hardhat node

### Lỗi: "Insufficient funds"

**Nguyên nhân:** Account không có đủ ETH để trả gas fee.

**Giải pháp:**
1. Với Hardhat local node, tất cả accounts có 10000 ETH
2. Với testnet, cần request testnet ETH từ faucet
3. Kiểm tra balance: `npx hardhat run scripts/check-balance.js --network localhost`

## Quick Start Commands

```bash
# 1. Start Hardhat node (terminal 1)
npm run node

# 2. Deploy contract (terminal 2)
npm run deploy:payroll

# 3. Update .env với contract address

# 4. Start backend (terminal 2)
npm run dev

# 5. Grant HR role (nếu cần)
npm run grant:hr 0x...
```

## Next Steps

1. ✅ Deploy KPI Management contract (nếu chưa có)
2. ✅ Deploy Attendance Management contract (nếu chưa có)
3. ✅ Update `KPI_CONTRACT` và `ATTENDANCE_CONTRACT` trong `.env`
4. ✅ Set KPI contract address trong PayrollManagement: `setKpiContract()`
5. ✅ Set Attendance contract address: `setAttendanceContract()`
6. ✅ Test các functions từ frontend

## Production Deployment

Khi deploy lên production:

1. Sử dụng mainnet hoặc production network
2. Sử dụng hardware wallet hoặc secure key management
3. Verify contract trên Etherscan
4. Set up monitoring và alerts
5. Document tất cả contract addresses
6. Backup deployment info

## Security Checklist

- [ ] Private key được bảo mật (không commit vào git)
- [ ] Contract đã được audit (nếu cần)
- [ ] Access control đã được test
- [ ] Reentrancy protection đã được verify
- [ ] Events được emit đầy đủ cho audit
- [ ] Backup deployment information

