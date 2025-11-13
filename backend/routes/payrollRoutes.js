const express = require('express');
const router = express.Router();
const payrollContractController = require('../controllers/payrollContractController');
const authService = require('../services/authService');
const HoSoNhanVien = require('../models/HoSoNhanVien');
const LuongThuong = require('../models/LuongThuong');

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

// Role constants (fallback to defaults if env not set)
const SUPER_ADMIN_ROLE_ID = process.env.SUPER_ADMIN_ROLE_ID || '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7a';
const HR_ADMIN_ROLE_ID = process.env.HR_ADMIN_ROLE_ID || '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7b';

// Middleware to check admin/HR role
const requireHR = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userRoleId = req.user.role_id || req.user.roleId;
  const allowedRoles = new Set([SUPER_ADMIN_ROLE_ID, HR_ADMIN_ROLE_ID]);

  if (!userRoleId || !allowedRoles.has(userRoleId)) {
    return res.status(403).json({ message: 'HR/Admin access required' });
  }

  next();
};

// Employee Salary Management Routes
router.post('/salary/set', requireAuth, requireHR, async (req, res) => {
  try {
    const { employeeDid, baseSalary, kpiBonus, allowance, taxRate, overtimeRate } = req.body;

    console.log('Setting salary request:', { employeeDid, baseSalary, kpiBonus, allowance, taxRate, overtimeRate });
    console.log('User info:', { employee_did: req.user?.employee_did, walletAddress: req.user?.walletAddress });

    // Validate required fields
    if (!employeeDid) {
      return res.status(400).json({ message: 'Missing required field: employeeDid' });
    }
    if (baseSalary === undefined || baseSalary === null || isNaN(baseSalary) || baseSalary < 0) {
      return res.status(400).json({ message: 'Invalid baseSalary. Must be a non-negative number.' });
    }
    if (kpiBonus === undefined || kpiBonus === null || isNaN(kpiBonus) || kpiBonus < 0 || kpiBonus > 100) {
      return res.status(400).json({ message: 'Invalid kpiBonus. Must be a number between 0 and 100.' });
    }
    if (allowance === undefined || allowance === null || isNaN(allowance) || allowance < 0) {
      return res.status(400).json({ message: 'Invalid allowance. Must be a non-negative number.' });
    }
    if (taxRate === undefined || taxRate === null || isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      return res.status(400).json({ message: 'Invalid taxRate. Must be a number between 0 and 100.' });
    }

    // Fetch employee wallet address from database to ensure accuracy
    let walletAddress;
    try {
      const employeeProfile = await HoSoNhanVien.findOne({ employee_did: employeeDid });
      if (!employeeProfile || !employeeProfile.walletAddress) {
        return res.status(400).json({
          message: 'Wallet address for this employee was not found. Please ensure the employee has connected their wallet.',
        });
      }

      walletAddress = employeeProfile.walletAddress;
      console.log('Using employee wallet address from database:', walletAddress);
    } catch (dbError) {
      console.error('Error fetching employee from database:', dbError);
      return res.status(500).json({
        message: 'Error fetching employee information. Please try again.',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
      });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        message: 'Invalid wallet address format for employee. Please check employee profile.',
      });
    }

    // Default overtime rate to 150 (1.5x) if not provided
    const overtimeRateValue = overtimeRate || 150;

    // Convert to numbers to ensure proper type
    const baseSalaryNum = Number(baseSalary);
    const kpiBonusNum = Number(kpiBonus);
    const allowanceNum = Number(allowance);
    const taxRateNum = Number(taxRate);
    const overtimeRateNum = Number(overtimeRateValue);

    console.log('Calling setEmployeeSalary with:', { 
      employeeDid, 
      baseSalary: baseSalaryNum, 
      kpiBonus: kpiBonusNum, 
      allowance: allowanceNum, 
      taxRate: taxRateNum, 
      overtimeRate: overtimeRateNum, 
      walletAddress 
    });

    const result = await payrollContractController.setEmployeeSalary(
      employeeDid,
      baseSalaryNum,
      kpiBonusNum,
      allowanceNum,
      taxRateNum,
      overtimeRateNum,
      walletAddress
    );

    await HoSoNhanVien.updateOne(
      { employee_did: employeeDid },
      {
        $set: {
          baseSalary: baseSalaryNum,
          kpiBonus: kpiBonusNum,
          allowance: allowanceNum,
          taxRate: taxRateNum,
          overtimeRate: overtimeRateNum,
          salaryUpdatedAt: new Date()
        }
      }
    );

    console.log('Salary set successfully:', result);

    res.json({
      message: 'Employee salary set successfully',
      data: result
    });
  } catch (error) {
    console.error('Error setting employee salary - Full error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide more specific error messages
    let errorMessage = error.message || 'Unknown error occurred';
    
    // Check for various error types
    if (error.code === 'ECONNREFUSED' || 
        error.message?.includes('ECONNREFUSED') || 
        error.message?.includes('failed, reason') ||
        error.message?.includes('connect ECONNREFUSED')) {
      errorMessage = 'Không thể kết nối tới blockchain node. Vui lòng đảm bảo Ethereum node đang chạy trên localhost:8545';
    } else if (error.message?.includes('not deployed') || error.message?.includes('Payroll contract is not deployed')) {
      errorMessage = 'Payroll contract chưa được deploy. Vui lòng deploy contract trước.';
    } else if (error.message?.includes('insufficient funds') || error.message?.includes('insufficient balance')) {
      errorMessage = 'Số dư ví không đủ để thực hiện giao dịch.';
    } else if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
      errorMessage = 'Giao dịch bị từ chối bởi người dùng.';
    } else if (error.message?.includes('invalid address') || error.message?.includes('Invalid address')) {
      errorMessage = 'Địa chỉ ví không hợp lệ. Vui lòng kiểm tra lại.';
    } else if (error.message?.includes('nonce') || error.message?.includes('replacement transaction')) {
      errorMessage = 'Lỗi nonce. Vui lòng thử lại sau vài giây.';
    } else if (error.message?.includes('revert') || error.message?.includes('execution reverted')) {
      errorMessage = 'Giao dịch bị từ chối bởi smart contract. Vui lòng kiểm tra quyền truy cập và điều kiện hợp đồng.';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.put('/salary/update', requireAuth, requireHR, async (req, res) => {
  try {
    const { employeeDid, baseSalary, kpiBonus, allowance, taxRate, overtimeRate } = req.body;

    if (!employeeDid || baseSalary === undefined || kpiBonus === undefined || allowance === undefined || taxRate === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get employee wallet address from database
    const employeeProfile = await HoSoNhanVien.findOne({ employee_did: employeeDid });
    if (!employeeProfile || !employeeProfile.walletAddress) {
      return res.status(400).json({
        message: 'Wallet address for this employee was not found. Please ensure the employee has connected their wallet.',
      });
    }

    const walletAddress = employeeProfile.walletAddress;
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        message: 'Invalid wallet address format for employee. Please check employee profile.',
      });
    }

    // Default overtime rate to 150 (1.5x) if not provided
    const overtimeRateValue = overtimeRate || 150;

    const result = await payrollContractController.updateEmployeeSalary(
      employeeDid,
      baseSalary,
      kpiBonus,
      allowance,
      taxRate,
      overtimeRateValue,
      walletAddress
    );

    await HoSoNhanVien.updateOne(
      { employee_did: employeeDid },
      {
        $set: {
          baseSalary,
          kpiBonus,
          allowance,
          taxRate,
          overtimeRate: overtimeRateValue,
          salaryUpdatedAt: new Date()
        }
      }
    );

    res.json({
      message: 'Employee salary updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating employee salary:', error);
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.message.includes('ECONNREFUSED') || error.message.includes('failed, reason')) {
      errorMessage = 'Không thể kết nối tới blockchain node. Vui lòng đảm bảo Ethereum node đang chạy trên localhost:8545';
    } else if (error.message.includes('not deployed')) {
      errorMessage = 'Payroll contract chưa được deploy. Vui lòng deploy contract trước.';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Số dư ví không đủ để thực hiện giao dịch.';
    } else if (error.message.includes('user rejected')) {
      errorMessage = 'Giao dịch bị từ chối bởi người dùng.';
    }
    res.status(500).json({ message: errorMessage });
  }
});

