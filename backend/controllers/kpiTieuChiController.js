const KpiTieuChi = require('../models/KpiTieuChi');

// Get all KPI criteria
exports.getAllKpiTieuChi = async (req, res) => {
  try {
    const kpiTieuChi = await KpiTieuChi.find();
    res.json(kpiTieuChi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get KPI criteria by ID
exports.getKpiTieuChiById = async (req, res) => {
  try {
    const kpiTieuChi = await KpiTieuChi.findOne({ kpi_id: req.params.id });
    if (!kpiTieuChi) {
      return res.status(404).json({ message: 'KPI criteria not found' });
    }
    res.json(kpiTieuChi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get KPI criteria by applicable positions
exports.getKpiTieuChiByChucVu = async (req, res) => {
  try {
    const { chuc_vu } = req.params;
    const kpiTieuChi = await KpiTieuChi.find({
      ap_dung_cho_chuc_vu: chuc_vu
    });
    res.json(kpiTieuChi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new KPI criteria
exports.createKpiTieuChi = async (req, res) => {
  const kpiTieuChi = new KpiTieuChi(req.body);
  try {
    const newKpiTieuChi = await kpiTieuChi.save();
    res.status(201).json(newKpiTieuChi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update KPI criteria
exports.updateKpiTieuChi = async (req, res) => {
  try {
    const updatedKpiTieuChi = await KpiTieuChi.findOneAndUpdate(
      { kpi_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedKpiTieuChi) {
      return res.status(404).json({ message: 'KPI criteria not found' });
    }
    res.json(updatedKpiTieuChi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete KPI criteria
exports.deleteKpiTieuChi = async (req, res) => {
  try {
    const deletedKpiTieuChi = await KpiTieuChi.findOneAndDelete({ kpi_id: req.params.id });
    if (!deletedKpiTieuChi) {
      return res.status(404).json({ message: 'KPI criteria not found' });
    }
    res.json({ message: 'KPI criteria deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
