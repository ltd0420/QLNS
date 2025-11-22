const mongoose = require('mongoose');

const phanHoiKhachHangSchema = new mongoose.Schema({
  ma_phan_hoi: {
    type: String,
    unique: true,
    sparse: true
  },
  employee_did: {
    type: String,
    required: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã nhân viên (employee_did) không hợp lệ.']
  },
  tieu_de: {
    type: String,
    maxLength: 200
  },
  loai_phan_hoi: {
    type: String,
    required: false,
    enum: [
      "Lương",
      "Môi trường",
      "Quản lý",
      "Phúc lợi",
      "Khen ngợi",
      "Khiếu nại",
      "Góp ý",
      "Đánh giá chung"
    ],
    default: "Đánh giá chung"
  },
  noi_dung: {
    type: String,
    required: true,
    maxLength: 5000
  },
  file_dinh_kem: [{
    filename: String,
    originalname: String,
    path: String,
    mimetype: String,
    size: Number
  }],
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
    topic: {
      type: String,
      default: null
    },
    topic_score: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    categories: [{
      type: String
    }],
    embedding_cid: {
      type: String,
      default: null
    },
    embedding_dim_original: {
      type: Number,
      default: null
    },
    embedding_dim_reduced: {
      type: Number,
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
  phan_hoi_admin: {
    type: String,
    default: null,
    maxLength: 5000
  },
  nguoi_xu_ly: {
    type: String,
    default: null
  },
  ngay_xu_ly: {
    type: Date,
    default: null
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
