# Ví dụ Test Phản hồi Nhân viên

File này chứa các ví dụ phản hồi mẫu để test hệ thống phân tích AI (BERT sentiment analysis và topic classification).

---

## 📝 HƯỚNG DẪN SỬ DỤNG

1. Đăng nhập với tài khoản **Nhân viên**
2. Vào trang **"Phản hồi khách hàng"**
3. Copy một trong các ví dụ bên dưới và paste vào form
4. **Chỉ cần nhập:**
   - Tiêu đề phản hồi (tùy chọn)
   - Nội dung phản hồi (bắt buộc)
   - File đính kèm (tùy chọn)
5. **Hệ thống AI sẽ tự động:**
   - ✅ Nhận diện loại phản hồi (Lương, Môi trường, Quản lý, Phúc lợi, ...)
   - ✅ Đánh giá mức độ hài lòng (1-5)
   - ✅ Phân tích cảm xúc (Tích cực/Trung lập/Tiêu cực)
   - ✅ Trích xuất từ khóa
6. Gửi phản hồi và xem kết quả phân tích AI ngay lập tức

---

## 🟢 PHẢN HỒI TÍCH CỰC

> **Lưu ý:** AI sẽ tự động nhận diện loại phản hồi và mức độ hài lòng từ nội dung. Bạn chỉ cần copy nội dung vào form.

### 1. Về Lương (AI sẽ nhận diện: Loại = "Lương", Rating = 4-5, Cảm xúc = "Tích cực")
**Tiêu đề (tùy chọn):** Đề xuất tăng lương

**Nội dung:**
```
Tôi rất hài lòng với mức lương hiện tại. Công ty đã đối xử công bằng và minh bạch trong việc trả lương. Tuy nhiên, tôi mong muốn được xem xét tăng lương trong kỳ đánh giá tiếp theo dựa trên hiệu suất làm việc của tôi.
```

### 2. Về Môi trường (AI sẽ nhận diện: Loại = "Môi trường", Rating = 5, Cảm xúc = "Tích cực")
**Tiêu đề (tùy chọn):** Môi trường làm việc tuyệt vời

**Nội dung:**
```
Tôi rất thích môi trường làm việc tại công ty. Đồng nghiệp thân thiện, văn phòng sạch sẽ và hiện đại. Không gian làm việc thoải mái giúp tôi tập trung và làm việc hiệu quả hơn. Cảm ơn công ty đã tạo điều kiện tốt cho nhân viên.
```

### 3. Về Quản lý (AI sẽ nhận diện: Loại = "Quản lý", Rating = 5, Cảm xúc = "Tích cực")
**Tiêu đề (tùy chọn):** Quản lý hỗ trợ tốt

**Nội dung:**
```
Quản lý của tôi rất tận tâm và hỗ trợ nhân viên. Anh/chị luôn lắng nghe ý kiến của chúng tôi và đưa ra những hướng dẫn rõ ràng. Tôi cảm thấy được đánh giá cao và có cơ hội phát triển trong công ty.
```

### 4. Về Phúc lợi (AI sẽ nhận diện: Loại = "Phúc lợi", Rating = 4, Cảm xúc = "Tích cực")
**Tiêu đề (tùy chọn):** Phúc lợi tốt

**Nội dung:**
```
Tôi đánh giá cao các chế độ phúc lợi của công ty như bảo hiểm y tế, nghỉ phép có lương, và các hoạt động team building. Điều này cho thấy công ty quan tâm đến đời sống của nhân viên.
```

---

## 🟡 PHẢN HỒI TRUNG LẬP

### 5. Về Lương (AI sẽ nhận diện: Loại = "Lương", Rating = 3, Cảm xúc = "Trung lập")
**Tiêu đề (tùy chọn):** Thắc mắc về lương

**Nội dung:**
```
Tôi muốn được giải thích rõ hơn về cách tính lương và các khoản phụ cấp. Hiện tại tôi chưa hiểu rõ về cơ chế tăng lương và các tiêu chí đánh giá. Mong được phản hồi từ phòng nhân sự.
```

### 6. Về Môi trường (AI sẽ nhận diện: Loại = "Môi trường", Rating = 3, Cảm xúc = "Trung lập")
**Tiêu đề (tùy chọn):** Đề xuất cải thiện văn phòng

**Nội dung:**
```
Văn phòng hiện tại khá ổn nhưng tôi nghĩ có thể cải thiện thêm về ánh sáng và không gian làm việc. Có thể cân nhắc thêm một số cây xanh để tạo không gian thoải mái hơn.
```

### 7. Về Quản lý (AI sẽ nhận diện: Loại = "Quản lý" hoặc "Góp ý", Rating = 3, Cảm xúc = "Trung lập")
**Tiêu đề (tùy chọn):** Góp ý về quy trình làm việc

