// Get KPI Criteria by Position/Role
exports.getKpiCriteriaByPosition = async (req, res) => {
  try {
    const { chucVu } = req.params;

    if (!chucVu) {
      return res.status(400).json({ message: 'Position is required' });
    }

    const kpiContract = getKpiContract();

    // Get total KPI criteria count
    const totalCriteria = await kpiContract.getTotalKpiCriteria();
    const applicableCriteria = [];

    // Loop through all criteria and check if position is applicable
    for (let i = 1; i <= totalCriteria; i++) {
      try {
        // Get criteria by index (assuming criteria are stored sequentially)
        // Note: This is a simplified approach. In production, you might want to add a mapping in the contract
        const criteria = await kpiContract.getKpiCriteria(`KPI${i.toString().padStart(3, '0')}`);

        if (criteria.isActive) {
          // Check if the position is in the applicable positions array
          const isApplicable = criteria.apDungChoChucVu.some(position =>
            position === chucVu
          );

          if (isApplicable) {
            applicableCriteria.push({
              kpiId: criteria.kpiId,
              tenKpi: criteria.tenKpi,
              moTa: criteria.moTa,
              loaiKpi: criteria.loaiKpi,
              donViDo: criteria.donViDo,
              trongSo: criteria.trongSo.toString(),
              nguongDat: criteria.nguongDat.toString(),
              nguongXuatSac: criteria.nguongXuatSac.toString(),
              chuKyDanhGia: criteria.chuKyDanhGia,
              createdAt: new Date(criteria.createdAt * 1000).toISOString()
            });
          }
        }
      } catch (error) {
        // Skip if criteria doesn't exist or has issues
        continue;
      }
    }

    res.json({
      chucVu,
      applicableCriteria,
      totalCount: applicableCriteria.length
    });
  } catch (error) {
    console.error('Error getting KPI criteria by position:', error);
    res.status(500).json({ message: error.message });
  }
};
