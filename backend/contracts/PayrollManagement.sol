// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Interface for KpiManagement contract
interface IKpiManagement {
    function getEmployeeKpiSummary(string memory employeeDid, string memory kyDanhGia)
        external view returns (uint256 totalScore, uint256 evaluationCount, string memory overallRanking);
}

// Interface for Attendance contract (future integration)
interface IAttendanceManagement {
    function getEmployeeAttendanceSummary(string memory employeeDid, string memory period)
        external view returns (uint256 workingDays, uint256 totalHours, uint256 overtimeHours);
}

contract PayrollManagement is Ownable, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _payrollIdCounter;
    Counters.Counter private _transactionIdCounter;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant HR_ROLE = keccak256("HR_ROLE");
    bytes32 public constant EMPLOYEE_ROLE = keccak256("EMPLOYEE_ROLE");

    // ERC20 token for payroll (can be set to any ERC20 token)
    IERC20 public payrollToken;

    // Integration contracts
    IKpiManagement public kpiContract;
    IAttendanceManagement public attendanceContract;

    // Payroll configuration
    uint256 public standardWorkingDaysPerMonth = 22; // Standard working days per month
    uint256 public standardWorkingHoursPerMonth = 176; // Standard working hours per month (22 days * 8 hours)
    uint256 public standardWorkingHoursPerYear = 2080; // Standard working hours per year (for hourly rate calculation)

    // Struct for Employee Salary Info
    struct EmployeeSalary {
        string employeeDid;
        uint256 baseSalary; // Monthly base salary in wei
        uint256 kpiBonus; // KPI bonus percentage (0-100)
        uint256 allowance; // Monthly allowance in wei
        uint256 taxRate; // Tax rate percentage (0-100)
        uint256 overtimeRate; // Overtime multiplier (e.g., 150 for 1.5x)
        bool isActive;
        uint256 lastPaidDate;
        uint256 totalPaid;
    }

    // Struct for Attendance Data (for calculation)
    struct AttendanceData {
        uint256 workingDays; // Actual working days in month
        uint256 totalHours; // Total working hours
        uint256 overtimeHours; // Overtime hours
    }

    // Struct for Payroll Record
    struct PayrollRecord {
        uint256 payrollId;
        string employeeDid;
        string period; // e.g., "2024-01"
        uint256 baseSalary;
        uint256 actualWorkingDays; // Actual working days
        uint256 standardWorkingDays; // Standard working days
        uint256 baseSalaryActual; // Base salary based on actual working days
        uint256 kpiBonus;
        uint256 allowance;
        uint256 overtimeBonus;
        uint256 taxAmount;
        uint256 netSalary;
        uint256 paidAmount;
        string status; // "Pending", "Approved", "Paid", "Cancelled"
        uint256 createdAt;
        uint256 approvedAt;
        uint256 paidAt;
        address approvedBy;
        address paidBy;
    }

    // Struct for Transaction Record
    struct TransactionRecord {
        uint256 transactionId;
        string employeeDid;
        uint256 amount;
        string transactionType; // "Salary", "Bonus", "Allowance", "Refund"
        string description;
        uint256 timestamp;
        bytes32 txHash;
    }

    // Mappings
    mapping(string => EmployeeSalary) public employeeSalaries; // employeeDid => EmployeeSalary
    mapping(uint256 => PayrollRecord) public payrollRecords; // payrollId => PayrollRecord
    mapping(string => uint256[]) public employeePayrolls; // employeeDid => payrollIds[]
    mapping(string => uint256[]) public periodPayrolls; // period => payrollIds[]
    mapping(uint256 => TransactionRecord) public transactions; // transactionId => TransactionRecord
    mapping(string => uint256[]) public employeeTransactions; // employeeDid => transactionIds[]

    // Contract balance tracking
    uint256 public totalDeposited;
    uint256 public totalPaid;
    uint256 public contractBalance;

    // Events
    event EmployeeSalarySet(string indexed employeeDid, uint256 baseSalary, uint256 kpiBonus);
    event PayrollCreated(uint256 indexed payrollId, string employeeDid, string period, uint256 netSalary);
    event PayrollApproved(uint256 indexed payrollId, string employeeDid, address approvedBy);
    event PayrollPaid(uint256 indexed payrollId, string employeeDid, uint256 amount, bytes32 txHash);
    event PayrollCancelled(uint256 indexed payrollId, string employeeDid);
    event PayrollUpdated(uint256 indexed payrollId, string employeeDid, uint256 newNetSalary);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed withdrawer, uint256 amount);
    event TokenSet(address indexed tokenAddress);
    event TransactionRecorded(uint256 indexed transactionId, string employeeDid, uint256 amount, string transactionType);
    event KpiContractSet(address indexed kpiContractAddress);
    event AttendanceContractSet(address indexed attendanceContractAddress);
    event PayrollConfigUpdated(uint256 standardWorkingDays, uint256 standardWorkingHours);

    constructor(address _payrollToken, address _kpiContract, address _attendanceContract) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(HR_ROLE, msg.sender);

        if (_payrollToken != address(0)) {
            payrollToken = IERC20(_payrollToken);
            emit TokenSet(_payrollToken);
        }

        if (_kpiContract != address(0)) {
            kpiContract = IKpiManagement(_kpiContract);
            emit KpiContractSet(_kpiContract);
        }

        if (_attendanceContract != address(0)) {
            attendanceContract = IAttendanceManagement(_attendanceContract);
            emit AttendanceContractSet(_attendanceContract);
        }
    }

    // Modifiers
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can perform this action");
        _;
    }

    modifier onlyHR() {
        require(hasRole(HR_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "Only HR or admin can perform this action");
        _;
    }

    /**
     * @dev Set payroll token (only owner)
     */
    function setPayrollToken(address _payrollToken) external onlyOwner {
        require(_payrollToken != address(0), "Invalid token address");
        payrollToken = IERC20(_payrollToken);
        emit TokenSet(_payrollToken);
    }



    /**
     * @dev Set attendance contract address (only owner)
     */
    function setAttendanceContract(address _attendanceContract) external onlyOwner {
        require(_attendanceContract != address(0), "Invalid attendance contract address");
        attendanceContract = IAttendanceManagement(_attendanceContract);
        emit AttendanceContractSet(_attendanceContract);
    }

    /**
     * @dev Update payroll configuration (only admin)
     */
    function updatePayrollConfig(uint256 _standardWorkingDays, uint256 _standardWorkingHours) external onlyAdmin {
        require(_standardWorkingDays > 0, "Standard working days must be > 0");
        require(_standardWorkingHours > 0, "Standard working hours must be > 0");

        standardWorkingDaysPerMonth = _standardWorkingDays;
        standardWorkingHoursPerMonth = _standardWorkingHours;

        emit PayrollConfigUpdated(_standardWorkingDays, _standardWorkingHours);
    }

    /**
     * @dev Set employee salary information
     */
    function setEmployeeSalary(
        string memory employeeDid,
        uint256 baseSalary,
        uint256 kpiBonus,
        uint256 allowance,
        uint256 taxRate,
        uint256 overtimeRate
    ) external onlyHR {
        require(bytes(employeeDid).length > 0, "Employee DID cannot be empty");
        require(kpiBonus <= 100, "KPI bonus must be <= 100");
        require(taxRate <= 100, "Tax rate must be <= 100");
        require(overtimeRate >= 100, "Overtime rate must be >= 100 (1x)");

        employeeSalaries[employeeDid] = EmployeeSalary({
            employeeDid: employeeDid,
            baseSalary: baseSalary,
            kpiBonus: kpiBonus,
            allowance: allowance,
            taxRate: taxRate,
            overtimeRate: overtimeRate,
            isActive: true,
            lastPaidDate: 0,
            totalPaid: 0
        });

        emit EmployeeSalarySet(employeeDid, baseSalary, kpiBonus);
    }

    /**
     * @dev Update employee salary
     */
    function updateEmployeeSalary(
        string memory employeeDid,
        uint256 baseSalary,
        uint256 kpiBonus,
        uint256 allowance,
        uint256 taxRate,
        uint256 overtimeRate
    ) external onlyHR {
        require(employeeSalaries[employeeDid].isActive, "Employee salary not set");

        EmployeeSalary storage salary = employeeSalaries[employeeDid];
        salary.baseSalary = baseSalary;
        salary.kpiBonus = kpiBonus;
        salary.allowance = allowance;
        salary.taxRate = taxRate;
        salary.overtimeRate = overtimeRate;

        emit EmployeeSalarySet(employeeDid, baseSalary, kpiBonus);
    }

    /**
     * @dev Deactivate employee salary
     */
    function deactivateEmployeeSalary(string memory employeeDid) external onlyHR {
        require(employeeSalaries[employeeDid].isActive, "Employee salary not active");
        employeeSalaries[employeeDid].isActive = false;
    }

    /**
     * @dev Get attendance data for employee in period
     */
    function _getAttendanceData(string memory employeeDid, string memory period) internal view returns (AttendanceData memory) {
        if (address(attendanceContract) != address(0)) {
            (uint256 workingDays, uint256 totalHours, uint256 overtimeHours) =
                attendanceContract.getEmployeeAttendanceSummary(employeeDid, period);
            return AttendanceData(workingDays, totalHours, overtimeHours);
        } else {
            // Fallback: assume full attendance if no attendance contract
            return AttendanceData(standardWorkingDaysPerMonth, standardWorkingHoursPerMonth, 0);
        }
    }

    /**
     * @dev Calculate salary components
     */
    function _calculateSalaryComponents(
        string memory employeeDid,
        string memory period,
        uint256 kpiScore
    ) internal view returns (
        uint256 baseSalaryActual,
        uint256 kpiBonus,
        uint256 allowance,
        uint256 overtimeBonus,
        uint256 taxAmount,
        uint256 netSalary,
        AttendanceData memory attendance
    ) {
        EmployeeSalary memory salary = employeeSalaries[employeeDid];
        attendance = _getAttendanceData(employeeDid, period);

        // Calculate base salary based on actual working days
        uint256 dailyBaseSalary = salary.baseSalary / standardWorkingDaysPerMonth;
        baseSalaryActual = dailyBaseSalary * attendance.workingDays;

        // Calculate KPI bonus
        kpiBonus = (salary.baseSalary * salary.kpiBonus * kpiScore) / 10000;

        // Allowance remains fixed
        allowance = salary.allowance;

        // Calculate overtime bonus
        // Formula: (Base Salary ÷ 2080 hours/year) × Overtime Hours × Overtime Rate
        // Using monthly equivalent: (Base Salary ÷ (2080/12)) × Overtime Hours × Overtime Rate
        uint256 monthlyHours = standardWorkingHoursPerYear / 12; // ~173.33 hours/month
        uint256 hourlyRate = salary.baseSalary / monthlyHours;
        overtimeBonus = (hourlyRate * attendance.overtimeHours * salary.overtimeRate) / 100;

        // Calculate gross salary
        uint256 grossSalary = baseSalaryActual + kpiBonus + allowance + overtimeBonus;

        // Calculate tax
        taxAmount = (grossSalary * salary.taxRate) / 100;

        // Calculate net salary
        netSalary = grossSalary - taxAmount;

        return (baseSalaryActual, kpiBonus, allowance, overtimeBonus, taxAmount, netSalary, attendance);
    }

    /**
     * @dev Create payroll record for employee with automatic KPI and attendance calculation
     */
    function createPayroll(
        string memory employeeDid,
        string memory period
    ) external onlyHR returns (uint256) {
        require(employeeSalaries[employeeDid].isActive, "Employee salary not active");

        // Get KPI score from KPI contract
        uint256 kpiScore = 0;
        if (address(kpiContract) != address(0)) {
            (uint256 totalScore, uint256 evaluationCount, ) = kpiContract.getEmployeeKpiSummary(employeeDid, period);
            kpiScore = evaluationCount > 0 ? totalScore / evaluationCount : 0;
            require(kpiScore <= 100, "Invalid KPI score from contract");
        }

        // Calculate salary components
        (
            uint256 baseSalaryActual,
            uint256 kpiBonus,
            uint256 allowance,
            uint256 overtimeBonus,
            uint256 taxAmount,
            uint256 netSalary,
            AttendanceData memory attendance
        ) = _calculateSalaryComponents(employeeDid, period, kpiScore);

        _payrollIdCounter.increment();
        uint256 payrollId = _payrollIdCounter.current();

        payrollRecords[payrollId] = PayrollRecord({
            payrollId: payrollId,
            employeeDid: employeeDid,
            period: period,
            baseSalary: employeeSalaries[employeeDid].baseSalary,
            actualWorkingDays: attendance.workingDays,
            standardWorkingDays: standardWorkingDaysPerMonth,
            baseSalaryActual: baseSalaryActual,
            kpiBonus: kpiBonus,
            allowance: allowance,
            overtimeBonus: overtimeBonus,
            taxAmount: taxAmount,
            netSalary: netSalary,
            paidAmount: 0,
            status: "Pending",
            createdAt: block.timestamp,
            approvedAt: 0,
            paidAt: 0,
            approvedBy: address(0),
            paidBy: address(0)
        });

        // Update mappings
        employeePayrolls[employeeDid].push(payrollId);
        periodPayrolls[period].push(payrollId);

        emit PayrollCreated(payrollId, employeeDid, period, netSalary);
        return payrollId;
    }

    /**
     * @dev Create payroll record with manual KPI score and attendance data
     */
    function createPayrollManual(
        string memory employeeDid,
        string memory period,
        uint256 kpiScore,
        uint256 workingDays,
        uint256 overtimeHours
    ) external onlyHR returns (uint256) {
        require(employeeSalaries[employeeDid].isActive, "Employee salary not active");
        require(kpiScore <= 100, "KPI score must be <= 100");
        require(workingDays <= 31, "Working days must be <= 31");

        // Calculate salary components with manual data
        (
            uint256 baseSalaryActual,
            uint256 kpiBonus,
            uint256 allowance,
            uint256 overtimeBonus,
            uint256 taxAmount,
            uint256 netSalary,
            AttendanceData memory attendance
        ) = _calculateSalaryComponents(employeeDid, period, kpiScore);

        // Override attendance data with manual input
        attendance.workingDays = workingDays;
        attendance.overtimeHours = overtimeHours;

        // Recalculate base salary with manual working days
        EmployeeSalary memory salary = employeeSalaries[employeeDid];
        uint256 dailyBaseSalary = salary.baseSalary / standardWorkingDaysPerMonth;
        baseSalaryActual = dailyBaseSalary * workingDays;

        // Recalculate overtime bonus with manual overtime hours
        // Formula: (Base Salary ÷ 2080 hours/year) × Overtime Hours × Overtime Rate
        uint256 monthlyHours = standardWorkingHoursPerYear / 12; // ~173.33 hours/month
        uint256 hourlyRate = salary.baseSalary / monthlyHours;
        overtimeBonus = (hourlyRate * overtimeHours * salary.overtimeRate) / 100;

        // Recalculate gross and net salary
        uint256 grossSalary = baseSalaryActual + kpiBonus + allowance + overtimeBonus;
        taxAmount = (grossSalary * salary.taxRate) / 100;
        netSalary = grossSalary - taxAmount;

        _payrollIdCounter.increment();
        uint256 payrollId = _payrollIdCounter.current();

        payrollRecords[payrollId] = PayrollRecord({
            payrollId: payrollId,
            employeeDid: employeeDid,
            period: period,
            baseSalary: salary.baseSalary,
            actualWorkingDays: workingDays,
            standardWorkingDays: standardWorkingDaysPerMonth,
            baseSalaryActual: baseSalaryActual,
            kpiBonus: kpiBonus,
            allowance: allowance,
            overtimeBonus: overtimeBonus,
            taxAmount: taxAmount,
            netSalary: netSalary,
            paidAmount: 0,
            status: "Pending",
            createdAt: block.timestamp,
            approvedAt: 0,
            paidAt: 0,
            approvedBy: address(0),
            paidBy: address(0)
        });

        // Update mappings
        employeePayrolls[employeeDid].push(payrollId);
        periodPayrolls[period].push(payrollId);

        emit PayrollCreated(payrollId, employeeDid, period, netSalary);
        return payrollId;
    }

    /**
     * @dev Approve payroll (only admin)
     */
    function approvePayroll(uint256 payrollId) external onlyAdmin {
        PayrollRecord storage payroll = payrollRecords[payrollId];
        require(payroll.payrollId != 0, "Payroll record does not exist");
        require(keccak256(bytes(payroll.status)) == keccak256(bytes("Pending")), "Payroll not pending");

        payroll.status = "Approved";
        payroll.approvedAt = block.timestamp;
        payroll.approvedBy = msg.sender;

        emit PayrollApproved(payrollId, payroll.employeeDid, msg.sender);
    }

    /**
     * @dev Update payroll before payment (only HR, if not approved)
     */
    function updatePayroll(
        uint256 payrollId,
        uint256 kpiScore,
        uint256 workingDays,
        uint256 overtimeHours
    ) external onlyHR {
        PayrollRecord storage payroll = payrollRecords[payrollId];
        require(payroll.payrollId != 0, "Payroll record does not exist");
        require(keccak256(bytes(payroll.status)) == keccak256(bytes("Pending")), "Can only update pending payroll");

        require(kpiScore <= 100, "KPI score must be <= 100");
        require(workingDays <= 31, "Working days must be <= 31");

        // Recalculate salary components
        EmployeeSalary memory salary = employeeSalaries[payroll.employeeDid];

        uint256 dailyBaseSalary = salary.baseSalary / standardWorkingDaysPerMonth;
        uint256 baseSalaryActual = dailyBaseSalary * workingDays;

        uint256 kpiBonus = (salary.baseSalary * salary.kpiBonus * kpiScore) / 10000;
        uint256 allowance = salary.allowance;

        // Calculate overtime bonus using same formula
        uint256 monthlyHours = standardWorkingHoursPerYear / 12; // ~173.33 hours/month
        uint256 hourlyRate = salary.baseSalary / monthlyHours;
        uint256 overtimeBonus = (hourlyRate * overtimeHours * salary.overtimeRate) / 100;

        uint256 grossSalary = baseSalaryActual + kpiBonus + allowance + overtimeBonus;
        uint256 taxAmount = (grossSalary * salary.taxRate) / 100;
        uint256 netSalary = grossSalary - taxAmount;

        // Update payroll record
        payroll.actualWorkingDays = workingDays;
        payroll.baseSalaryActual = baseSalaryActual;
        payroll.kpiBonus = kpiBonus;
        payroll.overtimeBonus = overtimeBonus;
        payroll.taxAmount = taxAmount;
        payroll.netSalary = netSalary;

        emit PayrollUpdated(payrollId, payroll.employeeDid, netSalary);
    }

    /**
     * @dev Pay employee salary (only admin, after approval)
     */
    function payEmployee(uint256 payrollId) external onlyAdmin nonReentrant {
        PayrollRecord storage payroll = payrollRecords[payrollId];
        require(payroll.payrollId != 0, "Payroll record does not exist");
        require(keccak256(bytes(payroll.status)) == keccak256(bytes("Approved")), "Payroll not approved");

        uint256 amount = payroll.netSalary;
        require(amount > 0, "Invalid payment amount");

        // Check contract balance
        if (address(payrollToken) != address(0)) {
            require(payrollToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        } else {
            require(address(this).balance >= amount, "Insufficient ETH balance");
        }

        // Update payroll status
        payroll.status = "Paid";
        payroll.paidAmount = amount;
        payroll.paidAt = block.timestamp;
        payroll.paidBy = msg.sender;

        // Update employee salary info
        EmployeeSalary storage salary = employeeSalaries[payroll.employeeDid];
        salary.lastPaidDate = block.timestamp;
        salary.totalPaid += amount;

        // Update contract balance tracking
        totalPaid += amount;
        contractBalance = address(payrollToken) != address(0) ?
            payrollToken.balanceOf(address(this)) : address(this).balance;

        // Transfer tokens/ETH
        bytes32 txHash;
        if (address(payrollToken) != address(0)) {
            // ERC20 transfer
            bool success = payrollToken.transfer(msg.sender, amount); // Transfer to caller (admin)
            require(success, "Token transfer failed");
            txHash = keccak256(abi.encodePacked(block.timestamp, payrollId, amount));
        } else {
            // ETH transfer
            payable(msg.sender).transfer(amount);
            txHash = keccak256(abi.encodePacked(block.timestamp, payrollId, amount));
        }

        // Record transaction
        _recordTransaction(payroll.employeeDid, amount, "Salary", string(abi.encodePacked("Payroll for period ", payroll.period)), txHash);

        emit PayrollPaid(payrollId, payroll.employeeDid, amount, txHash);
    }

    /**
     * @dev Cancel payroll
     */
    function cancelPayroll(uint256 payrollId) external onlyHR {
        PayrollRecord storage payroll = payrollRecords[payrollId];
        require(payroll.payrollId != 0, "Payroll record does not exist");
        require(
            keccak256(bytes(payroll.status)) == keccak256(bytes("Pending")) ||
            keccak256(bytes(payroll.status)) == keccak256(bytes("Approved")),
            "Can only cancel pending or approved payroll"
        );

        payroll.status = "Cancelled";
        emit PayrollCancelled(payrollId, payroll.employeeDid);
    }

    /**
     * @dev Deposit funds to contract
     */
    function depositFunds(uint256 amount) external payable {
        if (address(payrollToken) != address(0)) {
            require(payrollToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        } else {
            require(msg.value == amount, "ETH amount mismatch");
        }

        totalDeposited += amount;
        contractBalance += amount;

        emit FundsDeposited(msg.sender, amount);
    }

    /**
     * @dev Withdraw funds from contract (only owner)
     */
    function withdrawFunds(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= contractBalance, "Insufficient contract balance");

        totalPaid += amount; // This maintains balance equation
        contractBalance -= amount;

        if (address(payrollToken) != address(0)) {
            require(payrollToken.transfer(owner(), amount), "Token transfer failed");
        } else {
            payable(owner()).transfer(amount);
        }

        emit FundsWithdrawn(owner(), amount);
    }

    /**
     * @dev Record transaction
     */
    function _recordTransaction(
        string memory employeeDid,
        uint256 amount,
        string memory transactionType,
        string memory description,
        bytes32 txHash
    ) internal {
        _transactionIdCounter.increment();
        uint256 transactionId = _transactionIdCounter.current();

        transactions[transactionId] = TransactionRecord({
            transactionId: transactionId,
            employeeDid: employeeDid,
            amount: amount,
            transactionType: transactionType,
            description: description,
            timestamp: block.timestamp,
            txHash: txHash
        });

        employeeTransactions[employeeDid].push(transactionId);

        emit TransactionRecorded(transactionId, employeeDid, amount, transactionType);
    }

    /**
     * @dev Get employee salary info
     */
    function getEmployeeSalary(string memory employeeDid) external view returns (EmployeeSalary memory) {
        require(employeeSalaries[employeeDid].isActive, "Employee salary not active");
        return employeeSalaries[employeeDid];
    }

    /**
     * @dev Get payroll record
     */
    function getPayrollRecord(uint256 payrollId) external view returns (PayrollRecord memory) {
        require(payrollRecords[payrollId].payrollId != 0, "Payroll record does not exist");
        return payrollRecords[payrollId];
    }

    /**
     * @dev Get employee payrolls
     */
    function getEmployeePayrolls(string memory employeeDid) external view returns (uint256[] memory) {
        return employeePayrolls[employeeDid];
    }

    /**
     * @dev Get period payrolls
     */
    function getPeriodPayrolls(string memory period) external view returns (uint256[] memory) {
        return periodPayrolls[period];
    }

    /**
     * @dev Get employee transactions
     */
    function getEmployeeTransactions(string memory employeeDid) external view returns (uint256[] memory) {
        return employeeTransactions[employeeDid];
    }

    /**
     * @dev Get transaction record
     */
    function getTransaction(uint256 transactionId) external view returns (TransactionRecord memory) {
        require(transactions[transactionId].transactionId != 0, "Transaction does not exist");
        return transactions[transactionId];
    }

    /**
     * @dev Calculate net salary for employee with automatic KPI and attendance
     */
    function calculateNetSalaryAuto(string memory employeeDid, string memory period) external view returns (
        uint256 baseSalaryActual,
        uint256 kpiBonus,
        uint256 allowance,
        uint256 overtimeBonus,
        uint256 taxAmount,
        uint256 netSalary,
        uint256 workingDays,
        uint256 kpiScore
    ) {
        require(employeeSalaries[employeeDid].isActive, "Employee salary not active");

        // Get KPI score
        uint256 kpiScoreLocal = 0;
        if (address(kpiContract) != address(0)) {
            (uint256 totalScore, uint256 evaluationCount, ) = kpiContract.getEmployeeKpiSummary(employeeDid, period);
            kpiScoreLocal = evaluationCount > 0 ? totalScore / evaluationCount : 0;
        }

        // Calculate salary components
        (
            uint256 baseSalaryActualLocal,
            uint256 kpiBonusLocal,
            uint256 allowanceLocal,
            uint256 overtimeBonusLocal,
            uint256 taxAmountLocal,
            uint256 netSalaryLocal,
            AttendanceData memory attendance
        ) = _calculateSalaryComponents(employeeDid, period, kpiScoreLocal);

        return (
            baseSalaryActualLocal,
            kpiBonusLocal,
            allowanceLocal,
            overtimeBonusLocal,
            taxAmountLocal,
            netSalaryLocal,
            attendance.workingDays,
            kpiScoreLocal
        );
    }

    /**
     * @dev Calculate net salary for employee with manual data
     */
    function calculateNetSalaryManual(
        string memory employeeDid,
        uint256 kpiScore,
        uint256 workingDays,
        uint256 overtimeHours
    ) external view returns (
        uint256 baseSalaryActual,
        uint256 kpiBonus,
        uint256 allowance,
        uint256 overtimeBonus,
        uint256 taxAmount,
        uint256 netSalary
    ) {
        require(employeeSalaries[employeeDid].isActive, "Employee salary not active");
        require(kpiScore <= 100, "KPI score must be <= 100");
        require(workingDays <= 31, "Working days must be <= 31");

        EmployeeSalary memory salary = employeeSalaries[employeeDid];

        // Calculate with manual data
        uint256 dailyBaseSalary = salary.baseSalary / standardWorkingDaysPerMonth;
        baseSalaryActual = dailyBaseSalary * workingDays;

        kpiBonus = (salary.baseSalary * salary.kpiBonus * kpiScore) / 10000;
        allowance = salary.allowance;

        // Calculate overtime bonus using same formula
        uint256 monthlyHours = standardWorkingHoursPerYear / 12; // ~173.33 hours/month
        uint256 hourlyRate = salary.baseSalary / monthlyHours;
        overtimeBonus = (hourlyRate * overtimeHours * salary.overtimeRate) / 100;

        uint256 grossSalary = baseSalaryActual + kpiBonus + allowance + overtimeBonus;
        taxAmount = (grossSalary * salary.taxRate) / 100;
        netSalary = grossSalary - taxAmount;

        return (baseSalaryActual, kpiBonus, allowance, overtimeBonus, taxAmount, netSalary);
    }

    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        if (address(payrollToken) != address(0)) {
            return payrollToken.balanceOf(address(this));
        } else {
            return address(this).balance;
        }
    }

    /**
     * @dev Get balance summary
     */
    function getBalanceSummary() external view returns (
        uint256 _totalDeposited,
        uint256 _totalPaid,
        uint256 _contractBalance,
        bool isBalanced
    ) {
        uint256 currentBalance = this.getContractBalance();
        bool balanced = (totalDeposited == totalPaid + currentBalance);

        return (totalDeposited, totalPaid, currentBalance, balanced);
    }

    /**
     * @dev Grant roles
     */
    function grantHRRole(address account) external onlyAdmin {
        grantRole(HR_ROLE, account);
    }

    function grantEmployeeRole(address account) external onlyAdmin {
        grantRole(EMPLOYEE_ROLE, account);
    }

    function setKpiContract(address _kpiContract) external onlyOwner {
        require(_kpiContract != address(0), "Invalid KPI contract address");
        kpiContract = IKpiManagement(_kpiContract);
        emit KpiContractSet(_kpiContract);
    }

    // Fallback function to receive ETH
    receive() external payable {
        totalDeposited += msg.value;
        contractBalance += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
}
