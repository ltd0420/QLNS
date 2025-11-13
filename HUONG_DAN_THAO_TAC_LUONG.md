# Hướng Dẫn Thao Tác Hệ Thống Thanh Toán Lương

## Mục Lục
1. [Hướng dẫn cho Admin/HR](#hướng-dẫn-cho-adminhr)
2. [Hướng dẫn cho Nhân viên](#hướng-dẫn-cho-nhân-viên)
3. [Các tính năng chính](#các-tính-năng-chính)

---

## Hướng Dẫn Cho Admin/HR

### 1. Quản Lý Lương Thưởng (Payroll Management)

#### 1.1. Truy cập trang Quản lý Lương
- Đăng nhập với tài khoản Admin/HR
- Vào menu **Quản lý** → **Quản lý Lương Thưởng**

#### 1.2. Thiết lập Lương Cơ Bản cho Nhân viên

**Bước 1:** Chuyển sang tab **"Nhân viên"**

**Bước 2:** Tìm nhân viên cần thiết lập lương

**Bước 3:** Click vào icon **✏️ (Chỉnh sửa)** hoặc nút **"Thiết lập lương"**

**Bước 4:** Điền thông tin trong form:
- **Lương cơ bản (VNĐ)**: Nhập lương cơ bản hàng tháng (VD: 10,000,000)
- **Thưởng KPI (%)**: Tỷ lệ thưởng KPI (0-100%, VD: 20%)
- **Phụ cấp (VNĐ)**: Phụ cấp cố định hàng tháng (VD: 1,000,000)
- **Thuế (%)**: Tỷ lệ thuế (0-100%, VD: 10%)

**Bước 5:** Click **"Lưu"** để hoàn tất

> **Lưu ý:** 
> - Có thể cập nhật lương bằng cách click vào icon chỉnh sửa của nhân viên đã có lương
> - Thông tin lương sẽ được lưu trên Smart Contract

---

#### 1.3. Tạo Phiếu Lương (Payroll)

##### Cách 1: Tạo phiếu lương tự động (Khuyến nghị)

**Bước 1:** Chuyển sang tab **"Nhân viên"**

**Bước 2:** Tìm nhân viên cần tạo phiếu lương

**Bước 3:** Click vào icon **💳 (Thanh toán)** bên cạnh tên nhân viên

**Bước 4:** Trong dialog "Tạo phiếu lương":
- **Kỳ lương**: Nhập định dạng YYYY-MM (VD: 2024-01)
- **Bỏ chọn** checkbox "Nhập điểm KPI thủ công" (mặc định)
- Click nút **"Xem trước"** để xem lương dự kiến:
  - Hệ thống sẽ tự động lấy:
    - Dữ liệu chấm công từ database (số ngày làm việc, giờ làm thêm)
    - Điểm KPI từ hệ thống đánh giá KPI
  - Xem chi tiết:
    - Thông tin chấm công (số ngày, tổng giờ, giờ làm thêm)
    - Lương cơ bản (theo ngày làm)
    - Thưởng KPI
    - Phụ cấp
    - Thưởng giờ làm thêm
    - Thuế
    - **Tổng lương thực nhận**

**Bước 5:** Xem lại thông tin và click **"Tạo phiếu lương"**

**Bước 6:** Xác nhận giao dịch trên MetaMask (nếu có)

> **Ưu điểm:** 
> - Tự động lấy dữ liệu từ hệ thống
> - Chính xác, không cần nhập thủ công
> - Tiết kiệm thời gian

##### Cách 2: Tạo phiếu lương thủ công

**Bước 1-3:** Giống như Cách 1

**Bước 4:** Trong dialog "Tạo phiếu lương":
- **Kỳ lương**: Nhập định dạng YYYY-MM
- **Chọn** checkbox "Nhập điểm KPI thủ công"
- Điền thông tin:
  - **Điểm KPI (0-100)**: Nhập điểm KPI thủ công
  - **Số ngày làm việc (tùy chọn)**: Để trống hoặc nhập số ngày
  - **Số giờ làm thêm (tùy chọn)**: Để trống hoặc nhập số giờ

**Bước 5:** Click **"Tạo phiếu lương"**

> **Lưu ý:**
> - Nếu để trống số ngày làm việc và giờ làm thêm, hệ thống sẽ dùng giá trị mặc định
> - Chỉ dùng khi cần điều chỉnh thủ công hoặc không có dữ liệu trong hệ thống

---

#### 1.4. Phê Duyệt và Thanh Toán Lương

**Bước 1:** Chuyển sang tab **"Phiếu lương"**

**Bước 2:** Tìm phiếu lương cần thanh toán (trạng thái: **"Pending"** hoặc **"Approved"**)

**Bước 3:** Click vào icon **✓ (CheckCircle)** để thanh toán

**Bước 4:** Xác nhận giao dịch trên MetaMask

**Bước 5:** Sau khi thanh toán thành công:
- Trạng thái chuyển sang **"Paid"**
- Transaction hash được lưu trên blockchain
- Proof of payment được ghi nhận

> **Lưu ý:**
> - Cần đảm bảo hợp đồng có đủ số dư trước khi thanh toán
> - Mỗi phiếu lương chỉ có thể thanh toán 1 lần
> - Giao dịch được ghi nhận vĩnh viễn trên blockchain

---

#### 1.5. Nạp Tiền vào Hợp Đồng

**Bước 1:** Chuyển sang tab **"Tổng quan"**

**Bước 2:** Click nút **"Nạp tiền vào hợp đồng"**

**Bước 3:** Điền thông tin:
- **Số tiền (VNĐ)**: Số tiền cần nạp
- **Địa chỉ token (tùy chọn)**: Để trống nếu dùng ETH, hoặc nhập địa chỉ token ERC20

**Bước 4:** Click **"Nạp tiền"** và xác nhận trên MetaMask

**Bước 5:** Kiểm tra số dư đã cập nhật trong tab "Tổng quan"

---

#### 1.6. Xem Tổng Quan Tài Chính

Trong tab **"Tổng quan"**, bạn có thể xem:

- **Tổng nạp vào**: Tổng số tiền đã nạp vào hợp đồng
- **Tổng đã trả**: Tổng số tiền đã thanh toán cho nhân viên
- **Số dư hiện tại**: Số tiền còn lại trong hợp đồng
- **Trạng thái cân bằng**: Kiểm tra xem số liệu có khớp không

---

## Hướng Dẫn Cho Nhân Viên

### 1. Xem Lương Dự Kiến

**Bước 1:** Đăng nhập với tài khoản nhân viên

**Bước 2:** Vào menu **Dashboard** → **Lương & Thưởng**

**Bước 3:** Tìm phần **"Xem lương dự kiến"** ở đầu trang

**Bước 4:** 
- Nhập **Kỳ lương** (định dạng YYYY-MM, VD: 2024-01)
- Click nút **"Tính toán"**

**Bước 5:** Xem kết quả:
- **Thông tin chấm công:**
  - Số ngày làm việc
  - Tổng giờ làm
  - Giờ làm thêm
- **Chi tiết lương:**
  - Lương cơ bản (theo ngày làm)
  - Thưởng KPI (kèm điểm KPI)
  - Phụ cấp
  - Thưởng giờ làm thêm
  - Tổng lương
- **Khấu trừ:**
  - Thuế
  - **Lương thực nhận** (sau khi trừ thuế)

> **Lưu ý:**
> - Lương dự kiến được tính dựa trên:
>   - Dữ liệu chấm công thực tế trong kỳ
>   - Điểm KPI đã được phê duyệt
>   - Thông tin lương cơ bản đã được admin thiết lập
> - Đây chỉ là dự kiến, lương thực tế có thể khác khi admin tạo phiếu lương chính thức

---

### 2. Xem Lịch Sử Lương Đã Nhận

**Bước 1:** Trong trang **"Lương & Thưởng"**

**Bước 2:** Cuộn xuống phần **"Chi tiết lương thưởng"**

**Bước 3:** Xem bảng danh sách các kỳ lương:
- Kỳ lương
- Lương cơ bản
- Thưởng
- Khấu trừ
- Tổng nhận
- Trạng thái thanh toán

**Bước 4:** Click vào icon **▼ (Expand)** để xem chi tiết:
- **Chi tiết lương:**
  - Lương cơ bản
  - Phụ cấp
  - Làm thêm giờ
  - Tổng lương
- **Chi tiết thưởng:**
  - Thưởng KPI
  - Thưởng hiệu suất
  - Thưởng khác
  - Tổng thưởng
- **Khấu trừ & Thanh toán:**
  - Bảo hiểm xã hội
  - Bảo hiểm y tế
  - Thuế thu nhập
  - Khấu trừ khác
  - Phương thức thanh toán
  - Ngày thanh toán
  - Trạng thái

---

## Các Tính Năng Chính

### 1. Tính Lương Tự Động

Hệ thống tự động tính lương dựa trên:

- ✅ **Lương cơ bản**: Theo số ngày làm việc thực tế
- ✅ **Thưởng KPI**: Tự động lấy từ hệ thống đánh giá KPI
- ✅ **Phụ cấp**: Cố định theo tháng
- ✅ **Thưởng giờ làm thêm**: Tính từ dữ liệu chấm công
- ✅ **Thuế**: Tính theo tỷ lệ đã thiết lập

### 2. Công Thức Tính Lương

```
Tổng lương = Lương cơ bản (theo ngày) + Thưởng KPI + Phụ cấp + Thưởng giờ làm thêm
Lương thực nhận = Tổng lương - Thuế
```

**Chi tiết:**
- **Lương cơ bản (theo ngày)**: `(Lương cơ bản ÷ 22 ngày) × Số ngày làm việc thực tế`
- **Thưởng KPI**: `(Lương cơ bản × Tỷ lệ KPI × Điểm KPI) ÷ 10000`
- **Phụ cấp**: Cố định
- **Thưởng giờ làm thêm**: `(Lương cơ bản ÷ 173.33 giờ/tháng) × Số giờ làm thêm × Hệ số`
- **Thuế**: `(Tổng lương × Tỷ lệ thuế) ÷ 100`

### 3. Proof of Payment trên Blockchain

- Mỗi giao dịch thanh toán được ghi nhận trên blockchain
- Transaction hash được lưu trữ vĩnh viễn
- Có thể tra cứu và xác minh bất cứ lúc nào

### 4. Tích Hợp với Hệ Thống

- ✅ **Chấm công**: Tự động lấy dữ liệu từ hệ thống chấm công
- ✅ **KPI**: Tự động lấy điểm KPI từ hệ thống đánh giá
- ✅ **Blockchain**: Lưu trữ và thanh toán qua Smart Contract

---

## Câu Hỏi Thường Gặp (FAQ)

### Q1: Làm thế nào để biết lương dự kiến có chính xác không?

**A:** Lương dự kiến được tính dựa trên:
- Dữ liệu chấm công thực tế trong kỳ
- Điểm KPI đã được phê duyệt
- Thông tin lương cơ bản đã được admin thiết lập

Bạn có thể kiểm tra:
- Số ngày làm việc trong kỳ
- Điểm KPI đã được phê duyệt
- Giờ làm thêm đã được ghi nhận

### Q2: Tại sao lương thực tế khác với lương dự kiến?

**A:** Có thể do:
- Admin đã điều chỉnh thủ công khi tạo phiếu lương
- Dữ liệu chấm công hoặc KPI được cập nhật sau khi bạn xem dự kiến
- Có thay đổi về thông tin lương cơ bản

### Q3: Làm thế nào để khiếu nại về lương?

**A:** 
- Liên hệ trực tiếp với bộ phận HR/Admin
- Cung cấp thông tin: Kỳ lương, số tiền, lý do khiếu nại
- Admin có thể kiểm tra lại transaction hash trên blockchain

### Q4: Lương được thanh toán bằng gì?

**A:** 
- Thanh toán qua Smart Contract trên blockchain
- Có thể là ETH hoặc token ERC20 (tùy cấu hình)
- Mỗi giao dịch có transaction hash để tra cứu

### Q5: Làm thế nào để xem proof of payment?

**A:**
- Mỗi phiếu lương đã thanh toán có transaction hash
- Copy transaction hash và tra cứu trên blockchain explorer (Etherscan, v.v.)
- Hoặc liên hệ admin để xem chi tiết trong hệ thống

---

## Lưu Ý Quan Trọng

⚠️ **Cảnh báo:**
- Luôn kiểm tra kỹ thông tin trước khi xác nhận giao dịch trên MetaMask
- Đảm bảo có đủ gas fee cho giao dịch
- Không chia sẻ private key hoặc seed phrase với bất kỳ ai

✅ **Khuyến nghị:**
- Sử dụng tính năng "Xem trước" trước khi tạo phiếu lương
- Kiểm tra số dư hợp đồng trước khi thanh toán
- Thường xuyên kiểm tra lương dự kiến để theo dõi

---

## Hỗ Trợ

Nếu gặp vấn đề, vui lòng liên hệ:
- **Email hỗ trợ**: support@company.com
- **Hotline**: 1900-xxxx
- **Bộ phận IT**: it-support@company.com

---

*Tài liệu này được cập nhật lần cuối: [Ngày hiện tại]*

