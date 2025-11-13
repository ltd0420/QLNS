const mongoose = require('mongoose');

const kpiTieuChiSchema = new mongoose.Schema({
  kpi_id: {
    type: String,
    required: true,
    unique: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã KPI (kpi_id) không hợp lệ.']
  },
  ten_kpi: {
    type: String,
    required: true
  },
  mo_ta: {
    type: String,
    default: null
  },
  loai_kpi: {
    type: String,
    required: true,
    enum: [
      "Định lượng",
      "Định tính",
      "Hành vi",
      "Kỹ năng"
    ]
  },
  don_vi_do: {
    type: String,
    default: null
  },
  trong_so: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  nguong_dat: {
    type: Number,
    min: 0,
    default: null
  },
  nguong_xuat_sac: {
    type: Number,
    min: 0,
    default: null
  },
  ap_dung_cho_chuc_vu: [{
    type: String
  }],
  chu_ky_danh_gia: {
    type: String,
    required: true,
    enum: [
      "Tuần",
      "Tháng",
      "Quý",
      "Năm"
    ]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KpiTieuChi', kpiTieuChiSchema, 'kpi_tieu_chi');
