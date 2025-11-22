const mongoose = require('mongoose');

const aiModelMetadataSchema = new mongoose.Schema({
  ten_mo_hinh: {
    type: String,
    required: true
  },
  phien_ban: {
    type: String,
    required: true
  },
  loai_mo_hinh: {
    type: String,
    required: true,
    enum: [
      "BERT",
      "CNN",
      "Hybrid"
    ]
  },
  ung_dung: {
    type: String,
    required: true
  },
  tom_tat_du_lieu: {
    type: String,
    default: null
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  f1_score: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  mo_ta_model_uri: {
    type: String,
    match: /^(ipfs|https):\/\/.*/,
    default: null
  },
  last_trained: {
    type: Date,
    default: null
  },
  trang_thai: {
    type: String,
    required: true,
    enum: [
      "Active",
      "Deprecated",
      "Testing"
    ],
    default: "Active"
  },
  du_lieu_gia_lap: {
    thong_tin_ca_nhan: {
      ma_nhan_vien: String,
      tuoi: Number,
      gioi_tinh: String,
      trinh_do_hoc_van: String,
      tinh_trang_hon_nhan: String,
      so_nam_lam_viec: Number,
      phong_ban: String
    },
    thong_tin_cong_viec: {
      vi_tri_cong_viec: String,
      cap_bac: String,
      muc_luong_hien_tai: Number,
      tang_luong_nam_truoc: Number,
      so_gio_moi_tuan: Number,
      gio_ot: Number,
      so_du_an_tham_gia: Number,
      ma_quan_ly: String
    },
    thong_tin_hieu_suat: {
      diem_kpi: Number,
      xep_loai_hieu_suat: String,
      gio_dao_tao: Number,
      so_lan_thang_chuc: Number,
      thang_tu_lan_thang_chuc_cuoi: Number
    },
    thai_do_phuc_loi: {
      muc_do_hai_long: Number,
      can_bang_cong_viec: Number,
      so_ngay_nghi_phep: Number,
      so_lan_di_muon: Number,
      diem_gan_ket: Number,
      ket_qua_khao_sat: String
    }
  }
}, {
  timestamps: true
});

// Compound index for unique model per name and version
aiModelMetadataSchema.index({ ten_mo_hinh: 1, phien_ban: 1 }, { unique: true });

module.exports = mongoose.model('AiModelMetadata', aiModelMetadataSchema, 'ai_model_metadata');
