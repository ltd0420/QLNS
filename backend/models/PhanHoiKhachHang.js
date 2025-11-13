const mongoose = require('mongoose');

const phanHoiKhachHangSchema = new mongoose.Schema({
  employee_did: {
    type: String,
    required: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã nhân viên (employee_did) không hợp lệ.']
  },
  loai_phan_hoi: {
    type: String,
    required: true,
    enum: [
      "Khen ngợi",
      "Khiếu nại",
      "Góp ý",
      "Đánh giá chung"
    ]
  },
  noi_dung: {
    type: String,
    required: true,
    maxLength: 5000
  },
  diem_danh_gia: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  ai_sentiment: {
    sentiment: {
      type: String,
      enum: [
        "Tích cực",
        "Trung lập",
        "Tiêu cực"
      ],
      default: null
    },
    sentiment_score: {
      type: Number,
      min: -1,
      max: 1,
      default: null
    },
    keywords: [{
      type: String
    }],
    categories: [{
      type: String
    }],
    embedding_cid: {
      type: String,
      default: null
    }
  },
  trang_thai_xu_ly: {
    type: String,
    required: true,
    enum: [
      "Chờ xử lý",
      "Đang xử lý",
      "Đã xử lý",
      "Đã đóng"
    ],
    default: "Chờ xử lý"
  },
  ngay_phan_hoi: {
    type: Date,
    required: true
  },
  encrypted_fields: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('PhanHoiKhachHang', phanHoiKhachHangSchema, 'phan_hoi_khach_hang');
