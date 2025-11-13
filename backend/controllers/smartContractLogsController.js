const SmartContractLogs = require('../models/SmartContractLogs');

// Get all smart contract logs
exports.getAllSmartContractLogs = async (req, res) => {
  try {
    const smartContractLogs = await SmartContractLogs.find().sort({ timestamp: -1 });
    res.json({ 
      message: 'Smart contract logs retrieved successfully',
      data: smartContractLogs 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logs by transaction hash
exports.getSmartContractLogsByTxHash = async (req, res) => {
  try {
    const smartContractLogs = await SmartContractLogs.find({ transaction_hash: req.params.txHash });
    res.json(smartContractLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logs by contract address
exports.getSmartContractLogsByContract = async (req, res) => {
  try {
    const smartContractLogs = await SmartContractLogs.find({ contract_address: req.params.contractAddress });
    res.json(smartContractLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logs by event type
exports.getSmartContractLogsByEvent = async (req, res) => {
  try {
    const smartContractLogs = await SmartContractLogs.find({ event_type: req.params.eventType });
    res.json(smartContractLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logs by block range
exports.getSmartContractLogsByBlockRange = async (req, res) => {
  try {
    const { startBlock, endBlock } = req.params;
    const smartContractLogs = await SmartContractLogs.find({
      block_number: {
        $gte: parseInt(startBlock),
        $lte: parseInt(endBlock)
      }
    });
    res.json(smartContractLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new smart contract log
exports.createSmartContractLogs = async (req, res) => {
  const smartContractLogs = new SmartContractLogs(req.body);
  try {
    const newSmartContractLogs = await smartContractLogs.save();
    res.status(201).json(newSmartContractLogs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update smart contract log
exports.updateSmartContractLogs = async (req, res) => {
  try {
    const updatedSmartContractLogs = await SmartContractLogs.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedSmartContractLogs) {
      return res.status(404).json({ message: 'Smart contract log not found' });
    }
    res.json(updatedSmartContractLogs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete smart contract log
exports.deleteSmartContractLogs = async (req, res) => {
  try {
    const deletedSmartContractLogs = await SmartContractLogs.findByIdAndDelete(req.params.id);
    if (!deletedSmartContractLogs) {
      return res.status(404).json({ message: 'Smart contract log not found' });
    }
    res.json({ message: 'Smart contract log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logs by employee DID (for employee-related transactions)
exports.getSmartContractLogsByEmployee = async (req, res) => {
  try {
    const smartContractLogs = await SmartContractLogs.find({
      'event_data.employee_did': req.params.employeeDid
    });
    res.json(smartContractLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
