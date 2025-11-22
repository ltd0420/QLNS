# Hướng dẫn Sử dụng Hệ thống AI

## 📋 Tổng quan

Hệ thống AI bao gồm:
- **BERT**: Phân tích ngữ nghĩa và cảm xúc từ phản hồi khách hàng
- **CNN**: Giảm chiều dữ liệu (Dimensionality Reduction)
- **PCA**: Giảm chiều dữ liệu (phương pháp truyền thống)
- **Logistic Regression**: Dự đoán nguy cơ nghỉ việc (Attrition Prediction)

---

## 🚀 Bước 1: Khởi động các Service

### 1.1. ML Service (FastAPI) - Port 8001
```powershell
cd ml-service
python -m uvicorn app:app --host 0.0.0.0 --port 8001
```

**Kiểm tra:**
```powershell
Invoke-RestMethod -Uri http://localhost:8001/healthz -Method GET
```

### 1.2. Backend (Node.js) - Port 5000
```powershell
cd backend
npm start
```

**Kiểm tra:**
- Mở browser: http://localhost:5000/api/health (nếu có)

### 1.3. Frontend (React) - Port 3000
```powershell
cd frontend
npm start
```

**Kiểm tra:**
- Mở browser: http://localhost:3000

---

## 🎯 Bước 2: Sử dụng Giao diện AI Models Dashboard

### 2.1. Truy cập Dashboard
1. Đăng nhập với tài khoản **Super Admin** hoặc **Manager**
2. Vào menu **"Quản lý AI Models"** (trong phần "Giám sát & Cài đặt")

### 2.2. Tab 1: BERT Sentiment Analysis

**Mục đích:** Xem kết quả phân tích cảm xúc từ phản hồi khách hàng

**Cách hoạt động:**
- Hệ thống tự động phân tích tất cả phản hồi khách hàng bằng BERT
- Hiển thị:
  - Tổng số phản hồi đã phân tích
  - Phân bố cảm xúc (Tích cực/Trung lập/Tiêu cực)
  - Bảng mẫu với sentiment, điểm số, từ khóa

**Test:**
1. Vào trang **"Phản hồi Khách hàng"** (nhân viên)
2. Gửi một phản hồi mới (ví dụ: "Tôi rất hài lòng với công việc")
3. Quay lại **"Quản lý AI Models"** → Tab BERT
4. Xem kết quả phân tích tự động

### 2.3. Tab 2: CNN Dimensionality Reduction

**Mục đích:** Xem kết quả giảm chiều dữ liệu bằng CNN

**Hiển thị:**
- Phương pháp: CNN (scikit-learn MLP)
- Số components: 50
- Input features: 33 → 50 components
- Training/Validation Loss (MSE)
- Training/Validation MAE

**Lưu ý:**
- Nếu chưa chạy `reduce_dim_cnn.py`, sẽ hiển thị thông báo
- File metadata: `dataset/test.ai_model_metadata.cnn.csv.meta.json`

### 2.4. Tab 3: So sánh PCA vs CNN

**Mục đích:** So sánh 2 phương pháp giảm chiều dữ liệu

**Hiển thị:**
- Bảng so sánh chi tiết
- Explained Variance (PCA)
- Reconstruction Loss (CNN)
- Ưu điểm của từng phương pháp

---

## 🔧 Bước 3: Tạo dữ liệu CNN (nếu chưa có)

Nếu tab CNN hiển thị "Chưa có dữ liệu", chạy script:

```powershell
cd dataset
python reduce_dim_cnn.py --input test.ai_model_metadata.clean.json --output test.ai_model_metadata.cnn.csv --components 50 --epochs 20 --batch-size 256
```

**Kết quả:**
- File: `test.ai_model_metadata.cnn.csv` (dữ liệu đã giảm chiều)
- File: `test.ai_model_metadata.cnn.csv.meta.json` (metadata)
- Model: `cnn_encoder_mlp.joblib` (encoder model)
- Scaler: `cnn_scaler.joblib` (scaler)

---

## 📊 Bước 4: Sử dụng Dự đoán Nghỉ việc (Attrition Prediction)

### 4.1. Từ Admin Dashboard
1. Vào **"Phản hồi Khách hàng"**
2. Xem phần **"Nguy cơ nghỉ việc (AI)"**
3. Hiển thị:
   - Tổng số nhân viên
   - Số nhân viên có nguy cơ cao
   - Xác suất trung bình

### 4.2. API Endpoint
```powershell
# Predict cho một nhân viên
$body = @{
    pca_components = @(0.1, 0.2, 0.3, ...)  # 50 components
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/ai/attrition/predict -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer YOUR_TOKEN"}
```

---

## 🧪 Bước 5: Test BERT Sentiment Analysis

