const DanhGiaKpi = require('../models/DanhGiaKpi');

// Get all KPI evaluations
exports.getAllDanhGiaKpi = async (req, res) => {
  try {
    const danhGiaKpi = await DanhGiaKpi.find().sort({ createdAt: -1 });
    res.json({ 
      message: 'KPI evaluations retrieved successfully',
      data: danhGiaKpi 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get KPI evaluation by employee DID
exports.getDanhGiaKpiByEmployee = async (req, res) => {
  try {
    const danhGiaKpi = await DanhGiaKpi.find({ employee_did: req.params.employeeDid });
    res.json(danhGiaKpi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get KPI evaluation by specific criteria
exports.getDanhGiaKpiByCriteria = async (req, res) => {
  try {
    const { employee_did, kpi_id, ky_danh_gia } = req.params;
    const danhGiaKpi = await DanhGiaKpi.findOne({
      employee_did,
      kpi_id,
      ky_danh_gia
    });
    if (!danhGiaKpi) {
      return res.status(404).json({ message: 'KPI evaluation not found' });
    }
    res.json(danhGiaKpi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get KPI evaluations by period
exports.getDanhGiaKpiByPeriod = async (req, res) => {
  try {
    const { ky_danh_gia } = req.params;
    const danhGiaKpi = await DanhGiaKpi.find({ ky_danh_gia });
    res.json(danhGiaKpi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new KPI evaluation
exports.createDanhGiaKpi = async (req, res) => {
  const danhGiaKpi = new DanhGiaKpi(req.body);
  try {
    const newDanhGiaKpi = await danhGiaKpi.save();
    res.status(201).json(newDanhGiaKpi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update KPI evaluation
exports.updateDanhGiaKpi = async (req, res) => {
  try {
    const { employee_did, kpi_id, ky_danh_gia } = req.params;
    const updatedDanhGiaKpi = await DanhGiaKpi.findOneAndUpdate(
      { employee_did, kpi_id, ky_danh_gia },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedDanhGiaKpi) {
      return res.status(404).json({ message: 'KPI evaluation not found' });
    }
    res.json(updatedDanhGiaKpi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete KPI evaluation
exports.deleteDanhGiaKpi = async (req, res) => {
  try {
    const { employee_did, kpi_id, ky_danh_gia } = req.params;
    const deletedDanhGiaKpi = await DanhGiaKpi.findOneAndDelete({
      employee_did,
      kpi_id,
      ky_danh_gia
    });
    if (!deletedDanhGiaKpi) {
      return res.status(404).json({ message: 'KPI evaluation not found' });
    }
    res.json({ message: 'KPI evaluation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve KPI evaluation
exports.approveDanhGiaKpi = async (req, res) => {
  try {
    const { employee_did, kpi_id, ky_danh_gia } = req.params;
    const updatedDanhGiaKpi = await DanhGiaKpi.findOneAndUpdate(
      { employee_did, kpi_id, ky_danh_gia },
      { trang_thai: 'Đã phê duyệt' },
      { new: true }
    );
    if (!updatedDanhGiaKpi) {
      return res.status(404).json({ message: 'KPI evaluation not found' });
    }
    res.json(updatedDanhGiaKpi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
