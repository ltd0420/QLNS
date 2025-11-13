import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Avatar, Chip, Divider,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, CircularProgress, useTheme, useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Wallet as WalletIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  VerifiedUser as VerifiedIcon,
  Schedule as ScheduleIcon,
  AccountBalance as AccountIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';

function PersonalProfile({ user, employeeData, onDataUpdate }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    chuc_vu: '',
    ngay_vao_lam: '',
    ai_profile_summary: ''
  });

  useEffect(() => {
    if (employeeData) {
      setFormData({
        chuc_vu: employeeData.chuc_vu || '',
        ngay_vao_lam: employeeData.ngay_vao_lam || '',
        ai_profile_summary: employeeData.ai_profile_summary || ''
      });
    }
  }, [employeeData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const { employee_did } = user;
      await apiService.updateEmployeeProfile(employee_did, formData);

      setSuccess('Cập nhật hồ sơ thành công!');
      setEditDialogOpen(false);
      onDataUpdate(); // Refresh data

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Update profile error:', err);
      setError('Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đang làm việc':
        return 'success';
      case 'Nghỉ phép':
        return 'warning';
      case 'Tạm nghỉ':
        return 'info';
      case 'Đã nghỉ việc':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Hồ sơ cá nhân
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Profile Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={3} mb={3}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                  }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h5" fontWeight="bold">
                    {employeeData?.employee_did || 'Chưa cập nhật'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {employeeData?.chuc_vu || 'Nhân viên'}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={employeeData?.trang_thai || 'Đang làm việc'}
                      color={getStatusColor(employeeData?.trang_thai)}
                      size="small"
                    />
                    <Chip
                      icon={<VerifiedIcon />}
                      label="Đã xác thực ví"
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setEditDialogOpen(true)}
                >
                  Chỉnh sửa
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <WalletIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Địa chỉ ví
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {user?.walletAddress?.slice(0, 10)}...{user?.walletAddress?.slice(-8)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BusinessIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phòng ban
                      </Typography>
                      <Typography variant="body2">
                        {employeeData?.phong_ban_id?.ten_phong_ban || employeeData?.phong_ban_id || 'Chưa cập nhật'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <WorkIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Chức vụ
                      </Typography>
                      <Typography variant="body2">
                        {employeeData?.chuc_vu || 'Nhân viên'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <ScheduleIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Ngày vào làm
                      </Typography>
                      <Typography variant="body2">
                        {employeeData?.ngay_vao_lam ? new Date(employeeData.ngay_vao_lam).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {employeeData?.email && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AccountIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body2">
                          {employeeData.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {employeeData?.so_dien_thoai && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AccountIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Số điện thoại
                        </Typography>
                        <Typography variant="body2">
                          {employeeData.so_dien_thoai}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Thống kê nhanh
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {employeeData?.vc_uris?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chứng chỉ VC
                  </Typography>
                </Box>

                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Typography variant="h4" color="secondary" fontWeight="bold">
                    {employeeData?.consent_pointer ? '1' : '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Consent đã ký
                  </Typography>
                </Box>

                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {employeeData?.wallet_verified ? '1' : '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ví đã xác thực
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Chỉnh sửa hồ sơ cá nhân
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Chức vụ"
                value={formData.chuc_vu}
                onChange={(e) => handleInputChange('chuc_vu', e.target.value)}
              >
                <MenuItem value="Intern">Intern</MenuItem>
                <MenuItem value="Junior Developer">Junior Developer</MenuItem>
                <MenuItem value="Senior Developer">Senior Developer</MenuItem>
                <MenuItem value="Tech Lead">Tech Lead</MenuItem>
                <MenuItem value="Designer">Designer</MenuItem>
                <MenuItem value="QA Engineer">QA Engineer</MenuItem>
                <MenuItem value="DevOps Engineer">DevOps Engineer</MenuItem>
                <MenuItem value="Data Engineer">Data Engineer</MenuItem>
                <MenuItem value="Data Scientist">Data Scientist</MenuItem>
                <MenuItem value="Product Manager">Product Manager</MenuItem>
                <MenuItem value="Project Manager">Project Manager</MenuItem>
                <MenuItem value="HR Specialist">HR Specialist</MenuItem>
                <MenuItem value="Finance Analyst">Finance Analyst</MenuItem>
                <MenuItem value="Sales Executive">Sales Executive</MenuItem>
                <MenuItem value="Customer Support">Customer Support</MenuItem>
                <MenuItem value="Marketing Specialist">Marketing Specialist</MenuItem>
                <MenuItem value="Team Lead">Team Lead</MenuItem>
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Director">Director</MenuItem>
                <MenuItem value="VP">VP</MenuItem>
                <MenuItem value="CTO">CTO</MenuItem>
                <MenuItem value="CFO">CFO</MenuItem>
                <MenuItem value="COO">COO</MenuItem>
                <MenuItem value="CEO">CEO</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ngày vào làm"
                type="date"
                value={formData.ngay_vao_lam}
                onChange={(e) => handleInputChange('ngay_vao_lam', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tóm tắt hồ sơ AI"
                multiline
                rows={4}
                value={formData.ai_profile_summary}
                onChange={(e) => handleInputChange('ai_profile_summary', e.target.value)}
                placeholder="Nhập tóm tắt hồ sơ được tạo bởi AI..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PersonalProfile;
