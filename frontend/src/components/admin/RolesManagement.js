import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar, Alert, Snackbar
} from '@mui/material';
import {
  Security as SecurityIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

import apiService from '../../services/apiService';
const RolesManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const rolesRes = await apiService.get('/roles');

      const rolesData = rolesRes.data?.roles || [];
      setRoles(Array.isArray(rolesData) ? rolesData : []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải dữ liệu', severity: 'error' });
      setRoles([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case 'Super Admin':
        return <AdminIcon />;
      case 'Manager':
        return <SecurityIcon />;
      default:
        return <PeopleIcon />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary" mb={1}>
            Quản lý Phân quyền
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tạo và quản lý các vai trò người dùng trong hệ thống
          </Typography>
        </Box> 
      </Box>

      {/* Roles Grid */}
      <Grid container spacing={3}>
        {roles.map((role) => (
          <Grid item xs={12} md={6} lg={4} key={role.role_id}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {getRoleIcon(role.ten_vai_tro)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {role.ten_vai_tro}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ưu tiên: {role.cap_do_uu_tien}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={role.trang_thai}
                    color={role.trang_thai === 'Hoạt động' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={3}>
                  {role.mo_ta}
                </Typography>

              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RolesManagement;
