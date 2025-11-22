# Hướng Dẫn Deploy Backend Lên Render - Bản Tóm Tắt

## 🚀 Các Bước Deploy Backend

### Bước 1: Đăng Ký Render (Nếu chưa có)

1. Truy cập: https://render.com
2. Click **"Get Started for Free"**
3. Đăng ký bằng GitHub (khuyến nghị) để kết nối trực tiếp với repository

---

### Bước 2: Tạo Web Service

1. Trong Dashboard Render, click **"New +"** → **"Web Service"**
2. Chọn repository: `ltd0420/QLNS` (hoặc connect nếu chưa có)
3. Click **"Connect"**

---

### Bước 3: Cấu Hình Service

Điền các thông tin sau:

#### Thông Tin Cơ Bản:
- **Name**: `web3-hr-backend` (hoặc tên bạn muốn)
- **Region**: `Singapore` (gần Việt Nam nhất)
- **Branch**: `main`
- **Root Directory**: `backend` ⚠️ **QUAN TRỌNG!**

#### Build & Start Commands:
- **Build Command**: 
  ```bash
  npm install
  ```
- **Start Command**: 
  ```bash
  npm start
  ```

#### Runtime Settings:
- **Runtime**: `Node`
- **Node Version**: `18` (hoặc để mặc định)

---

### Bước 4: Cấu Hình Environment Variables

Scroll xuống phần **"Environment Variables"** và thêm các biến sau:

#### ⚠️ Biến Bắt Buộc:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://nguyenhuy4435:nhathuy812@clusterweb3.5tqfgfq.mongodb.net/test?retryWrites=true&w=majority
JWT_SECRET=<tạo-key-ngẫu-nhiên-32-ký-tự-trở-lên>
FRONTEND_URL=http://localhost:3000
```

#### 📝 Tạo JWT_SECRET:

Chạy lệnh sau để tạo JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy kết quả và paste vào biến `JWT_SECRET` trong Render.

#### 🔧 Biến Tùy Chọn (nếu cần):

```env
# ML Service (nếu đã deploy)
ML_SERVICE_URL=https://your-ml-service.onrender.com

# Web3 (nếu sử dụng blockchain)
PRIVATE_KEY=your-private-key
MNEMONIC=your-mnemonic-phrase

# Smart Contracts (nếu đã deploy)
PAYROLL_CONTRACT=0x...
KPI_CONTRACT=0x...
# ... các contract khác
```

---

### Bước 5: Deploy

1. Sau khi cấu hình xong, click **"Create Web Service"**
2. Render sẽ bắt đầu build và deploy
3. Quá trình này mất khoảng 5-10 phút
4. Xem logs trong tab **"Logs"** để theo dõi quá trình

---

### Bước 6: Kiểm Tra Deploy

Sau khi deploy xong, bạn sẽ có URL dạng:
```
https://web3-hr-backend.onrender.com
```

Truy cập URL này, bạn sẽ thấy:
```
Web3 HR Management API is running...
```

---

## ✅ Checklist Trước Khi Deploy

- [x] Code đã được push lên GitHub: `https://github.com/ltd0420/QLNS.git`
- [ ] Đã tạo tài khoản Render
- [ ] Đã kết nối GitHub với Render
- [ ] Đã set **Root Directory**: `backend`
- [ ] Đã thêm tất cả Environment Variables
- [ ] Đã tạo JWT_SECRET
- [ ] MongoDB URI đã được set đúng

---

## 🔍 Xử Lý Lỗi Thường Gặp

### Lỗi: "Cannot find module"
- **Nguyên nhân**: Root Directory chưa đúng
- **Giải pháp**: Kiểm tra lại Root Directory = `backend`

### Lỗi: "MongoDB connection failed"
- **Nguyên nhân**: MONGODB_URI sai hoặc IP chưa whitelist
- **Giải pháp**: 
  - Kiểm tra lại MONGODB_URI
  - Vào MongoDB Atlas → Network Access → Add IP `0.0.0.0/0`

### Lỗi: "JWT_SECRET is not defined"
- **Nguyên nhân**: Chưa set biến JWT_SECRET
- **Giải pháp**: Thêm JWT_SECRET vào Environment Variables

### Lỗi: Build timeout
- **Nguyên nhân**: Dependencies quá lớn
- **Giải pháp**: Kiểm tra `package.json`, loại bỏ dependencies không cần thiết

---

## 📝 Lưu Ý Quan Trọng

1. **Root Directory**: Phải là `backend` (không phải root của repo)
2. **PORT**: Render tự động set, không cần config trong code
3. **Free Tier**: Service sẽ sleep sau 15 phút không có request
4. **Auto-Deploy**: Bật để tự động deploy khi có commit mới

---

## 🔗 Liên Kết Hữu Ích

- [Render Dashboard](https://dashboard.render.com)
- [Render Documentation](https://render.com/docs)
- [Hướng dẫn chi tiết](./HUONG_DAN_DEPLOY_RENDER.md)

---

## 🎯 Sau Khi Deploy Thành Công

1. Lưu URL backend: `https://web3-hr-backend.onrender.com`
2. Cập nhật `FRONTEND_URL` trong Environment Variables (nếu đã deploy frontend)
3. Test API endpoints
4. Cấu hình CORS nếu cần

**Chúc bạn deploy thành công! 🚀**

