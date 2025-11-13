const mongoose = require('mongoose');

const chamCongSchema = new mongoose.Schema({
  employee_did: {
    type: String,
    required: true
  },
  ngay: {
    type: Date,
    required: true
  },
  gio_vao: {
    type: String,
    default: null,
    match: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/
  },
  gio_ra: {
    type: String,
    default: null,
    match: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/
  },
  tong_gio_lam: {
    type: Number,
    min: 0,
    default: null
  },
  loai_ngay: {
    type: String,
    required: true,
    enum: [
      "Ngày thường",
      "Cuối tuần",
      "Lễ",
      "Nghỉ phép",
      "Nghỉ ốm",
      "Vắng không phép"
    ],
    default: "Ngày thường"
  },
  ghi_chu: {
    type: String,
    maxLength: 500,
    default: null
  },
  xac_thuc_qua: {
    type: String,
    required: true,
    enum: [
      "QR Code",
      "Fingerprint",
      "Face Recognition",
      "Manual",
      "Web App",
      "Mobile App"
    ]
  },
  transaction_hash: {
    type: String,
    default: null,
    description: "Transaction hash của bản ghi neo on-chain"
  },
  record_hash: {
    type: String,
    default: null,
    description: "Hash của bản ghi attendance để neo on-chain"
  }
}, {
  timestamps: true
});

// Compound index for unique attendance per employee per day
chamCongSchema.index({ employee_did: 1, ngay: 1 }, { unique: true });

module.exports = mongoose.model('ChamCong', chamCongSchema, 'cham_cong');