router.get('/salary/:employeeDid', requireAuth, async (req, res) => {
  try {
    const { employeeDid } = req.params;
    const salary = await payrollContractController.getEmployeeSalary(employeeDid);

    res.json({
      message: 'Employee salary retrieved successfully',
      data: salary
    });
  } catch (error) {
    console.error('Error getting employee salary:', error);
    res.status(500).json({ message: error.message });
  }
});

// Payroll Management Routes
router.post('/create', requireAuth, requireHR, async (req, res) => {
  try {
    const { employeeDid, period } = req.body;

    if (!employeeDid || !period) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await payrollContractController.createPayroll(
      employeeDid,
      period,
      req.user.walletAddress
    );

    res.json({
      message: 'Payroll created successfully with automatic KPI calculation',
      data: result
    });
  } catch (error) {
    console.error('Error creating payroll:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/create-manual', requireAuth, requireHR, async (req, res) => {
  try {
    const { employeeDid, period, kpiScore, workingDays, overtimeHours } = req.body;

    if (!employeeDid || !period || kpiScore === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (kpiScore < 0 || kpiScore > 100) {
      return res.status(400).json({ message: 'KPI score must be between 0 and 100' });
    }

    // Fetch employee wallet address from database
    const employeeProfile = await HoSoNhanVien.findOne({ employee_did: employeeDid });
    if (!employeeProfile || !employeeProfile.walletAddress) {
      return res.status(400).json({
        message: 'Employee wallet address not found. Please ensure the employee has connected their wallet.'
      });
    }

    const walletAddress = employeeProfile.walletAddress;
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        message: 'Invalid employee wallet address format. Please check employee profile.'
      });
    }

    const result = await payrollContractController.createPayrollManual(
      employeeDid,
      period,
      kpiScore,
      workingDays,
      overtimeHours,
      walletAddress
    );

    // Get salary info from employee profile to calculate payroll details
    const baseSalary = employeeProfile.baseSalary || 0;
    const kpiBonusPercent = employeeProfile.kpiBonus || 0;
    const allowance = employeeProfile.allowance || 0;
    const taxRate = employeeProfile.taxRate || 0;
    const overtimeRate = employeeProfile.overtimeRate || 150;

    // Calculate salary components
    const workingDaysValue = workingDays !== undefined && workingDays !== null && workingDays !== '' ? Number(workingDays) : 22;
    const overtimeHoursValue = overtimeHours !== undefined && overtimeHours !== null && overtimeHours !== '' ? Number(overtimeHours) : 0;
    
    // Daily salary
    const dailySalary = baseSalary / 22; // Assuming 22 working days per month
    const baseSalaryForPeriod = dailySalary * workingDaysValue;
    
    // KPI bonus
    const kpiBonusAmount = (baseSalaryForPeriod * kpiBonusPercent * kpiScore) / 10000; // kpiBonusPercent is 0-100, kpiScore is 0-100
    
    // Overtime bonus
    const hourlyRate = baseSalary / (22 * 8); // Assuming 8 hours per day
    const overtimeBonus = (hourlyRate * overtimeHoursValue * overtimeRate) / 100;
    
    // Total before tax
    const totalBeforeTax = baseSalaryForPeriod + kpiBonusAmount + allowance + overtimeBonus;
    
    // Tax deduction
    const taxAmount = (totalBeforeTax * taxRate) / 100;
    
    // Net salary
    const netSalary = totalBeforeTax - taxAmount;

    // Sync to Mongo using LuongThuong model
    await LuongThuong.findOneAndUpdate(
      { employee_did: employeeDid, ky_luong: period },
      {
        employee_did: employeeDid,
        ky_luong: period,
        luong_co_ban: Math.round(baseSalaryForPeriod),
        thuong_kpi: Math.round(kpiBonusAmount),
        phu_cap: Math.round(allowance),
        khau_tru: Math.round(taxAmount),
        tong_thuc_linh: Math.round(netSalary),
        trang_thai_thanh_toan: 'Chờ xử lý',
        ngay_thanh_toan: null
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Payroll created successfully with manual KPI score',
      data: result
    });
  } catch (error) {
    console.error('Error creating payroll manually:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create payroll with data from database (attendance + KPI)
router.post('/create-with-db', requireAuth, requireHR, async (req, res) => {
  try {
    const { employeeDid, period } = req.body;

    if (!employeeDid || !period) {
      return res.status(400).json({ message: 'Missing required fields: employeeDid, period' });
    }

    const employeeProfile = await HoSoNhanVien.findOne({ employee_did: employeeDid });
    if (!employeeProfile || !employeeProfile.walletAddress) {
      return res.status(400).json({
        message: 'Employee wallet address not found. Please ensure the employee has connected their wallet.'
      });
    }

    const walletAddress = employeeProfile.walletAddress;
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        message: 'Invalid employee wallet address format. Please check employee profile.'
      });
    }

    const result = await payrollContractController.createPayrollWithDBData(
      employeeDid,
      period,
      walletAddress
    );

    // Get salary info from employee profile to calculate payroll details
    const baseSalary = employeeProfile.baseSalary || 0;
    const kpiBonusPercent = employeeProfile.kpiBonus || 0;
    const allowance = employeeProfile.allowance || 0;
    const taxRate = employeeProfile.taxRate || 0;
    const overtimeRate = employeeProfile.overtimeRate || 150;

    // Try to get calculated values from contract result, or calculate from DB
    let netSalary = 0;
    let baseSalaryForPeriod = 0;
    let kpiBonusAmount = 0;
    let taxAmount = 0;

    try {
      // If result has netSalary, use it
      if (result.netSalary) {
        netSalary = Number(result.netSalary);
      } else {
        // Calculate from contract if available
        const payrollRecord = await payrollContractController.getPayrollRecord(result.payrollId);
        if (payrollRecord && payrollRecord.netSalary) {
          netSalary = Number(payrollRecord.netSalary);
        }
      }
    } catch (err) {
      console.warn('Could not get netSalary from contract, calculating from DB:', err.message);
    }

    // If we don't have netSalary from contract, calculate from DB
    if (netSalary === 0) {
      // Get attendance data
      const ChamCong = require('../models/ChamCong');
      const DanhGiaKpi = require('../models/DanhGiaKpi');
      
      const [year, month] = period.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      const attendanceRecords = await ChamCong.find({
        employee_did: employeeDid,
        ngay_cham_cong: { $gte: startDate, $lte: endDate }
      });
      
      const workingDaysValue = attendanceRecords.filter(r => r.trang_thai === 'Đã chấm công').length;
      const overtimeHoursValue = attendanceRecords.reduce((sum, r) => sum + (r.gio_lam_them || 0), 0);
      
      // Get KPI score
      const kpiRecord = await DanhGiaKpi.findOne({
        employee_did: employeeDid,
        ky_danh_gia: period
      });
      const kpiScore = kpiRecord?.tong_diem || 0;
      
      // Calculate salary components
      const dailySalary = baseSalary / 22;
      baseSalaryForPeriod = dailySalary * workingDaysValue;
      kpiBonusAmount = (baseSalaryForPeriod * kpiBonusPercent * kpiScore) / 10000;
      const hourlyRate = baseSalary / (22 * 8);
      const overtimeBonus = (hourlyRate * overtimeHoursValue * overtimeRate) / 100;
      const totalBeforeTax = baseSalaryForPeriod + kpiBonusAmount + allowance + overtimeBonus;
      taxAmount = (totalBeforeTax * taxRate) / 100;
      netSalary = totalBeforeTax - taxAmount;
    }

    // Sync to Mongo using LuongThuong model
    await LuongThuong.findOneAndUpdate(
      { employee_did: employeeDid, ky_luong: period },
      {
        employee_did: employeeDid,
        ky_luong: period,
        luong_co_ban: Math.round(baseSalaryForPeriod || baseSalary),
        thuong_kpi: Math.round(kpiBonusAmount),
        phu_cap: Math.round(allowance),
        khau_tru: Math.round(taxAmount),
        tong_thuc_linh: Math.round(netSalary),
        trang_thai_thanh_toan: 'Chờ xử lý',
        ngay_thanh_toan: null
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Payroll created successfully with database data (attendance + KPI)',
      data: result
    });
  } catch (error) {
    console.error('Error creating payroll with DB data:', error);
    res.status(500).json({ message: error.message });
  }
});

// Calculate salary preview with database data
router.post('/calculate-preview-db', requireAuth, async (req, res) => {
  try {
    const { employeeDid, period } = req.body;

    if (!employeeDid || !period) {
      return res.status(400).json({ message: 'Missing required fields: employeeDid, period' });
    }

    const calculation = await payrollContractController.calculateSalaryPreviewWithDB(
      employeeDid,
      period
    );

    res.json({
      message: 'Salary preview calculated successfully with database data',
      data: calculation
    });
  } catch (error) {
    console.error('Error calculating salary preview with DB:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/pay/:payrollId', requireAuth, requireHR, async (req, res) => {
  try {
    const { payrollId } = req.params;

    const result = await payrollContractController.payEmployee(
      payrollId,
      req.user.walletAddress
    );

    res.json({
      message: 'Employee paid successfully',
      data: result
    });
  } catch (error) {
    console.error('Error paying employee:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all payrolls (for admin/HR to view all payrolls) - MUST be before /employee/:employeeDid
router.get('/employee/all', requireAuth, requireHR, async (req, res) => {
  try {
    const { period } = req.query;
    const targetPeriod = period || (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    })();
    
    // Try to get from smart contract first
    let payrolls = [];
    try {
      payrolls = await payrollContractController.getPeriodPayrolls(targetPeriod);
    } catch (error) {
      console.warn('Error fetching payrolls from contract, falling back to MongoDB:', error.message);
      // Fallback to MongoDB
      try {
        const mongoPayrolls = await LuongThuong.find({ ky_luong: targetPeriod }).lean();
        payrolls = mongoPayrolls.map(p => ({
          payrollId: p._id?.toString() || null,
          employeeDid: p.employee_did,
          period: p.ky_luong,
          netSalary: p.tong_thuc_linh,
          paidAmount: p.trang_thai_thanh_toan === 'Đã thanh toán' ? p.tong_thuc_linh : 0,
          status: p.trang_thai_thanh_toan === 'Đã thanh toán' ? 'Paid' : 'Pending',
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }));
      } catch (mongoError) {
        console.error('Error fetching payrolls from MongoDB:', mongoError.message);
        payrolls = [];
      }
    }
    
    return res.status(200).json({
      message: 'Payrolls retrieved successfully',
      data: Array.isArray(payrolls) ? payrolls : []
    });
  } catch (error) {
    console.error('Error getting all payrolls:', error);
    return res.status(200).json({
      message: 'Failed to fetch payroll data, returning fallback',
      data: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/employee/:employeeDid', requireAuth, async (req, res) => {
  try {
    const { employeeDid } = req.params;
    const payrolls = await payrollContractController.getEmployeePayrolls(employeeDid);
    const salaryProfile = await HoSoNhanVien.findOne({ employee_did: employeeDid }, {
      baseSalary: 1,
      kpiBonus: 1,
      allowance: 1,
      taxRate: 1,
      overtimeRate: 1,
      salaryUpdatedAt: 1
    }).lean();

    res.json({
      message: 'Employee payrolls retrieved successfully',
      data: Array.isArray(payrolls) ? payrolls : [],
      salaryProfile: salaryProfile || null
    });
  } catch (error) {
    console.error('Error getting employee payrolls:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/period/:period', requireAuth, requireHR, async (req, res) => {
  try {
    const { period } = req.params;
    const payrolls = await payrollContractController.getPeriodPayrolls(period);

    res.json({
      message: 'Period payrolls retrieved successfully',
      data: payrolls
    });
  } catch (error) {
    console.error('Error getting period payrolls:', error);
    res.status(500).json({ message: error.message });
  }
});

// Transaction Management Routes
router.get('/transactions/:employeeDid', requireAuth, async (req, res) => {
  try {
    const { employeeDid } = req.params;
    const transactions = await payrollContractController.getEmployeeTransactions(employeeDid);

    res.json({
      message: 'Employee transactions retrieved successfully',
      data: transactions
    });
  } catch (error) {
    console.error('Error getting employee transactions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Contract Balance Routes
router.get('/balance/contract', requireAuth, requireHR, async (req, res) => {
  try {
    const balance = await payrollContractController.getContractBalance();
    const normalizedBalance = balance?.toString?.() ?? '0';

    res.json({
      message: 'Contract balance retrieved successfully',
      data: { balance: normalizedBalance }
    });
  } catch (error) {
    console.error('Error getting contract balance:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/balance/summary', requireAuth, requireHR, async (req, res) => {
  try {
    const summary = await payrollContractController.getBalanceSummary();
    const normalizedSummary = summary
      ? {
          totalDeposited: summary.totalDeposited?.toString() ?? '0',
          totalPaid: summary.totalPaid?.toString() ?? '0',
          contractBalance: summary.contractBalance?.toString() ?? '0',
          isBalanced: summary.isBalanced ?? true
        }
      : {
          totalDeposited: '0',
          totalPaid: '0',
          contractBalance: '0',
          isBalanced: true
        };

    return res.status(200).json({
      message: 'Balance summary retrieved successfully',
      data: normalizedSummary
    });
  } catch (error) {
    console.error('Error getting balance summary:', error);
    return res.status(200).json({
      message: 'Balance summary unavailable (contract error), returning defaults',
      data: {
        totalDeposited: '0',
        totalPaid: '0',
        contractBalance: '0',
        isBalanced: true
      },
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get payroll record by ID (placed after specific routes to avoid conflicts)
router.get('/record/:payrollId', requireAuth, async (req, res) => {
  try {
    const { payrollId } = req.params;
    const payroll = await payrollContractController.getPayrollRecord(payrollId);

    res.json({
      message: 'Payroll record retrieved successfully',
      data: payroll
    });
  } catch (error) {
    console.error('Error getting payroll record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Salary Calculation Route
router.post('/calculate-salary', requireAuth, async (req, res) => {
  try {
    const { employeeDid, kpiScore } = req.body;

    if (!employeeDid || kpiScore === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const calculation = await payrollContractController.calculateNetSalary(employeeDid, kpiScore);

    res.json({
      message: 'Salary calculated successfully',
      data: calculation
    });
  } catch (error) {
    console.error('Error calculating salary:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/calculate-salary-auto', requireAuth, async (req, res) => {
  try {
    const { employeeDid, period } = req.body;

    if (!employeeDid || !period) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const calculation = await payrollContractController.calculateNetSalaryAuto(employeeDid, period);

    res.json({
      message: 'Salary calculated automatically with KPI data',
      data: calculation
    });
  } catch (error) {
    console.error('Error calculating salary automatically:', error);
    res.status(500).json({ message: error.message });
  }
});

// Deposit Funds Route
router.post('/deposit', requireAuth, requireHR, async (req, res) => {
  try {
    const { amount, tokenAddress } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    const result = await payrollContractController.depositFunds(
      amount,
      req.user.walletAddress,
      tokenAddress
    );

    res.json({
      message: 'Funds deposited successfully',
      data: result
    });
  } catch (error) {
    console.error('Error depositing funds:', error);
    res.status(500).json({ message: error.message });
  }
});

// Role Management Routes
router.post('/roles/grant-hr', requireAuth, requireHR, async (req, res) => {
  try {
    const { account } = req.body;

    if (!account) {
      return res.status(400).json({ message: 'Account address required' });
    }

    const result = await payrollContractController.grantHRRole(
      account,
      req.user.walletAddress
    );

    res.json({
      message: 'HR role granted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error granting HR role:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/roles/grant-employee', requireAuth, requireHR, async (req, res) => {
  try {
    const { account } = req.body;

    if (!account) {
      return res.status(400).json({ message: 'Account address required' });
    }

    const result = await payrollContractController.grantEmployeeRole(
      account,
      req.user.walletAddress
    );

    res.json({
      message: 'Employee role granted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error granting employee role:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/set-kpi-contract', requireAuth, requireHR, async (req, res) => {
  try {
    const { kpiContractAddress } = req.body;

    if (!kpiContractAddress) {
      return res.status(400).json({ message: 'KPI contract address required' });
    }

    const result = await payrollContractController.setKpiContract(
      kpiContractAddress,
      req.user.walletAddress
    );

    res.json({
      message: 'KPI contract address set successfully',
      data: result
    });
  } catch (error) {
    console.error('Error setting KPI contract:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
