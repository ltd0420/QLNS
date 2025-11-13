import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Alert, CircularProgress, useTheme, useMediaQuery, Divider,
  Tooltip, IconButton, Collapse, Avatar, Button, TextField
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Calculate as CalculateIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';
import { useAuth } from '../../AuthContext';

function SalaryBonus({ user }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [salaryData, setSalaryData] = useState([]);
  const [salaryProfile, setSalaryProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [salaryPreview, setSalaryPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPeriod, setPreviewPeriod] = useState('');

  useEffect(() => {
    fetchSalaryData();
  }, [user]);

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      setError('');

      const { employee_did } = user;
      const response = await apiService.getSalaryInfo(employee_did);
      const salaryProfile = response?.salaryProfile || null;
      const payrolls = Array.isArray(response?.data) ? response.data : [];

      setSalaryProfile(salaryProfile);
      setSalaryData(payrolls);
    } catch (err) {
      console.error('Fetch salary data error:', err);
      setError('Không thể tải dữ liệu lương thưởng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  useEffect(() => {
    // Set default preview period to current month
    setPreviewPeriod(getCurrentPeriod());
  }, []);

  const handleCalculatePreview = async () => {
    try {
      setPreviewLoading(true);
      setError('');

      const { employee_did } = user;
      const response = await apiService.post('/payroll-contract/calculate-preview-db', {
        employeeDid: employee_did,
        period: previewPeriod
      });

      setSalaryPreview(response.data);
    } catch (err) {
      console.error('Error calculating salary preview:', err);
      setError('Không thể tính toán lương dự kiến. Vui lòng thử lại.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRowExpand = (salaryId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(salaryId)) {
      newExpanded.delete(salaryId);
    } else {
      newExpanded.add(salaryId);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã thanh toán':
        return 'success';
      case 'Chờ thanh toán':
        return 'warning';
      case 'Đang xử lý':
        return 'info';
      case 'Tạm hoãn':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Chuyển khoản':
        return 'primary';
      case 'Tiền mặt':
        return 'secondary';
      case 'Ví điện tử':
        return 'info';
      default:
        return 'default';
    }
  };

  const calculateTotalSalary = (salaries) => {
    if (!salaries || salaries.length === 0) return 0;
    return salaries.reduce((sum, salary) => sum + (salary.tong_luong || 0), 0);
  };

  const calculateTotalBonus = (salaries) => {
    if (!salaries || salaries.length === 0) return 0;
    return salaries.reduce((sum, salary) => sum + (salary.tong_thuong || 0), 0);
  };

  const getLatestSalary = (salaries) => {
    if (!salaries || salaries.length === 0) return null;
    return salaries.sort((a, b) => new Date(b.thang_nam) - new Date(a.thang_nam))[0];
  };

  const getSalaryTrend = (salaries) => {
    if (!salaries || salaries.length < 2) return 'N/A';
    const sorted = salaries.sort((a, b) => new Date(b.thang_nam) - new Date(a.thang_nam));
    const current = sorted[0].tong_luong;
    const previous = sorted[1].tong_luong;
    if (current > previous) return 'Tăng';
    if (current < previous) return 'Giảm';
    return 'Ổn định';
  };

  const latestSalary = getLatestSalary(salaryData);
  const totalSalary = calculateTotalSalary(salaryData);
  const totalBonus = calculateTotalBonus(salaryData);
  const salaryTrend = getSalaryTrend(salaryData);
  const baseSalaryCurrent = salaryProfile?.baseSalary ? Number(salaryProfile.baseSalary) : 0;
  const kpiBonusCurrent = salaryProfile?.kpiBonus ? Number(salaryProfile.kpiBonus) : 0;
  const allowanceCurrent = salaryProfile?.allowance ? Number(salaryProfile.allowance) : 0;
  const taxRateCurrent = salaryProfile?.taxRate ? Number(salaryProfile.taxRate) : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Lương & Thưởng
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Salary Preview Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Xem lương dự kiến
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                label="Kỳ lương"
                value={previewPeriod}
                onChange={(e) => setPreviewPeriod(e.target.value)}
                placeholder="YYYY-MM"
                size="small"
                sx={{ width: 150 }}
              />
              <Button
                variant="contained"
                startIcon={<CalculateIcon />}
                onClick={handleCalculatePreview}
                disabled={previewLoading || !previewPeriod}
              >
                {previewLoading ? <CircularProgress size={20} /> : 'Tính toán'}
              </Button>
            </Box>
          </Box>

          {salaryPreview && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {salaryPreview.attendanceData && (
                <Box mb={2} p={1} bgcolor="info.light" borderRadius={1}>
                  <Typography variant="body2" fontWeight="bold" mb={0.5}>Thông tin chấm công:</Typography>
                  <Typography variant="body2">- Số ngày làm việc: {salaryPreview.attendanceData.workingDays} ngày</Typography>
                  <Typography variant="body2">- Tổng giờ làm: {salaryPreview.attendanceData.totalHours?.toFixed(2) || 0} giờ</Typography>
                  <Typography variant="body2">- Giờ làm thêm: {salaryPreview.attendanceData.overtimeHours?.toFixed(2) || 0} giờ</Typography>
                </Box>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                    Chi tiết lương
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Lương cơ bản (theo ngày làm):</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(salaryPreview.baseSalaryActual ?? baseSalaryCurrent)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Thưởng KPI:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(salaryPreview.kpiBonus ?? (baseSalaryCurrent * kpiBonusCurrent * (salaryPreview.kpiScore || 0) / 10000))}
                        {' '}
                        ({salaryPreview.kpiScore || kpiBonusCurrent} điểm)
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Phụ cấp:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(salaryPreview.allowance ?? allowanceCurrent)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Thưởng giờ làm thêm:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(salaryPreview.overtimeBonus || 0)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" fontWeight="bold">Tổng lương:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {formatCurrency(
                          (salaryPreview.baseSalaryActual ?? baseSalaryCurrent) +
                          (salaryPreview.kpiBonus ?? 0) +
                          (salaryPreview.allowance ?? allowanceCurrent) +
                          (salaryPreview.overtimeBonus ?? 0)
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                    Khấu trừ
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Thuế:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        -{formatCurrency(salaryPreview.taxAmount || 0)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6" fontWeight="bold">Lương thực nhận:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatCurrency(salaryPreview.netSalary || 0)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tổng lương nhận
              </Typography>
              <Typography variant="h3" color="primary" fontWeight="bold">
                {formatCurrency(totalSalary)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Từ {salaryData.length} kỳ lương
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tổng thưởng
              </Typography>
              <Typography variant="h3" color="success.main" fontWeight="bold">
                {formatCurrency(totalBonus)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Thưởng hiệu suất
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Kỳ lương gần nhất
              </Typography>
              {latestSalary ? (
                <>
                  <Typography variant="h5" color="secondary" fontWeight="bold">
                    {formatCurrency(latestSalary.tong_luong)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {latestSalary.thang_nam}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                    {salaryTrend === 'Tăng' && <TrendingUpIcon color="success" fontSize="small" />}
                    {salaryTrend === 'Giảm' && <TrendingDownIcon color="error" fontSize="small" />}
                    {salaryTrend === 'Ổn định' && <TrendingUpIcon color="warning" fontSize="small" />}
                    <Typography variant="body2" color="text.secondary">
                      {salaryTrend}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Chưa có dữ liệu lương
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Salary Details Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Chi tiết lương thưởng
          </Typography>

          {salaryData.length === 0 ? (
            <Box textAlign="center" py={4}>
              <WalletIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Chưa có dữ liệu lương thưởng
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Kỳ lương</strong></TableCell>
                    <TableCell align="right"><strong>Lương cơ bản</strong></TableCell>
                    <TableCell align="right"><strong>Thưởng</strong></TableCell>
                    <TableCell align="right"><strong>Khấu trừ</strong></TableCell>
                    <TableCell align="right"><strong>Tổng nhận</strong></TableCell>
                    <TableCell><strong>Trạng thái</strong></TableCell>
                    <TableCell><strong>Chi tiết</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salaryData
                    .sort((a, b) => new Date(b.thang_nam) - new Date(a.thang_nam))
                    .map((salary) => (
                    <TableRow key={salary._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {salary.thang_nam}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {salary.loai_luong}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(salary.luong_co_ban || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          {formatCurrency(salary.tong_thuong || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="error.main">
                          -{formatCurrency(salary.tong_khau_tru || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(salary.tong_luong || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={salary.trang_thai_thanh_toan}
                          color={getStatusColor(salary.trang_thai_thanh_toan)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleRowExpand(salary._id)}
                        >
                          {expandedRows.has(salary._id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Expanded Details */}
          {salaryData.map((salary) => (
            <Collapse key={salary._id} in={expandedRows.has(salary._id)}>
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                      Chi tiết lương
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Lương cơ bản:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(salary.luong_co_ban || 0)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Phụ cấp:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(salary.phu_cap || 0)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Làm thêm giờ:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(salary.luong_lam_them || 0)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" fontWeight="bold">Tổng lương:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency((salary.luong_co_ban || 0) + (salary.phu_cap || 0) + (salary.luong_lam_them || 0))}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                      Chi tiết thưởng
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Thưởng KPI:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(salary.thuong_kpi || 0)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Thưởng hiệu suất:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(salary.thuong_hieu_suat || 0)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Thưởng khác:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(salary.thuong_khac || 0)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" fontWeight="bold">Tổng thưởng:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(salary.tong_thuong || 0)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                      Khấu trừ & Thanh toán
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Bảo hiểm xã hội:</Typography>
                            <Typography variant="body2" color="error.main">
                              -{formatCurrency(salary.bhxh || 0)}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Bảo hiểm y tế:</Typography>
                            <Typography variant="body2" color="error.main">
                              -{formatCurrency(salary.bhyt || 0)}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Thuế thu nhập:</Typography>
                            <Typography variant="body2" color="error.main">
                              -{formatCurrency(salary.thue_tncn || 0)}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Khấu trừ khác:</Typography>
                            <Typography variant="body2" color="error.main">
                              -{formatCurrency(salary.khau_tru_khac || 0)}
                            </Typography>
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" fontWeight="bold">Tổng khấu trừ:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="error.main">
                              -{formatCurrency(salary.tong_khau_tru || 0)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Phương thức thanh toán:</Typography>
                            <Chip
                              label={salary.phuong_thuc_thanh_toan}
                              color={getPaymentMethodColor(salary.phuong_thuc_thanh_toan)}
                              size="small"
                            />
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Ngày thanh toán:</Typography>
                            <Typography variant="body2">
                              {salary.ngay_thanh_toan ? new Date(salary.ngay_thanh_toan).toLocaleDateString('vi-VN') : 'Chưa thanh toán'}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Trạng thái:</Typography>
                            <Chip
                              label={salary.trang_thai_thanh_toan}
                              color={getStatusColor(salary.trang_thai_thanh_toan)}
                              size="small"
                            />
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" fontWeight="bold">Tổng nhận:</Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary">
                              {formatCurrency(salary.tong_luong || 0)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>

                  {salary.ghi_chu && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                        Ghi chú
                      </Typography>
                      <Typography variant="body2" sx={{ p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                        {salary.ghi_chu}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Collapse>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}

export default SalaryBonus;
