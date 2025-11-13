# Quick Start Guide - Deploy PayrollManagement Contract

## ⚠️ QUAN TRỌNG: Chạy trong 2 Terminal riêng biệt

Bạn **PHẢI** chạy Hardhat node và deploy script trong **2 terminal riêng biệt**!

---

## Bước 1: Terminal 1 - Start Hardhat Node

Mở **Terminal 1** và chạy:

```bash
cd backend
npm run node
```

**Giữ terminal này mở!** Bạn sẽ thấy output như:

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
...
```

✅ **Đợi đến khi thấy "Started HTTP and WebSocket JSON-RPC server"**

---

## Bước 2: Terminal 2 - Kiểm tra kết nối (Tùy chọn)

Mở **Terminal 2** (terminal mới) và kiểm tra kết nối:

```bash
cd backend
npm run check:node
```

Nếu thành công, bạn sẽ thấy:
```
✓ Successfully connected to Hardhat node!
  Network: localhost
  Chain ID: 31337
  Current Block: 0
  Node is ready for deployment!
```

---

## Bước 3: Terminal 2 - Deploy Contract

Trong **Terminal 2** (cùng terminal với bước 2), chạy:

```bash
npm run deploy:payroll
```

Hoặc:

```bash
npx hardhat run scripts/deploy-payroll.js --network localhost
```

---

## Bước 3.5: Terminal 2 - Unlock các ví lấy từ Mongo Atlas

Nếu nhân viên có `walletAddress` không nằm trong 20 ví mặc định của Hardhat, bạn cần giả lập (impersonate) những ví đó để node cho phép ký giao dịch:

```bash
npm run impersonate
```

Script sẽ tự đọc toàn bộ `walletAddress` từ Mongo Atlas và unlock từng địa chỉ.

Nếu bạn chỉ muốn unlock một vài địa chỉ cụ thể, có thể truyền thủ công:

```bash
npm run impersonate -- 0xWalletEmployee1 0xWalletEmployee2
```

Hoặc dùng biến môi trường:

```bash
IMPERSONATE_ACCOUNTS=0xWalletEmployee1,0xWalletEmployee2 npm run impersonate
```

Script sẽ:
- Unlock các địa chỉ đó trên Hardhat node.
- Nạp 10 ETH test cho mỗi ví.
- In log xác nhận "Signer ready".

⚠️ Mỗi lần bạn khởi động lại `npm run node`, cần chạy lại bước này.

---

## Bước 4: Cập nhật .env

Sau khi deploy thành công, bạn sẽ thấy:

```
==========================================
Deployment Summary
==========================================
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Network: localhost
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
==========================================
```

Cập nhật file `.env` trong thư mục `backend`:

```env
PAYROLL_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## Bước 5: Grant HR Role (Nếu cần)

Nếu muốn grant HR role cho accounts khác:

```bash
npm run grant:hr 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

---

## Troubleshooting

### Lỗi: "Cannot connect to the network localhost"

**Nguyên nhân:** Hardhat node chưa chạy hoặc đã bị tắt.

**Giải pháp:**
1. Kiểm tra Terminal 1 - Hardhat node có đang chạy không
2. Đảm bảo thấy message "Started HTTP and WebSocket JSON-RPC server"
3. Chạy lại: `npm run check:node` để kiểm tra kết nối

### Lỗi: "connect ECONNREFUSED 127.0.0.1:8545"

**Nguyên nhân:** 
- Hardhat node chưa start
- Hoặc đang chạy trên port khác

**Giải pháp:**
1. Start Hardhat node trong Terminal 1: `npm run node`
2. Đợi đến khi thấy "Started HTTP and WebSocket JSON-RPC server"
3. Kiểm tra port trong `hardhat.config.js` là `8545`

### Lỗi: Node.js version warning

**Cảnh báo:** "You are currently using Node.js v24.10.0, which is not supported by Hardhat"

**Giải pháp:**
- Cảnh báo này không ngăn deployment, nhưng có thể gây lỗi
- Khuyến nghị: Sử dụng Node.js v18 hoặc v20
- Có thể tiếp tục nếu không gặp lỗi

### Lỗi: "Account ... is not unlocked or not available"

**Nguyên nhân:** Ví của nhân viên trong Mongo Atlas không nằm trong danh sách ví Hardhat đã unlock.

**Giải pháp:**
1. Giữ nguyên địa chỉ ví lấy từ Mongo Atlas.
2. Unlock ví đó trên Hardhat:
   ```bash
   npm run impersonate -- 0xWalletFromMongo
   ```
3. Kiểm tra log thấy "Signer ready".
4. Thử lại thao tác thiết lập lương.
5. Nhớ chạy lại sau khi restart `npm run node`.

---

## Tóm tắt Commands

```bash
# Terminal 1: Start node (giữ mở)
npm run node

# Terminal 2: Check connection
npm run check:node

# Terminal 2: Deploy contract
npm run deploy:payroll

# Terminal 2: Grant HR role (nếu cần)
npm run grant:hr 0x...
```

---

## Lưu ý

1. ✅ **Luôn chạy Hardhat node trong terminal riêng** và giữ nó mở
2. ✅ **Đợi node sẵn sàng** trước khi deploy (thấy "Started HTTP...")
3. ✅ **Cập nhật .env** sau khi deploy thành công
4. ✅ **Restart backend server** sau khi cập nhật .env

---

## Next Steps

Sau khi deploy thành công:

1. ✅ Cập nhật `PAYROLL_CONTRACT` trong `.env`
2. ✅ Start backend server: `npm run dev`
3. ✅ Test từ frontend
4. ✅ Grant HR role cho admin accounts (nếu cần)

