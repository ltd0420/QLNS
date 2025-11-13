# Smart Contracts Documentation

## PayrollManagement Contract

Contract quản lý lương thưởng với tích hợp KPI và chấm công.

### Features

- ✅ Quản lý lương nhân viên (base salary, KPI bonus, allowance, tax)
- ✅ Tạo và quản lý payroll records
- ✅ Tích hợp với KPI Management contract
- ✅ Tích hợp với Attendance Management contract
- ✅ Hỗ trợ thanh toán bằng ETH hoặc ERC20 token
- ✅ Role-based access control (Admin, HR, Employee)
- ✅ Transaction tracking và audit logs

### Deployment

#### 1. Cài đặt dependencies

```bash
cd backend
npm install
```

#### 2. Cấu hình môi trường

Tạo file `.env` trong thư mục `backend`:

```env
# Blockchain Network
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Contract Addresses (sẽ được cập nhật sau khi deploy)
PAYROLL_CONTRACT=0x0000000000000000000000000000000000000000
KPI_CONTRACT=0x0000000000000000000000000000000000000000
ATTENDANCE_CONTRACT=0x0000000000000000000000000000000000000000
PAYROLL_TOKEN=0x0000000000000000000000000000000000000000
```

#### 3. Khởi động Hardhat local node (cho development)

```bash
npx hardhat node
```

Node sẽ chạy trên `http://localhost:8545` với 20 accounts được unlock sẵn.

#### 4. Deploy contract

**Deploy lên localhost:**
```bash
npx hardhat run scripts/deploy-payroll.js --network localhost
```

**Deploy lên Sepolia testnet:**
```bash
npx hardhat run scripts/deploy-payroll.js --network sepolia
```

Sau khi deploy, địa chỉ contract sẽ được lưu vào `deployment.json` và hiển thị trên console.

#### 5. Cập nhật .env

Sau khi deploy, cập nhật file `.env` với địa chỉ contract:

```env
PAYROLL_CONTRACT=0x... (địa chỉ từ deployment.json)
```

### Grant Roles

Sau khi deploy, bạn cần grant HR role cho các admin accounts:

```bash
# Grant HR role cho một address
npx hardhat run scripts/grant-hr-role.js --network localhost 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Grant HR role cho nhiều addresses (comma-separated)
HR_ADDRESSES=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,0x8ba1f109551bD432803012645Hac136c22C9e00 npx hardhat run scripts/grant-hr-role.js --network localhost
```

### Contract Functions

#### Employee Salary Management

```solidity
// Set employee salary (only HR)
function setEmployeeSalary(
    string memory employeeDid,
    uint256 baseSalary,
    uint256 kpiBonus,
    uint256 allowance,
    uint256 taxRate,
    uint256 overtimeRate
) external onlyHR

// Update employee salary (only HR)
function updateEmployeeSalary(...) external onlyHR

// Get employee salary
function getEmployeeSalary(string memory employeeDid) external view returns (EmployeeSalary memory)
```

#### Payroll Management

```solidity
// Create payroll with automatic KPI and attendance (only HR)
function createPayroll(string memory employeeDid, string memory period) external onlyHR returns (uint256)

// Create payroll with manual data (only HR)
function createPayrollManual(
    string memory employeeDid,
    string memory period,
    uint256 kpiScore,
    uint256 workingDays,
    uint256 overtimeHours
) external onlyHR returns (uint256)

// Pay employee (only Admin)
function payEmployee(uint256 payrollId) external onlyAdmin nonReentrant

// Get payroll record
function getPayrollRecord(uint256 payrollId) external view returns (PayrollRecord memory)
```

#### Salary Calculation

```solidity
// Calculate salary with automatic KPI and attendance
function calculateNetSalaryAuto(string memory employeeDid, string memory period) 
    external view returns (...)

// Calculate salary with manual data
function calculateNetSalaryManual(
    string memory employeeDid,
    uint256 kpiScore,
    uint256 workingDays,
    uint256 overtimeHours
) external view returns (...)
```

#### Fund Management

```solidity
// Deposit funds to contract
function depositFunds(uint256 amount) external payable

// Withdraw funds (only Owner)
function withdrawFunds(uint256 amount) external onlyOwner nonReentrant

// Get contract balance
function getContractBalance() external view returns (uint256)

// Get balance summary
function getBalanceSummary() external view returns (uint256, uint256, uint256, bool)
```

### Events

Contract emit các events sau:

- `EmployeeSalarySet` - Khi thiết lập lương nhân viên
- `PayrollCreated` - Khi tạo payroll record
- `PayrollApproved` - Khi approve payroll
- `PayrollPaid` - Khi thanh toán lương
- `PayrollCancelled` - Khi hủy payroll
- `FundsDeposited` - Khi nạp tiền vào contract
- `FundsWithdrawn` - Khi rút tiền từ contract
- `TransactionRecorded` - Khi ghi nhận transaction

### Testing

```bash
# Run tests
npx hardhat test

# Run tests với coverage
npx hardhat coverage
```

### Troubleshooting

#### 1. Contract không deploy được

- Kiểm tra Hardhat node đang chạy (localhost)
- Kiểm tra private key và RPC URL (testnet)
- Kiểm tra account có đủ ETH để trả gas

#### 2. Transaction bị revert

- Kiểm tra account có role phù hợp (HR/Admin)
- Kiểm tra employee salary đã được set
- Kiểm tra contract balance đủ để thanh toán

#### 3. Không kết nối được blockchain node

- Đảm bảo Hardhat node đang chạy trên port 8545
- Kiểm tra firewall không chặn kết nối
- Kiểm tra RPC URL đúng (testnet)

### Integration với Backend

Backend sử dụng Web3.js để tương tác với contract. Xem `backend/controllers/payrollContractController.js` để biết cách sử dụng.

### Security Best Practices

1. ✅ Sử dụng AccessControl cho role management
2. ✅ Sử dụng ReentrancyGuard cho các hàm thanh toán
3. ✅ Validate input parameters
4. ✅ Sử dụng SafeMath (Solidity 0.8+ có built-in overflow protection)
5. ✅ Events cho audit trail
6. ✅ Non-reentrant cho các hàm transfer funds

### Gas Optimization

- Contract sử dụng optimizer với 200 runs
- Sử dụng `uint256` thay vì `uint8` cho gas efficiency
- Pack structs để giảm storage costs
- Sử dụng events thay vì storage cho logging

### References

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org)

