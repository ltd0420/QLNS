const { Web3 } = require('web3');
const config = require('../config/web3');
const PayrollManagement = require('../artifacts/contracts/PayrollManagement.sol/PayrollManagement.json');
const ChamCong = require('../models/ChamCong');
const HoSoNhanVien = require('../models/HoSoNhanVien');
const DanhGiaKpi = require('../models/DanhGiaKpi');

class PayrollContractController {
  constructor() {
    const networkConfig = config.web3Config.networks[config.web3Config.currentNetwork];
    this.web3 = new Web3(networkConfig.provider);
    this.contractAddress = config.web3Config.contracts.payrollContract;
    this.contract = new this.web3.eth.Contract(
      PayrollManagement.abi,
      this.contractAddress
    );
    
    // Configure account for sending transactions (if private key is available)
    if (config.web3Config.wallet.privateKey) {
      try {
        const account = this.web3.eth.accounts.privateKeyToAccount('0x' + config.web3Config.wallet.privateKey);
        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account.address;
        console.log('Web3 account configured from private key:', account.address);
      } catch (error) {
        console.warn('Could not configure Web3 account from private key:', error.message);
      }
    }
  }

  // Helper method to check if contract is deployed
  _checkContractDeployed() {
    if (!this.contractAddress || this.contractAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("Payroll contract is not deployed. Please deploy the contract first.");
    }
  }

  _applyGasBuffer(gasEstimate) {
    try {
      const gasBigInt = typeof gasEstimate === 'bigint' ? gasEstimate : BigInt(gasEstimate);
      return (gasBigInt * 110n) / 100n;
    } catch (error) {
      const gasNumber = Number(gasEstimate);
      return Math.ceil(gasNumber * 1.1);
    }
  }

  _toNumber(value) {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string') return Number(value);
    if (value.toString) return Number(value.toString());
    return 0;
  }

