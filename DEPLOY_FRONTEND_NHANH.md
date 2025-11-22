# Hướng Dẫn Deploy Frontend Lên Netlify - Bản Tóm Tắt

## 🚀 Các Bước Deploy Frontend

### Bước 1: Đăng Ký Netlify (Nếu chưa có)

1. Truy cập: https://www.netlify.com
2. Click **"Sign up"**
3. Đăng ký bằng GitHub (khuyến nghị)

---

### Bước 2: Tạo Site Mới

1. Trong Dashboard, click **"Add new site"** → **"Import an existing project"**
2. Chọn **"Deploy with GitHub"**
3. Chọn repository: `ltd0420/QLNS`
4. Click **"Connect"**

---

### Bước 3: Cấu Hình Build Settings

⚠️ **QUAN TRỌNG**: Cấu hình đúng các settings sau:

- **Branch to deploy**: `main`
- **Base directory**: `frontend` ⚠️
- **Build command**: 
  ```bash
  npm install && npm run build
  ```
- **Publish directory**: 
  ```
  frontend/build
  ```

---

### Bước 4: Thêm Environment Variable

Scroll xuống phần **"Environment variables"** và thêm:

#### ⚠️ Biến Bắt Buộc:

**REACT_APP_API_URL**
- **Key**: `REACT_APP_API_URL`
- **Value**: `https://web3-hr-backend.onrender.com/api`
  (Thay bằng URL backend thực tế của bạn)

**Lưu ý**: 
- Biến phải bắt đầu bằng `REACT_APP_`
- Không có dấu `/` ở cuối URL

---

### Bước 5: Deploy

1. Click **"Deploy site"**
2. Đợi 3-5 phút để build và deploy
3. Xem logs trong tab **"Deploys"**

---

### Bước 6: Kiểm Tra

Sau khi deploy, bạn sẽ có URL:
```
https://random-name-123456.netlify.app
```

Truy cập và kiểm tra:
- [ ] Site load được
- [ ] Không có lỗi trong console (F12)
- [ ] API calls hoạt động
- [ ] Đăng nhập được

---

## ✅ Checklist

- [x] Code đã push lên GitHub
- [ ] Đã tạo tài khoản Netlify
- [ ] Đã kết nối GitHub
- [ ] Base directory = `frontend`
- [ ] Build command = `npm install && npm run build`
- [ ] Publish directory = `frontend/build`
- [ ] Đã thêm `REACT_APP_API_URL`
- [ ] Backend đã deploy và có URL

---

## 🔧 Cập Nhật Backend CORS

Sau khi deploy frontend, cập nhật backend:

1. Vào Render Dashboard → Environment Variables
2. Tìm `FRONTEND_URL`
3. Cập nhật thành URL Netlify của bạn:
   ```
   https://your-site.netlify.app
   ```
4. Save và redeploy backend

---

## 🚨 Lỗi Thường Gặp

### Lỗi: "404 Not Found" khi navigate
**Giải pháp**: File `_redirects` đã được tạo trong `frontend/public/`

### Lỗi: "API calls failed"
**Giải pháp**: 
- Kiểm tra `REACT_APP_API_URL` đã được set
- Cập nhật `FRONTEND_URL` trong backend

### Lỗi: "Build failed"
**Giải pháp**: 
- Kiểm tra Base directory = `frontend`
- Kiểm tra Build command có `npm install`

---

## 📝 Files Đã Tạo

- ✅ `frontend/netlify.toml` - Cấu hình Netlify
- ✅ `frontend/public/_redirects` - Redirect rules cho React Router

---

## 🔗 Xem Hướng Dẫn Chi Tiết

Xem file `HUONG_DAN_DEPLOY_NETLIFY.md` để biết thêm chi tiết.

---

**Chúc bạn deploy thành công! 🚀**

