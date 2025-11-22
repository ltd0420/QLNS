const {
  predictAttrition,
  predictAttritionBatch,
} = require('../services/aiPredictionService');
const { loadAttritionSamples } = require('../utils/attritionDataLoader');

exports.predictAttrition = async (req, res, next) => {
  try {
    const { components, threshold = 0.5 } = req.body;
    const numericThreshold = Number(threshold);
    if (Number.isNaN(numericThreshold) || numericThreshold <= 0 || numericThreshold >= 1) {
      return res.status(400).json({
        message: 'threshold must be a number between 0 and 1',
      });
    }

    const result = await predictAttrition(components, numericThreshold);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getAttritionOverview = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const threshold = Number(req.query.threshold ?? 0.5);

    if (Number.isNaN(threshold) || threshold <= 0 || threshold >= 1) {
      return res.status(400).json({
        message: 'threshold must be a number between 0 and 1',
      });
    }

    const samples = await loadAttritionSamples(limit);
    const predictions = await predictAttritionBatch(
      samples.map((sample) => ({ components: sample.components })),
      threshold
    );

    const items = samples.map((sample, index) => {
      const prediction = predictions[index] || {};
      const metadata = sample.metadata || {};
      const duLieuGiaLap = metadata.du_lieu_gia_lap || {};
      return {
        ten_mo_hinh: sample.ten_mo_hinh,
        phien_ban: sample.phien_ban,
        probability: prediction.probability ?? null,
        label: prediction.label ?? null,
        trang_thai: metadata.trang_thai,
        ung_dung: metadata.ung_dung,
        thong_tin_ca_nhan: duLieuGiaLap.thong_tin_ca_nhan,
        thong_tin_cong_viec: duLieuGiaLap.thong_tin_cong_viec,
        thong_tin_hieu_suat: duLieuGiaLap.thong_tin_hieu_suat,
        thai_do_phuc_loi: duLieuGiaLap.thai_do_phuc_loi,
      };
    });

    const total = items.length;
    const highRisk = items.filter((item) => item.label === 1).length;
    const averageProbability =
      total > 0
        ? Number(
            (
              items.reduce((sum, item) => sum + (item.probability ?? 0), 0) /
              total
            ).toFixed(4)
          )
        : 0;

    res.json({
      total,
      high_risk: highRisk,
      average_probability: averageProbability,
      items,
    });
  } catch (error) {
    next(error);
  }
};

