const XepHangNhanVien = require('../models/XepHangNhanVien');

// Get all employee rankings
exports.getAllXepHangNhanVien = async (req, res) => {
  try {
    const xepHangNhanVien = await XepHangNhanVien.find();
    res.json(xepHangNhanVien);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get ranking by employee DID
exports.getXepHangNhanVienByEmployee = async (req, res) => {
  try {
    const xepHangNhanVien = await XepHangNhanVien.find({ employee_did: req.params.employeeDid });
    res.json(xepHangNhanVien);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get ranking by period
exports.getXepHangNhanVienByPeriod = async (req, res) => {
  try {
    const { ky_xep_hang } = req.params;
    const xepHangNhanVien = await XepHangNhanVien.find({ ky_xep_hang });
    res.json(xepHangNhanVien);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get ranking by scope
exports.getXepHangNhanVienByScope = async (req, res) => {
  try {
    const { pham_vi_xep_hang } = req.params;
    const xepHangNhanVien = await XepHangNhanVien.find({ pham_vi_xep_hang });
    res.json(xepHangNhanVien);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get ranking by specific criteria
exports.getXepHangNhanVienByCriteria = async (req, res) => {
  try {
    const { employee_did, ky_xep_hang, pham_vi_xep_hang } = req.params;
    const xepHangNhanVien = await XepHangNhanVien.findOne({
      employee_did,
      ky_xep_hang,
      pham_vi_xep_hang
    });
    if (!xepHangNhanVien) {
      return res.status(404).json({ message: 'Employee ranking not found' });
    }
    res.json(xepHangNhanVien);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new employee ranking
exports.createXepHangNhanVien = async (req, res) => {
  const xepHangNhanVien = new XepHangNhanVien(req.body);
  try {
    const newXepHangNhanVien = await xepHangNhanVien.save();
    res.status(201).json(newXepHangNhanVien);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update employee ranking
exports.updateXepHangNhanVien = async (req, res) => {
  try {
    const { employee_did, ky_xep_hang, pham_vi_xep_hang } = req.params;
    const updatedXepHangNhanVien = await XepHangNhanVien.findOneAndUpdate(
      { employee_did, ky_xep_hang, pham_vi_xep_hang },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedXepHangNhanVien) {
      return res.status(404).json({ message: 'Employee ranking not found' });
    }
    res.json(updatedXepHangNhanVien);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete employee ranking
exports.deleteXepHangNhanVien = async (req, res) => {
  try {
    const { employee_did, ky_xep_hang, pham_vi_xep_hang } = req.params;
    const deletedXepHangNhanVien = await XepHangNhanVien.findOneAndDelete({
      employee_did,
      ky_xep_hang,
      pham_vi_xep_hang
    });
    if (!deletedXepHangNhanVien) {
      return res.status(404).json({ message: 'Employee ranking not found' });
    }
    res.json({ message: 'Employee ranking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get top performers by period and scope
exports.getTopPerformers = async (req, res) => {
  try {
    const { ky_xep_hang, pham_vi_xep_hang, limit = 10 } = req.params;
    const topPerformers = await XepHangNhanVien.find({
      ky_xep_hang,
      pham_vi_xep_hang
    })
    .sort({ thu_hang: 1 }) // Sort by rank ascending (1 is best)
    .limit(parseInt(limit));
    res.json(topPerformers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
