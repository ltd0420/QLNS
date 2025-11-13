import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Tooltip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Avatar, Alert, Snackbar, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { vi } from 'date-fns/locale';
import apiService from '../../services/apiService';
import authService from '../../services/authService';

const EmployeeManagement = ({ user, employeeData }) => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userDepartment, setUserDepartment] = useState(null);
  const [canCreateEmployee, setCanCreateEmployee] = useState(false); // State to control create button visibility
  const [formData, setFormData] = useState({
    employee_did: '',
    chuc_vu: '',
    phong_ban_id: '',
    trang_thai: 'Đang làm việc',
    ngay_vao_lam: null,
    walletAddress: '',
    role_id: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUserRoleAndDepartment();
    fetchEmployees();
    fetchDepartments();
    fetchRoles();

    // Auto-refresh data every 5 seconds to reflect department changes
    const interval = setInterval(() => {
      fetchEmployees();
      fetchDepartments();
      fetchRoles();
    }, 5000);

    // Listen for real-time department head assignment updates
    const handleDepartmentHeadAssigned = (data) => {
      console.log('Department head assigned:', data);
      // Refresh employee data to show updated department assignments
      fetchEmployees();
      fetchDepartments();
    };

    // Initialize socket connection if not already done
    if (window.socket) {
      window.socket.on('department_head_assigned', handleDepartmentHeadAssigned);
    }

    return () => {
      clearInterval(interval);
      if (window.socket) {
        window.socket.off('department_head_assigned', handleDepartmentHeadAssigned);
      }
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllEmployees(); // Use getAllEmployees to get full data including role_id
      setEmployees(response || []);
      if (!response || response.length === 0) {
        setSnackbar({
          open: true,
          message: 'Không có dữ liệu nhân viên hoặc API không trả về dữ liệu',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi tải danh sách nhân viên';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      setEmployees([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải danh sách phòng ban', severity: 'error' });
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiService.get('/roles');
      // Correctly access the roles array from the response data
      const rolesData = response.data?.roles || [];
      console.log('Fetched roles:', rolesData); // Log to check roles data
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải danh sách vai trò', severity: 'error' });
      setRoles([]); // Set empty array on error
    }
  };

  const fetchUserRoleAndDepartment = async () => {
    try {
      // Fetch full user profile to ensure we have the correct employee_did
      if (!currentUser) {
        let basicUser = authService.getCurrentUser();
        if (!basicUser) {
          try {
            basicUser = await authService.getProfile();
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
          }
        }

        if (basicUser?.did) {
          try {
            const fullUserProfile = await apiService.get(`/employees/${basicUser.did}`);
            setCurrentUser(fullUserProfile?.data || fullUserProfile);
          } catch (profileFetchError) {
            console.error('Error fetching full user profile:', profileFetchError);
          }
        }
      }
      // Get user permissions to determine role
      const permissionsResponse = await apiService.get('/roles/permissions/me');
      if (!permissionsResponse.data || !permissionsResponse.data.permissions) {
        console.error('Invalid permissions response:', permissionsResponse);
        setSnackbar({ open: true, message: 'Không thể lấy thông tin quyền của người dùng.', severity: 'error' });
        return;
      }
      const userPermissions = permissionsResponse.data.permissions;

      // Determine user role based on permissions
      let role = 'Employee'; // default
      let canCreate = false;
      // Prioritize checking for Super Admin role first
      if (userPermissions.system_settings?.manage_roles) {
        role = 'Super Admin';
        canCreate = true;
      } else if (userPermissions.ho_so_nhan_vien?.view_all) {
        role = 'Manager';
        canCreate = true;
      } else if (userPermissions.ho_so_nhan_vien?.create) {
        role = 'Department Head';
        canCreate = true;
      }

      setUserRole(role);
      setCanCreateEmployee(canCreate);

      // If Department Head, find their department
      if (role === 'Department Head') {
        const departmentsResponse = await apiService.getDepartments();
        const userDept = departmentsResponse.find(dept => dept.truong_phong_did === currentUser?.employee_did);
        setUserDepartment(userDept);
      }
    } catch (error) {
      console.error('Error fetching user role and department:', error);
    }
  };

  const handleOpenDialog = (employee = null) => {
    // Check permissions for Department Head
    if (userRole === 'Department Head' && employee && employee.phong_ban_id) {
      // Block editing if the employee belongs to another department.
      // Allows editing if the employee is in the same department or has no department.
      if (employee.phong_ban_id !== userDepartment?.phong_ban_id) {
        setSnackbar({ open: true, message: 'Bạn chỉ có thể chỉnh sửa nhân viên trong phòng ban của mình', severity: 'warning' });
        return;
      }
    }

    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        ...employee, // Spread all employee properties
        ngay_vao_lam: employee.ngay_vao_lam ? new Date(employee.ngay_vao_lam) : null,
        role_id: employee.role_id || '',
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        employee_did: '',
        chuc_vu: '',
        phong_ban_id: userRole === 'Department Head' ? userDepartment?.phong_ban_id || '' : '',
        trang_thai: 'Đang làm việc',
        ngay_vao_lam: null,
        walletAddress: '',
        role_id: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleSaveEmployee = async () => {
    try {
      if (editingEmployee) {
        // Construct the data to be sent for update, excluding fields that shouldn't be changed
        const updateData = {
          chuc_vu: formData.chuc_vu,
          phong_ban_id: formData.phong_ban_id,
          trang_thai: formData.trang_thai,
          ngay_vao_lam: formData.ngay_vao_lam,
          role_id: formData.role_id,
          walletAddress: formData.walletAddress,
        }; 

        // Ensure role_id is not an empty string, which might cause validation issues.
        // Send null if it's empty.
        if (updateData.role_id === '') {
          delete updateData.role_id;
        }

        // Update existing employee
        await apiService.updateEmployee(editingEmployee.employee_did, updateData);
        setSnackbar({ open: true, message: 'Cập nhật nhân viên thành công', severity: 'success' });
      } else {
        // Create new employee
        await apiService.createEmployee(formData);
        setSnackbar({ open: true, message: 'Tạo nhân viên mới thành công', severity: 'success' });
      }
      handleCloseDialog();
      fetchEmployees(); // Refresh the list
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi lưu nhân viên';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDeleteEmployee = async (employeeDid) => {
    // Check permissions for Department Head
    if (userRole === 'Department Head') {
      // Find the employee to check their department
      const employee = employees.find(emp => emp.employee_did === employeeDid);
      // Block deletion if the employee exists and is not in the current user's department.
      // This implicitly prevents deleting employees from other departments.
      if (employee && employee.phong_ban_id !== userDepartment?.phong_ban_id) {
        setSnackbar({ open: true, message: 'Bạn chỉ có thể xóa nhân viên trong phòng ban của mình', severity: 'warning' });
        return;
      }
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      try {
        await apiService.deleteEmployee(employeeDid);
        setSnackbar({ open: true, message: 'Xóa nhân viên thành công', severity: 'success' });
        fetchEmployees(); // Refresh the list
      } catch (error) {
        console.error('Error deleting employee:', error);
        setSnackbar({ open: true, message: 'Lỗi khi xóa nhân viên', severity: 'error' });
      }
    }
  };

  const getDepartmentName = (departmentId) => {
    const department = departments.find(dept => dept.phong_ban_id === departmentId);
    return department ? department.ten_phong_ban : 'Chưa xác định';
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.role_id === roleId);
    return role ? role.ten_vai_tro : 'Chưa xác định';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đang làm việc': return 'success';
      case 'Nghỉ phép': return 'warning';
      case 'Tạm nghỉ': return 'info';
      case 'Đã nghỉ việc': return 'error';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" mb={1}>
              Quản lý Nhân viên
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tạo và quản lý thông tin nhân viên trong tổ chức
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                fetchEmployees();
                fetchDepartments();
                fetchRoles();
              }}
              sx={{ borderRadius: 2, px: 3, py: 1.5 }}
            >
              Làm mới
            </Button>
            {canCreateEmployee && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ borderRadius: 2, px: 3, py: 1.5 }}
              >
                Thêm Nhân viên
              </Button>
            )}
          </Box>
        </Box>

        {/* Employees Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nhân viên</TableCell>
                    <TableCell>Chức vụ</TableCell>
                    <TableCell>Phòng ban</TableCell>
                    <TableCell>Vai trò</TableCell>
                    <TableCell>Trưởng phòng</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày vào làm</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees
                    .filter(employee => {
                      if (userRole === 'Department Head') {
                        return employee.phong_ban_id === userDepartment?.phong_ban_id;
                      }
                      return true;
                    })
                    .map((employee) => (
                    <TableRow key={employee.employee_did} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {employee.employee_did}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {employee.walletAddress}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.chuc_vu}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getDepartmentName(employee.phong_ban_id)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getRoleName(employee.role_id)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {departments.find(dept => dept.phong_ban_id === employee.phong_ban_id)?.truong_phong_did === employee.employee_did ? 'Có' : 'Không'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.trang_thai}
                          size="small"
                          color={getStatusColor(employee.trang_thai)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.ngay_vao_lam ? new Date(employee.ngay_vao_lam).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(employee)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteEmployee(employee.employee_did)}
                            sx={{ color: 'error.main' }}
                          >
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

        {/* Employee Form Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 'bold' }}>
            {editingEmployee ? 'Chỉnh sửa Nhân viên' : 'Tạo Nhân viên Mới'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mã định danh nhân viên (DID)"
                  value={formData.employee_did}
                  onChange={(e) => setFormData({ ...formData, employee_did: e.target.value })}
                  required
                  disabled={!!editingEmployee}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Chức vụ</InputLabel>
                  <Select
                    value={formData.chuc_vu}
                    onChange={(e) => setFormData({ ...formData, chuc_vu: e.target.value })}
                  >
                    <MenuItem key="Intern" value="Intern">Intern</MenuItem>
                    <MenuItem key="Junior Developer" value="Junior Developer">Junior Developer</MenuItem>
                    <MenuItem key="Senior Developer" value="Senior Developer">Senior Developer</MenuItem>
                    <MenuItem key="Tech Lead" value="Tech Lead">Tech Lead</MenuItem>
                    <MenuItem key="Designer" value="Designer">Designer</MenuItem>
                    <MenuItem key="QA Engineer" value="QA Engineer">QA Engineer</MenuItem>
                    <MenuItem key="DevOps Engineer" value="DevOps Engineer">DevOps Engineer</MenuItem>
                    <MenuItem key="Data Engineer" value="Data Engineer">Data Engineer</MenuItem>
                    <MenuItem key="Data Scientist" value="Data Scientist">Data Scientist</MenuItem>
                    <MenuItem key="Product Manager" value="Product Manager">Product Manager</MenuItem>
                    <MenuItem key="Project Manager" value="Project Manager">Project Manager</MenuItem>
                    <MenuItem key="HR Specialist" value="HR Specialist">HR Specialist</MenuItem>
                    <MenuItem key="Finance Analyst" value="Finance Analyst">Finance Analyst</MenuItem>
                    <MenuItem key="Sales Executive" value="Sales Executive">Sales Executive</MenuItem>
                    <MenuItem key="Customer Support" value="Customer Support">Customer Support</MenuItem>
                    <MenuItem key="Marketing Specialist" value="Marketing Specialist">Marketing Specialist</MenuItem>
                    <MenuItem key="Team Lead" value="Team Lead">Team Lead</MenuItem>
                    <MenuItem key="Manager" value="Manager">Manager</MenuItem>
                    <MenuItem key="Director" value="Director">Director</MenuItem>
                    <MenuItem key="VP" value="VP">VP</MenuItem>
                    <MenuItem key="CTO" value="CTO">CTO</MenuItem>
                    <MenuItem key="CFO" value="CFO">CFO</MenuItem>
                    <MenuItem key="COO" value="COO">COO</MenuItem>
                    <MenuItem key="CEO" value="CEO">CEO</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Phòng ban</InputLabel>
                  <Select
                    value={formData.phong_ban_id}
                    onChange={(e) => setFormData({ ...formData, phong_ban_id: e.target.value })}
                    disabled={userRole === 'Department Head' && !editingEmployee}
                  >
                    <MenuItem value="">
                      <em>Chưa xác định</em>
                    </MenuItem>
                    {departments
                      .filter(department => {
                        if (userRole === 'Department Head') {
                          return department.phong_ban_id === userDepartment?.phong_ban_id;
                        }
                        return true;
                      })
                      .map((department) => (
                        <MenuItem key={department.phong_ban_id} value={department.phong_ban_id}>
                          {department.ten_phong_ban}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Vai trò</InputLabel>
                  <Select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>Chưa xác định</em>
                    </MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role.role_id} value={role.role_id}>
                        {role.ten_vai_tro}
                      </MenuItem>
                    ))}
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
                    <MenuItem value="Đang làm việc">Đang làm việc</MenuItem>
                    <MenuItem value="Nghỉ phép">Nghỉ phép</MenuItem>
                    <MenuItem value="Tạm nghỉ">Tạm nghỉ</MenuItem>
                    <MenuItem value="Đã nghỉ việc">Đã nghỉ việc</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Ngày vào làm"
                  value={formData.ngay_vao_lam}
                  onChange={(date) => setFormData({ ...formData, ngay_vao_lam: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa chỉ ví (Wallet Address)"
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={handleCloseDialog} sx={{ borderRadius: 2 }}>
              Hủy
            </Button>
            <Button
              onClick={handleSaveEmployee}
              variant="contained"
              disabled={!formData.employee_did || !formData.chuc_vu || !formData.walletAddress || !formData.phong_ban_id}
              sx={{ borderRadius: 2, px: 3 }}
            >
              {editingEmployee ? 'Cập nhật' : 'Tạo mới'}
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
    </LocalizationProvider>
  );
};

export default EmployeeManagement;
