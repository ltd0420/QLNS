const express = require('express');
const router = express.Router();
const kpiContractController = require('../controllers/kpiContractController');
const authService = require('../services/authService');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check admin/HR role
const requireHR = (req, res, next) => {
  if (!req.user || (req.user.role_id !== '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7a' && req.user.role_id !== '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7b')) {
    return res.status(403).json({ message: 'HR/Admin access required' });
  }
  next();
};

// KPI Criteria Management Routes
router.post('/criteria', requireAuth, requireHR, kpiContractController.createKpiCriteria);
router.put('/criteria/:kpiId', requireAuth, requireHR, kpiContractController.updateKpiCriteria);
router.delete('/criteria/:kpiId', requireAuth, requireHR, kpiContractController.deactivateKpiCriteria);
router.get('/criteria/:kpiId', requireAuth, kpiContractController.getKpiCriteria);

// KPI Evaluation Management Routes
router.post('/evaluations', requireAuth, requireHR, kpiContractController.createKpiEvaluation);
router.put('/evaluations/:evaluationId', requireAuth, requireHR, kpiContractController.updateKpiEvaluation);
router.put('/evaluations/:evaluationId/approve', requireAuth, requireHR, kpiContractController.approveKpiEvaluation);
router.get('/evaluations/:evaluationId', requireAuth, kpiContractController.getKpiEvaluation);

// KPI Data Retrieval Routes
router.get('/employees/:employeeDid/evaluations', requireAuth, kpiContractController.getEmployeeEvaluations);
router.get('/employees/:employeeDid/summary/:kyDanhGia', requireAuth, kpiContractController.getEmployeeKpiSummary);
router.get('/periods/:kyDanhGia/evaluations', requireAuth, kpiContractController.getEvaluationsByPeriod);
router.get('/positions/:chucVu/criteria', requireAuth, kpiContractController.getKpiCriteriaByPosition);

// KPI Statistics Routes
router.get('/stats', requireAuth, kpiContractController.getKpiStats);

// Role Management Routes
router.post('/roles/grant-evaluator', requireAuth, requireHR, kpiContractController.grantEvaluatorRole);
router.post('/roles/grant-employee', requireAuth, requireHR, kpiContractController.grantEmployeeRole);

module.exports = router;
