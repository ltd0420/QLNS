const PhanHoiKhachHang = require('../models/PhanHoiKhachHang');
const { analyzeSentimentBERT } = require('../services/bertSentimentService');
const { analyzeSentiment } = require('../utils/sentimentAnalyzer');

// Get all customer feedback
exports.getAllPhanHoiKhachHang = async (req, res) => {
  try {
    const phanHoiKhachHang = await PhanHoiKhachHang.find().sort({ createdAt: -1 });
    res.json({ 
      message: 'Customer feedback retrieved successfully',
      data: phanHoiKhachHang 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get feedback by employee DID
exports.getPhanHoiKhachHangByEmployee = async (req, res) => {
  try {
    const employeeDid = req.params.employeeDid || req.params.id;
    const phanHoiKhachHang = await PhanHoiKhachHang.find({ employee_did: employeeDid });
    res.json(phanHoiKhachHang);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get feedback by type
exports.getPhanHoiKhachHangByType = async (req, res) => {
  try {
    const { loai_phan_hoi } = req.params;
    const phanHoiKhachHang = await PhanHoiKhachHang.find({ loai_phan_hoi });
    res.json(phanHoiKhachHang);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get feedback by processing status
exports.getPhanHoiKhachHangByStatus = async (req, res) => {
  try {
    const { trang_thai_xu_ly } = req.params;
    const phanHoiKhachHang = await PhanHoiKhachHang.find({ trang_thai_xu_ly });
    res.json(phanHoiKhachHang);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate unique feedback code
const generateFeedbackCode = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `FB-${year}-${randomNum}`;
};

// Create new customer feedback
exports.createPhanHoiKhachHang = async (req, res) => {
  const payload = { ...req.body };
  
  // Set default values if not provided
  if (!payload.loai_phan_hoi) {
    payload.loai_phan_hoi = 'Đánh giá chung';
  }
  
  // Generate unique feedback code
  let feedbackCode = generateFeedbackCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await PhanHoiKhachHang.findOne({ ma_phan_hoi: feedbackCode });
    if (!existing) break;
    feedbackCode = generateFeedbackCode();
    attempts++;
  }
  payload.ma_phan_hoi = feedbackCode;
  
  // Handle file uploads if present
  if (req.files && req.files.length > 0) {
    payload.file_dinh_kem = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));
  }
  
  if (!payload.ai_sentiment) {
    // Use BERT for sentiment analysis (falls back to rule-based if unavailable)
    // AI will auto-predict rating and topic if not provided
    const sentimentResult = await analyzeSentimentBERT(
      payload.noi_dung || '',
      payload.diem_danh_gia  // Optional, AI will predict if not provided
    );
    
    // Use AI-predicted rating if user didn't provide one
    if (!payload.diem_danh_gia && sentimentResult.predicted_rating) {
      payload.diem_danh_gia = sentimentResult.predicted_rating;
    }
    
    // Use AI-predicted topic if user didn't provide one
    if (!payload.loai_phan_hoi && sentimentResult.topic) {
      // Map topic to loai_phan_hoi enum values
      const topicMap = {
        "Lương": "Lương",
        "Môi trường": "Môi trường",
        "Quản lý": "Quản lý",
        "Phúc lợi": "Phúc lợi",
        "Khen ngợi": "Khen ngợi",
        "Khiếu nại": "Khiếu nại",
        "Góp ý": "Góp ý"
      };
      payload.loai_phan_hoi = topicMap[sentimentResult.topic] || "Đánh giá chung";
    }
    
    payload.ai_sentiment = {
      sentiment: sentimentResult.sentiment,
      sentiment_score: sentimentResult.sentiment_score,
      keywords: sentimentResult.keywords || [],
      topic: sentimentResult.topic || "Khác",
      topic_score: sentimentResult.topic_confidence || 0.5,
      embedding_dim_original: 768, // BERT embedding dimension
      embedding_dim_reduced: 64    // CNN reduced dimension
    };
  }

  const phanHoiKhachHang = new PhanHoiKhachHang(payload);
  try {
    const newPhanHoiKhachHang = await phanHoiKhachHang.save();
    res.status(201).json(newPhanHoiKhachHang);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update customer feedback
exports.updatePhanHoiKhachHang = async (req, res) => {
  try {
    const updatedPhanHoiKhachHang = await PhanHoiKhachHang.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPhanHoiKhachHang) {
      return res.status(404).json({ message: 'Customer feedback not found' });
    }
    res.json(updatedPhanHoiKhachHang);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete customer feedback
exports.deletePhanHoiKhachHang = async (req, res) => {
  try {
    const deletedPhanHoiKhachHang = await PhanHoiKhachHang.findByIdAndDelete(req.params.id);
    if (!deletedPhanHoiKhachHang) {
      return res.status(404).json({ message: 'Customer feedback not found' });
    }
    res.json({ message: 'Customer feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update processing status and admin response
exports.updateTrangThaiXuLy = async (req, res) => {
  try {
    const { trang_thai_xu_ly, phan_hoi_admin, nguoi_xu_ly } = req.body;
    const updateData = {};
    
    if (trang_thai_xu_ly) {
      updateData.trang_thai_xu_ly = trang_thai_xu_ly;
    }
    
    if (phan_hoi_admin !== undefined) {
      updateData.phan_hoi_admin = phan_hoi_admin || null;
    }
    
    if (nguoi_xu_ly) {
      updateData.nguoi_xu_ly = nguoi_xu_ly;
      // Auto-set ngay_xu_ly when someone starts processing
      if (trang_thai_xu_ly === 'Đang xử lý' || trang_thai_xu_ly === 'Đã xử lý') {
        updateData.ngay_xu_ly = new Date();
      }
    }
    
    const updatedPhanHoiKhachHang = await PhanHoiKhachHang.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedPhanHoiKhachHang) {
      return res.status(404).json({ message: 'Customer feedback not found' });
    }
    res.json(updatedPhanHoiKhachHang);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
