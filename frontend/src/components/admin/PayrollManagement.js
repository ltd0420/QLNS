import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, Alert, IconButton,
  Tooltip, LinearProgress, FormControlLabel, Checkbox, Divider
} from '@mui/material';
import {
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import apiService from '../../services/apiService';

const PayrollManagement = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data states
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState({}); // Map employee_did to employee details
  const [departments, setDepartments] = useState([]);
  const [contractBalance, setContractBalance] = useState({
    totalDeposited: 0,
    totalPaid: 0,
    contractBalance: 0,
    isBalanced: true
  });

  // Dialog states
  const [salaryDialog, setSalaryDialog] = useState({ open: false, employee: null });
  const [payrollDialog, setPayrollDialog] = useState({ open: false, employee: null });
  const [depositDialog, setDepositDialog] = useState(false);

  // Form states
  const [salaryForm, setSalaryForm] = useState({
    baseSalary: '',
    kpiBonus: '',
    allowance: '',
    taxRate: ''
  });

  const [payrollForm, setPayrollForm] = useState({
    employeeDid: '',
    period: '',
    useManualKpi: false,
    kpiScore: '',
    workingDays: '',
    overtimeHours: ''
  });

  const [depositForm, setDepositForm] = useState({
    amount: '',
    tokenAddress: ''
  });

  // KPI calculation preview
  const [kpiPreview, setKpiPreview] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [payrollsRes, employeesRes, departmentsRes, balanceRes] = await Promise.allSettled([
        apiService.get('/payroll-contract/employee/all'), // Get all payrolls for current period
        apiService.getAllEmployees(),
        apiService.getAllDepartments(),
        apiService.get('/payroll-contract/balance/summary')
      ]);

      if (payrollsRes.status === 'fulfilled') {
        const payrollResponse = payrollsRes.value?.data;
        const payrollData = payrollResponse?.data ?? payrollResponse ?? [];
        setPayrolls(Array.isArray(payrollData) ? payrollData : []);
      }
      if (employeesRes.status === 'fulfilled') {
        const employeesList = employeesRes.value || [];
        setEmployees(employeesList);
        
        // Fetch detailed information for each employee by employee_did
        const detailsMap = {};
        const fetchPromises = employeesList.map(async (emp) => {
          try {
            if (emp.employee_did) {
              const detail = await apiService.getEmployeeProfile(emp.employee_did);
              detailsMap[emp.employee_did] = detail;
            }
          } catch (error) {
            console.warn(`Failed to fetch details for employee ${emp.employee_did}:`, error);
            // Use existing data if fetch fails
            detailsMap[emp.employee_did] = emp;
          }
        });
        await Promise.allSettled(fetchPromises);
        setEmployeeDetails(detailsMap);
      }
      if (departmentsRes.status === 'fulfilled') setDepartments(departmentsRes.value || []);
      if (balanceRes.status === 'fulfilled') setContractBalance(balanceRes.value?.data || contractBalance);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getEmployeeWalletAddress = (employee) => {
    if (!employee) return '';
    const detail = employeeDetails[employee.employee_did] || employee;
    return detail?.walletAddress || 'Chưa có địa chỉ ví';
  };

  const handleSalaryDialogOpen = (employee = null) => {
    if (employee) {
      setSalaryForm({
        baseSalary: employee.baseSalary || '',
        kpiBonus: employee.kpiBonus || '',
        allowance: employee.allowance || '',
        taxRate: employee.taxRate || ''
      });
    } else {
      setSalaryForm({
        baseSalary: '',
        kpiBonus: '',
        allowance: '',
        taxRate: ''
      });
    }
    setSalaryDialog({ open: true, employee });
  };

  const handleSalaryDialogClose = () => {
    setSalaryDialog({ open: false, employee: null });
    setSalaryForm({
      baseSalary: '',
      kpiBonus: '',
      allowance: '',
      taxRate: ''
    });
  };

  const handlePayrollDialogOpen = (employee) => {
    setPayrollForm({
      employeeDid: employee.employee_did,
      period: getCurrentPeriod(),
      useManualKpi: false,
      kpiScore: '',
      workingDays: '',
      overtimeHours: ''
    });
    setKpiPreview(null);
    setPayrollDialog({ open: true, employee });
  };

  const handlePayrollDialogClose = () => {
    setPayrollDialog({ open: false, employee: null });
    setPayrollForm({
      employeeDid: '',
      period: '',
      useManualKpi: false,
      kpiScore: '',
      workingDays: '',
      overtimeHours: ''
    });
    setKpiPreview(null);
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  const handleCalculateKpiPreview = async () => {
    try {
      setLoading(true);
      // Use database data for preview
      const response = await apiService.post('/payroll-contract/calculate-preview-db', {
        employeeDid: payrollForm.employeeDid,
        period: payrollForm.period
      });
      setKpiPreview(response.data);
    } catch (error) {
      console.error('Error calculating KPI preview:', error);
      setError('Không thể tính toán lương dự kiến. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalarySubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate employee exists
      if (!salaryDialog.employee || !salaryDialog.employee.employee_did) {
        setError('Vui lòng chọn nhân viên.');
        setLoading(false);
        return;
      }

      // Validate and parse form values
      const baseSalary = parseFloat(salaryForm.baseSalary);
      const kpiBonus = parseFloat(salaryForm.kpiBonus);
      const allowance = parseFloat(salaryForm.allowance);
      const taxRate = parseFloat(salaryForm.taxRate);

      // Validate that all values are valid numbers
      if (isNaN(baseSalary) || baseSalary < 0) {
        setError('Lương cơ bản không hợp lệ.');
        setLoading(false);
        return;
      }
      if (isNaN(kpiBonus) || kpiBonus < 0 || kpiBonus > 100) {
        setError('Thưởng KPI phải từ 0 đến 100%.');
        setLoading(false);
        return;
      }
      if (isNaN(allowance) || allowance < 0) {
        setError('Phụ cấp không hợp lệ.');
        setLoading(false);
        return;
      }
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        setError('Thuế phải từ 0 đến 100%.');
        setLoading(false);
        return;
      }

      const payload = {
        employeeDid: salaryDialog.employee.employee_did,
        baseSalary: baseSalary,
        kpiBonus: kpiBonus,
        allowance: allowance,
        taxRate: taxRate
      };

      const endpoint = salaryDialog.employee.baseSalary ?
        '/payroll-contract/salary/update' : '/payroll-contract/salary/set';

      await apiService.post(endpoint, payload);

      setSuccess('Thiết lập lương thành công!');
      handleSalaryDialogClose();
      fetchInitialData();

    } catch (error) {
      console.error('Error setting salary:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể thiết lập lương. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayrollSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint, payload;

      if (payrollForm.useManualKpi) {
        // Manual KPI with optional working days and overtime
        endpoint = '/payroll-contract/create-manual';
        payload = {
          employeeDid: payrollForm.employeeDid,
          period: payrollForm.period,
          kpiScore: parseFloat(payrollForm.kpiScore),
          workingDays: payrollForm.workingDays ? parseFloat(payrollForm.workingDays) : undefined,
          overtimeHours: payrollForm.overtimeHours ? parseFloat(payrollForm.overtimeHours) : undefined
        };
      } else {
        // Use database data (attendance + KPI)
        endpoint = '/payroll-contract/create-with-db';
        payload = {
          employeeDid: payrollForm.employeeDid,
          period: payrollForm.period
        };
      }

      await apiService.post(endpoint, payload);

      setSuccess('Tạo phiếu lương thành công!');
      handlePayrollDialogClose();
      fetchInitialData();

    } catch (error) {
      console.error('Error creating payroll:', error);
      setError('Không thể tạo phiếu lương. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayEmployee = async (payrollId) => {
    try {
      setLoading(true);
      setError(null);

      await apiService.post(`/payroll-contract/pay/${payrollId}`);

      setSuccess('Thanh toán lương thành công!');
      fetchInitialData();

    } catch (error) {
      console.error('Error paying employee:', error);
      setError('Không thể thanh toán lương. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDepositFunds = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        amount: parseFloat(depositForm.amount),
        tokenAddress: depositForm.tokenAddress || null
      };

      await apiService.post('/payroll-contract/deposit', payload);

      setSuccess('Nạp tiền thành công!');
      setDepositDialog(false);
      setDepositForm({ amount: '', tokenAddress: '' });
      fetchInitialData();

    } catch (error) {
      console.error('Error depositing funds:', error);
      setError('Không thể nạp tiền. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Contract Balance Cards */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <WalletIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Tổng nạp vào</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {formatCurrency(contractBalance.totalDeposited)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <PaymentIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Tổng đã trả</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {formatCurrency(contractBalance.totalPaid)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <AssessmentIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Số dư hiện tại</Typography>
            </Box>
            <Typography variant="h4" color="info.main">
              {formatCurrency(contractBalance.contractBalance)}
            </Typography>
            <Chip
              label={contractBalance.isBalanced ? "Cân bằng" : "Không cân bằng"}
              color={contractBalance.isBalanced ? "success" : "error"}
              size="small"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Balance Status */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>Trạng thái cân bằng tài chính</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography>Tổng đầu vào: {formatCurrency(contractBalance.totalDeposited)}</Typography>
              <Typography>=</Typography>
              <Typography>Tổng đầu ra: {formatCurrency(contractBalance.totalPaid)}</Typography>
              <Typography>+</Typography>
              <Typography>Số dư: {formatCurrency(contractBalance.contractBalance)}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={contractBalance.isBalanced ? 100 : 0}
              color={contractBalance.isBalanced ? "success" : "error"}
              sx={{ mt: 2, height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>Thao tác nhanh</Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDepositDialog(true)}
              >
                Nạp tiền vào hợp đồng
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchInitialData}
              >
                Làm mới dữ liệu
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderEmployeesTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Danh sách nhân viên và lương</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleSalaryDialogOpen()}
              >
                Thiết lập lương
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên nhân viên</TableCell>
                    <TableCell>Phòng ban</TableCell>
                    <TableCell align="right">Lương cơ bản</TableCell>
                    <TableCell align="right">Thưởng KPI (%)</TableCell>
                    <TableCell align="right">Phụ cấp</TableCell>
                    <TableCell align="right">Thuế (%)</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => {
                    // Get employee details from employee_did
                    const employeeDetail = employeeDetails[employee.employee_did] || employee;
                    const department = departments.find(d => d.phong_ban_id === (employeeDetail.phong_ban_id || employee.phong_ban_id));
                    return (
                      <TableRow key={employee.employee_did} hover>
                        <TableCell>{employeeDetail.ho_ten || employee.ho_ten || employee.employee_did}</TableCell>
                        <TableCell>{department?.ten_phong_ban || 'N/A'}</TableCell>
                        <TableCell align="right">
                          {employee.baseSalary ? formatCurrency(employee.baseSalary) : 'Chưa thiết lập'}
                        </TableCell>
                        <TableCell align="right">
                          {employee.kpiBonus ? `${employee.kpiBonus}%` : 'Chưa thiết lập'}
                        </TableCell>
                        <TableCell align="right">
                          {employee.allowance ? formatCurrency(employee.allowance) : 'Chưa thiết lập'}
                        </TableCell>
                        <TableCell align="right">
                          {employee.taxRate ? `${employee.taxRate}%` : 'Chưa thiết lập'}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Thiết lập lương">
                              <IconButton
                                size="small"
                                onClick={() => handleSalaryDialogOpen(employee)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Tạo phiếu lương">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handlePayrollDialogOpen(employee)}
                              >
                                <PaymentIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPayrollsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={3}>Danh sách phiếu lương</Typography>

            {(!Array.isArray(payrolls) || payrolls.length === 0) ? (
              <Box textAlign="center" py={4}>
                <WalletIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Chưa có phiếu lương nào
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hãy tạo phiếu lương đầu tiên cho nhân viên của bạn.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã phiếu</TableCell>
                      <TableCell>Nhân viên</TableCell>
                      <TableCell>Kỳ lương</TableCell>
                      <TableCell align="right">Lương thực tế</TableCell>
                      <TableCell align="right">Đã trả</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payrolls.map((payroll) => {
                      const employee = employees.find(e => e.employee_did === payroll.employeeDid);
                      return (
                        <TableRow key={payroll.payrollId} hover>
                          <TableCell>{payroll.payrollId}</TableCell>
                          <TableCell>{employee?.ho_ten || payroll.employeeDid}</TableCell>
                          <TableCell>{payroll.period}</TableCell>
                          <TableCell align="right">{formatCurrency(payroll.netSalary)}</TableCell>
                          <TableCell align="right">
                            {payroll.paidAmount ? formatCurrency(payroll.paidAmount) : '0'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={payroll.status}
                              color={getStatusColor(payroll.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {payroll.status === 'Pending' && (
                              <Tooltip title="Thanh toán">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handlePayEmployee(payroll.payrollId)}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSmartContractTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={3}>Quản lý Smart Contract</Typography>
            <Typography>Nội dung cho tab Smart Contract sẽ được thêm vào đây.</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý lương thưởng
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchInitialData}
          disabled={loading}
        >
          Làm mới
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Tổng quan" />
          <Tab label="Nhân viên" />
          <Tab label="Phiếu lương" />
          <Tab label="Smart Contract" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === 0 && renderOverviewTab()}
            {activeTab === 1 && renderEmployeesTab()}
            {activeTab === 2 && renderPayrollsTab()}
            {activeTab === 3 && renderSmartContractTab()}
          </>
        )}
      </Box>

      {/* Salary Setup Dialog */}
      <Dialog open={salaryDialog.open} onClose={handleSalaryDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {salaryDialog.employee?.baseSalary ? 'Cập nhật lương' : 'Thiết lập lương'} - {
            salaryDialog.employee ? 
              (employeeDetails[salaryDialog.employee.employee_did]?.ho_ten || salaryDialog.employee.ho_ten || salaryDialog.employee.employee_did) :
              'Nhân viên mới'
          }
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ ví"
                value={salaryDialog.employee ? getEmployeeWalletAddress(salaryDialog.employee) : 'Chưa chọn nhân viên'}
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: 'monospace' }
                }}
                helperText="Địa chỉ ví được lấy trực tiếp từ hồ sơ nhân viên (MongoDB). Đảm bảo địa chỉ này đã được kết nối với ví hợp lệ."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lương cơ bản (VNĐ)"
                type="number"
                value={salaryForm.baseSalary}
                onChange={(e) => setSalaryForm({...salaryForm, baseSalary: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thưởng KPI (%)"
                type="number"
                value={salaryForm.kpiBonus}
                onChange={(e) => setSalaryForm({...salaryForm, kpiBonus: e.target.value})}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phụ cấp (VNĐ)"
                type="number"
                value={salaryForm.allowance}
                onChange={(e) => setSalaryForm({...salaryForm, allowance: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thuế (%)"
                type="number"
                value={salaryForm.taxRate}
                onChange={(e) => setSalaryForm({...salaryForm, taxRate: e.target.value})}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSalaryDialogClose}>Hủy</Button>
          <Button onClick={handleSalarySubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payroll Creation Dialog */}
      <Dialog open={payrollDialog.open} onClose={handlePayrollDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Tạo phiếu lương - {
            payrollDialog.employee ? 
              (employeeDetails[payrollDialog.employee.employee_did]?.ho_ten || payrollDialog.employee.ho_ten || payrollDialog.employee.employee_did) :
              'Nhân viên'
          }
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kỳ lương"
                value={payrollForm.period}
                onChange={(e) => setPayrollForm({...payrollForm, period: e.target.value})}
                placeholder="YYYY-MM"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={payrollForm.useManualKpi}
                    onChange={(e) => setPayrollForm({...payrollForm, useManualKpi: e.target.checked})}
                  />
                }
                label="Nhập điểm KPI thủ công"
              />
            </Grid>

            {payrollForm.useManualKpi ? (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Điểm KPI (0-100)"
                    type="number"
                    value={payrollForm.kpiScore}
                    onChange={(e) => setPayrollForm({...payrollForm, kpiScore: e.target.value})}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Số ngày làm việc (tùy chọn)"
                    type="number"
                    value={payrollForm.workingDays}
                    onChange={(e) => setPayrollForm({...payrollForm, workingDays: e.target.value})}
                    inputProps={{ min: 0, max: 31 }}
                    helperText="Để trống để sử dụng giá trị mặc định"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Số giờ làm thêm (tùy chọn)"
                    type="number"
                    value={payrollForm.overtimeHours}
                    onChange={(e) => setPayrollForm({...payrollForm, overtimeHours: e.target.value})}
                    inputProps={{ min: 0 }}
                    helperText="Để trống để sử dụng giá trị mặc định"
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Sử dụng điểm KPI tự động từ hệ thống đánh giá
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<CalculateIcon />}
                    onClick={handleCalculateKpiPreview}
                    variant="outlined"
                  >
                    Xem trước
                  </Button>
                </Box>

                {kpiPreview && (
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" mb={1}>Chi tiết lương dự kiến:</Typography>
                    {kpiPreview.attendanceData && (
                      <Box mb={2} p={1} bgcolor="info.light" borderRadius={1}>
                        <Typography variant="body2" fontWeight="bold" mb={0.5}>Thông tin chấm công:</Typography>
                        <Typography variant="body2">- Số ngày làm việc: {kpiPreview.attendanceData.workingDays} ngày</Typography>
                        <Typography variant="body2">- Tổng giờ làm: {kpiPreview.attendanceData.totalHours?.toFixed(2) || 0} giờ</Typography>
                        <Typography variant="body2">- Giờ làm thêm: {kpiPreview.attendanceData.overtimeHours?.toFixed(2) || 0} giờ</Typography>
                      </Box>
                    )}
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">Lương cơ bản (theo ngày làm):</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(kpiPreview.baseSalaryActual || kpiPreview.baseSalary)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Thưởng KPI:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(kpiPreview.kpiBonus)} ({kpiPreview.kpiScore || 0} điểm)
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Phụ cấp:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(kpiPreview.allowance)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Thưởng giờ làm thêm:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(kpiPreview.overtimeBonus || 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Thuế:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                          -{formatCurrency(kpiPreview.taxAmount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">Tổng lương thực nhận:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(kpiPreview.netSalary)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePayrollDialogClose}>Hủy</Button>
          <Button onClick={handlePayrollSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Tạo phiếu lương'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deposit Funds Dialog */}
      <Dialog open={depositDialog} onClose={() => setDepositDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nạp tiền vào hợp đồng</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Số tiền (VNĐ)"
                type="number"
                value={depositForm.amount}
                onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ token (để trống nếu dùng ETH)"
                value={depositForm.tokenAddress}
                onChange={(e) => setDepositForm({...depositForm, tokenAddress: e.target.value})}
                placeholder="0x..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositDialog(false)}>Hủy</Button>
          <Button onClick={handleDepositFunds} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Nạp tiền'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollManagement;
