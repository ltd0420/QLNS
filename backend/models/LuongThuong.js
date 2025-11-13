const mongoose = require('mongoose');

const luongThuongSchema = new mongoose.Schema({
  employee_did: {
    type: String,
    required: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã nhân viên (employee_did) không hợp lệ.']
  },
  ky_luong: {
    type: String,
    required: true
  },
  luong_co_ban: {
    type: Number,
    required: true,
    min: 0
  },
  thuong_kpi: {
    type: Number,
    min: 0,
    default: 0
  },
  phu_cap: {
    type: Number,
    min: 0,
    default: 0
  },
  khau_tru: {
    type: Number,
    min: 0,
    default: 0
  },
  tong_thuc_linh: {
    type: Number,
    required: true,
    min: 0
  },
  trang_thai_thanh_toan: {
    type: String,
    required: true,
    enum: [
      "Chờ xử lý",
      "Đang xử lý",
      "Đã thanh toán",
      "Thất bại"
    ],
    default: "Chờ xử lý"
  },
  ngay_thanh_toan: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for unique salary record per employee per period
luongThuongSchema.index({ employee_did: 1, ky_luong: 1 }, { unique: true });

module.exports = mongoose.model('LuongThuong', luongThuongSchema, 'luong_thuong');
