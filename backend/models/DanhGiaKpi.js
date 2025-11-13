const mongoose = require('mongoose');

const danhGiaKpiSchema = new mongoose.Schema({
  employee_did: {
    type: String,
    required: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã nhân viên (employee_did) không hợp lệ.']
  },
  kpi_id: {
    type: String,
    required: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã KPI (kpi_id) không hợp lệ.']
  },
  ky_danh_gia: {
    type: String,
    required: true
  },
  ngay_bat_dau: {
    type: Date,
    required: true
  },
  ngay_ket_thuc: {
    type: Date,
    required: true
  },
  gia_tri_thuc_te: {
    type: Number,
    required: true
  },
  diem_so: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  xep_loai: {
    type: String,
    required: true,
    enum: [
      "Xuất sắc",
      "Tốt",
      "Đạt",
      "Chưa đạt"
    ]
  },
  nguoi_danh_gia_did: {
    type: String,
    required: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã người đánh giá (nguoi_danh_gia_did) không hợp lệ.']
  },
  nhan_xet: {
    type: String,
    maxLength: 2000,
    default: null
  },
  ai_analysis: {
    sentiment_score: {
      type: Number,
      min: -1,
      max: 1,
      default: null
    },
    key_strengths: [{
      type: String
    }],
    improvement_areas: [{
      type: String
    }],
    confidence_score: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    }
  },
  trang_thai: {
    type: String,
    required: true,
    enum: [
      "Nháp",
      "Đã gửi",
      "Đã phê duyệt",
      "Đã đóng"
    ],
    default: "Nháp"
  },
  encrypted_fields: [{
    type: String
  }]
}, {
  timestamps: true
});

// Compound index for unique KPI evaluation per employee per KPI per period
danhGiaKpiSchema.index({ employee_did: 1, kpi_id: 1, ky_danh_gia: 1 }, { unique: true });

module.exports = mongoose.model('DanhGiaKpi', danhGiaKpiSchema, 'danh_gia_kpi');
