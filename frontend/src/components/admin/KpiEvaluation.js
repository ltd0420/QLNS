import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Tooltip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Alert, Snackbar, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Slider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import apiService from '../../services/apiService';
import authService from '../../services/authService';

const KpiEvaluation = ({ user }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [kpiCriteria, setKpiCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [formData, setFormData] = useState({
    employee_did: '',
    kpi_id: '',
    ky_danh_gia: '',
    ngay_bat_dau: null,
    ngay_ket_thuc: null,
    gia_tri_thuc_te: 0,
    diem_so: 0,
    xep_loai: 'Chưa đạt',
    nhan_xet: '',
    trang_thai: 'Nháp'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evalsRes, empsRes, kpisRes] = await Promise.all([
        apiService.get('/danh-gia-kpi'),
        apiService.getAllEmployees(),
        apiService.getAllKpiCriteria()
      ]);

      setEvaluations(evalsRes.data || []);
      setEmployees(empsRes || []);
      setKpiCriteria(kpisRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải dữ liệu đánh giá KPI', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (evaluation = null) => {
    if (evaluation) {
      setEditingEvaluation(evaluation);
      setFormData({
        ...evaluation,
        ngay_bat_dau: new Date(evaluation.ngay_bat_dau),
        ngay_ket_thuc: new Date(evaluation.ngay_ket_thuc),
      });
    } else {
      setEditingEvaluation(null);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      setFormData({
        employee_did: '',
        kpi_id: '',
        ky_danh_gia: `Tháng ${currentMonth}/${currentYear}`,
        ngay_bat_dau: new Date(currentYear, currentMonth - 1, 1),
        ngay_ket_thuc: new Date(currentYear, currentMonth, 0),
        gia_tri_thuc_te: 0,
        diem_so: 0,
        xep_loai: 'Chưa đạt',
        nhan_xet: '',
        trang_thai: 'Nháp'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEvaluation(null);
  };

  const handleSaveEvaluation = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const payload = {
        ...formData,
        nguoi_danh_gia_did: currentUser.did,
      };

      if (editingEvaluation) {
        // Loại bỏ các trường không cần thiết trước khi cập nhật
        const { _id, createdAt, updatedAt, __v, ...updatePayload } = payload;
        await apiService.put(`/danh-gia-kpi/${editingEvaluation._id}`, updatePayload);
        setSnackbar({ open: true, message: 'Cập nhật đánh giá thành công', severity: 'success' });
      } else {
        await apiService.post('/danh-gia-kpi', payload);
        setSnackbar({ open: true, message: 'Tạo đánh giá mới thành công', severity: 'success' });
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi lưu đánh giá';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleApproveEvaluation = async (evaluationId) => {
    try {
      const payload = { trang_thai: 'Đã phê duyệt' };
      await apiService.put(`/danh-gia-kpi/${evaluationId}`, payload);
      setSnackbar({ open: true, message: 'Phê duyệt đánh giá thành công', severity: 'success' });
      fetchData();
    } catch (error) {
      console.error('Error approving evaluation:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi phê duyệt đánh giá';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };


  const handleDeleteEvaluation = async (evaluationId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản đánh giá này?')) {
      try {
        await apiService.delete(`/danh-gia-kpi/${evaluationId}`);
        setSnackbar({ open: true, message: 'Xóa đánh giá thành công', severity: 'success' });
        fetchData();
      } catch (error) {
        console.error('Error deleting evaluation:', error);
        setSnackbar({ open: true, message: 'Lỗi khi xóa đánh giá', severity: 'error' });
      }
    }
  };

  const handleScoreChange = (value) => {
    let xep_loai = 'Chưa đạt';
    if (value >= 90) xep_loai = 'Xuất sắc';
    else if (value >= 75) xep_loai = 'Tốt';
    else if (value >= 50) xep_loai = 'Đạt';
    setFormData({ ...formData, diem_so: value, xep_loai });
  };

  const getEmployeeName = (did) => employees.find(e => e.employee_did === did)?.ho_ten || did;
  const getKpiName = (id) => kpiCriteria.find(k => k.kpi_id === id)?.ten_kpi || id;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã phê duyệt': return 'success';
      case 'Đã gửi': return 'info';
      case 'Nháp': return 'default';
      case 'Đã đóng': return 'warning';
      default: return 'default';
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Xuất sắc': return 'success';
      case 'Tốt': return 'primary';
      case 'Đạt': return 'info';
      case 'Chưa đạt': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold">Quản lý Đánh giá KPI</Typography>
            <Typography variant="body1" color="text.secondary">Tạo và quản lý các kỳ đánh giá hiệu suất nhân viên</Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>Làm mới</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Tạo Đánh giá</Button>
          </Box>
        </Box>

        {/* Evaluations Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nhân viên</TableCell>
                    <TableCell>Tiêu chí KPI</TableCell>
                    <TableCell>Kỳ đánh giá</TableCell>
                    <TableCell align="center">Điểm</TableCell>
                    <TableCell>Xếp loại</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evaluations.map((evaluation) => (
                    <TableRow key={evaluation._id} hover>
                      <TableCell>{getEmployeeName(evaluation.employee_did)}</TableCell>
                      <TableCell>{getKpiName(evaluation.kpi_id)}</TableCell>
                      <TableCell>{evaluation.ky_danh_gia}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold">{evaluation.diem_so}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={evaluation.xep_loai} size="small" color={getRatingColor(evaluation.xep_loai)} />
                      </TableCell>
                      <TableCell>
                        <Chip label={evaluation.trang_thai} size="small" color={getStatusColor(evaluation.trang_thai)} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" onClick={() => handleOpenDialog(evaluation)} color="primary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton size="small" onClick={() => handleDeleteEvaluation(evaluation._id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        {evaluation.trang_thai === 'Đã gửi' && (
                          <Tooltip title="Phê duyệt">
                            <IconButton size="small" onClick={() => handleApproveEvaluation(evaluation._id)} color="success">
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Evaluation Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle fontWeight="bold">
            {editingEvaluation ? 'Chỉnh sửa Đánh giá KPI' : 'Tạo Đánh giá KPI Mới'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ pt: 2 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Nhân viên</InputLabel>
                  <Select
                    value={formData.employee_did}
                    onChange={(e) => setFormData({ ...formData, employee_did: e.target.value })}
                    disabled={!!editingEvaluation}
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.employee_did} value={emp.employee_did}>
                        {emp.ho_ten || emp.employee_did}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tiêu chí KPI</InputLabel>
                  <Select
                    value={formData.kpi_id}
                    onChange={(e) => setFormData({ ...formData, kpi_id: e.target.value })}
                    disabled={!!editingEvaluation}
                  >
                    {kpiCriteria.map((kpi) => (
                      <MenuItem key={kpi.kpi_id} value={kpi.kpi_id}>
                        {kpi.ten_kpi}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Kỳ đánh giá"
                  value={formData.ky_danh_gia}
                  onChange={(e) => setFormData({ ...formData, ky_danh_gia: e.target.value })}
                  required
                  helperText="Ví dụ: Tháng 1/2024, Quý 1/2024"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Ngày bắt đầu"
                  value={formData.ngay_bat_dau}
                  onChange={(date) => setFormData({ ...formData, ngay_bat_dau: date })}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Ngày kết thúc"
                  value={formData.ngay_ket_thuc}
                  onChange={(date) => setFormData({ ...formData, ngay_ket_thuc: date })}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Giá trị thực tế đạt được"
                  value={formData.gia_tri_thuc_te}
                  onChange={(e) => setFormData({ ...formData, gia_tri_thuc_te: Number(e.target.value) })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Điểm số: {formData.diem_so}</Typography>
                <Slider
                  value={formData.diem_so}
                  onChange={(e, value) => handleScoreChange(value)}
                  aria-labelledby="diem-so-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={0}
                  max={100}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Xếp loại</InputLabel>
                  <Select
                    value={formData.xep_loai}
                    onChange={(e) => setFormData({ ...formData, xep_loai: e.target.value })}
                    readOnly
                  >
                    <MenuItem value="Xuất sắc">Xuất sắc (&gt;= 90)</MenuItem>
                    <MenuItem value="Tốt">Tốt (&gt;= 75)</MenuItem>
                    <MenuItem value="Đạt">Đạt (&gt;= 50)</MenuItem>
                    <MenuItem value="Chưa đạt">Chưa đạt (&lt; 50)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={formData.trang_thai}
                    onChange={(e) => setFormData({ ...formData, trang_thai: e.target.value })}
                  >
                    <MenuItem value="Nháp">Nháp</MenuItem>
                    <MenuItem value="Đã gửi">Đã gửi</MenuItem>
                    <MenuItem value="Đã phê duyệt">Đã phê duyệt</MenuItem>
                    <MenuItem value="Đã đóng">Đã đóng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nhận xét của người đánh giá"
                  multiline
                  rows={4}
                  value={formData.nhan_xet}
                  onChange={(e) => setFormData({ ...formData, nhan_xet: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button
              onClick={handleSaveEvaluation}
              variant="contained"
              disabled={!formData.employee_did || !formData.kpi_id || !formData.ky_danh_gia}
            >
              {editingEvaluation ? 'Cập nhật' : 'Lưu'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default KpiEvaluation;