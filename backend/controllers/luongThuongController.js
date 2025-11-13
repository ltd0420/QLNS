const LuongThuong = require('../models/LuongThuong');

// Get all salary records
exports.getAllLuongThuong = async (req, res) => {
  try {
    const luongThuong = await LuongThuong.find();
    res.json(luongThuong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get salary by employee DID
exports.getLuongThuongByEmployee = async (req, res) => {
  try {
    const luongThuong = await LuongThuong.find({ employee_did: req.params.employeeDid });
    res.json(luongThuong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get salary by period
exports.getLuongThuongByPeriod = async (req, res) => {
  try {
    const { ky_luong } = req.params;
    const luongThuong = await LuongThuong.find({ ky_luong });
    res.json(luongThuong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get salary by specific criteria
exports.getLuongThuongByCriteria = async (req, res) => {
  try {
    const { employee_did, ky_luong } = req.params;
    const luongThuong = await LuongThuong.findOne({
      employee_did,
      ky_luong
    });
    if (!luongThuong) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    res.json(luongThuong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new salary record
exports.createLuongThuong = async (req, res) => {
  const luongThuong = new LuongThuong(req.body);
  try {
    const newLuongThuong = await luongThuong.save();
    res.status(201).json(newLuongThuong);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update salary record
exports.updateLuongThuong = async (req, res) => {
  try {
    const { employee_did, ky_luong } = req.params;
    const updatedLuongThuong = await LuongThuong.findOneAndUpdate(
      { employee_did, ky_luong },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedLuongThuong) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    res.json(updatedLuongThuong);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete salary record
exports.deleteLuongThuong = async (req, res) => {
  try {
    const { employee_did, ky_luong } = req.params;
    const deletedLuongThuong = await LuongThuong.findOneAndDelete({
      employee_did,
      ky_luong
    });
    if (!deletedLuongThuong) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    res.json({ message: 'Salary record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment status
exports.updateTrangThaiThanhToan = async (req, res) => {
  try {
    const { employee_did, ky_luong } = req.params;
    const { trang_thai_thanh_toan, ngay_thanh_toan } = req.body;

    const updateData = { trang_thai_thanh_toan };
    if (ngay_thanh_toan) {
      updateData.ngay_thanh_toan = ngay_thanh_toan;
    }

    const updatedLuongThuong = await LuongThuong.findOneAndUpdate(
      { employee_did, ky_luong },
      updateData,
      { new: true }
    );

    if (!updatedLuongThuong) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    res.json(updatedLuongThuong);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Calculate salary (helper function for creating salary records)
exports.calculateLuongThuong = async (req, res) => {
  try {
    const { employee_did, ky_luong, luong_co_ban, kpi_score } = req.body;

    // Basic calculation logic (can be enhanced with more complex rules)
    const thuong_kpi = luong_co_ban * (kpi_score / 100) * 0.2; // 20% bonus based on KPI
    const phu_cap = 0; // Can be calculated based on position, etc.
    const khau_tru = luong_co_ban * 0.105; // 10.5% tax deduction
    const tong_thuc_linh = luong_co_ban + thuong_kpi + phu_cap - khau_tru;

    const luongThuongData = {
      employee_did,
      ky_luong,
      luong_co_ban,
      thuong_kpi,
      phu_cap,
      khau_tru,
      tong_thuc_linh
    };

    res.json(luongThuongData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
