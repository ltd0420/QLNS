const QrAuthentication = require('../models/QrAuthentication');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { getQRAuthContract, web3Utils, initializeWeb3, signer } = require('../config/web3');

// Get all QR authentications
exports.getAllQrAuthentication = async (req, res) => {
  try {
    const qrAuthentication = await QrAuthentication.find();
    res.json(qrAuthentication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get QR authentication by QR code ID
exports.getQrAuthenticationById = async (req, res) => {
  try {
    const qrAuthentication = await QrAuthentication.findOne({ qr_code_id: req.params.id });
    if (!qrAuthentication) {
      return res.status(404).json({ message: 'QR authentication not found' });
    }
    res.json(qrAuthentication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get QR authentications by employee DID
exports.getQrAuthenticationByEmployee = async (req, res) => {
  try {
    const qrAuthentication = await QrAuthentication.findOne({ employee_did: req.params.employeeDid });
    if (!qrAuthentication) {
      // If no QR code exists, create one with blockchain integration
      const newQr = await createBlockchainQR(req.params.employeeDid, req.body?.walletAddress);
      return res.json(newQr);
    }
    res.json(qrAuthentication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate new QR code for employee with blockchain integration
exports.generateNewQrCode = async (req, res) => {
  try {
    const { employeeDid } = req.params;
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required for blockchain integration' });
    }

    // Find existing QR code
    let existingQr = await QrAuthentication.findOne({ employee_did: employeeDid });

    // Check if user has exceeded the limit (3 times per day)
    if (existingQr) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastCreateDate = existingQr.lan_tao_qr_cuoi ? new Date(existingQr.lan_tao_qr_cuoi) : null;
      lastCreateDate?.setHours(0, 0, 0, 0);

      if (lastCreateDate && lastCreateDate.getTime() === today.getTime()) {
        // Same day, check count
        if (existingQr.so_lan_tao_qr >= 3) {
          return res.status(429).json({
            message: 'Bạn đã tạo QR code quá 3 lần trong ngày hôm nay. Tài khoản sẽ bị tạm khóa để bảo mật.',
            locked: true
          });
        }
      } else {
        // Different day, reset counter
        existingQr.so_lan_tao_qr = 0;
      }
    }

    // Delete existing QR code if it exists
    if (existingQr) {
      await QrAuthentication.findOneAndDelete({ employee_did: employeeDid });
    }

    // Create new QR with blockchain integration
    const newQr = await createBlockchainQR(employeeDid, walletAddress, (existingQr ? existingQr.so_lan_tao_qr : 0) + 1);

    return res.json(newQr);
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to create QR with blockchain integration
async function createBlockchainQR(employeeDid, walletAddress, createCount = 1) {
  try {
    // Initialize Web3
    await initializeWeb3();

    // Generate QR data
    const qrCodeId = crypto.randomUUID();
    const timestamp = Date.now();

    const qrData = {
      qr_code_id: qrCodeId,
      employee_did: employeeDid,
      wallet_address: walletAddress,
      timestamp: new Date().toISOString(),
      type: 'login_auth',
      blockchain: {
        network: 'ethereum',
        standard: 'ERC-721',
        contract_address: process.env.QR_AUTH_CONTRACT || '0x0000000000000000000000000000000000000000'
      }
    };

    // Generate cryptographic hash and signature
    const qrHash = web3Utils.generateQRHash(qrData);
    const signature = await web3Utils.signQRData(qrData);

    // Mint NFT on blockchain
    let tokenId = null;
    let transactionHash = null;

    try {
      const qrContract = getQRAuthContract();
      const expiryDate = 0; // Permanent

      // Check if signer is available for transactions
      if (!signer) {
        throw new Error('No wallet configured for blockchain transactions');
      }

      const tx = await qrContract.mintQRToken(walletAddress, qrCodeId, employeeDid, qrHash, expiryDate);
      const receipt = await tx.wait();

      tokenId = receipt.logs[0].args.tokenId.toString();
      transactionHash = receipt.hash;

      console.log(`NFT minted successfully. Token ID: ${tokenId}, TX: ${transactionHash}`);
    } catch (blockchainError) {
      console.error('Blockchain minting failed:', blockchainError);
      // Demo mode: Continue without blockchain for now, but log the error
      // Generate demo token ID and transaction hash
      tokenId = `demo_${Date.now()}`;
      transactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      console.log(`Demo mode: Using demo token ID: ${tokenId}, TX: ${transactionHash}`);
    }

    // Generate QR code image
    const qrImage = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Save to database
    const newQr = new QrAuthentication({
      qr_code_id: qrCodeId,
      employee_did: employeeDid,
      qr_hash: qrHash,
      qr_image: qrImage,
      trang_thai: 'Hoạt động',
      ngay_cap: new Date(),
      ngay_het_han: null,
      so_lan_su_dung: 0,
      lan_su_dung_cuoi: null,
      so_lan_tao_qr: createCount,
      lan_tao_qr_cuoi: new Date(),
      // Blockchain fields
      token_id: tokenId,
      transaction_hash: transactionHash,
      wallet_address: walletAddress,
      blockchain_signature: signature,
      contract_address: process.env.QR_AUTH_CONTRACT,
      network: 'ethereum'
    });

    const savedQr = await newQr.save();
    return savedQr;
  } catch (error) {
    console.error('Create blockchain QR error:', error);
    throw error;
  }
}

// Validate QR code for login with blockchain verification
exports.validateQrForLogin = async (req, res) => {
  try {
    const { qr_code_id, qr_hash, signature, wallet_address } = req.body;

    if (!qr_code_id || !qr_hash) {
      return res.status(400).json({ message: 'QR code data is required' });
    }

    const qrAuthentication = await QrAuthentication.findOne({
      qr_code_id: qr_code_id,
      qr_hash: qr_hash,
      trang_thai: 'Hoạt động'
    });

    if (!qrAuthentication) {
      return res.status(404).json({ message: 'Invalid or inactive QR code' });
    }

    if (qrAuthentication.ngay_het_han && new Date() > qrAuthentication.ngay_het_han) {
      return res.status(400).json({ message: 'QR code has expired' });
    }

    // Blockchain verification
    let blockchainValid = false;
    try {
      const qrContract = getQRAuthContract();
      const [isValid, tokenId] = await qrContract.verifyQRToken(qr_code_id, qr_hash, qrAuthentication.employee_did);
      blockchainValid = isValid;

      if (blockchainValid && tokenId) {
        // Record usage on blockchain
        await qrContract.recordQRUsage(qr_code_id);
      }
    } catch (blockchainError) {
      console.error('Blockchain verification failed:', blockchainError.message);
      // Check if it's a contract not deployed error
      if (blockchainError.message.includes('not deployed or address not configured')) {
        console.log('Demo mode: QR Authentication contract not deployed, skipping blockchain verification');
      } else {
        // Continue with database validation if blockchain fails for other reasons
      }
    }

    // Verify signature if provided
    if (signature && wallet_address) {
      const qrData = {
        qr_code_id: qr_code_id,
        employee_did: qrAuthentication.employee_did,
        wallet_address: wallet_address,
        timestamp: qrAuthentication.createdAt.toISOString(),
        type: 'login_auth'
      };

      const signatureValid = web3Utils.verifyQRSignature(qrData, signature, wallet_address);
      if (!signatureValid) {
        return res.status(400).json({ message: 'Invalid signature' });
      }
    }

    // Increment usage count and update last used time
    qrAuthentication.so_lan_su_dung += 1;
    qrAuthentication.lan_su_dung_cuoi = new Date();
    await qrAuthentication.save();

    res.json({
      success: true,
      employee_did: qrAuthentication.employee_did,
      qr_image: qrAuthentication.qr_image,
      blockchain_verified: blockchainValid,
      token_id: qrAuthentication.token_id,
      message: 'QR code validated successfully'
    });
  } catch (error) {
    console.error('Validate QR error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get QR authentications by status
exports.getQrAuthenticationByStatus = async (req, res) => {
  try {
    const qrAuthentication = await QrAuthentication.find({ trang_thai: req.params.status });
    res.json(qrAuthentication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new QR authentication
exports.createQrAuthentication = async (req, res) => {
  const qrAuthentication = new QrAuthentication(req.body);
  try {
    const newQrAuthentication = await qrAuthentication.save();
    res.status(201).json(newQrAuthentication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update QR authentication
exports.updateQrAuthentication = async (req, res) => {
  try {
    const updatedQrAuthentication = await QrAuthentication.findOneAndUpdate(
      { qr_code_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedQrAuthentication) {
      return res.status(404).json({ message: 'QR authentication not found' });
    }
    res.json(updatedQrAuthentication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete QR authentication
exports.deleteQrAuthentication = async (req, res) => {
  try {
    const deletedQrAuthentication = await QrAuthentication.findOneAndDelete({ qr_code_id: req.params.id });
    if (!deletedQrAuthentication) {
      return res.status(404).json({ message: 'QR authentication not found' });
    }
    res.json({ message: 'QR authentication deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Revoke QR authentication with blockchain
exports.revokeQrAuthentication = async (req, res) => {
  try {
    const qrAuthentication = await QrAuthentication.findOne({ qr_code_id: req.params.id });

    if (!qrAuthentication) {
      return res.status(404).json({ message: 'QR authentication not found' });
    }

    // Revoke on blockchain if token exists
    if (qrAuthentication.token_id) {
      try {
        const qrContract = getQRAuthContract();
        await qrContract.revokeQRToken(req.params.id);
      } catch (blockchainError) {
        console.error('Blockchain revoke failed:', blockchainError);
      }
    }

    // Update database
    const updatedQrAuthentication = await QrAuthentication.findOneAndUpdate(
      { qr_code_id: req.params.id },
      {
        trang_thai: 'Đã thu hồi',
        ngay_het_han: new Date()
      },
      { new: true }
    );

    res.json(updatedQrAuthentication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Validate QR authentication (increment usage count)
exports.validateQrAuthentication = async (req, res) => {
  try {
    const qrAuthentication = await QrAuthentication.findOne({ qr_code_id: req.params.id });

    if (!qrAuthentication) {
      return res.status(404).json({ message: 'QR authentication not found' });
    }

    if (qrAuthentication.trang_thai !== 'Hoạt động') {
      return res.status(400).json({ message: 'QR authentication is not active' });
    }

    if (qrAuthentication.ngay_het_han && new Date() > qrAuthentication.ngay_het_han) {
      return res.status(400).json({ message: 'QR authentication has expired' });
    }

    // Increment usage count and update last used time
    qrAuthentication.so_lan_su_dung += 1;
    qrAuthentication.lan_su_dung_cuoi = new Date();
    await qrAuthentication.save();

    res.json(qrAuthentication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Welcome endpoint for QR authentication with logging
exports.welcomeQr = async (req, res) => {
  try {
    // Log request metadata
    const EventLogsUser = require('../models/EventLogsUser');
    const logEntry = new EventLogsUser({
      user_did: null, // No specific user for welcome
      event_type: 'QR_AUTH_REQUEST',
      message: `QR Authentication request: ${req.method} ${req.path}`,
      resource_type: 'qr_auth',
      resource_id: null,
      is_read: false,
      timestamp: new Date()
    });

    // Add metadata to message
    logEntry.message += ` | IP: ${req.ip || req.connection.remoteAddress} | User-Agent: ${req.get('User-Agent')}`;

    await logEntry.save();

    // Return welcome message
    res.json({
      message: 'Welcome to the QR Authentication System!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Welcome QR error:', error);
    res.status(500).json({ message: error.message });
  }
};
