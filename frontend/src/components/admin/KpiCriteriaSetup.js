import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Tooltip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, Snackbar, FormControl, InputLabel, Select,
  MenuItem, Slider, CircularProgress, Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';
import { v4 as uuidv4 } from 'uuid';

const KpiCriteriaSetup = () => {
  const [kpiCriteria, setKpiCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);
  const [formData, setFormData] = useState({
    ten_kpi: '',
    mo_ta: '',
    loai_kpi: 'Định lượng',
    don_vi_do: '',
    trong_so: 10,
    nguong_dat: 70,
    nguong_xuat_sac: 90,
    ap_dung_cho_chuc_vu: [],
    chu_ky_danh_gia: 'Tháng'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const jobPositions = [
    'Intern', 'Junior Developer', 'Senior Developer', 'Tech Lead', 'Designer',
    'QA Engineer', 'DevOps Engineer', 'Data Engineer', 'Data Scientist',
    'Product Manager', 'Project Manager', 'HR Specialist', 'Finance Analyst',
    'Sales Executive', 'Customer Support', 'Marketing Specialist', 'Team Lead',
    'Manager', 'Director', 'VP', 'CTO', 'CFO', 'COO', 'CEO'
  ];

  useEffect(() => {
    fetchKpiCriteria();
  }, []);

  const fetchKpiCriteria = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllKpiCriteria();
      setKpiCriteria(response || []);
    } catch (error) {
      console.error('Error fetching KPI criteria:', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải danh sách tiêu chí KPI', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (kpi = null) => {
    if (kpi) {
      setEditingKpi(kpi);
      // Chỉ lấy các trường cần thiết để điền vào form, tránh đưa các trường thừa vào state
      setFormData({
        ten_kpi: kpi.ten_kpi || '',
        mo_ta: kpi.mo_ta || '',
        loai_kpi: kpi.loai_kpi || 'Định lượng',
        don_vi_do: kpi.don_vi_do || '',
        trong_so: kpi.trong_so || 10,
        nguong_dat: kpi.nguong_dat || 70,
        nguong_xuat_sac: kpi.nguong_xuat_sac || 90,
        ap_dung_cho_chuc_vu: kpi.ap_dung_cho_chuc_vu || [],
        chu_ky_danh_gia: kpi.chu_ky_danh_gia || 'Tháng'
      });
    } else {
      setEditingKpi(null);
      setFormData({
        ten_kpi: '',
        mo_ta: '',
        loai_kpi: 'Định lượng',
        don_vi_do: '',
        trong_so: 10,
        nguong_dat: 70,
        nguong_xuat_sac: 90,
        ap_dung_cho_chuc_vu: [],
        chu_ky_danh_gia: 'Tháng'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingKpi(null);
  };

  const handleSaveKpi = async () => {
    try {
      // Chỉ trích xuất các trường cần thiết từ formData để gửi đi
      const {
        ten_kpi, mo_ta, loai_kpi, don_vi_do, trong_so,
        nguong_dat, nguong_xuat_sac, ap_dung_cho_chuc_vu, chu_ky_danh_gia
      } = formData;

      const payload = {
        ten_kpi, mo_ta, loai_kpi, don_vi_do, trong_so,
        nguong_dat, nguong_xuat_sac, ap_dung_cho_chuc_vu, chu_ky_danh_gia
      };

      if (editingKpi) {
        await apiService.updateKpiCriteria(editingKpi.kpi_id, payload);
        setSnackbar({ open: true, message: 'Cập nhật tiêu chí KPI thành công', severity: 'success' });
      } else {
        const newKpi = { ...payload, kpi_id: uuidv4() };
        await apiService.createKpiCriteria(newKpi);
        setSnackbar({ open: true, message: 'Tạo tiêu chí KPI mới thành công', severity: 'success' });
      }
      handleCloseDialog();
      fetchKpiCriteria();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi lưu tiêu chí KPI';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDeleteKpi = async (kpiId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tiêu chí KPI này?')) {
      try {
        await apiService.deleteKpiCriteria(kpiId);
        setSnackbar({ open: true, message: 'Xóa tiêu chí KPI thành công', severity: 'success' });
        fetchKpiCriteria();
      } catch (error) {
        console.error('Error deleting KPI criteria:', error);
        setSnackbar({ open: true, message: 'Lỗi khi xóa tiêu chí KPI', severity: 'error' });
      }
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Thiết lập Tiêu chí KPI</Typography>
          <Typography variant="body1" color="text.secondary">Quản lý các tiêu chí đánh giá hiệu suất</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchKpiCriteria}>Làm mới</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Thêm Tiêu chí</Button>
        </Box>
      </Box>

      {/* KPI Criteria Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên KPI</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell align="center">Trọng số</TableCell>
                  <TableCell>Chu kỳ</TableCell>
                  <TableCell>Áp dụng cho</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {kpiCriteria.map((kpi) => (
                  <TableRow key={kpi.kpi_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">{kpi.ten_kpi}</Typography>
                      <Typography variant="caption" color="text.secondary">{kpi.mo_ta}</Typography>
                    </TableCell>
                    <TableCell><Chip label={kpi.loai_kpi} size="small" /></TableCell>
                    <TableCell align="center">{kpi.trong_so}%</TableCell>
                    <TableCell>{kpi.chu_ky_danh_gia}</TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {kpi.ap_dung_cho_chuc_vu.slice(0, 3).map(pos => <Chip key={pos} label={pos} size="small" variant="outlined" />)}
                        {kpi.ap_dung_cho_chuc_vu.length > 3 && <Chip label={`+${kpi.ap_dung_cho_chuc_vu.length - 3}`} size="small" />}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" onClick={() => handleOpenDialog(kpi)} color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton size="small" onClick={() => handleDeleteKpi(kpi.kpi_id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* KPI Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle fontWeight="bold">{editingKpi ? 'Chỉnh sửa Tiêu chí KPI' : 'Tạo Tiêu chí KPI Mới'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Tên KPI" value={formData.ten_kpi} onChange={(e) => setFormData({ ...formData, ten_kpi: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Mô tả" multiline rows={2} value={formData.mo_ta} onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Loại KPI</InputLabel>
                <Select value={formData.loai_kpi} onChange={(e) => setFormData({ ...formData, loai_kpi: e.target.value })}>
                  <MenuItem value="Định lượng">Định lượng</MenuItem>
                  <MenuItem value="Định tính">Định tính</MenuItem>
                  <MenuItem value="Hành vi">Hành vi</MenuItem>
                  <MenuItem value="Kỹ năng">Kỹ năng</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Đơn vị đo" value={formData.don_vi_do} onChange={(e) => setFormData({ ...formData, don_vi_do: e.target.value })} helperText="Ví dụ: %, điểm, task" />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Trọng số (%): {formData.trong_so}</Typography>
              <Slider value={formData.trong_so} onChange={(e, value) => setFormData({ ...formData, trong_so: value })} valueLabelDisplay="auto" step={5} marks min={0} max={100} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Ngưỡng Đạt" value={formData.nguong_dat} onChange={(e) => setFormData({ ...formData, nguong_dat: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Ngưỡng Xuất sắc" value={formData.nguong_xuat_sac} onChange={(e) => setFormData({ ...formData, nguong_xuat_sac: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={jobPositions}
                value={formData.ap_dung_cho_chuc_vu}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, ap_dung_cho_chuc_vu: newValue });
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} variant="outlined" label={option} {...tagProps} />;
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Áp dụng cho chức vụ" placeholder="Chọn chức vụ" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Chu kỳ đánh giá</InputLabel>
                <Select value={formData.chu_ky_danh_gia} onChange={(e) => setFormData({ ...formData, chu_ky_danh_gia: e.target.value })}>
                  <MenuItem value="Tuần">Tuần</MenuItem>
                  <MenuItem value="Tháng">Tháng</MenuItem>
                  <MenuItem value="Quý">Quý</MenuItem>
                  <MenuItem value="Năm">Năm</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSaveKpi} variant="contained" disabled={!formData.ten_kpi}>
            {editingKpi ? 'Cập nhật' : 'Tạo mới'}
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
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KpiCriteriaSetup;
