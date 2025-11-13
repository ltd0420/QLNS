# Hướng Dẫn Nhanh - Hệ Thống Thanh Toán Lương

## 📋 Cho Admin/HR

### ⚡ Thiết lập lương cho nhân viên (Lần đầu)
```
1. Vào: Quản lý → Quản lý Lương Thưởng → Tab "Nhân viên"
2. Click icon ✏️ bên cạnh tên nhân viên
3. Điền: Lương cơ bản, Thưởng KPI (%), Phụ cấp, Thuế (%)
4. Click "Lưu"
```

### ⚡ Tạo phiếu lương (Khuyến nghị: Tự động)
```
1. Tab "Nhân viên" → Click icon 💳 bên cạnh nhân viên
2. Nhập kỳ lương (YYYY-MM, VD: 2024-01)
3. Bỏ chọn "Nhập điểm KPI thủ công"
4. Click "Xem trước" để kiểm tra
5. Click "Tạo phiếu lương"
```

### ⚡ Thanh toán lương
```
1. Tab "Phiếu lương"
2. Tìm phiếu lương (trạng thái: Pending/Approved)
3. Click icon ✓ để thanh toán
4. Xác nhận trên MetaMask
```

### ⚡ Nạp tiền vào hợp đồng
```
1. Tab "Tổng quan"
2. Click "Nạp tiền vào hợp đồng"
3. Nhập số tiền
4. Click "Nạp tiền" → Xác nhận MetaMask
```

---

## 📋 Cho Nhân Viên

### ⚡ Xem lương dự kiến
```
1. Dashboard → Lương & Thưởng
2. Phần "Xem lương dự kiến"
3. Nhập kỳ lương (YYYY-MM)
4. Click "Tính toán"
5. Xem kết quả chi tiết
```

### ⚡ Xem lịch sử lương
```
1. Dashboard → Lương & Thưởng
2. Cuộn xuống "Chi tiết lương thưởng"
3. Click icon ▼ để xem chi tiết từng kỳ
```

---

## 🔢 Công Thức Tính Lương

```
Tổng lương = Lương cơ bản (theo ngày) + Thưởng KPI + Phụ cấp + Thưởng giờ làm thêm
Lương thực nhận = Tổng lương - Thuế
```

**Chi tiết:**
- **Lương cơ bản**: `(Lương cơ bản ÷ 22) × Số ngày làm việc`
- **Thưởng KPI**: `(Lương cơ bản × Tỷ lệ KPI × Điểm KPI) ÷ 10000`
- **Thưởng giờ làm**: `(Lương cơ bản ÷ 173.33) × Giờ làm thêm × Hệ số`
- **Thuế**: `(Tổng lương × Tỷ lệ thuế) ÷ 100`

---

## ⚠️ Lưu Ý

✅ **Nên làm:**
- Xem trước trước khi tạo phiếu lương
- Kiểm tra số dư hợp đồng trước khi thanh toán
- Xác nhận kỹ thông tin trên MetaMask

❌ **Không nên:**
- Chia sẻ private key
- Thanh toán khi không đủ số dư
- Bỏ qua bước xem trước

---

## 🆘 Hỗ Trợ

- **Chi tiết**: Xem file `HUONG_DAN_THAO_TAC_LUONG.md`
- **Email**: support@company.com
- **Hotline**: 1900-xxxx

