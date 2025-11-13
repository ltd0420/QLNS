import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Tooltip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Avatar, Alert, Snackbar, FormControl, InputLabel, Select, MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';
import { v4 as uuidv4 } from 'uuid';
import authService from '../../services/authService';

const DepartmentManagement = ({ user, onDataUpdate }) => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    ten_phong_ban: '',
    mo_ta: '',
    truong_phong_did: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchData();

    // Listen for real-time department head assignment updates
    const handleDepartmentHeadAssigned = (data) => {
      console.log('Department head assigned:', data);
      // Refresh department and employee data to show updated assignments
      fetchDepartments();
      fetchEmployees();
    };

    // Initialize socket connection if not already done
    if (window.socket) {
      window.socket.on('department_head_assigned', handleDepartmentHeadAssigned);
    }

    return () => {
      if (window.socket) {
        window.socket.off('department_head_assigned', handleDepartmentHeadAssigned);
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Step 1: Fetch basic user info and all employees
      const basicUser = await authService.getCurrentUser();
      const empRes = await apiService.getEmployees();
      setEmployees(empRes || []);

      // Step 2: Find the full user profile from the employee list
      const fullUserProfile = (empRes || []).find(emp => emp.employee_did === basicUser.did);
      setCurrentUser(fullUserProfile || basicUser);

      // Step 3: Fetch remaining data
      const [deptRes, taskRes, rolesRes] = await Promise.all([
        apiService.getDepartments(),
        apiService.getAllTasks(),
        apiService.get('/roles') // Fetch roles
      ]);

      setDepartments(deptRes || []);
      setTasks(taskRes || []);
      setRoles(rolesRes.data?.roles || []); // Set roles

    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải dữ liệu', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEmployees = async () => { try { const response = await apiService.getEmployees(); setEmployees(response); } catch (error) { console.error('Error fetching employees:', error); setSnackbar({ open: true, message: 'Lỗi khi tải danh sách nhân viên', severity: 'error' }); } };
  const handleOpenDialog = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        ten_phong_ban: department.ten_phong_ban,
        mo_ta: department.mo_ta || '',
        truong_phong_did: department.truong_phong_did || ''
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        ten_phong_ban: '',
        mo_ta: '',
        truong_phong_did: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDepartment(null);
  };

  const handleSaveDepartment = async () => {
    try {
      const departmentHeadRole = roles.find(r => r.ten_vai_tro === 'Department Head');
      const managerRole = roles.find(r => r.ten_vai_tro === 'Manager');
      const employeeRole = roles.find(r => r.ten_vai_tro === 'Employee');

      if (!departmentHeadRole || !employeeRole || !managerRole) {
        setSnackbar({ open: true, message: 'Không tìm thấy các vai trò cần thiết (Manager, Department Head, Employee).', severity: 'error' });
        return;
      }

      // Determine which role to assign based on the current user's role
      const isSuperAdmin = currentUser?.role_id === '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7a';
      const roleToAssign = isSuperAdmin ? managerRole : departmentHeadRole;

      const oldManagerId = editingDepartment?.truong_phong_did;
      const newManagerId = formData.truong_phong_did;

      if (editingDepartment) {
        // Update existing department
        const departmentId = editingDepartment.phong_ban_id;
        await apiService.updateDepartment(departmentId, formData);

        // If manager has changed, update roles
        if (oldManagerId !== newManagerId) {
          // Revoke old manager's role if they existed
          if (oldManagerId) {
            await apiService.updateEmployee(oldManagerId, { role_id: employeeRole.role_id });
          }
          // Assign new manager's role and department
          if (newManagerId) {
            await apiService.updateEmployee(newManagerId, {
              role_id: roleToAssign.role_id,
              phong_ban_id: departmentId
            });
          }
        }

        setSnackbar({ open: true, message: 'Cập nhật phòng ban thành công', severity: 'success' });
      } else {
        // Create new department
        const newDepartmentData = { ...formData, phong_ban_id: uuidv4() };
        await apiService.createDepartment(newDepartmentData);

        // Assign role and department to the new manager if selected
        if (newManagerId) {
          await apiService.updateEmployee(newManagerId, {
            role_id: roleToAssign.role_id,
            phong_ban_id: newDepartmentData.phong_ban_id
          });
        }

        setSnackbar({ open: true, message: 'Tạo phòng ban mới thành công', severity: 'success' });
      }
      handleCloseDialog();
      fetchData(); // Refresh all data
    } catch (error) {
      console.error('Error saving department:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi lưu phòng ban';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng ban này? Tất cả nhân viên trong phòng ban sẽ bị ảnh hưởng.')) {
      try {
        await apiService.deleteDepartment(departmentId);
        setSnackbar({ open: true, message: 'Xóa phòng ban thành công', severity: 'success' });
        fetchData(); // Refresh all data
      } catch (error) {
        console.error('Error deleting department:', error);
        setSnackbar({ open: true, message: 'Lỗi khi xóa phòng ban', severity: 'error' });
      }
    }
  };

  const getManagerName = (managerId) => {
    if (!managerId) return 'Chưa chỉ định';
    const manager = employees.find(emp => emp.employee_did === managerId);
    return manager ? `${manager.employee_did} - ${manager.ho_ten}` : 'Chưa chỉ định';
  };

  const getDepartmentStats = (department) => {
    const departmentTasks = tasks.filter(task => task.phong_ban_id === department.phong_ban_id);
    const activeTasks = departmentTasks.filter(task => task.trang_thai === 'Đang thực hiện' || task.trang_thai === 'Chờ bắt đầu').length;
    const completedTasks = departmentTasks.filter(task => task.trang_thai === 'Hoàn thành').length;
    const totalEmployees = employees.filter(emp => emp.phong_ban_id === department.phong_ban_id).length;

    return {
      totalEmployees,
      activeProjects: activeTasks,
      completedTasks,
    };
  };

  const getAvailableManagers = (editingDeptId) => {
    const assignedManagerIds = departments
      .filter(dept => dept.phong_ban_id !== editingDeptId && dept.truong_phong_did)
      .map(dept => dept.truong_phong_did);

    return employees.filter(
      emp => !assignedManagerIds.includes(emp.employee_did)
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary" mb={1}>
            Quản lý Phòng ban
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tạo và quản lý các phòng ban trong tổ chức
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2, px: 3, py: 1.5 }}
        >
          Thêm Phòng ban
        </Button>
      </Box>

      {/* Departments Grid */}
      <Grid container spacing={3}>
        {departments.map((department) => {
          const stats = getDepartmentStats(department);
          return (
            <Grid item xs={12} md={6} lg={4} key={department.phong_ban_id}>
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
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {department.ten_phong_ban}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {department.phong_ban_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {department.mo_ta}
                  </Typography>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Trưởng phòng:
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight="500">
                        {getManagerName(department.truong_phong_did)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Stats */}
                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {stats.totalEmployees}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Nhân viên
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {stats.activeProjects}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dự án
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" fontWeight="bold" color="info.main">
                          {stats.completedTasks}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Hoàn thành
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" gap={1}>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(department)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDepartment(department.phong_ban_id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    </Box>
                    {/* Show 'Add Employee' button only for the correct Department Head */}
                    {(
                      (currentUser?.role_id === '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7d' && // Department Head
                       department.truong_phong_did === currentUser.employee_did)
                    ) && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        // Re-using dialog to assign/change manager, which effectively adds an employee
                        // to the department and assigns them the 'Department Head' role.
                        onClick={() => handleOpenDialog(department)}
                      >
                        Thêm nhân viên
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Department Details Table */}
      <Card sx={{ mt: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Box p={3} pb={0}>
            <Typography variant="h6" fontWeight="bold">
              Chi tiết Phòng ban
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên phòng ban</TableCell>
                  <TableCell>Trưởng phòng</TableCell>
                  <TableCell align="center">Số nhân viên</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((department) => {
                  const stats = getDepartmentStats(department);
                  return (
                  <TableRow key={department.phong_ban_id} hover >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          {department.ten_phong_ban}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {department.mo_ta}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getManagerName(department.truong_phong_did)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={stats.totalEmployees}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(department.createdAt).toLocaleDateString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(department)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteDepartment(department.phong_ban_id)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow >
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Department Form Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 'bold' }}>
          {editingDepartment ? 'Chỉnh sửa Phòng ban' : 'Tạo Phòng ban Mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên phòng ban"
                value={formData.ten_phong_ban}
                onChange={(e) => setFormData({ ...formData, ten_phong_ban: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả"
                multiline
                rows={3}
                value={formData.mo_ta}
                onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Trưởng phòng</InputLabel>
                <Select
                  value={formData.truong_phong_did}
                  onChange={(e) => setFormData({ ...formData, truong_phong_did: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Chưa chỉ định</em>
                  </MenuItem>
                  {getAvailableManagers(editingDepartment?.phong_ban_id).map((employee) => (
                    <MenuItem key={employee.employee_did} value={employee.employee_did}>
                      {employee.employee_did} - {employee.ho_ten}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 2 }}>
            Hủy
          </Button>
          <Button
            onClick={handleSaveDepartment}
            variant="contained"
            disabled={!formData.ten_phong_ban.trim()}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {editingDepartment ? 'Cập nhật' : 'Tạo mới'}
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

export default DepartmentManagement;
