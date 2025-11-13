import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Button, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Alert, CircularProgress, useTheme, useMediaQuery, TextField,
  InputAdornment, IconButton, Tooltip, Fab, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, FormControl, InputLabel,
  Select, MenuItem, Link, Divider, List, ListItem, ListItemText,
  ListItemIcon, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  QrCode as QrCodeIcon,
  Verified as VerifiedIcon,
  Link as LinkIcon,
  ExpandMore as ExpandMoreIcon,
  GetApp as ExportIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { startOfMonth, endOfMonth } from 'date-fns';
import apiService from '../../services/apiService';
import QrScanner from '../QrScanner';
import * as XLSX from 'xlsx';

function AttendanceHistory({ user, employeeData }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrAction, setQrAction] = useState(''); // 'checkin' or 'checkout'
  const [blockchainFilter, setBlockchainFilter] = useState('all'); // 'all', 'onchain', 'offchain'
  const [smartContractLogs, setSmartContractLogs] = useState({});

  // New states for advanced filters
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [dayTypeFilter, setDayTypeFilter] = useState('all');
  const [authMethodFilter, setAuthMethodFilter] = useState('all');
  const [onChainFilter, setOnChainFilter] = useState('all');

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordDetails, setRecordDetails] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
  }, [user]);

  const fetchAttendanceData = async (params = {}) => {
    try {
      setLoading(true);
      setError('');

      const { employee_did } = user;
      console.log('Fetching attendance data for employee_did:', employee_did, 'with params:', params);

      const response = await apiService.getAttendanceByEmployee(employee_did, params);
      console.log('API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Is response array?', Array.isArray(response));

      // Normalize date format for frontend
      const normalizedData = (response || []).map(record => ({
        ...record,
        ngay: record.ngay ? new Date(record.ngay).toISOString().split('T')[0] : record.ngay
      }));

      console.log('Normalized data:', normalizedData);
      console.log('Normalized data length:', normalizedData.length);
      setAttendanceData(normalizedData);
    } catch (err) {
      console.error('Fetch attendance data error:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);

      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          'Không thể tải dữ liệu chấm công. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (qrCodeId = null) => {
    try {
      setCheckInLoading(true);
      setError('');

      // Prevent check-in if already checked in today
      if (todayRecord && todayRecord.gio_vao) {
        setError('Bạn đã check-in hôm nay rồi.');
        return;
      }

      // Prevent check-in outside allowed time window
      if (!canCheckIn) {
        setError('Check-in chỉ được phép từ 6:30 AM đến 6:30 PM.');
        return;
      }

      const { employee_did } = user;
      const checkInData = {
        employee_did,
        ngay: new Date().toISOString().split('T')[0],
        gio_vao: new Date().toTimeString().slice(0, 8),
        xac_thuc_qua: qrCodeId ? 'QR Code' : 'Web App'
      };

      if (qrCodeId) {
        checkInData.qr_code_id = qrCodeId;
      }

      await apiService.checkIn(checkInData);
      await fetchAttendanceData(); // Refresh data

      setError('');
    } catch (err) {
      console.error('Check-in error:', err);
      setError(err.response?.data?.message || 'Không thể check-in. Vui lòng thử lại.');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async (qrCodeId = null) => {
    try {
      setCheckOutLoading(true);
      setError('');

      // Prevent check-out after 6:00 PM
      if (!canCheckOut) {
        setError('Check-out chỉ được phép trước 6:00 PM.');
        return;
      }

      const { employee_did } = user;
      const checkOutData = {
        employee_did,
        ngay: new Date().toISOString().split('T')[0],
        gio_ra: new Date().toTimeString().slice(0, 8),
        xac_thuc_qua: qrCodeId ? 'QR Code' : 'Web App'
      };

      if (qrCodeId) {
        checkOutData.qr_code_id = qrCodeId;
      }

      await apiService.checkOut(checkOutData);
      await fetchAttendanceData(); // Refresh data

      setError('');
    } catch (err) {
      console.error('Check-out error:', err);
      setError('Không thể check-out. Vui lòng thử lại.');
    } finally {
      setCheckOutLoading(false);
    }
  };

  const handleQrCheckIn = () => {
    setQrAction('checkin');
    setQrDialogOpen(true);
  };

  const handleQrCheckOut = () => {
    setQrAction('checkout');
    setQrDialogOpen(true);
  };

  const handleQrScan = async (qrText) => {
    try {
      setQrDialogOpen(false);

      // Parse QR data - assuming it contains JSON with qr_code_id
      let qrData;
      try {
        qrData = JSON.parse(qrText);
      } catch (parseErr) {
        // If not JSON, assume the text is the qr_code_id directly
        qrData = { qr_code_id: qrText };
      }

      if (qrAction === 'checkin') {
        await handleCheckIn(qrData.qr_code_id);
      } else if (qrAction === 'checkout') {
        await handleCheckOut(qrData.qr_code_id);
      }
    } catch (err) {
      console.error('QR scan error:', err);
      setError('Không thể xử lý mã QR. Vui lòng thử lại.');
    }
  };

  const handleViewBlockchainLogs = async (recordId) => {
    try {
      const logs = await apiService.getSmartContractLogsForAttendance(recordId);
      setSmartContractLogs(prev => ({
        ...prev,
        [recordId]: logs
      }));
    } catch (err) {
      console.error('Fetch blockchain logs error:', err);
    }
  };

  const handleSearch = () => {
    const params = {};
    if (searchTerm) {
      params.search = searchTerm;
    }
    if (filterDate) {
      params.date = filterDate.toISOString().split('T')[0];
    }
    fetchAttendanceData(params);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setFilterDate(null);
    fetchAttendanceData();
  };

  // New functions for advanced filters
  const handleAdvancedSearch = () => {
    const params = {};
    if (startDate && endDate) {
      params.startDate = startDate.toISOString().split('T')[0];
      params.endDate = endDate.toISOString().split('T')[0];
    }
    if (dayTypeFilter !== 'all') {
      params.loai_ngay = dayTypeFilter;
    }
    if (authMethodFilter !== 'all') {
      params.xac_thuc_qua = authMethodFilter;
    }
    if (onChainFilter !== 'all') {
      params.onChain = onChainFilter === 'onchain' ? true : false;
    }
    // Clear simple filters to avoid double filtering
    setSearchTerm('');
    setFilterDate(null);
    fetchAttendanceData(params);
  };

  const handleResetFilters = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(endOfMonth(new Date()));
    setDayTypeFilter('all');
    setAuthMethodFilter('all');
    setOnChainFilter('all');
    setSearchTerm('');
    setFilterDate(null);
    fetchAttendanceData();
  };

  const handleViewDetails = async (record) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);

    // Fetch blockchain logs if available
    if (record.transaction_hash) {
      try {
        const logs = await apiService.getSmartContractLogsForAttendance(record._id);
        setRecordDetails(logs);
      } catch (err) {
        console.error('Fetch blockchain logs error:', err);
        setRecordDetails(null);
      }
    } else {
      setRecordDetails(null);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredData.map(record => ({
      'Ngày': new Date(record.ngay).toLocaleDateString('vi-VN'),
      'Loại ngày': record.loai_ngay,
      'Giờ vào': record.gio_vao ? formatTime(record.gio_vao) : '--:--',
      'Giờ ra': record.gio_ra ? formatTime(record.gio_ra) : '--:--',
      'Tổng giờ': record.tong_gio_lam ? `${record.tong_gio_lam.toFixed(2)}h` : '--',
      'Phương thức xác thực': record.xac_thuc_qua,
      'Trạng thái on-chain': record.transaction_hash ? 'On-chain' : 'Off-chain',
      'Transaction Hash': record.transaction_hash || '--',
      'Ghi chú': record.ghi_chu || '--'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LichSuChamCong');
    XLSX.writeFile(wb, `lich_su_cham_cong_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getOnChainStatus = (record) => {
    if (record.transaction_hash) {
      return {
        label: 'On-chain',
        color: 'success',
        icon: <VerifiedIcon fontSize="small" />
      };
    } else {
      return {
        label: 'Chưa chứng thực',
        color: 'warning',
        icon: <WarningIcon fontSize="small" />
      };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ngày thường':
        return 'primary';
      case 'Cuối tuần':
        return 'secondary';
      case 'Lễ':
        return 'success';
      case 'Nghỉ phép':
        return 'warning';
      case 'Nghỉ ốm':
        return 'info';
      case 'Vắng không phép':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString.slice(0, 5); // HH:MM format
  };

  const calculateWorkingHours = (gio_vao, gio_ra) => {
    if (!gio_vao || !gio_ra) return 0;

    const start = new Date(`2000-01-01T${gio_vao}`);
    const end = new Date(`2000-01-01T${gio_ra}`);
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours > 0 ? diffHours.toFixed(2) : 0;
  };

  const filteredData = attendanceData.filter(item => {
    const matchesSearch = !searchTerm ||
      item.ngay.includes(searchTerm) ||
      item.loai_ngay.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !filterDate ||
      item.ngay === filterDate.toISOString().split('T')[0];

    return matchesSearch && matchesDate;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceData.find(item => item.ngay === today);

  // Time constraints
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // minutes since midnight
  const checkInStartTime = 6 * 60 + 30; // 6:30 AM
  const checkInEndTime = 18 * 60 + 30; // 6:30 PM
  const checkOutLockTime = 18 * 60; // 6:00 PM

  const canCheckIn = currentTime >= checkInStartTime && currentTime <= checkInEndTime;
  const canCheckOut = currentTime <= checkOutLockTime;
  const shouldShowLateWarning = !todayRecord?.gio_vao && currentTime > checkInEndTime;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Lịch sử chấm công
          </Typography>

          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<QrCodeIcon />}
              onClick={handleQrCheckIn}
              disabled={checkInLoading || (todayRecord && todayRecord.gio_vao) || !canCheckIn}
              color="success"
            >
              Check-in QR
            </Button>
            <Button
              variant="contained"
              startIcon={<QrCodeIcon />}
              onClick={handleQrCheckOut}
              disabled={checkOutLoading || !todayRecord?.gio_vao || todayRecord?.gio_ra || !canCheckOut}
              color="error"
            >
              Check-out QR
            </Button>
            <Button
              variant="outlined"
              startIcon={checkInLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              onClick={() => handleCheckIn()}
              disabled={checkInLoading || loading || (todayRecord && todayRecord.gio_vao) || !canCheckIn}
              color="success"
            >
              {checkInLoading ? 'Đang check-in...' : 'Check-in Web'}
            </Button>
            <Button
              variant="outlined"
              startIcon={checkOutLoading ? <CircularProgress size={20} /> : <AccessTimeIcon />}
              onClick={() => handleCheckOut()}
              disabled={checkOutLoading || loading || !todayRecord?.gio_vao || todayRecord?.gio_ra || !canCheckOut}
              color="error"
            >
              {checkOutLoading ? 'Đang check-out...' : 'Check-out Web'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {shouldShowLateWarning && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Đã quá thời gian chấm công (6:00 PM). Vui lòng liên hệ quản lý để được hỗ trợ.
          </Alert>
        )}

        {/* Today's Status Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Trạng thái hôm nay ({new Date().toLocaleDateString('vi-VN')})
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <CheckCircleIcon color={todayRecord?.gio_vao ? 'success' : 'disabled'} sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Check-in</Typography>
                  <Typography variant="h6" color={todayRecord?.gio_vao ? 'success.main' : 'text.secondary'}>
                    {todayRecord?.gio_vao ? formatTime(todayRecord.gio_vao) : '--:--'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <AccessTimeIcon color={todayRecord?.gio_ra ? 'error' : 'disabled'} sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Check-out</Typography>
                  <Typography variant="h6" color={todayRecord?.gio_ra ? 'error.main' : 'text.secondary'}>
                    {todayRecord?.gio_ra ? formatTime(todayRecord.gio_ra) : '--:--'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <ScheduleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Giờ làm việc</Typography>
                  <Typography variant="h6" color="primary">
                    {todayRecord ? calculateWorkingHours(todayRecord.gio_vao, todayRecord.gio_ra) : 0} giờ
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <LocationIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Phương thức</Typography>
                  <Typography variant="h6" color="secondary">
                    {todayRecord?.xac_thuc_qua || 'Chưa chấm công'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight="bold">
                  Bộ lọc nâng cao
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Từ ngày"
                      value={startDate}
                      onChange={setStartDate}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Đến ngày"
                      value={endDate}
                      onChange={setEndDate}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Loại ngày</InputLabel>
                      <Select
                        value={dayTypeFilter}
                        onChange={(e) => setDayTypeFilter(e.target.value)}
                        label="Loại ngày"
                      >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="Ngày thường">Ngày thường</MenuItem>
                        <MenuItem value="Cuối tuần">Cuối tuần</MenuItem>
                        <MenuItem value="Lễ">Lễ</MenuItem>
                        <MenuItem value="Nghỉ phép">Nghỉ phép</MenuItem>
                        <MenuItem value="Nghỉ ốm">Nghỉ ốm</MenuItem>
                        <MenuItem value="Vắng không phép">Vắng không phép</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Phương thức xác thực</InputLabel>
                      <Select
                        value={authMethodFilter}
                        onChange={(e) => setAuthMethodFilter(e.target.value)}
                        label="Phương thức xác thực"
                      >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="QR Code">QR Code</MenuItem>
                        <MenuItem value="Web App">Web App</MenuItem>
                        <MenuItem value="Mobile App">Mobile App</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Trạng thái on-chain</InputLabel>
                      <Select
                        value={onChainFilter}
                        onChange={(e) => setOnChainFilter(e.target.value)}
                        label="Trạng thái on-chain"
                      >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="onchain">On-chain</MenuItem>
                        <MenuItem value="offchain">Off-chain</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={handleAdvancedSearch}
                        size="small"
                      >
                        Áp dụng bộ lọc
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleResetFilters}
                        size="small"
                      >
                        Đặt lại
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<ExportIcon />}
                        onClick={handleExportExcel}
                        color="secondary"
                        size="small"
                      >
                        Xuất Excel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Lịch sử chấm công ({filteredData.length} bản ghi)
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress size={60} />
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Ngày</strong></TableCell>
                      <TableCell><strong>Loại ngày</strong></TableCell>
                      <TableCell><strong>Giờ vào</strong></TableCell>
                      <TableCell><strong>Giờ ra</strong></TableCell>
                      <TableCell><strong>Tổng giờ</strong></TableCell>
                      <TableCell><strong>Phương thức</strong></TableCell>
                      <TableCell><strong>On-chain</strong></TableCell>
                      <TableCell><strong>Hành động</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Không có dữ liệu chấm công
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((record) => {
                        const onChainStatus = getOnChainStatus(record);
                        return (
                          <TableRow key={record._id || record.ngay} hover>
                            <TableCell>
                              {new Date(record.ngay).toLocaleDateString('vi-VN')}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={record.loai_ngay}
                                color={getStatusColor(record.loai_ngay)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {record.gio_vao ? (
                                <Box display="flex" alignItems="center" gap={1}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                  {formatTime(record.gio_vao)}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">--:--</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {record.gio_ra ? (
                                <Box display="flex" alignItems="center" gap={1}>
                                  <ErrorIcon color="error" fontSize="small" />
                                  {formatTime(record.gio_ra)}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">--:--</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {record.tong_gio_lam ? `${record.tong_gio_lam.toFixed(2)}h` : '--'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {record.xac_thuc_qua}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={onChainStatus.label}
                                color={onChainStatus.color}
                                size="small"
                                icon={onChainStatus.icon}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={1}>
                                <Tooltip title="Xem chi tiết">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewDetails(record)}
                                    color="primary"
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                {record.transaction_hash && (
                                  <Tooltip title="Xem trên blockchain">
                                    <IconButton
                                      size="small"
                                      component={Link}
                                      href={`https://etherscan.io/tx/${record.transaction_hash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      color="secondary"
                                    >
                                      <LinkIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* QR Scanner Dialog */}
        <Dialog
          open={qrDialogOpen}
          onClose={() => setQrDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Quét mã QR để {qrAction === 'checkin' ? 'Check-in' : 'Check-out'}
          </DialogTitle>
          <DialogContent>
            <QrScanner onScan={handleQrScan} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQrDialogOpen(false)}>Hủy</Button>
          </DialogActions>
        </Dialog>

        {/* Detail Modal */}
        <Dialog
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Chi tiết bản ghi chấm công
          </DialogTitle>
          <DialogContent>
            {selectedRecord && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Ngày</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {new Date(selectedRecord.ngay).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Loại ngày</Typography>
                    <Chip
                      label={selectedRecord.loai_ngay}
                      color={getStatusColor(selectedRecord.loai_ngay)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Giờ vào</Typography>
                    <Typography variant="body1">
                      {selectedRecord.gio_vao ? formatTime(selectedRecord.gio_vao) : '--:--'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Giờ ra</Typography>
                    <Typography variant="body1">
                      {selectedRecord.gio_ra ? formatTime(selectedRecord.gio_ra) : '--:--'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Tổng giờ làm</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedRecord.tong_gio_lam ? `${selectedRecord.tong_gio_lam.toFixed(2)}h` : '--'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Phương thức xác thực</Typography>
                    <Typography variant="body1">
                      {selectedRecord.xac_thuc_qua}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Trạng thái on-chain</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={selectedRecord.transaction_hash ? 'On-chain' : 'Chưa chứng thực'}
                        color={selectedRecord.transaction_hash ? 'success' : 'warning'}
                        size="small"
                        icon={selectedRecord.transaction_hash ? <VerifiedIcon fontSize="small" /> : <WarningIcon fontSize="small" />}
                      />
                      {selectedRecord.transaction_hash && (
                        <Link
                          href={`https://etherscan.io/tx/${selectedRecord.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <LinkIcon fontSize="small" />
                          Xem trên blockchain
                        </Link>
                      )}
                    </Box>
                  </Grid>
                  {selectedRecord.transaction_hash && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Transaction Hash</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {selectedRecord.transaction_hash}
                      </Typography>
                    </Grid>
                  )}
                  {selectedRecord.ghi_chu && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Ghi chú</Typography>
                      <Typography variant="body1">
                        {selectedRecord.ghi_chu}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {/* Blockchain Logs */}
                {recordDetails && (
                  <Box mt={3}>
                    <Typography variant="h6" gutterBottom>
                      Chi tiết blockchain
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      {recordDetails.map((log, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <VerifiedIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Block ${log.blockNumber}`}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  Transaction: {log.transactionHash}
                                </Typography>
                                <Typography variant="body2">
                                  Timestamp: {new Date(log.timestamp * 1000).toLocaleString('vi-VN')}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button for Quick Check-in */}
        {!isMobile && (
          <Tooltip title="Check-in nhanh">
            <Fab
              color="success"
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000,
              }}
              onClick={handleCheckIn}
              disabled={checkInLoading || (todayRecord && todayRecord.gio_vao)}
            >
              <CheckCircleIcon />
            </Fab>
          </Tooltip>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default AttendanceHistory;
