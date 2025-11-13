const PhanHoiKhachHang = require('../models/PhanHoiKhachHang');

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
    const phanHoiKhachHang = await PhanHoiKhachHang.find({ employee_did: req.params.employeeDid });
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

// Create new customer feedback
exports.createPhanHoiKhachHang = async (req, res) => {
  const phanHoiKhachHang = new PhanHoiKhachHang(req.body);
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

// Update processing status
exports.updateTrangThaiXuLy = async (req, res) => {
  try {
    const { trang_thai_xu_ly } = req.body;
    const updatedPhanHoiKhachHang = await PhanHoiKhachHang.findByIdAndUpdate(
      req.params.id,
      { trang_thai_xu_ly },
      { new: true }
    );
    if (!updatedPhanHoiKhachHang) {
      return res.status(404).json({ message: 'Customer feedback not found' });
    }
    res.json(updatedPhanHoiKhachHang);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