### 5.1. Từ Frontend
1. Đăng nhập với tài khoản **Nhân viên**
2. Vào **"Phản hồi Khách hàng"**
3. Gửi phản hồi mới:
   - **Tích cực:** "Tôi rất hài lòng với môi trường làm việc"
   - **Tiêu cực:** "Lương quá thấp, tôi muốn nghỉ việc"
   - **Trung lập:** "Công việc bình thường, không có gì đặc biệt"
4. Xem kết quả phân tích AI tự động

### 5.2. Test API trực tiếp
```powershell
# Test BERT sentiment
$body = @{
    text = "Tôi rất hài lòng với dịch vụ"
    rating = 4.5
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8001/sentiment -Method POST -Body $body -ContentType "application/json"
```

**Kết quả mẫu:**
```json
{
  "sentiment": "Tích cực",
  "sentiment_score": 0.85,
  "keywords": ["hài lòng", "dịch vụ"]
}
```

---

## 📁 Cấu trúc File Quan trọng

```
Web3_QLNS/
├── ml-service/
│   ├── app.py                    # FastAPI service
│   ├── sentiment_bert.py         # BERT sentiment analysis
│   └── requirements.txt          # Python dependencies
│
├── backend/
│   ├── controllers/
│   │   ├── aiPredictionController.js      # Attrition prediction
│   │   └── aiModelMetadataController.js   # CNN/PCA metadata
│   ├── routes/
│   │   └── aiRoutes.js                    # AI API routes
│   └── services/
│       └── aiPredictionService.js         # ML service client
│
├── frontend/src/
│   ├── components/admin/
│   │   └── AIModelsDashboard.js          # UI dashboard
│   └── services/
│       └── apiService.js                 # API client
│
└── dataset/
    ├── test.ai_model_metadata.clean.json      # Cleaned data
    ├── test.ai_model_metadata.pca.csv         # PCA results
    ├── test.ai_model_metadata.pca.csv.meta.json
    ├── test.ai_model_metadata.cnn.csv         # CNN results
    ├── test.ai_model_metadata.cnn.csv.meta.json
    ├── models/
    │   ├── attrition_lr.joblib               # Trained model
    │   └── attrition_metrics.json            # Model metrics
    └── reduce_dim_cnn.py                     # CNN script
```

---

## ✅ Checklist Kiểm tra

- [ ] ML Service đang chạy (port 8001)
- [ ] Backend đang chạy (port 5000)
- [ ] Frontend đang chạy (port 3000)
- [ ] File CNN metadata tồn tại (`test.ai_model_metadata.cnn.csv.meta.json`)
- [ ] File PCA metadata tồn tại (`test.ai_model_metadata.pca.csv.meta.json`)
- [ ] Model attrition đã train (`attrition_lr.joblib`)
- [ ] Đã đăng nhập với tài khoản Admin/Manager
- [ ] Có ít nhất 1 phản hồi khách hàng để test BERT

---

## 🐛 Xử lý Lỗi

### Lỗi: "CNN metadata file not found"
**Giải pháp:** Chạy `reduce_dim_cnn.py` để tạo file metadata

### Lỗi: "BERT model loading failed"
**Giải pháp:** 
- Kiểm tra `transformers` và `torch` đã cài đặt: `pip install transformers torch`
- Hệ thống sẽ tự động fallback sang rule-based sentiment

### Lỗi: "Cannot connect to ML service"
**Giải pháp:**
- Kiểm tra ML service đang chạy: `netstat -ano | findstr :8001`
- Khởi động lại: `cd ml-service && python -m uvicorn app:app --host 0.0.0.0 --port 8001`

### Lỗi: "401 Unauthorized"
**Giải pháp:**
- Đăng nhập lại với tài khoản Admin/Manager
- Kiểm tra token trong localStorage

---

## 📈 Metrics và Kết quả

### BERT Sentiment Analysis
- **Model:** PhoBERT (vinai/phobert-base-v2)
- **Fallback:** Rule-based sentiment analyzer
- **Output:** Sentiment (Tích cực/Trung lập/Tiêu cực), Score, Keywords

### CNN Dimensionality Reduction
- **Method:** CNN Autoencoder (scikit-learn MLP fallback)
- **Input:** 33 features
- **Output:** 50 components
- **Training Loss:** ~0.00096 (MSE)
- **Validation Loss:** ~0.00096 (MSE)
- **MAE:** ~0.0104

### PCA Dimensionality Reduction
- **Method:** Principal Component Analysis
- **Components:** 50
- **Explained Variance:** ~95%

### Attrition Prediction
- **Model:** Logistic Regression
- **Input:** 50 PCA components
- **Output:** Probability of attrition (0-1)

---

## 🎓 Tài liệu Tham khảo

- **BERT:** https://huggingface.co/vinai/phobert-base-v2
- **CNN Autoencoder:** Neural network-based dimensionality reduction
- **PCA:** Principal Component Analysis (scikit-learn)
- **FastAPI:** https://fastapi.tiangolo.com/
- **React Material-UI:** https://mui.com/

---

**Chúc bạn sử dụng thành công! 🚀**

