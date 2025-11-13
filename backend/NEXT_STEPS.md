# Các Bước Tiếp Theo Sau Khi Deploy Contract Thành Công

## ✅ Bước 1: Kiểm tra Deployment Info

Sau khi deploy thành công, kiểm tra file `deployment.json`:

```bash
cat deployment.json
```

Hoặc mở file `backend/deployment.json` và lấy thông tin:
- `payrollContract`: Địa chỉ contract đã deploy
- `deployer`: Địa chỉ account deployer (đã có ADMIN_ROLE và HR_ROLE)

---

## ✅ Bước 2: Cập nhật .env File

Mở file `.env` trong thư mục `backend` và cập nhật:

```env
# Contract Addresses
PAYROLL_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3  # Thay bằng địa chỉ từ deployment.json

# Các contract khác (có thể để 0x0000... nếu chưa deploy)
KPI_CONTRACT=0x0000000000000000000000000000000000000000
ATTENDANCE_CONTRACT=0x0000000000000000000000000000000000000000
PAYROLL_TOKEN=0x0000000000000000000000000000000000000000
```

**Lưu ý:** 
- Thay `0x5FbDB2315678afecb367f032d93F642f64180aa3` bằng địa chỉ contract thực tế từ `deployment.json`
- Nếu chưa có file `.env`, tạo mới trong thư mục `backend`

---

## ✅ Bước 3: Grant HR Role (Nếu cần)

Nếu bạn muốn grant HR role cho các accounts khác (không phải deployer):

```bash
# Grant cho một address
npm run grant:hr 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Hoặc grant cho nhiều addresses
HR_ADDRESSES=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,0x8ba1f109551bD432803012645Hac136c22C9e00 npm run grant:hr
```

**Lưu ý:** 
- Deployer account đã có ADMIN_ROLE và HR_ROLE từ constructor
- Chỉ cần grant nếu muốn thêm accounts khác

---

## ✅ Bước 4: Kiểm tra Wallet Address trong Database

Đảm bảo user accounts trong database có `walletAddress` đúng format:

1. Mở MongoDB hoặc database tool
2. Kiểm tra collection `hosonhanviens` (hoặc tương tự)
3. Đảm bảo các user có `walletAddress` là một trong các addresses từ Hardhat node

**Các addresses có sẵn trong Hardhat node:**
- Account #0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Account #1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- ... (xem output từ `npm run node`)

**Cách cập nhật wallet address:**
- Qua API: `PUT /api/employees/:id/wallet`
- Hoặc trực tiếp trong database

---

## ✅ Bước 5: Start Backend Server

Trong **Terminal 3** (terminal mới), chạy:

```bash
cd backend
npm run dev
```

Hoặc:

```bash
npm start
```

**Kiểm tra:**
- Server chạy trên port 5000 (hoặc port trong .env)
- Không có lỗi về contract connection
- Log hiển thị: "Web3 initialized for network: Localhost"

---

## ✅ Bước 6: Test từ Frontend

1. **Start frontend** (nếu chưa chạy):
   ```bash
   cd frontend
   npm start
   ```

2. **Đăng nhập** với account có HR role

3. **Vào trang Quản lý lương thưởng** (Payroll Management)

4. **Test các chức năng:**
   - ✅ Thiết lập lương cho nhân viên
   - ✅ Tạo phiếu lương
   - ✅ Xem danh sách payroll
   - ✅ Thanh toán lương (nếu có quyền Admin)

---

## ✅ Bước 7: Test API Endpoints

Test các API endpoints từ Postman hoặc curl:

### 7.1. Kiểm tra contract balance
```bash
curl http://localhost:5000/api/payroll-contract/balance/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7.2. Set employee salary
```bash
curl -X POST http://localhost:5000/api/payroll-contract/salary/set \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeDid": "EMP001",
    "baseSalary": 10000000,
    "kpiBonus": 10,
    "allowance": 2000000,
    "taxRate": 10
  }'
```

### 7.3. Get employee salary
```bash
curl http://localhost:5000/api/payroll-contract/salary/EMP001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Bước 8: Deposit Funds (Nếu cần)

Nếu muốn test thanh toán lương, cần deposit funds vào contract:

### Qua API:
```bash
curl -X POST http://localhost:5000/api/payroll-contract/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": "1000000000000000000"
  }'
```

### Hoặc trực tiếp qua contract:
- Sử dụng MetaMask hoặc Hardhat console
- Gọi function `depositFunds()` với ETH amount

---

## ✅ Bước 9: Kiểm tra Logs

Kiểm tra backend logs để đảm bảo không có lỗi:

1. **Contract connection:**
   - ✅ "Connected to blockchain, current block: X"
   - ✅ "Contract address: 0x..."

2. **Transaction logs:**
   - ✅ "Transaction successful: 0x..."
   - ✅ "Salary set successfully"

3. **Errors (nếu có):**
   - ❌ "Cannot connect to blockchain node" → Kiểm tra Hardhat node
   - ❌ "Payroll contract is not deployed" → Kiểm tra .env
   - ❌ "Account is not unlocked" → Kiểm tra wallet address

---

## ✅ Bước 10: Troubleshooting

### Lỗi: "Payroll contract is not deployed"
**Giải pháp:**
1. Kiểm tra `PAYROLL_CONTRACT` trong `.env`
2. Đảm bảo địa chỉ đúng từ `deployment.json`
3. Restart backend server

### Lỗi: "Cannot connect to blockchain node"
**Giải pháp:**
1. Kiểm tra Hardhat node đang chạy (Terminal 1)
2. Kiểm tra port 8545 không bị block
3. Kiểm tra `backend/config/web3.js` có đúng provider URL

### Lỗi: "Wallet address not found"
**Giải pháp:**
1. Kiểm tra user có `walletAddress` trong database
2. Đảm bảo wallet address là một trong các addresses từ Hardhat node
3. Cập nhật wallet address qua API hoặc database

### Lỗi: "Only HR or admin can perform this action"
**Giải pháp:**
1. Kiểm tra user có HR_ROLE hoặc ADMIN_ROLE
2. Grant HR role: `npm run grant:hr <address>`
3. Đảm bảo wallet address trong token match với address trong contract

---

## 📋 Checklist Hoàn Thành

Sau khi hoàn thành tất cả các bước, bạn nên có:

- [ ] Contract đã deploy và có địa chỉ trong `deployment.json`
- [ ] File `.env` đã cập nhật với `PAYROLL_CONTRACT`
- [ ] Backend server chạy không có lỗi
- [ ] Frontend có thể kết nối và sử dụng payroll features
- [ ] Có thể set salary cho nhân viên
- [ ] Có thể tạo payroll records
- [ ] Có thể xem danh sách payroll
- [ ] (Optional) Có thể thanh toán lương

---

## 🎉 Hoàn Thành!

Nếu tất cả các bước trên đều thành công, bạn đã sẵn sàng sử dụng hệ thống Payroll Management với Smart Contract!

**Next Steps:**
- Deploy KPI Management contract (nếu chưa có)
- Deploy Attendance Management contract (nếu chưa có)
- Set KPI contract address: `setKpiContract()`
- Set Attendance contract address: `setAttendanceContract()`
- Test integration end-to-end