  // Employee Salary Management
  async setEmployeeSalary(employeeDid, baseSalary, kpiBonus, allowance, taxRate, overtimeRate, fromAddress) {
    try {
      console.log('setEmployeeSalary called with:', { employeeDid, baseSalary, kpiBonus, allowance, taxRate, overtimeRate, fromAddress });
      console.log('Contract address:', this.contractAddress);
      console.log('Web3 provider:', this.web3.currentProvider?.host || 'Not set');
      
      // Check if contract is deployed
      this._checkContractDeployed();
      
      // Check if Web3 is connected
      try {
        const blockNumber = await this.web3.eth.getBlockNumber();
        console.log('Connected to blockchain, current block:', blockNumber);
      } catch (connectionError) {
        console.error('Cannot connect to blockchain node:', connectionError);
        throw new Error('Cannot connect to blockchain node. Please ensure the Ethereum node is running on localhost:8545');
      }
      
      // Validate fromAddress
      if (!fromAddress || !this.web3.utils.isAddress(fromAddress)) {
        throw new Error(`Invalid wallet address: ${fromAddress}`);
      }
      
      // Normalize address to checksum format
      fromAddress = this.web3.utils.toChecksumAddress(fromAddress);
      
      // Check account balance (optional, but helpful for debugging)
      try {
        const balance = await this.web3.eth.getBalance(fromAddress);
        const balanceEth = this.web3.utils.fromWei(balance, 'ether');
        console.log('Account balance:', balanceEth, 'ETH');
        if (parseFloat(balanceEth) < 0.001) {
          console.warn('Account balance is very low. Transaction might fail due to insufficient gas.');
        }
      } catch (balanceError) {
        console.warn('Could not check account balance:', balanceError.message);
      }
      
      // For local development, try to unlock account if needed
      // Note: This only works if the node allows account unlocking
      // In Hardhat/Ganache, accounts are usually unlocked by default
      
      console.log('Estimating gas for setEmployeeSalary...');
      let gasEstimate;
      try {
        gasEstimate = await this.contract.methods
          .setEmployeeSalary(employeeDid, baseSalary, kpiBonus, allowance, taxRate, overtimeRate)
          .estimateGas({ from: fromAddress });
        console.log('Gas estimate:', gasEstimate);
      } catch (estimateError) {
        console.error('Gas estimation failed:', estimateError);
        throw new Error(`Gas estimation failed: ${estimateError.message}. This usually means the transaction would revert. Check contract permissions and requirements.`);
      }

      const gasWithBuffer = this._applyGasBuffer(gasEstimate);
      console.log('Gas with buffer (10%):', gasWithBuffer.toString());

      console.log('Sending transaction from:', fromAddress);
      let tx;
      try {
        tx = await this.contract.methods
          .setEmployeeSalary(employeeDid, baseSalary, kpiBonus, allowance, taxRate, overtimeRate)
          .send({
            from: fromAddress,
            gas: gasWithBuffer
          });
      } catch (sendError) {
        console.error('Transaction send failed:', sendError);
        // Check if it's an account unlock issue
        if (sendError.message?.includes('account is not unlocked') || 
            sendError.message?.includes('unknown account') ||
            sendError.message?.includes('account not found')) {
          throw new Error(`Account ${fromAddress} is not unlocked or not available. For local development, ensure the account is unlocked on your blockchain node (Hardhat/Ganache).`);
        }
        throw sendError;
      }

      console.log('Transaction successful!');
      console.log('Transaction hash:', tx.transactionHash);
      console.log('Block number:', tx.blockNumber);

      return {
        success: true,
        transactionHash: tx.transactionHash,
        employeeDid,
        baseSalary,
        kpiBonus,
        allowance,
        taxRate,
        overtimeRate
      };
    } catch (error) {
      console.error('Error setting employee salary - Full details:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      
      // Provide clearer error messages for connection issues
      if (error.code === 'ECONNREFUSED' || 
          error.message?.includes('ECONNREFUSED') || 
          error.message?.includes('failed, reason') ||
          error.message?.includes('connect ECONNREFUSED') ||
          error.message?.includes('connection not open')) {
        throw new Error('Cannot connect to blockchain node. Please ensure the Ethereum node is running on localhost:8545');
      }
      if (error.message?.includes('not deployed') || error.message?.includes('Payroll contract is not deployed')) {
        throw new Error('Payroll contract is not deployed. Please deploy the contract first.');
      }
      if (error.message?.includes('insufficient funds') || error.message?.includes('insufficient balance')) {
        throw new Error('Insufficient funds in wallet to pay for gas fees.');
      }
      if (error.message?.includes('revert') || error.message?.includes('execution reverted')) {
        throw new Error(`Transaction reverted: ${error.reason || error.message}. Please check contract permissions and requirements.`);
      }
      if (error.message?.includes('invalid address') || error.message?.includes('Invalid address')) {
        throw new Error(`Invalid wallet address: ${fromAddress}`);
      }
      if (error.message?.includes('nonce') || error.message?.includes('replacement transaction')) {
        throw new Error('Nonce error. Please try again in a few seconds.');
      }
      
      // Re-throw with more context
      throw new Error(`Failed to set employee salary: ${error.message || 'Unknown error'}`);
    }
  }

  async updateEmployeeSalary(employeeDid, baseSalary, kpiBonus, allowance, taxRate, overtimeRate, fromAddress) {
    try {
      const gasEstimate = await this.contract.methods
        .updateEmployeeSalary(employeeDid, baseSalary, kpiBonus, allowance, taxRate, overtimeRate)
        .estimateGas({ from: fromAddress });

      const tx = await this.contract.methods
        .updateEmployeeSalary(employeeDid, baseSalary, kpiBonus, allowance, taxRate, overtimeRate)
        .send({
          from: fromAddress,
        gas: this._applyGasBuffer(gasEstimate)
        });

      return {
        success: true,
        transactionHash: tx.transactionHash,
        employeeDid,
        baseSalary,
        kpiBonus,
        allowance,
        taxRate,
        overtimeRate
      };
    } catch (error) {
      console.error('Error updating employee salary:', error);
      throw new Error(`Failed to update employee salary: ${error.message}`);
    }
  }

  async getEmployeeSalary(employeeDid) {
    try {
      const salary = await this.contract.methods.getEmployeeSalary(employeeDid).call();
      return {
        employeeDid: salary.employeeDid,
        baseSalary: salary.baseSalary,
        kpiBonus: salary.kpiBonus,
        allowance: salary.allowance,
        taxRate: salary.taxRate,
        isActive: salary.isActive,
        lastPaidDate: salary.lastPaidDate,
        totalPaid: salary.totalPaid
      };
    } catch (error) {
      console.error('Error getting employee salary:', error);
      throw new Error(`Failed to get employee salary: ${error.message}`);
    }
  }

  // Payroll Management
  async createPayroll(employeeDid, period, fromAddress) {
    try {
      const gasEstimate = await this.contract.methods
        .createPayroll(employeeDid, period)
        .estimateGas({ from: fromAddress });

      const tx = await this.contract.methods
        .createPayroll(employeeDid, period)
        .send({
          from: fromAddress,
        gas: this._applyGasBuffer(gasEstimate)
        });

      // Get the created payroll ID from transaction logs
      const payrollId = tx.events?.PayrollCreated?.returnValues?.payrollId;

      return {
        success: true,
        transactionHash: tx.transactionHash,
        payrollId,
        employeeDid,
        period
      };
    } catch (error) {
      console.error('Error creating payroll:', error);
      throw new Error(`Failed to create payroll: ${error.message}`);
    }
  }

  async createPayrollManual(employeeDid, period, kpiScore, workingDays, overtimeHours, fromAddress) {
    try {
      // If workingDays and overtimeHours are not provided, use defaults
      const workingDaysValue = workingDays !== undefined && workingDays !== null && workingDays !== ''
        ? Number(workingDays)
        : 22;
      const overtimeHoursValue = overtimeHours !== undefined && overtimeHours !== null && overtimeHours !== ''
        ? Number(overtimeHours)
        : 0;

      const gasEstimate = await this.contract.methods
        .createPayrollManual(employeeDid, period, kpiScore, workingDaysValue, overtimeHoursValue)
        .estimateGas({ from: fromAddress });

      const tx = await this.contract.methods
        .createPayrollManual(employeeDid, period, kpiScore, workingDaysValue, overtimeHoursValue)
        .send({
          from: fromAddress,
          gas: this._applyGasBuffer(gasEstimate)
        });

      // Get the created payroll ID from transaction logs
      const payrollId = tx.events?.PayrollCreated?.returnValues?.payrollId;

      return {
        success: true,
        transactionHash: tx.transactionHash,
        payrollId,
        employeeDid,
        period,
        kpiScore,
        workingDays: workingDaysValue,
        overtimeHours: overtimeHoursValue
      };
    } catch (error) {
      console.error('Error creating payroll manually:', error);
      throw new Error(`Failed to create payroll manually: ${error.message}`);
    }
  }

  async payEmployee(payrollId, fromAddress) {
    try {
      const gasEstimate = await this.contract.methods
        .payEmployee(payrollId)
        .estimateGas({ from: fromAddress });

      const tx = await this.contract.methods
        .payEmployee(payrollId)
        .send({
          from: fromAddress,
        gas: this._applyGasBuffer(gasEstimate)
        });

      return {
        success: true,
        transactionHash: tx.transactionHash,
        payrollId,
        paidAmount: tx.events?.PayrollPaid?.returnValues?.amount
      };
    } catch (error) {
      console.error('Error paying employee:', error);
      throw new Error(`Failed to pay employee: ${error.message}`);
    }
  }

  async getPayrollRecord(payrollId) {
    try {
      const payroll = await this.contract.methods.getPayrollRecord(payrollId).call();
      return {
        payrollId: payroll.payrollId,
        employeeDid: payroll.employeeDid,
        period: payroll.period,
        baseSalary: payroll.baseSalary,
        kpiBonus: payroll.kpiBonus,
        allowance: payroll.allowance,
        taxAmount: payroll.taxAmount,
        netSalary: payroll.netSalary,
        paidAmount: payroll.paidAmount,
        status: payroll.status,
        createdAt: payroll.createdAt,
        paidAt: payroll.paidAt
      };
    } catch (error) {
      console.error('Error getting payroll record:', error);
      throw new Error(`Failed to get payroll record: ${error.message}`);
    }
  }

  async getEmployeePayrolls(employeeDid) {
    try {
      const payrollIds = await this.contract.methods.getEmployeePayrolls(employeeDid).call();
      const payrolls = [];

      for (const id of payrollIds) {
        try {
          const payroll = await this.getPayrollRecord(id);
          payrolls.push(payroll);
        } catch (error) {
          console.warn(`Failed to get payroll ${id}:`, error);
        }
      }

      return payrolls;
    } catch (error) {
      console.error('Error getting employee payrolls:', error);
      throw new Error(`Failed to get employee payrolls: ${error.message}`);
    }
  }

  async getPeriodPayrolls(period) {
    try {
      this._checkContractDeployed();
      const payrollIds = await this.contract.methods.getPeriodPayrolls(period).call();
      const payrolls = [];

      for (const id of payrollIds) {
        try {
          const payroll = await this.getPayrollRecord(id);
          payrolls.push(payroll);
        } catch (error) {
          console.warn(`Failed to get payroll ${id}:`, error);
        }
      }

      return payrolls;
    } catch (error) {
      console.error('Error getting period payrolls:', error);
      // Return empty array if contract not deployed or blockchain node not available
      if (error.message.includes('not deployed') || 
          error.code === 'ECONNREFUSED' || 
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('failed, reason')) {
        return [];
      }
      throw new Error(`Failed to get period payrolls: ${error.message}`);
    }
  }

  // Transaction Management
  async getEmployeeTransactions(employeeDid) {
    try {
      const transactionIds = await this.contract.methods.getEmployeeTransactions(employeeDid).call();
      const transactions = [];

      for (const id of transactionIds) {
        try {
          const tx = await this.contract.methods.getTransaction(id).call();
          transactions.push({
            transactionId: tx.transactionId,
            employeeDid: tx.employeeDid,
            amount: tx.amount,
            transactionType: tx.transactionType,
            description: tx.description,
            timestamp: tx.timestamp,
            txHash: tx.txHash
          });
        } catch (error) {
          console.warn(`Failed to get transaction ${id}:`, error);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error getting employee transactions:', error);
      throw new Error(`Failed to get employee transactions: ${error.message}`);
    }
  }

  // Contract Balance Management
  async getContractBalance() {
    try {
      const balance = await this.contract.methods.getContractBalance().call();
      return balance;
    } catch (error) {
      console.error('Error getting contract balance:', error);
      throw new Error(`Failed to get contract balance: ${error.message}`);
    }
  }

  async getBalanceSummary() {
    try {
      this._checkContractDeployed();
      const summary = await this.contract.methods.getBalanceSummary().call();
      return {
        totalDeposited: summary._totalDeposited,
        totalPaid: summary._totalPaid,
        contractBalance: summary._contractBalance,
        isBalanced: summary.isBalanced
      };
    } catch (error) {
      console.error('Error getting balance summary:', error);
      // Return default values if contract not deployed or blockchain node not available
      if (error.message.includes('not deployed') || 
          error.code === 'ECONNREFUSED' || 
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('failed, reason')) {
        return {
          totalDeposited: '0',
          totalPaid: '0',
          contractBalance: '0',
          isBalanced: true
        };
      }
      throw new Error(`Failed to get balance summary: ${error.message}`);
    }
  }

  async calculateNetSalary(employeeDid, kpiScore) {
    try {
      const calculation = await this.contract.methods.calculateNetSalary(employeeDid, kpiScore).call();
      return {
        baseSalary: calculation.baseSalary,
        kpiBonus: calculation.kpiBonus,
        allowance: calculation.allowance,
        taxAmount: calculation.taxAmount,
        netSalary: calculation.netSalary
      };
    } catch (error) {
      console.error('Error calculating net salary:', error);
      throw new Error(`Failed to calculate net salary: ${error.message}`);
    }
  }

  async calculateNetSalaryAuto(employeeDid, period) {
    try {
      const calculation = await this.contract.methods.calculateNetSalaryAuto(employeeDid, period).call();
      return {
        baseSalary: calculation.baseSalary,
        kpiBonus: calculation.kpiBonus,
        allowance: calculation.allowance,
        taxAmount: calculation.taxAmount,
        netSalary: calculation.netSalary,
        kpiScore: calculation.kpiScore
      };
    } catch (error) {
      console.error('Error calculating net salary automatically:', error);
      throw new Error(`Failed to calculate net salary automatically: ${error.message}`);
    }
  }

  // Deposit/Withdraw Funds
  async depositFunds(amount, fromAddress, tokenAddress = null) {
    try {
      let tx;
      if (tokenAddress) {
        // ERC20 deposit - would need approval first
        tx = await this.contract.methods.depositFunds(amount).send({
          from: fromAddress,
          gas: 200000
        });
      } else {
        // ETH deposit
        tx = await this.contract.methods.depositFunds(amount).send({
          from: fromAddress,
          value: amount,
          gas: 200000
        });
      }

      return {
        success: true,
        transactionHash: tx.transactionHash,
        amount
      };
    } catch (error) {
      console.error('Error depositing funds:', error);
      throw new Error(`Failed to deposit funds: ${error.message}`);
    }
  }

  // Role Management
  async grantHRRole(account, fromAddress) {
    try {
      const gasEstimate = await this.contract.methods
        .grantHRRole(account)
        .estimateGas({ from: fromAddress });

      const tx = await this.contract.methods
        .grantHRRole(account)
        .send({
          from: fromAddress,
        gas: this._applyGasBuffer(gasEstimate)
        });

      return {
        success: true,
        transactionHash: tx.transactionHash,
        account
      };
    } catch (error) {
      console.error('Error granting HR role:', error);
      throw new Error(`Failed to grant HR role: ${error.message}`);
    }
  }

  async grantEmployeeRole(account, fromAddress) {
    try {
      const gasEstimate = await this.contract.methods
        .grantEmployeeRole(account)
        .estimateGas({ from: fromAddress });

      const tx = await this.contract.methods
        .grantEmployeeRole(account)
        .send({
          from: fromAddress,
        gas: this._applyGasBuffer(gasEstimate)
        });

      return {
        success: true,
        transactionHash: tx.transactionHash,
        account
      };
    } catch (error) {
      console.error('Error granting employee role:', error);
      throw new Error(`Failed to grant employee role: ${error.message}`);
    }
  }

  async setKpiContract(kpiContractAddress, fromAddress) {
    try {
      const gasEstimate = await this.contract.methods
        .setKpiContract(kpiContractAddress)
        .estimateGas({ from: fromAddress });

      const tx = await this.contract.methods
        .setKpiContract(kpiContractAddress)
        .send({
          from: fromAddress,
        gas: this._applyGasBuffer(gasEstimate)
        });

      return {
        success: true,
        transactionHash: tx.transactionHash,
        kpiContractAddress
      };
    } catch (error) {
      console.error('Error setting KPI contract:', error);
      throw new Error(`Failed to set KPI contract: ${error.message}`);
    }
  }

  // Helper function to get attendance data from database
  async getAttendanceDataFromDB(employeeDid, period) {
    try {
      // Parse period (YYYY-MM) to get start and end dates
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get all attendance records for the period
      const attendanceRecords = await ChamCong.find({
        employee_did: employeeDid,
        ngay: {
          $gte: startDate,
          $lte: endDate
        },
        loai_ngay: { $ne: 'Vắng không phép' } // Exclude unauthorized absences
      });

      // Calculate working days, total hours, and overtime hours
      let workingDays = 0;
      let totalHours = 0;
      let overtimeHours = 0;
      const standardHoursPerDay = 8;

      attendanceRecords.forEach(record => {
        if (record.loai_ngay === 'Ngày thường' || record.loai_ngay === 'Cuối tuần' || record.loai_ngay === 'Lễ') {
          workingDays++;
          if (record.tong_gio_lam) {
            totalHours += record.tong_gio_lam;
            // Calculate overtime (hours beyond 8 hours per day)
            const dailyOvertime = Math.max(0, record.tong_gio_lam - standardHoursPerDay);
            overtimeHours += dailyOvertime;
          }
        }
      });

      return {
        workingDays,
        totalHours,
        overtimeHours
      };
    } catch (error) {
      console.error('Error getting attendance data from DB:', error);
      throw new Error(`Failed to get attendance data: ${error.message}`);
    }
  }

  // Helper function to get KPI score from database
  async getKpiScoreFromDB(employeeDid, period) {
    try {
      // Get KPI evaluations for the period (only approved ones)
      const kpiEvaluations = await DanhGiaKpi.find({
        employee_did: employeeDid,
        ky_danh_gia: period,
        trang_thai: 'Đã phê duyệt' // Only use approved evaluations
      });

      if (kpiEvaluations.length === 0) {
        return 0;
      }

      // Calculate average KPI score
      const totalScore = kpiEvaluations.reduce((sum, evaluation) => sum + (evaluation.diem_so || 0), 0);
      const averageScore = totalScore / kpiEvaluations.length;

      return Math.round(averageScore * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error getting KPI score from DB:', error);
      throw new Error(`Failed to get KPI score: ${error.message}`);
    }
  }

  // Create payroll with data from database (attendance + KPI)
  async createPayrollWithDBData(employeeDid, period, fromAddress) {
    try {
      // Get attendance data from database
      const attendanceData = await this.getAttendanceDataFromDB(employeeDid, period);
      
      // Get KPI score from database
      const kpiScore = await this.getKpiScoreFromDB(employeeDid, period);

      // Create payroll with manual data
      const gasEstimate = await this.contract.methods
        .createPayrollManual(
          employeeDid,
          period,
          Math.round(kpiScore),
          attendanceData.workingDays,
          Math.round(attendanceData.overtimeHours)
        )
        .estimateGas({ from: fromAddress });

      const tx = await this.contract.methods
        .createPayrollManual(
          employeeDid,
          period,
          Math.round(kpiScore),
          attendanceData.workingDays,
          Math.round(attendanceData.overtimeHours)
        )
        .send({
          from: fromAddress,
          gas: this._applyGasBuffer(gasEstimate)
        });

      const payrollId = tx.events?.PayrollCreated?.returnValues?.payrollId;

      return {
        success: true,
        transactionHash: tx.transactionHash,
        payrollId,
        employeeDid,
        period,
        kpiScore,
        attendanceData
      };
    } catch (error) {
      console.error('Error creating payroll with DB data:', error);
      throw new Error(`Failed to create payroll with DB data: ${error.message}`);
    }
  }

  // Calculate salary preview with database data (without creating payroll)
  async calculateSalaryPreviewWithDB(employeeDid, period) {
    try {
      // Get attendance data from database
      const attendanceData = await this.getAttendanceDataFromDB(employeeDid, period);
      
      // Get KPI score from database
      const kpiScore = await this.getKpiScoreFromDB(employeeDid, period);

      const roundedKpiScore = Math.round(kpiScore);
      const roundedOvertimeHours = Math.round(attendanceData.overtimeHours || 0);

      try {
        const calculation = await this.contract.methods
          .calculateNetSalaryManual(
            employeeDid,
            roundedKpiScore,
            attendanceData.workingDays,
            roundedOvertimeHours
          )
          .call();

        const baseSalaryActual = this._toNumber(calculation.baseSalaryActual ?? calculation[0]);
        const kpiBonusAmount = this._toNumber(calculation.kpiBonus ?? calculation[1]);
        const allowanceAmount = this._toNumber(calculation.allowance ?? calculation[2]);
        const overtimeBonusAmount = this._toNumber(calculation.overtimeBonus ?? calculation[3]);
        const taxAmount = this._toNumber(calculation.taxAmount ?? calculation[4]);
        const netSalary = this._toNumber(calculation.netSalary ?? calculation[5]);

        return {
          baseSalaryActual,
          kpiBonus: kpiBonusAmount,
          allowance: allowanceAmount,
          overtimeBonus: overtimeBonusAmount,
          taxAmount,
          netSalary,
          kpiScore: roundedKpiScore,
          attendanceData
        };
      } catch (contractError) {
        console.warn('Contract salary preview failed, using local fallback:', contractError.message);
        const fallback = await this._calculateSalaryPreviewLocally(
          employeeDid,
          roundedKpiScore,
          attendanceData,
          roundedOvertimeHours
        );

        if (!fallback) {
          throw contractError;
        }

        return {
          ...fallback,
          kpiScore: roundedKpiScore,
          attendanceData
        };
      }
    } catch (error) {
      console.error('Error calculating salary preview with DB:', error);
      throw new Error(`Failed to calculate salary preview: ${error.message}`);
    }
  }

  async _calculateSalaryPreviewLocally(employeeDid, kpiScore, attendanceData, overtimeHours) {
    const profile = await HoSoNhanVien.findOne({ employee_did: employeeDid });
    if (!profile || profile.baseSalary === undefined || profile.baseSalary === null) {
      console.warn('Local salary preview fallback failed: salary profile not found for', employeeDid);
      return null;
    }

    const baseSalary = Number(profile.baseSalary) || 0;
    const allowance = Number(profile.allowance) || 0;
    const taxRate = Number(profile.taxRate) || 0;
    const kpiBonusPercent = Number(profile.kpiBonus) || 0;
    const overtimeRate = Number(profile.overtimeRate) || 150;

    const workingDays = Number(attendanceData?.workingDays) || 0;
    const overtimeHoursValue = Number(overtimeHours) || 0;

    const STANDARD_WORKING_DAYS = 22;
    const STANDARD_WORKING_HOURS_PER_YEAR = 2080;

    const dailyBaseSalary = Math.floor(baseSalary / STANDARD_WORKING_DAYS);
    const baseSalaryActual = dailyBaseSalary * workingDays;

    const kpiBonusAmount = Math.floor((baseSalary * kpiBonusPercent * kpiScore) / 10000);
    const monthlyHours = STANDARD_WORKING_HOURS_PER_YEAR / 12;
    const hourlyRate = baseSalary / monthlyHours;
    const overtimeBonus = Math.floor((hourlyRate * overtimeHoursValue * overtimeRate) / 100);

    const grossSalary = baseSalaryActual + kpiBonusAmount + allowance + overtimeBonus;
    const taxAmount = Math.floor((grossSalary * taxRate) / 100);
    const netSalary = grossSalary - taxAmount;

    return {
      baseSalaryActual,
      kpiBonus: kpiBonusAmount,
      allowance,
      overtimeBonus,
      taxAmount,
      netSalary
    };
  }
}

module.exports = new PayrollContractController();
