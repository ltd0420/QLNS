const AuditLogs = require('../models/AuditLogs');

// Get all audit logs
exports.getAllAuditLogs = async (req, res) => {
  try {
    const auditLogs = await AuditLogs.find();
    res.json(auditLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get audit logs by user DID
exports.getAuditLogsByUser = async (req, res) => {
  try {
    const auditLogs = await AuditLogs.find({ user_did: req.params.userDid });
    res.json(auditLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get audit logs by action type
exports.getAuditLogsByAction = async (req, res) => {
  try {
    const auditLogs = await AuditLogs.find({ action_type: req.params.actionType });
    res.json(auditLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get audit logs by resource type
exports.getAuditLogsByResource = async (req, res) => {
  try {
    const auditLogs = await AuditLogs.find({ resource_type: req.params.resourceType });
    res.json(auditLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get audit logs by date range
exports.getAuditLogsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const auditLogs = await AuditLogs.find({
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    res.json(auditLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new audit log
exports.createAuditLogs = async (req, res) => {
  const auditLogs = new AuditLogs(req.body);
  try {
    const newAuditLogs = await auditLogs.save();
    res.status(201).json(newAuditLogs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update audit log
exports.updateAuditLogs = async (req, res) => {
  try {
    const updatedAuditLogs = await AuditLogs.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedAuditLogs) {
      return res.status(404).json({ message: 'Audit log not found' });
    }
    res.json(updatedAuditLogs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete audit log
exports.deleteAuditLogs = async (req, res) => {
  try {
    const deletedAuditLogs = await AuditLogs.findByIdAndDelete(req.params.id);
    if (!deletedAuditLogs) {
      return res.status(404).json({ message: 'Audit log not found' });
    }
    res.json({ message: 'Audit log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get audit logs by IP address
exports.getAuditLogsByIP = async (req, res) => {
  try {
    const auditLogs = await AuditLogs.find({ ip_address: req.params.ipAddress });
    res.json(auditLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
