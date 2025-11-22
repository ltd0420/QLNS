# Hướng Dẫn Deploy Backend Lên Render

## Tổng Quan

Hướng dẫn này sẽ giúp bạn deploy backend của hệ thống Web3 HR Management lên Render - một platform cloud đơn giản và miễn phí cho các ứng dụng Node.js.

## Yêu Cầu Trước Khi Bắt Đầu

1. **Tài khoản GitHub/GitLab/Bitbucket**: Code của bạn cần được push lên một repository
2. **Tài khoản Render**: Đăng ký miễn phí tại [render.com](https://render.com)
3. **MongoDB Atlas**: Tài khoản MongoDB (miễn phí) hoặc sử dụng MongoDB của Render
4. **Các thông tin cần thiết**:
   - MongoDB connection string
   - JWT Secret key
   - Frontend URL (nếu đã deploy frontend)
   - Web3 private key (nếu sử dụng blockchain)
   - ML Service URL (nếu đã deploy ML service)

---

## Bước 1: Chuẩn Bị Repository

### 1.1. Đảm bảo code đã được commit và push lên Git

```bash
# Kiểm tra trạng thái
git status

# Nếu có thay đổi chưa commit
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2. Tạo file `.env.example` (tùy chọn nhưng khuyến nghị)

Tạo file `.env.example` trong thư mục `backend/` để làm mẫu:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.onrender.com

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ML Service (nếu có)
ML_SERVICE_URL=https://your-ml-service.onrender.com

# Web3 Configuration
PRIVATE_KEY=your-private-key-here
MNEMONIC=your-mnemonic-phrase-here

# Smart Contract Addresses
EMPLOYEE_REGISTRY_CONTRACT=0x0000000000000000000000000000000000000000
KPI_CONTRACT=0x0000000000000000000000000000000000000000
PAYROLL_CONTRACT=0x0000000000000000000000000000000000000000
ATTENDANCE_CONTRACT=0x0000000000000000000000000000000000000000
QR_AUTH_CONTRACT=0x0000000000000000000000000000000000000000
CONSENT_CONTRACT=0x0000000000000000000000000000000000000000
KPI_MANAGEMENT_CONTRACT=0x0000000000000000000000000000000000000000

# IPFS (nếu sử dụng)
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
IPFS_API_KEY=your-ipfs-api-key
IPFS_SECRET_KEY=your-ipfs-secret-key
```

**Lưu ý**: File `.env` thực tế KHÔNG được commit lên Git (đã có trong `.gitignore`)

---

## Bước 2: Đăng Ký và Đăng Nhập Render

1. Truy cập [render.com](https://render.com)
2. Click **"Get Started for Free"** hoặc **"Sign Up"**
3. Đăng ký bằng GitHub/GitLab/Bitbucket (khuyến nghị) hoặc email
4. Xác thực tài khoản qua email nếu cần

---

## Bước 3: Tạo Web Service Mới

### 3.1. Tạo Service

1. Trong Dashboard, click **"New +"** → **"Web Service"**
2. Chọn **"Connect a repository"** và chọn repository của bạn
3. Nếu chưa kết nối, click **"Configure account"** để kết nối GitHub/GitLab

### 3.2. Cấu Hình Service

Điền các thông tin sau:

- **Name**: `web3-hr-backend` (hoặc tên bạn muốn)
- **Region**: Chọn region gần nhất (ví dụ: Singapore cho Việt Nam)
- **Branch**: `main` hoặc `master` (tùy repository của bạn)
- **Root Directory**: `backend` (quan trọng!)
- **Runtime**: `Node`
- **Build Command**: 
  ```bash
  npm install
  ```
- **Start Command**: 
  ```bash
  npm start
  ```

### 3.3. Cấu Hình Nâng Cao (Advanced Settings)

Click **"Advanced"** để cấu hình thêm:

- **Auto-Deploy**: `Yes` (tự động deploy khi có commit mới)
- **Health Check Path**: `/` (hoặc để trống, app đã có healthcheck.js)
- **Dockerfile Path**: (để trống nếu không dùng Docker)

---

## Bước 4: Cấu Hình Biến Môi Trường (Environment Variables)

### 4.1. Thêm Biến Môi Trường

Trong trang cấu hình service, scroll xuống phần **"Environment Variables"** và thêm các biến sau:

#### Biến Bắt Buộc:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
FRONTEND_URL=https://your-frontend.onrender.com
```

#### Biến Tùy Chọn (nếu sử dụng):

```env
# ML Service
ML_SERVICE_URL=https://your-ml-service.onrender.com

# Web3
PRIVATE_KEY=your-private-key-without-0x-prefix
MNEMONIC=your twelve word mnemonic phrase here

# Smart Contracts (thay bằng địa chỉ thực tế)
EMPLOYEE_REGISTRY_CONTRACT=0x...
KPI_CONTRACT=0x...
PAYROLL_CONTRACT=0x...
ATTENDANCE_CONTRACT=0x...
QR_AUTH_CONTRACT=0x...
CONSENT_CONTRACT=0x...
KPI_MANAGEMENT_CONTRACT=0x...

# IPFS
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
IPFS_API_KEY=your-key
IPFS_SECRET_KEY=your-secret
```

### 4.2. Lưu Ý Quan Trọng:

- **JWT_SECRET**: Phải là chuỗi ngẫu nhiên, dài ít nhất 32 ký tự. Có thể tạo bằng:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **MONGODB_URI**: Lấy từ MongoDB Atlas hoặc Render MongoDB
- **FRONTEND_URL**: URL của frontend sau khi deploy (nếu chưa deploy, có thể để localhost tạm thời)
- **PORT**: Render tự động set biến này, không cần thêm

---

## Bước 5: Thiết Lập MongoDB

### Tùy Chọn 1: Sử Dụng MongoDB Atlas (Khuyến Nghị)

1. Truy cập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo cluster miễn phí
3. Tạo database user
4. Whitelist IP: Thêm `0.0.0.0/0` để cho phép mọi IP (hoặc IP của Render)
5. Lấy connection string và thêm vào biến môi trường `MONGODB_URI`

### Tùy Chọn 2: Sử Dụng Render MongoDB

1. Trong Render Dashboard, click **"New +"** → **"MongoDB"**
2. Chọn plan (Free tier có sẵn)
3. Sau khi tạo, Render sẽ tự động tạo biến môi trường `MONGODB_URI`
4. Copy connection string và thêm vào Web Service

---

## Bước 6: Deploy

### 6.1. Deploy Lần Đầu

1. Sau khi cấu hình xong, click **"Create Web Service"**
2. Render sẽ bắt đầu build và deploy
3. Quá trình này mất khoảng 5-10 phút
4. Bạn có thể xem logs trong tab **"Logs"**

### 6.2. Kiểm Tra Logs

Trong tab **"Logs"**, bạn sẽ thấy:
- Build logs: Quá trình cài đặt dependencies
- Runtime logs: Logs khi server chạy
- Lỗi (nếu có): Sẽ hiển thị màu đỏ

### 6.3. Kiểm Tra Health Check

Sau khi deploy xong, truy cập:
```
https://your-service-name.onrender.com/
```

Bạn sẽ thấy message: `Web3 HR Management API is running...`

---

## Bước 7: Xử Lý Lỗi Thường Gặp

### Lỗi 1: "Cannot find module"

**Nguyên nhân**: Dependencies chưa được cài đặt đúng

**Giải pháp**:
- Kiểm tra `package.json` có đầy đủ dependencies
- Đảm bảo `Root Directory` được set đúng là `backend`
- Kiểm tra build logs xem có lỗi `npm install` không

### Lỗi 2: "MongoDB connection failed"

**Nguyên nhân**: 
- `MONGODB_URI` sai hoặc chưa được set
- IP chưa được whitelist trong MongoDB Atlas

**Giải pháp**:
- Kiểm tra lại `MONGODB_URI` trong Environment Variables
- Whitelist IP `0.0.0.0/0` trong MongoDB Atlas Network Access
- Kiểm tra username/password trong connection string

### Lỗi 3: "JWT_SECRET is not defined"

**Nguyên nhân**: Biến môi trường `JWT_SECRET` chưa được set

**Giải pháp**:
- Thêm `JWT_SECRET` vào Environment Variables
- Đảm bảo giá trị đủ dài (ít nhất 32 ký tự)

### Lỗi 4: "Port already in use" hoặc "EADDRINUSE"

**Nguyên nhân**: Render tự động set PORT, không cần config trong code

**Giải pháp**:
- Đảm bảo trong `server.js` sử dụng `process.env.PORT || 5000`
- Không hardcode port trong code

### Lỗi 5: "Build timeout"

**Nguyên nhân**: Build quá lâu (thường do dependencies lớn)

**Giải pháp**:
- Kiểm tra `package.json`, loại bỏ dependencies không cần thiết
- Sử dụng `npm ci` thay vì `npm install` trong build command
- Nâng cấp plan (nếu cần)

---

## Bước 8: Cấu Hình Auto-Deploy

### 8.1. Bật Auto-Deploy

1. Vào **Settings** của service
2. Tìm phần **"Auto-Deploy"**
3. Chọn **"Yes"** để tự động deploy khi có commit mới

### 8.2. Manual Deploy

Nếu muốn deploy thủ công:
1. Vào tab **"Manual Deploy"**
2. Chọn branch và commit
3. Click **"Deploy"**

---

## Bước 9: Cấu Hình Custom Domain (Tùy Chọn)

### 9.1. Thêm Custom Domain

1. Vào **Settings** → **"Custom Domains"**
2. Click **"Add Custom Domain"**
3. Nhập domain của bạn (ví dụ: `api.yourdomain.com`)
4. Thêm CNAME record trong DNS provider:
   - **Type**: CNAME
   - **Name**: `api` (hoặc subdomain bạn muốn)
   - **Value**: `your-service-name.onrender.com`

### 9.2. SSL Certificate

Render tự động cung cấp SSL certificate (HTTPS) cho custom domain.

---

## Bước 10: Monitoring và Logs

### 10.1. Xem Logs

- **Real-time logs**: Tab **"Logs"** trong dashboard
- **Historical logs**: Render lưu logs trong 7 ngày (free tier)

### 10.2. Metrics

- **CPU Usage**: Xem trong tab **"Metrics"**
- **Memory Usage**: Xem trong tab **"Metrics"**
- **Request Count**: Xem trong tab **"Metrics"**

### 10.3. Alerts

Có thể cấu hình alerts khi:
- Service down
- High CPU/Memory usage
- Build failures

---

## Bước 11: Cấu Hình Health Check

Render tự động kiểm tra health của service. File `healthcheck.js` đã được tạo sẵn trong project.

Nếu muốn custom health check path:
1. Vào **Settings** → **"Health Check Path"**
2. Nhập path (ví dụ: `/health`)
3. Thêm route trong `server.js`:
   ```javascript
   app.get('/health', (req, res) => {
     res.status(200).json({ status: 'ok' });
   });
   ```

---

## Bước 12: Backup và Recovery

### 12.1. Backup Database

- **MongoDB Atlas**: Tự động backup (nếu dùng paid plan)
- **Render MongoDB**: Cần backup thủ công hoặc dùng script

### 12.2. Backup Code

Code đã được lưu trên Git, không cần backup riêng.

### 12.3. Backup Environment Variables

- Export danh sách biến môi trường ra file text (lưu an toàn)
- Hoặc sử dụng Render CLI để export

---

## Checklist Trước Khi Deploy

- [ ] Code đã được push lên Git repository
- [ ] `package.json` có đầy đủ dependencies
- [ ] `server.js` sử dụng `process.env.PORT`
- [ ] MongoDB đã được setup và có connection string
- [ ] Tất cả biến môi trường đã được thêm vào Render
- [ ] `JWT_SECRET` đã được tạo và set
- [ ] `FRONTEND_URL` đã được set (nếu có frontend)
- [ ] Root Directory được set đúng là `backend`
- [ ] Build Command và Start Command đã được cấu hình đúng

---

## URL Sau Khi Deploy

Sau khi deploy thành công, bạn sẽ có URL dạng:
```
https://web3-hr-backend.onrender.com
```

URL này sẽ được dùng để:
- Kết nối từ frontend
- Test API endpoints
- Cấu hình CORS (nếu cần)

---

## Cập Nhật và Maintenance

### Cập Nhật Code

1. Commit và push code mới lên Git
2. Render sẽ tự động deploy (nếu bật Auto-Deploy)
3. Hoặc deploy thủ công từ dashboard

### Cập Nhật Dependencies

1. Cập nhật `package.json`
2. Commit và push
3. Render sẽ tự động rebuild

### Restart Service

Nếu cần restart service:
1. Vào **Settings** → **"Manual Deploy"**
2. Click **"Deploy latest commit"**

---

## Giới Hạn Free Tier

- **750 giờ/tháng** runtime (đủ cho 1 service chạy 24/7)
- **512 MB RAM**
- **0.5 CPU**
- **Logs lưu 7 ngày**
- **Sleep sau 15 phút không có request** (wake up mất ~30 giây)

**Lưu ý**: Nếu service sleep, request đầu tiên sẽ mất thời gian wake up.

---

## Nâng Cấp Lên Paid Plan

Nếu cần:
- Không sleep
- Nhiều RAM/CPU hơn
- Logs lưu lâu hơn
- Priority support

Vào **Settings** → **"Plan"** để nâng cấp.

---

## Liên Kết Hữu Ích

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node)
- [Environment Variables](https://render.com/docs/environment-variables)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong Render dashboard
2. Kiểm tra [Render Status Page](https://status.render.com)
3. Xem [Render Community Forum](https://community.render.com)
4. Liên hệ Render Support (nếu có paid plan)

---

## Tóm Tắt Các Bước

1. ✅ Push code lên Git
2. ✅ Đăng ký Render
3. ✅ Tạo Web Service
4. ✅ Cấu hình Root Directory: `backend`
5. ✅ Set Build Command: `npm install`
6. ✅ Set Start Command: `npm start`
7. ✅ Thêm Environment Variables
8. ✅ Setup MongoDB
9. ✅ Deploy và kiểm tra
10. ✅ Cấu hình Auto-Deploy

**Chúc bạn deploy thành công! 🚀**