**Nội dung:**
```
Tôi muốn đề xuất một số cải tiến về quy trình làm việc. Hiện tại có một số bước còn rườm rà và tốn thời gian. Nếu được tối ưu hóa sẽ giúp tăng năng suất làm việc.
```

---

## 🔴 PHẢN HỒI TIÊU CỰC

### 8. Về Lương - Tiêu cực mạnh (AI sẽ nhận diện: Loại = "Lương" hoặc "Khiếu nại", Rating = 1-2, Cảm xúc = "Tiêu cực")
**Tiêu đề (tùy chọn):** Lương quá thấp

**Nội dung:**
```
Lương quá thấp, tôi muốn nghỉ việc. Mức lương hiện tại không đủ để trang trải cuộc sống. Tôi đã làm việc ở đây 2 năm nhưng lương vẫn không được tăng. Cảm thấy không được đánh giá đúng năng lực.
```

### 9. Về Môi trường - Tiêu cực (AI sẽ nhận diện: Loại = "Môi trường", Rating = 2, Cảm xúc = "Tiêu cực")
**Tiêu đề (tùy chọn):** Môi trường làm việc không tốt

**Nội dung:**
```
Văn phòng quá ồn ào, không có không gian riêng tư. Điều hòa không hoạt động tốt, mùa hè rất nóng. Máy tính và thiết bị làm việc cũ, thường xuyên bị lỗi. Tôi cảm thấy khó tập trung và làm việc hiệu quả.
```

### 10. Về Quản lý - Tiêu cực (AI sẽ nhận diện: Loại = "Quản lý" hoặc "Khiếu nại", Rating = 1-2, Cảm xúc = "Tiêu cực")
**Tiêu đề (tùy chọn):** Quản lý không công bằng

**Nội dung:**
```
Quản lý của tôi thiên vị, không công bằng trong việc phân công công việc và đánh giá. Một số nhân viên được ưu ái trong khi những người khác bị bỏ qua. Tôi cảm thấy bất công và không được đối xử đúng mức.
```

### 11. Về Phúc lợi - Tiêu cực (AI sẽ nhận diện: Loại = "Phúc lợi", Rating = 2, Cảm xúc = "Tiêu cực")
**Tiêu đề (tùy chọn):** Phúc lợi không đủ

**Nội dung:**
```
Chế độ phúc lợi của công ty còn hạn chế. Bảo hiểm y tế không đầy đủ, không có hỗ trợ ăn trưa, và các hoạt động team building quá ít. So với các công ty khác thì phúc lợi ở đây kém hơn nhiều.
```

### 12. Về Lương - Tiêu cực vừa (AI sẽ nhận diện: Loại = "Lương", Rating = 2, Cảm xúc = "Tiêu cực")
**Tiêu đề (tùy chọn):** Lương không tương xứng với công việc

**Nội dung:**
```
Tôi làm việc rất nhiều giờ ngoài giờ nhưng không được trả thêm. Lương hiện tại không tương xứng với khối lượng công việc và trách nhiệm. Mong công ty xem xét lại chính sách lương thưởng.
```

---

## 🎯 PHẢN HỒI HỖN HỢP (Cả tích cực và tiêu cực)

### 13. Phản hồi hỗn hợp (AI sẽ nhận diện: Loại = "Đánh giá chung", Rating = 3, Cảm xúc = "Trung lập")
**Tiêu đề (tùy chọn):** Có điểm tốt và điểm cần cải thiện

**Nội dung:**
```
Tôi thích môi trường làm việc và đồng nghiệp ở đây. Tuy nhiên, lương còn thấp và quy trình làm việc còn nhiều bất cập. Nếu công ty cải thiện những điểm này thì sẽ tốt hơn rất nhiều.
```

---

## 📊 BẢNG TÓM TẮT CÁC VÍ DỤ

| STT | Chủ đề | AI nhận diện | Cảm xúc dự kiến | Rating dự kiến | Độ dài |
|-----|--------|--------------|----------------|----------------|--------|
| 1 | Lương | Lương | Tích cực | 4-5 | Trung bình |
| 2 | Môi trường | Môi trường | Tích cực | 5 | Ngắn |
| 3 | Quản lý | Quản lý | Tích cực | 5 | Trung bình |
| 4 | Phúc lợi | Phúc lợi | Tích cực | 4 | Ngắn |
| 5 | Lương | Lương | Trung lập | 3 | Trung bình |
| 6 | Môi trường | Môi trường | Trung lập | 3 | Ngắn |
| 7 | Quản lý | Quản lý/Góp ý | Trung lập | 3 | Trung bình |
| 8 | Lương | Lương/Khiếu nại | Tiêu cực | 1-2 | Ngắn |
| 9 | Môi trường | Môi trường | Tiêu cực | 2 | Trung bình |
| 10 | Quản lý | Quản lý/Khiếu nại | Tiêu cực | 1-2 | Trung bình |
| 11 | Phúc lợi | Phúc lợi | Tiêu cực | 2 | Trung bình |
| 12 | Lương | Lương | Tiêu cực | 2 | Trung bình |
| 13 | Hỗn hợp | Đánh giá chung | Trung lập | 3 | Trung bình |

