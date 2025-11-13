const mongoose = require('mongoose');

const xepHangNhanVienSchema = new mongoose.Schema({
  employee_did: {
    type: String,
    required: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã nhân viên (employee_did) không hợp lệ.']
  },
  ky_xep_hang: {
    type: String,
    required: true
  },
  tong_diem_kpi: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  diem_phan_hoi_khach_hang: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  diem_cham_cong: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  diem_ai_tong_hop: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  thu_hang: {
    type: Number,
    required: true,
    min: 1
  },
  pham_vi_xep_hang: {
    type: String,
    required: true,
    enum: [
      "Phòng ban",
      "Công ty",
      "Chức vụ"
    ]
  },
  xep_loai: {
    type: String,
    required: true,
    enum: [
      "A+",
      "A",
      "B+",
      "B",
      "C+",
      "C",
      "D"
    ]
  },
  ai_insights: {
    performance_trend: {
      type: String,
      enum: [
        "Tăng",
        "Ổn định",
        "Giảm"
      ],
      default: null
    },
    predicted_next_quarter: {
      type: Number,
      default: null
    },
    risk_factors: [{
      type: String
    }],
    recommendations: [{
      type: String
    }]
  }
}, {
  timestamps: true
});

// Compound index for unique ranking per employee per period per scope
xepHangNhanVienSchema.index({ employee_did: 1, ky_xep_hang: 1, pham_vi_xep_hang: 1 }, { unique: true });

module.exports = mongoose.model('XepHangNhanVien', xepHangNhanVienSchema, 'xep_hang_nhan_vien');
