import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, Alert, IconButton,
  Tooltip, LinearProgress, Avatar
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import apiService from '../../services/apiService';

const PayrollDashboard = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    totalPayrollThisMonth: 0,
    averageSalary: 0,
    totalPaidThisMonth: 0,
    contractBalance: {
      totalDeposited: 0,
      totalPaid: 0,
      contractBalance: 0,
      isBalanced: true
    },
    monthlyTrends: [],
    departmentBreakdown: [],
    paymentStatus: {
      pending: 0,
      paid: 0,
      cancelled: 0
    }
  });

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topEarners, setTopEarners] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [
        balanceRes,
        payrollsRes,
        employeesRes,
        transactionsRes
      ] = await Promise.allSettled([
        apiService.get('/payroll-contract/balance/summary'),
        apiService.get('/payroll-contract/employee/all'), // This would need to be implemented
        apiService.getAllEmployees(),
        apiService.get('/payroll-contract/transactions/recent') // This would need to be implemented
      ]);

      // Process contract balance
      let contractBalance = dashboardData.contractBalance;
      if (balanceRes.status === 'fulfilled') {
        contractBalance = balanceRes.value?.data || contractBalance;
      }

      // Process payrolls and calculate statistics
      let payrolls = [];
      let employees = [];
      let transactions = [];

      if (payrollsRes.status === 'fulfilled') {
        payrolls = payrollsRes.value?.data || [];
      }

      if (employeesRes.status === 'fulfilled') {
        employees = employeesRes.value || [];
      }

      if (transactionsRes.status === 'fulfilled') {
        transactions = transactionsRes.value?.data || [];
      }

      // Calculate dashboard statistics
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const currentMonthPayrolls = payrolls.filter(p => p.period === currentMonth);

      const totalPayrollThisMonth = currentMonthPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
      const totalPaidThisMonth = currentMonthPayrolls
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.paidAmount, 0);

      const averageSalary = employees.length > 0 ?
        employees.filter(e => e.baseSalary).reduce((sum, e) => sum + e.baseSalary, 0) / employees.filter(e => e.baseSalary).length : 0;

      // Payment status breakdown
      const paymentStatus = {
        pending: payrolls.filter(p => p.status === 'Pending').length,
        paid: payrolls.filter(p => p.status === 'Paid').length,
        cancelled: payrolls.filter(p => p.status === 'Cancelled').length
      };

      // Monthly trends (last 6 months)
      const monthlyTrends = generateMonthlyTrends(payrolls);

      // Department breakdown
      const departmentBreakdown = generateDepartmentBreakdown(employees, payrolls);

      // Top earners
      const topEarners = employees
        .filter(e => e.baseSalary)
        .sort((a, b) => b.baseSalary - a.baseSalary)
        .slice(0, 5);

      setDashboardData({
        totalEmployees: employees.length,
        totalPayrollThisMonth,
        averageSalary,
        totalPaidThisMonth,
        contractBalance,
        monthlyTrends,
        departmentBreakdown,
        paymentStatus
      });

      setRecentTransactions(transactions.slice(0, 10));
      setTopEarners(topEarners);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrends = (payrolls) => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthPayrolls = payrolls.filter(p => p.period === period);

      months.push({
        month: period,
        totalPaid: monthPayrolls.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.paidAmount, 0),
        totalPayroll: monthPayrolls.reduce((sum, p) => sum + p.netSalary, 0),
        employeeCount: new Set(monthPayrolls.map(p => p.employeeDid)).size
      });
    }

    return months;
  };

  const generateDepartmentBreakdown = (employees, payrolls) => {
    // This would require department data integration
    // For now, return mock data
    return [
      { name: 'Kỹ thuật', value: 35, totalSalary: 150000000 },
      { name: 'Kinh doanh', value: 25, totalSalary: 120000000 },
      { name: 'Hành chính', value: 20, totalSalary: 80000000 },
      { name: 'Marketing', value: 15, totalSalary: 90000000 },
      { name: 'Khác', value: 5, totalSalary: 30000000 }
    ];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderKPICards = () => (
    <Grid container spacing={3} mb={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Tổng nhân viên
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardData.totalEmployees}
                </Typography>
              </Box>
              <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Lương tháng này
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(dashboardData.totalPayrollThisMonth)}
                </Typography>
              </Box>
              <PaymentIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Lương trung bình
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(dashboardData.averageSalary)}
                </Typography>
              </Box>
              <TrendingUpIcon color="warning" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Số dư hợp đồng
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(dashboardData.contractBalance.contractBalance)}
                </Typography>
              </Box>
              <AccountBalanceIcon color="info" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCharts = () => (
    <Grid container spacing={3} mb={3}>
      {/* Monthly Trends Chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>Xu hướng lương theo tháng</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <RechartsTooltip
                  formatter={(value) => [formatCurrency(value), 'Tổng lương']}
                  labelFormatter={(label) => `Tháng ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="totalPaid"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Đã trả"
                />
                <Line
                  type="monotone"
                  dataKey="totalPayroll"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Tổng lương"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Payment Status Pie Chart */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>Trạng thái thanh toán</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Đã trả', value: dashboardData.paymentStatus.paid, color: '#00C49F' },
                    { name: 'Chờ xử lý', value: dashboardData.paymentStatus.pending, color: '#FFBB28' },
                    { name: 'Đã hủy', value: dashboardData.paymentStatus.cancelled, color: '#FF8042' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Đã trả', value: dashboardData.paymentStatus.paid, color: '#00C49F' },
                    { name: 'Chờ xử lý', value: dashboardData.paymentStatus.pending, color: '#FFBB28' },
                    { name: 'Đã hủy', value: dashboardData.paymentStatus.cancelled, color: '#FF8042' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Department Breakdown */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>Phân bổ lương theo phòng ban</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.departmentBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <RechartsTooltip
                  formatter={(value) => [formatCurrency(value), 'Tổng lương']}
                />
                <Bar dataKey="totalSalary" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Earners */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>Top 5 nhân viên có lương cao nhất</Typography>
            <Box>
              {topEarners.map((employee, index) => (
                <Box key={employee.employee_did} display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2, bgcolor: COLORS[index % COLORS.length] }}>
                    {employee.ho_ten.charAt(0)}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1">{employee.ho_ten}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {employee.chuc_vu || 'Chưa cập nhật'}
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(employee.baseSalary)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderRecentTransactions = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Giao dịch gần đây</Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                size="small"
              >
                Xuất báo cáo
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Nhân viên</TableCell>
                    <TableCell>Loại giao dịch</TableCell>
                    <TableCell align="right">Số tiền</TableCell>
                    <TableCell>Mô tả</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.transactionId} hover>
                      <TableCell>
                        {new Date(transaction.timestamp * 1000).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>{transaction.employeeDid}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.transactionType}
                          size="small"
                          color={
                            transaction.transactionType === 'Salary' ? 'success' :
                            transaction.transactionType === 'Bonus' ? 'primary' :
                            transaction.transactionType === 'Refund' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard Lương thưởng
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
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

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderKPICards()}
          {renderCharts()}
          {renderRecentTransactions()}
        </>
      )}
    </Box>
  );
};

export default PayrollDashboard;