> **Lưu ý:** Tất cả các giá trị trên là dự kiến. AI sẽ tự động phân tích và có thể có kết quả khác một chút tùy vào ngữ cảnh.

---

## 🧪 KỊCH BẢN TEST

### Test Case 1: Phản hồi tích cực về lương
- **Input:** Ví dụ #1 (chỉ copy nội dung, không cần chọn gì thêm)
- **Kỳ vọng AI nhận diện:** 
  - ✅ Cảm xúc: Tích cực
  - ✅ Chủ đề: Lương
  - ✅ Mức độ hài lòng: 4-5
  - ✅ Từ khóa: lương, tăng lương, công bằng

### Test Case 2: Phản hồi tiêu cực mạnh
- **Input:** Ví dụ #8 (nội dung: "Lương quá thấp, tôi muốn nghỉ việc...")
- **Kỳ vọng AI nhận diện:**
  - ✅ Cảm xúc: Tiêu cực
  - ✅ Chủ đề: Lương
  - ✅ Mức độ hài lòng: 1-2
  - ✅ Từ khóa: lương thấp, nghỉ việc, không đủ

### Test Case 3: Phản hồi trung lập
- **Input:** Ví dụ #5 (nội dung thắc mắc về lương)
- **Kỳ vọng AI nhận diện:**
  - ✅ Cảm xúc: Trung lập
  - ✅ Chủ đề: Lương
  - ✅ Mức độ hài lòng: 3
  - ✅ Từ khóa: giải thích, thắc mắc

### Test Case 4: Phản hồi với file đính kèm
- **Input:** Bất kỳ ví dụ nào + đính kèm file PDF/DOC
- **Kỳ vọng:** 
  - ✅ File được upload thành công
  - ✅ AI vẫn nhận diện đúng loại, cảm xúc, rating

### Test Case 5: Phản hồi ngắn gọn
- **Input:** "Lương quá thấp, tôi muốn nghỉ việc"
- **Kỳ vọng AI nhận diện:**
  - ✅ Cảm xúc: Tiêu cực
  - ✅ Chủ đề: Lương
  - ✅ Mức độ hài lòng: 1-2

### Test Case 6: Phản hồi dài
- **Input:** Copy ví dụ #1 và lặp lại nhiều lần
- **Kỳ vọng:** AI vẫn xử lý được và nhận diện chính xác

---

## 💡 LƯU Ý KHI TEST

1. **Không cần chọn loại phản hồi hay rating:** Chỉ cần nhập nội dung, AI sẽ tự động nhận diện
2. **Test với phản hồi dài:** Copy một phản hồi và lặp lại nhiều lần để test với text dài
3. **Test với phản hồi ngắn:** Chỉ gửi 1-2 câu ngắn (ví dụ: "Lương quá thấp")
4. **Test với emoji:** Thử thêm emoji vào phản hồi (😊, 😢, 😡) để xem AI xử lý
5. **Test với tiếng Việt không dấu:** Thử gửi phản hồi không có dấu để xem AI xử lý thế nào
6. **Test với số lượng lớn:** Gửi nhiều phản hồi liên tiếp để test hiệu suất
7. **So sánh kết quả:** Kiểm tra xem AI nhận diện có đúng với kỳ vọng không

---

## 📈 KIỂM TRA KẾT QUẢ

Sau khi gửi phản hồi, kiểm tra ngay trên màn hình:

1. **Mã phản hồi:** Có được tạo tự động không? (Format: FB-YYYY-XXXXX)
2. **Phân tích AI tự động:**
   - ✅ **Cảm xúc hệ thống nhận diện:** (Tích cực/Trung lập/Tiêu cực) + Điểm số
   - ✅ **Loại phản hồi (AI nhận diện):** (Lương/Môi trường/Quản lý/Phúc lợi...) + Độ tin cậy
   - ✅ **Mức độ hài lòng (AI đánh giá):** (1-5) với rating stars
   - ✅ **Từ khóa:** Các từ khóa được trích xuất
3. **Hiển thị trên Admin Dashboard:**
   - Phản hồi xuất hiện trong danh sách với đầy đủ thông tin AI
   - Biểu đồ cảm xúc được cập nhật
   - Thống kê phòng ban được cập nhật (nếu có)
   - Mức độ hài lòng trung bình được tính toán

---

**Chúc bạn test thành công! 🚀**

