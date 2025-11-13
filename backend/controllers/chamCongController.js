const ChamCong = require('../models/ChamCong');
const SmartContractLogs = require('../models/SmartContractLogs');
const AuditLogs = require('../models/AuditLogs');
const crypto = require('crypto');
const Web3 = require('web3');

// Get all attendance records
const getAll = async (req, res) => {
  try {
    const chamCong = await ChamCong.find();
    res.json(chamCong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by employee DID
const getByEmployee = async (req, res) => {
  try {
    const { startDate, endDate, loai_ngay, xac_thuc_qua, onChain } = req.query;

    let query = { employee_did: req.params.employeeDid };

    // Apply date range filter
    if (startDate && endDate) {
      query.ngay = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Apply day type filter
    if (loai_ngay && loai_ngay !== 'all') {
      query.loai_ngay = loai_ngay;
    }

    // Apply authentication method filter
    if (xac_thuc_qua && xac_thuc_qua !== 'all') {
      query.xac_thuc_qua = xac_thuc_qua;
    }

    // Apply on-chain filter
    if (onChain !== undefined && onChain !== 'all') {
      const isOnChain = onChain === 'true' || onChain === true;
      if (isOnChain) {
        query.transaction_hash = { $exists: true, $ne: null };
      } else {
        query.$or = [
          { transaction_hash: { $exists: false } },
          { transaction_hash: null }
        ];
      }
    }

    const chamCong = await ChamCong.find(query)
      .sort({ ngay: -1 }); // Sort by date descending

    res.json(chamCong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by ID (MongoDB _id)
const getById = async (req, res) => {
  try {
    const chamCong = await ChamCong.findById(req.params.id);
    if (!chamCong) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.json(chamCong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by date range
const getByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const chamCong = await ChamCong.find({
      ngay: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    res.json(chamCong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by employee and date
const getByEmployeeAndDate = async (req, res) => {
  try {
    const chamCong = await ChamCong.findOne({
      employee_did: req.params.employeeDid,
      ngay: req.params.date
    });
    if (!chamCong) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.json(chamCong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new attendance record
const create = async (req, res) => {
  const chamCong = new ChamCong(req.body);
  try {
    const newChamCong = await chamCong.save();
    res.status(201).json(newChamCong);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update attendance record
const update = async (req, res) => {
  try {
    const updatedChamCong = await ChamCong.findOneAndUpdate(
      {
        employee_did: req.params.employeeDid,
        ngay: req.params.date
      },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedChamCong) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.json(updatedChamCong);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete attendance record
const deleteAttendance = async (req, res) => {
  try {
    const deletedChamCong = await ChamCong.findOneAndDelete({
      employee_did: req.params.employeeDid,
      ngay: req.params.date
    });
    if (!deletedChamCong) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate record hash
const calculateRecordHash = (record) => {
  const data = {
    employee_did: record.employee_did,
    ngay: record.ngay.toISOString().split('T')[0],
    gio_vao: record.gio_vao,
    gio_ra: record.gio_ra,
    tong_gio_lam: record.tong_gio_lam,
    xac_thuc_qua: record.xac_thuc_qua
  };
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

// Helper function to anchor record on blockchain (mock implementation)
const anchorToBlockchain = async (employeeDid, date, recordHash) => {
  try {
    // Mock blockchain interaction - in real implementation, this would call smart contract
    const mockTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;

    // Save to smart contract logs
    const smartContractLog = new SmartContractLogs({
      contract_address: process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      transaction_hash: mockTxHash,
      block_number: Math.floor(Math.random() * 1000000) + 1000000,
      function_name: 'anchorAttendance',
      parameters: {
        employeeDid,
        date: new Date(date).toISOString().split('T')[0],
        recordHash
      },
      gas_used: Math.floor(Math.random() * 50000) + 20000,
      status: 'Success',
      event_logs: [{
        event_name: 'AttendanceAnchored',
        data: {
          employeeDid,
          date: new Date(date).toISOString().split('T')[0],
          recordHash
        }
      }],
      timestamp: new Date()
    });

    await smartContractLog.save();
    return mockTxHash;
  } catch (error) {
    console.error('Blockchain anchoring error:', error);
    throw error;
  }
};

// Helper function to determine day type
const determineDayType = (date) => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Check if it's weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'Cuối tuần';
  }

  // TODO: Add holiday checking logic here
  // For now, return 'Ngày thường' for weekdays
  return 'Ngày thường';
};

// Check-in (create or update check-in time)
const checkIn = async (req, res) => {
  try {
    const { employee_did, ngay, gio_vao, xac_thuc_qua, qr_code_id } = req.body;

    // Validate required fields
    if (!employee_did || !ngay || !gio_vao || !xac_thuc_qua) {
      return res.status(400).json({ message: 'Missing required fields: employee_did, ngay, gio_vao, xac_thuc_qua' });
    }

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(gio_vao)) {
      return res.status(400).json({ message: 'Invalid time format for gio_vao. Use HH:MM:SS' });
    }

    // Convert date string to Date object
    const attendanceDate = new Date(ngay);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format for ngay. Use YYYY-MM-DD' });
    }

    // Validate QR code if provided
    if (xac_thuc_qua === 'QR Code' && qr_code_id) {
      const QrAuthentication = require('../models/QrAuthentication');
      const qrAuth = await QrAuthentication.findOne({
        qr_code_id: qr_code_id,
        employee_did: employee_did,
        trang_thai: 'Hoạt động'
      });

      if (!qrAuth) {
        return res.status(400).json({ message: 'Invalid or inactive QR code' });
      }

      // Update QR usage
      qrAuth.so_lan_su_dung += 1;
      qrAuth.lan_su_dung_cuoi = new Date();
      await qrAuth.save();
    }

    // Check if employee already checked in today
    const existingRecord = await ChamCong.findOne({ employee_did, ngay: attendanceDate });
    if (existingRecord && existingRecord.gio_vao) {
      return res.status(400).json({ message: 'Employee has already checked in today' });
    }

    const dayType = determineDayType(attendanceDate);

    let chamCong;
    if (existingRecord) {
      // Update existing record
      existingRecord.gio_vao = gio_vao;
      existingRecord.xac_thuc_qua = xac_thuc_qua;
      existingRecord.loai_ngay = dayType;
      chamCong = await existingRecord.save();
    } else {
      // Create new record
      chamCong = new ChamCong({
        employee_did,
        ngay: attendanceDate,
        gio_vao,
        xac_thuc_qua,
        loai_ngay: dayType
      });
      chamCong = await chamCong.save();
    }

    // Calculate record hash and anchor to blockchain
    const recordHash = calculateRecordHash(chamCong);
    chamCong.record_hash = recordHash;

    try {
      const txHash = await anchorToBlockchain(employee_did, ngay, recordHash);
      chamCong.transaction_hash = txHash;
    } catch (blockchainError) {
      console.error('Blockchain anchoring failed:', blockchainError);
      // Continue without blockchain anchoring
    }

    await chamCong.save();

    // Create audit log
    const auditLog = new AuditLogs({
      user_did: employee_did,
      action: existingRecord ? 'UPDATE' : 'CREATE',
      resource_type: 'cham_cong',
      resource_id: chamCong._id.toString(),
      changes: {
        before: existingRecord || null,
        after: {
          employee_did,
          ngay,
          gio_vao,
          xac_thuc_qua,
          loai_ngay: dayType,
          record_hash: recordHash,
          transaction_hash: chamCong.transaction_hash
        }
      },
      status: 'Success',
      details: `Check-in recorded for ${employee_did} on ${ngay} at ${gio_vao}`,
      timestamp: new Date(),
      ip_address: req.ip
    });
    await auditLog.save();

    res.json(chamCong);
  } catch (error) {
    console.error('Check-in error:', error);

    // Create error audit log
    try {
      const auditLog = new AuditLogs({
        user_did: req.body.employee_did || 'unknown',
        action: 'CREATE',
        resource_type: 'cham_cong',
        resource_id: null,
        changes: { error: error.message },
        status: 'Failed',
        details: `Check-in failed: ${error.message}`,
        timestamp: new Date(),
        ip_address: req.ip
      });
      await auditLog.save();
    } catch (auditError) {
      console.error('Failed to create error audit log:', auditError);
    }

    res.status(400).json({ message: error.message });
  }
};

// Check-out (update check-out time and calculate total hours)
const checkOut = async (req, res) => {
  try {
    const { employee_did, ngay, gio_ra, qr_code_id } = req.body;

    // Validate required fields
    if (!employee_did || !ngay || !gio_ra) {
      return res.status(400).json({ message: 'Missing required fields: employee_did, ngay, gio_ra' });
    }

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(gio_ra)) {
      return res.status(400).json({ message: 'Invalid time format for gio_ra. Use HH:MM:SS' });
    }

    // Convert date string to Date object for consistent querying
    const attendanceDate = new Date(ngay);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format for ngay. Use YYYY-MM-DD' });
    }

    const chamCong = await ChamCong.findOne({ employee_did, ngay: attendanceDate });

    if (!chamCong) {
      return res.status(404).json({ message: 'Check-in record not found for today' });
    }

    // Check if already checked out
    if (chamCong.gio_ra) {
      return res.status(400).json({ message: 'Employee has already checked out today' });
    }

    // Check if check-in exists
    if (!chamCong.gio_vao) {
      return res.status(400).json({ message: 'Cannot check-out without check-in first' });
    }

    // Validate check-out time is after check-in time
    const checkInTime = new Date(`${ngay}T${chamCong.gio_vao}`);
    const checkOutTime = new Date(`${ngay}T${gio_ra}`);

    if (checkOutTime <= checkInTime) {
      return res.status(400).json({ message: 'Check-out time must be after check-in time' });
    }

    // Validate QR code if provided
    if (chamCong.xac_thuc_qua === 'QR Code' && qr_code_id) {
      const QrAuthentication = require('../models/QrAuthentication');
      const qrAuth = await QrAuthentication.findOne({
        qr_code_id: qr_code_id,
        employee_did: employee_did,
        trang_thai: 'Hoạt động'
      });

      if (!qrAuth) {
        return res.status(400).json({ message: 'Invalid or inactive QR code' });
      }

      // Update QR usage
      qrAuth.so_lan_su_dung += 1;
      qrAuth.lan_su_dung_cuoi = new Date();
      await qrAuth.save();
    }

    chamCong.gio_ra = gio_ra;

    // Calculate total hours
    const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    chamCong.tong_gio_lam = Math.round(totalHours * 100) / 100; // Round to 2 decimal places

    // Calculate record hash and anchor to blockchain
    const recordHash = calculateRecordHash(chamCong);
    chamCong.record_hash = recordHash;

    try {
      const txHash = await anchorToBlockchain(employee_did, ngay, recordHash);
      chamCong.transaction_hash = txHash;
    } catch (blockchainError) {
      console.error('Blockchain anchoring failed:', blockchainError);
      // Continue without blockchain anchoring
    }

    await chamCong.save();

    // Create audit log
    const auditLog = new AuditLogs({
      user_did: employee_did,
      action: 'UPDATE',
      resource_type: 'cham_cong',
      resource_id: chamCong._id.toString(),
      changes: {
        before: {
          gio_ra: null,
          tong_gio_lam: null
        },
        after: {
          gio_ra,
          tong_gio_lam: chamCong.tong_gio_lam,
          record_hash: recordHash,
          transaction_hash: chamCong.transaction_hash
        }
      },
      status: 'Success',
      details: `Check-out recorded for ${employee_did} on ${ngay} at ${gio_ra}. Total hours: ${chamCong.tong_gio_lam}`,
      timestamp: new Date(),
      ip_address: req.ip
    });
    await auditLog.save();

    res.json(chamCong);
  } catch (error) {
    console.error('Check-out error:', error);

    // Create error audit log
    try {
      const auditLog = new AuditLogs({
        user_did: req.body.employee_did || 'unknown',
        action: 'UPDATE',
        resource_type: 'cham_cong',
        resource_id: null,
        changes: { error: error.message },
        status: 'Failed',
        details: `Check-out failed: ${error.message}`,
        timestamp: new Date(),
        ip_address: req.ip
      });
      await auditLog.save();
    } catch (auditError) {
      console.error('Failed to create error audit log:', auditError);
    }

    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  getByEmployee,
  getByDateRange,
  getByEmployeeAndDate,
  create,
  update,
  delete: deleteAttendance,
  checkIn,
  checkOut
};
