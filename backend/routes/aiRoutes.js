const express = require('express');
const router = express.Router();
const {
  predictAttrition,
  getAttritionOverview,
} = require('../controllers/aiPredictionController');
const {
  getCnnMetadata,
  getPcaMetadata,
} = require('../controllers/aiModelMetadataController');
const authController = require('../controllers/authController');

router.post(
  '/attrition/predict',
  authController.authenticateToken,
  predictAttrition
);

router.get(
  '/attrition/overview',
  authController.authenticateToken,
  getAttritionOverview
);

router.get(
  '/models/cnn/metadata',
  authController.authenticateToken,
  getCnnMetadata
);

router.get(
  '/models/pca/metadata',
  authController.authenticateToken,
  getPcaMetadata
);

module.exports = router;

