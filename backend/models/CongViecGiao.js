const mongoose = require('mongoose');

const CongViecGiaoSchema = new mongoose.Schema({
  task_id: {
    type: String,
    required: [true, 'Mã công việc là bắt buộc'],
    unique: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã công việc (task_id) không hợp lệ.']
  },
  ten_cong_viec: {
    type: String,
    required: [true, 'Tên công việc là bắt buộc'],
    maxLength: [200, 'Tên công việc không được vượt quá 200 ký tự']
  },
  mo_ta: {
    type: String,
    maxLength: [5000, 'Mô tả không được vượt quá 5000 ký tự']
  },
  nguoi_giao_did: {
    type: String,
    required: [true, 'Người giao việc là bắt buộc'],
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã người giao (nguoi_giao_did) không hợp lệ.']
  },
  nguoi_thuc_hien_did: {
    type: String,
    required: [true, 'Người thực hiện là bắt buộc'],
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã người thực hiện (nguoi_thuc_hien_did) không hợp lệ.']
  },
  phong_ban_id: {
    type: String,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã phòng ban (phong_ban_id) không hợp lệ.']
  },
  do_uu_tien: {
    type: String,
    required: true,
    enum: ["Thấp", "Trung bình", "Cao", "Khẩn cấp"],
    default: "Trung bình"
  },
  trang_thai: {
    type: String,
    required: true,
    enum: [
      "Chờ bắt đầu",
      "Đang thực hiện",
      "Tạm dừng",
      "Chờ review",
      "Hoàn thành",
      "Hủy bỏ"
    ],
    default: "Chờ bắt đầu"
  },
  ngay_bat_dau: {
    type: Date,
    required: true
  },
  ngay_ket_thuc_du_kien: {
    type: Date,
    required: true
  },
  ngay_hoan_thanh_thuc_te: {
    type: Date
  },
  tien_do: {
    type: Number,
    required: true,
    min: [0, 'Tiến độ không được nhỏ hơn 0'],
    max: [100, 'Tiến độ không được lớn hơn 100'],
    default: 0
  },
  gio_uoc_tinh: {
    type: Number,
    min: [0, 'Giờ ước tính không được âm']
  },
  gio_thuc_te: {
    type: Number,
    min: [0, 'Giờ thực tế không được âm']
  },
  tags: [{
    type: String
  }],
  lien_ket_kpi_id: {
    type: String,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã KPI (lien_ket_kpi_id) không hợp lệ.']
  },
  task_cha_id: {
    type: String,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã task cha (task_cha_id) không hợp lệ.']
  },
  subtasks: [{
    type: String,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng UUID không hợp lệ trong subtasks.']
  }],
  file_dinh_kem: [{
    file_name: {
      type: String,
      required: true
    },
    file_uri: {
      type: String,
      required: true,
      match: [/^(ipfs|https):\/\/.*/, 'URI file không hợp lệ']
    },
    file_type: {
      type: String,
      required: true
    },
    uploaded_at: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  nhan_xet: [{
    nguoi_nhan_xet_did: {
      type: String,
      required: true,
      match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'Định dạng mã người nhận xét không hợp lệ.']
    },
    noi_dung: {
      type: String,
      required: true,
      maxLength: [2000, 'Nội dung nhận xét không được vượt quá 2000 ký tự']
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  ai_insights: {
    risk_level: {
      type: String,
      enum: ["Thấp", "Trung bình", "Cao"]
    },
    predicted_completion_date: {
      type: Date
    },
    workload_score: {
      type: Number,
      min: 0,
      max: 100
    },
    recommendations: [{
      type: String
    }]
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
CongViecGiaoSchema.index({ task_id: 1 });
CongViecGiaoSchema.index({ nguoi_thuc_hien_did: 1 });
CongViecGiaoSchema.index({ nguoi_giao_did: 1 });
CongViecGiaoSchema.index({ trang_thai: 1 });
CongViecGiaoSchema.index({ do_uu_tien: 1 });
CongViecGiaoSchema.index({ ngay_ket_thuc_du_kien: 1 });

const CongViecGiao = mongoose.model('CongViecGiao', CongViecGiaoSchema, 'cong_viec_giao');

module.exports = CongViecGiao;
