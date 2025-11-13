const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

require('dotenv').config();
const cspHeader = require('./middleware/cspHeader');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();
app.use(cspHeader);
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user-specific room for notifications
  socket.on('join', (userDid) => {
    socket.join(userDid);
    console.log(`User ${userDid} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible in controllers
app.set('io', io);

// Routes
app.get('/', (req, res) => {
  res.send('Web3 HR Management API is running...');
});

// Import controllers
const authController = require('./controllers/authController');
const rolesController = require('./controllers/rolesController');
const danhMucPhongBanController = require('./controllers/danhMucPhongBanController');
const hoSoNhanVienController = require('./controllers/hoSoNhanVienController');
const chamCongController = require('./controllers/chamCongController');
const kpiTieuChiController = require('./controllers/kpiTieuChiController');
const danhGiaKpiController = require('./controllers/danhGiaKpiController');
const phanHoiKhachHangController = require('./controllers/phanHoiKhachHangController');
const xepHangNhanVienController = require('./controllers/xepHangNhanVienController');
const luongThuongController = require('./controllers/luongThuongController');
const smartContractLogsController = require('./controllers/smartContractLogsController');
const auditLogsController = require('./controllers/auditLogsController');
const qrAuthenticationController = require('./controllers/qrAuthenticationController');
const consentController = require('./controllers/consentController');
const aiModelMetadataController = require('./controllers/aiModelMetadataController');
const eventLogsUserController = require('./controllers/eventLogsUserController');
const congViecGiaoController = require('./controllers/congViecGiaoController');
const kpiStatsController = require('./controllers/kpiStatsController');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Auth routes
app.post('/api/auth/challenge', authController.generateChallenge);
app.post('/api/auth/verify', authController.verifySignature);
app.post('/api/auth/logout', authController.authenticateToken, authController.logout);
app.get('/api/auth/profile', authController.authenticateToken, authController.getProfile);

// Roles and Permissions routes (protected)
app.get('/api/roles', authController.authenticateToken, rolesController.getAllRoles);
app.get('/api/roles/:role_id', authController.authenticateToken, rolesController.getRoleById);
app.post('/api/roles', authController.authenticateToken, rolesController.createRole);
app.put('/api/roles/:role_id', authController.authenticateToken, rolesController.updateRole);
app.delete('/api/roles/:role_id', authController.authenticateToken, rolesController.deleteRole);
app.get('/api/roles/permissions/me', authController.authenticateToken, rolesController.getUserPermissions);

// Protected routes - require authentication
// BƯỚC 1: XÓA DÒNG BÊN DƯỚI
// app.use('/api/employees', authController.authenticateToken);
// app.use('/api/departments', authController.authenticateToken);
// app.use('/api/attendance', authController.authenticateToken); // Temporarily disabled for testing
// app.use('/api/attendance', authController.authenticateToken); // Disabled for testing Attendance History feature
app.use('/api/kpi', authController.authenticateToken);
app.use('/api/reviews', authController.authenticateToken);
app.use('/api/rankings', authController.authenticateToken);
app.use('/api/payroll', authController.authenticateToken);

// Temporarily disable auth for testing notifications
app.get('/api/logs/events/test/:userDid', async (req, res) => {
  try {
    const eventLogsUser = await require('./models/EventLogsUser').find({ user_did: req.params.userDid });
    res.json(eventLogsUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Temporarily disable auth for logs
// app.use('/api/logs', authController.authenticateToken);

// Department routes (protected)
app.get('/api/departments', danhMucPhongBanController.getAll);
app.get('/api/departments/:id', danhMucPhongBanController.getById);
app.post('/api/departments', authController.authenticateToken, danhMucPhongBanController.create);
app.put('/api/departments/:id', authController.authenticateToken, danhMucPhongBanController.update);
app.post('/api/departments/:id/assign-employee', authController.authenticateToken, danhMucPhongBanController.assignEmployeeToDepartment);
app.delete('/api/departments/:id', authController.authenticateToken, danhMucPhongBanController.delete);
app.delete('/api/departments/remove-employee/:employeeDid', authController.authenticateToken, danhMucPhongBanController.removeEmployeeFromDepartment);

// Employee routes
// BƯỚC 2: THÊM `authController.authenticateToken` VÀO 5 DÒNG BÊN DƯỚI
app.get('/api/employees', authController.authenticateToken, hoSoNhanVienController.getAll);
app.get('/api/employees/:id', authController.authenticateToken, hoSoNhanVienController.getById);
app.get('/api/employees/department/:departmentId', authController.authenticateToken, hoSoNhanVienController.getEmployeesByDepartment);
app.post('/api/employees', authController.authenticateToken, hoSoNhanVienController.create);
app.put('/api/employees/:id', authController.authenticateToken, hoSoNhanVienController.update);
app.delete('/api/employees/:id', authController.authenticateToken, hoSoNhanVienController.delete);

// Update user wallet address
app.put('/api/employees/:id/wallet', authController.authenticateToken, hoSoNhanVienController.updateWalletAddress);

// Attendance routes (protected)
app.get('/api/attendance', authController.authenticateToken, chamCongController.getAll);
app.get('/api/attendance/:id', authController.authenticateToken, chamCongController.getById);
app.post('/api/attendance', authController.authenticateToken, chamCongController.create);
app.put('/api/attendance/:id', authController.authenticateToken, chamCongController.update);
app.delete('/api/attendance/:id', authController.authenticateToken, chamCongController.delete);

// Additional attendance routes (protected)
app.get('/api/attendance/employee/:employeeDid', chamCongController.getByEmployee);
app.get('/api/attendance/date-range', authController.authenticateToken, chamCongController.getByDateRange);
app.get('/api/attendance/employee/:employeeDid/date/:date', authController.authenticateToken, chamCongController.getByEmployeeAndDate);
app.post('/api/attendance/checkin', authController.authenticateToken, chamCongController.checkIn);
app.post('/api/attendance/checkout', authController.authenticateToken, chamCongController.checkOut);

// Get smart contract logs for attendance record
app.get('/api/logs/contracts/attendance/:recordId', async (req, res) => {
  try {
    const SmartContractLogs = require('./models/SmartContractLogs');
    const logs = await SmartContractLogs.find({
      'parameters.employeeDid': req.params.recordId
    }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// KPI routes
app.get('/api/kpi/criteria', kpiTieuChiController.getAllKpiTieuChi);
app.get('/api/kpi/criteria/:id', kpiTieuChiController.getKpiTieuChiById);
app.post('/api/kpi/criteria', kpiTieuChiController.createKpiTieuChi);
app.put('/api/kpi/criteria/:id', kpiTieuChiController.updateKpiTieuChi);
app.delete('/api/kpi/criteria/:id', kpiTieuChiController.deleteKpiTieuChi);

app.get('/api/kpi/evaluations', danhGiaKpiController.getAllDanhGiaKpi);
app.get('/api/kpi/evaluations/:id', danhGiaKpiController.getDanhGiaKpiByEmployee);
app.post('/api/kpi/evaluations', danhGiaKpiController.createDanhGiaKpi);
app.put('/api/kpi/evaluations/:id', danhGiaKpiController.updateDanhGiaKpi);
app.delete('/api/kpi/evaluations/:id', danhGiaKpiController.deleteDanhGiaKpi);

// KPI Stats routes
app.get('/api/kpi/stats', kpiStatsController.getKpiStats);
app.get('/api/kpi/stats/dashboard', kpiStatsController.getDashboardStats);

// Customer feedback routes
app.get('/api/reviews', phanHoiKhachHangController.getAllPhanHoiKhachHang);
app.get('/api/reviews/:id', phanHoiKhachHangController.getPhanHoiKhachHangByEmployee);
app.post('/api/reviews', phanHoiKhachHangController.createPhanHoiKhachHang);
app.put('/api/reviews/:id', phanHoiKhachHangController.updatePhanHoiKhachHang);
app.delete('/api/reviews/:id', phanHoiKhachHangController.deletePhanHoiKhachHang);

// Employee ranking routes
app.get('/api/rankings', xepHangNhanVienController.getAllXepHangNhanVien);
app.get('/api/rankings/:id', xepHangNhanVienController.getXepHangNhanVienByEmployee);
app.post('/api/rankings', xepHangNhanVienController.createXepHangNhanVien);
app.put('/api/rankings/:id', xepHangNhanVienController.updateXepHangNhanVien);
app.delete('/api/rankings/:id', xepHangNhanVienController.deleteXepHangNhanVien);

// Payroll routes
app.get('/api/payroll', luongThuongController.getAllLuongThuong);
app.get('/api/payroll/:id', luongThuongController.getLuongThuongByEmployee);
app.post('/api/payroll', luongThuongController.createLuongThuong);
app.put('/api/payroll/:id', luongThuongController.updateLuongThuong);
app.delete('/api/payroll/:id', luongThuongController.deleteLuongThuong);

// Payroll Contract routes (Smart Contract based payroll)
const payrollRoutes = require('./routes/payrollRoutes');
app.use('/api/payroll-contract', payrollRoutes);

// Smart contract logs routes
app.get('/api/logs/contracts', smartContractLogsController.getAllSmartContractLogs);
app.get('/api/logs/contracts/:id', smartContractLogsController.getSmartContractLogsByTxHash);
app.post('/api/logs/contracts', smartContractLogsController.createSmartContractLogs);

// Alias routes for frontend compatibility
app.get('/api/smart-contract-logs', authController.authenticateToken, smartContractLogsController.getAllSmartContractLogs);
app.get('/api/danh-gia-kpi', authController.authenticateToken, danhGiaKpiController.getAllDanhGiaKpi);
app.get('/api/phan-hoi-khach-hang', authController.authenticateToken, phanHoiKhachHangController.getAllPhanHoiKhachHang);

// Audit logs routes
app.get('/api/logs/audit', auditLogsController.getAllAuditLogs);
app.get('/api/logs/audit/:id', auditLogsController.getAuditLogsByUser);
app.post('/api/logs/audit', auditLogsController.createAuditLogs);

// QR Authentication routes (with blockchain support)
app.get('/api/qr', qrAuthenticationController.getAllQrAuthentication);
app.get('/api/qr/:id', qrAuthenticationController.getQrAuthenticationById);
app.get('/api/qr/employee/:employeeDid', qrAuthenticationController.getQrAuthenticationByEmployee);
app.post('/api/qr', qrAuthenticationController.createQrAuthentication);
app.put('/api/qr/:id', qrAuthenticationController.updateQrAuthentication);
app.delete('/api/qr/:id', qrAuthenticationController.deleteQrAuthentication);

// Generate new QR code for employee (with blockchain minting)
app.post('/api/qr/generate/:employeeDid', qrAuthenticationController.generateNewQrCode);

// Validate QR code for login (with blockchain verification)
app.post('/api/qr/validate-login', qrAuthenticationController.validateQrForLogin);

// Revoke QR authentication (with blockchain burn)
app.put('/api/qr/revoke/:id', qrAuthenticationController.revokeQrAuthentication);

// Welcome endpoint for QR authentication with logging
app.get('/api/qr/welcome', qrAuthenticationController.welcomeQr);

// Consent Management routes (protected)
app.post('/api/consent', authController.authenticateToken, consentController.giveConsent);
app.put('/api/consent/:consentId/revoke', authController.authenticateToken, consentController.revokeConsent);
app.get('/api/consent/:consentId/valid', authController.authenticateToken, consentController.checkConsent);
app.get('/api/consent/employee/:employeeDid/type/:consentType/active', authController.authenticateToken, consentController.checkActiveConsent);
app.get('/api/consent/employee/:employeeDid', authController.authenticateToken, consentController.getEmployeeConsents);
app.get('/api/consent/:consentId', authController.authenticateToken, consentController.getConsentDetails);

// AI Model Metadata routes
app.get('/api/ai/models', aiModelMetadataController.getAllAiModelMetadata);
app.get('/api/ai/models/:id', aiModelMetadataController.getAiModelMetadataByNameVersion);
app.post('/api/ai/models', aiModelMetadataController.createAiModelMetadata);
app.put('/api/ai/models/:id', aiModelMetadataController.updateAiModelMetadata);
app.delete('/api/ai/models/:id', aiModelMetadataController.deleteAiModelMetadata);

// User Event Logs routes
app.get('/api/logs/events', eventLogsUserController.getAllEventLogsUser);
app.get('/api/logs/events/:userDid', eventLogsUserController.getEventLogsUserByUser);
app.post('/api/logs/events', eventLogsUserController.createEventLogsUser);
app.put('/api/logs/events/:id', eventLogsUserController.markAsRead);
app.delete('/api/logs/events/read/:userDid', eventLogsUserController.deleteReadEventLogs);

// Task Management routes (protected)
app.get('/api/tasks', authController.authenticateToken, congViecGiaoController.getAll);
app.get('/api/tasks/:id', authController.authenticateToken, congViecGiaoController.getById);
app.get('/api/tasks/employee/:employeeDid', authController.authenticateToken, congViecGiaoController.getByEmployee);
app.get('/api/tasks/assigner/:assignerDid', authController.authenticateToken, congViecGiaoController.getByAssigner);
app.get('/api/tasks/status/:status', authController.authenticateToken, congViecGiaoController.getByStatus);
app.get('/api/tasks/priority/:priority', authController.authenticateToken, congViecGiaoController.getByPriority);
app.get('/api/tasks/department/:departmentId', authController.authenticateToken, congViecGiaoController.getByDepartment);
app.get('/api/tasks/overdue', authController.authenticateToken, congViecGiaoController.getOverdueTasks);
app.get('/api/tasks/stats', authController.authenticateToken, congViecGiaoController.getTaskStats);
app.post('/api/tasks', authController.authenticateToken, congViecGiaoController.create);
app.put('/api/tasks/:id', authController.authenticateToken, congViecGiaoController.update);
app.put('/api/tasks/:id/progress', authController.authenticateToken, congViecGiaoController.updateProgress);
app.put('/api/tasks/:id/approve', authController.authenticateToken, congViecGiaoController.approveTask);
app.delete('/api/tasks/:id', authController.authenticateToken, congViecGiaoController.delete);

// Additional Task Management routes
app.post('/api/tasks/upload', authController.authenticateToken, upload.single('file'), congViecGiaoController.uploadFile);
app.post('/api/tasks/:task_id/attach', authController.authenticateToken, congViecGiaoController.attachFileToTask);
app.post('/api/tasks/:task_id/ai-insights', authController.authenticateToken, congViecGiaoController.generateAiInsights);
app.post('/api/tasks/bulk', authController.authenticateToken, congViecGiaoController.bulkCreate);
app.put('/api/tasks/bulk', authController.authenticateToken, congViecGiaoController.bulkUpdate);
app.delete('/api/tasks/bulk', authController.authenticateToken, congViecGiaoController.bulkDelete);
app.get('/api/tasks/stats/detailed', authController.authenticateToken, congViecGiaoController.getDetailedTaskStats);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
