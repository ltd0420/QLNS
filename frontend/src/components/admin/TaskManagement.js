import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Chip, List, ListItem,
  ListItemText, ListItemSecondaryAction, IconButton, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, LinearProgress,
  Alert, CircularProgress, useTheme, Tabs, Tab, Avatar, Tooltip,
  Paper, Divider, Accordion, AccordionSummary, AccordionDetails,
  FormControl, InputLabel, Select, MenuItem, Fab, Badge, ListItemIcon,
  Autocomplete, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, InputAdornment, Switch, FormControlLabel,
  Checkbox, Snackbar
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityHighIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  ThumbUp as ThumbUpIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Done as DoneIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Psychology as AiIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';
import { v4 as uuidv4 } from 'uuid';

function AdminTaskManagement({ user, employeeData }) {
  const theme = useTheme();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [kpiCriteria, setKpiCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form states for task creation
  const [newTask, setNewTask] = useState({
    ten_cong_viec: '',
    mo_ta: '',
    nguoi_thuc_hien_did: '',
    phong_ban_id: '',
    do_uu_tien: 'Trung bình',
    ngay_bat_dau: new Date(),
    ngay_ket_thuc_du_kien: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    })(),
    gio_uoc_tinh: '',
    lien_ket_kpi_id: '',
    tags: []
  });

  // Form states for task editing
  const [editingTask, setEditingTask] = useState(null);

  const handleEditClick = (task) => {
    setEditingTask({
      ...task,
      ngay_bat_dau: new Date(task.ngay_bat_dau),
      ngay_ket_thuc_du_kien: new Date(task.ngay_ket_thuc_du_kien),
    });
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingTask(null);
  };
  // Filtered employees based on selected department
  const getFilteredEmployees = () => {
    if (!newTask.phong_ban_id) {
      return employees;
    }
    return employees.filter(emp => emp.phong_ban_id === newTask.phong_ban_id);
  };

  // Filtered employees for the edit form
  const getFilteredEmployeesForEdit = () => {
    if (!editingTask || !editingTask.phong_ban_id) {
      return employees;
    }
    return employees.filter(emp => emp.phong_ban_id === editingTask.phong_ban_id);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [tasksRes, employeesRes, departmentsRes, kpiRes] = await Promise.all([
        apiService.getAllTasks(),
        apiService.getAllEmployees(),
        apiService.getAllDepartments(),
        apiService.getAllKpiCriteria()
      ]);

      setTasks(tasksRes || []);
      setEmployees(employeesRes || []);
      setDepartments(departmentsRes || []);
      setKpiCriteria(kpiRes || []);
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      if (!user || !user.employee_did) {
        setSnackbar({ open: true, message: 'Không thể xác định người dùng. Vui lòng đăng nhập lại.', severity: 'error' });
        return;
      }

      const taskData = {
        ...newTask,
        nguoi_giao_did: user.employee_did,
        task_id: uuidv4(),
        trang_thai: 'Chờ bắt đầu',
        tien_do: 0,
        ngay_bat_dau: newTask.ngay_bat_dau ? newTask.ngay_bat_dau.toISOString() : null,
        ngay_ket_thuc_du_kien: newTask.ngay_ket_thuc_du_kien ? newTask.ngay_ket_thuc_du_kien.toISOString() : null
      };

      console.log('Creating task with data:', taskData);
      const response = await apiService.createTask(taskData);
      console.log('Task creation response:', response);
      await fetchData();
      setCreateDialogOpen(false);
      resetNewTaskForm();
      setSnackbar({ open: true, message: 'Tạo công việc thành công!', severity: 'success' });
    } catch (err) {
      console.error('Create task error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tạo công việc. Vui lòng thử lại.';
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const resetNewTaskForm = () => {
    setNewTask({
      ten_cong_viec: '',
      mo_ta: '',
      nguoi_thuc_hien_did: '',
      phong_ban_id: '',
      do_uu_tien: 'Trung bình',
      ngay_bat_dau: new Date(),
      ngay_ket_thuc_du_kien: (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      })(),
      gio_uoc_tinh: '',
      lien_ket_kpi_id: '',
      tags: []
    });
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await apiService.updateTask(taskId, updates);
      await fetchData();
      setSnackbar({ open: true, message: 'Cập nhật công việc thành công!', severity: 'success' });
      // Close any open dialogs
      setTaskDialogOpen(false);
      setEditDialogOpen(false);
      setEditingTask(null);
      return response;
    } catch (err) {
      console.error('Update task error:', err);
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật công việc. Vui lòng thử lại.';
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      // Re-throw the error to be caught by the calling function if needed
      throw err;
    }
  };

  const handleApproveTask = async (taskId, evaluation) => {
    try {
      await apiService.approveTask(taskId, evaluation);
      await fetchData();
    } catch (err) {
      console.error('Approve task error:', err);
      setError('Không thể phê duyệt công việc. Vui lòng thử lại.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      try {
        await apiService.deleteTask(taskId);
        await fetchData();
      } catch (err) {
        console.error('Delete task error:', err);
        setError('Không thể xóa công việc. Vui lòng thử lại.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chờ bắt đầu': return 'default';
      case 'Đang thực hiện': return 'primary';
      case 'Chờ review': return 'warning';
      case 'Hoàn thành': return 'success';
      case 'Tạm dừng': return 'error';
      case 'Hủy bỏ': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Thấp': return 'success';
      case 'Trung bình': return 'warning';
      case 'Cao': return 'error';
      case 'Khẩn cấp': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.trang_thai !== filterStatus) return false;
    if (filterPriority !== 'all' && task.do_uu_tien !== filterPriority) return false;
    if (filterDepartment !== 'all' && task.phong_ban_id !== filterDepartment) return false;
    if (filterEmployee !== 'all' && task.nguoi_thuc_hien_did !== filterEmployee) return false;
    if (searchTerm && !task.ten_cong_viec.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.trang_thai === 'Hoàn thành').length;
    const inProgress = tasks.filter(t => t.trang_thai === 'Đang thực hiện').length;
    const overdue = tasks.filter(t => isOverdue(t.ngay_ket_thuc_du_kien) && t.trang_thai !== 'Hoàn thành').length;
    const pendingReview = tasks.filter(t => t.trang_thai === 'Chờ review').length;

    return { total, completed, inProgress, overdue, pendingReview };
  };

  const stats = getTaskStats();

  const paginatedTasks = filteredTasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Quản lý công việc (Admin)
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Tạo công việc mới
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Tổng công việc
                </Typography>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Đang thực hiện
                </Typography>
                <Typography variant="h3" color="warning.main" fontWeight="bold">
                  {stats.inProgress}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Chờ review
                </Typography>
                <Typography variant="h3" color="info.main" fontWeight="bold">
                  {stats.pendingReview}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Hoàn thành
                </Typography>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {stats.completed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quá hạn
                </Typography>
                <Typography variant="h3" color="error.main" fontWeight="bold">
                  {stats.overdue}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Tìm kiếm công việc"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AssignmentIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filterStatus}
                  label="Trạng thái"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="Chờ bắt đầu">Chờ bắt đầu</MenuItem>
                  <MenuItem value="Đang thực hiện">Đang thực hiện</MenuItem>
                  <MenuItem value="Chờ review">Chờ review</MenuItem>
                  <MenuItem value="Hoàn thành">Hoàn thành</MenuItem>
                  <MenuItem value="Tạm dừng">Tạm dừng</MenuItem>
                  <MenuItem value="Hủy bỏ">Hủy bỏ</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Độ ưu tiên</InputLabel>
                <Select
                  value={filterPriority}
                  label="Độ ưu tiên"
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="Thấp">Thấp</MenuItem>
                  <MenuItem value="Trung bình">Trung bình</MenuItem>
                  <MenuItem value="Cao">Cao</MenuItem>
                  <MenuItem value="Khẩn cấp">Khẩn cấp</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Phòng ban</InputLabel>
                <Select
                  value={filterDepartment}
                  label="Phòng ban"
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.phong_ban_id} value={dept.phong_ban_id}>
                      {dept.ten_phong_ban}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Nhân viên</InputLabel>
                <Select
                  value={filterEmployee}
                  label="Nhân viên"
                  onChange={(e) => setFilterEmployee(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.employee_did} value={emp.employee_did}>
                      {emp.employee_did}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                size="small"
              >
                Làm mới
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tasks Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên công việc</TableCell>
                  <TableCell>Người thực hiện</TableCell>
                  <TableCell>Phòng ban</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Độ ưu tiên</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Tiến độ</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTasks.map((task) => (
                  <TableRow key={task.task_id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {task.ten_cong_viec}
                        </Typography>
                        {task.tags && task.tags.length > 0 && (
                          <Box mt={0.5}>
                            {task.tags.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {task.nguoi_thuc_hien_did}
                    </TableCell>
                    <TableCell>
                      {departments.find(d => d.phong_ban_id === task.phong_ban_id)?.ten_phong_ban || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.trang_thai}
                        color={getStatusColor(task.trang_thai)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.do_uu_tien}
                        color={getPriorityColor(task.do_uu_tien)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(task.ngay_ket_thuc_du_kien)}
                      </Typography>
                      {isOverdue(task.ngay_ket_thuc_du_kien) && task.trang_thai !== 'Hoàn thành' && (
                        <Typography variant="caption" color="error">
                          Quá hạn
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={task.tien_do || 0}
                          sx={{ flexGrow: 1, maxWidth: 60 }}
                        />
                        <Typography variant="body2">
                          {task.tien_do || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedTask(task);
                              setTaskDialogOpen(true);
                            }}
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(task)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {task.trang_thai === 'Chờ review' && (
                          <Tooltip title="Phê duyệt">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApproveTask(task.task_id, {})}
                            >
                              <ThumbUpIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTask(task.task_id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredTasks.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} của ${count}`
            }
          />
        </Card>

        {/* Create Task Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Tạo công việc mới</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tên công việc"
                    value={newTask.ten_cong_viec}
                    onChange={(e) => setNewTask({...newTask, ten_cong_viec: e.target.value})}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Mô tả"
                    value={newTask.mo_ta}
                    onChange={(e) => setNewTask({...newTask, mo_ta: e.target.value})}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Người thực hiện</InputLabel>
                    <Select
                      value={newTask.nguoi_thuc_hien_did}
                      label="Người thực hiện"
                      onChange={(e) => setNewTask({...newTask, nguoi_thuc_hien_did: e.target.value})}
                      required
                      disabled={!newTask.phong_ban_id} // Disable if no department is selected
                    >
                      {getFilteredEmployees().map((emp) => (
                        <MenuItem key={emp.employee_did} value={emp.employee_did}>
                          {emp.employee_did}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Phòng ban</InputLabel>
                    <Select
                      value={newTask.phong_ban_id}
                      label="Phòng ban"
                      // Reset employee when department changes
                      onChange={(e) => setNewTask({...newTask, phong_ban_id: e.target.value, nguoi_thuc_hien_did: ''})}
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept.phong_ban_id} value={dept.phong_ban_id}>
                          {dept.ten_phong_ban}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Độ ưu tiên</InputLabel>
                    <Select
                      value={newTask.do_uu_tien}
                      label="Độ ưu tiên"
                      onChange={(e) => setNewTask({...newTask, do_uu_tien: e.target.value})}
                    >
                      <MenuItem value="Thấp">Thấp</MenuItem>
                      <MenuItem value="Trung bình">Trung bình</MenuItem>
                      <MenuItem value="Cao">Cao</MenuItem>
                      <MenuItem value="Khẩn cấp">Khẩn cấp</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Giờ ước tính"
                    value={newTask.gio_uoc_tinh}
                    onChange={(e) => setNewTask({...newTask, gio_uoc_tinh: e.target.value})}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Ngày bắt đầu"
                    value={newTask.ngay_bat_dau.toISOString().split('T')[0]}
                    onChange={(e) => setNewTask({...newTask, ngay_bat_dau: new Date(e.target.value)})}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Deadline"
                    value={newTask.ngay_ket_thuc_du_kien.toISOString().split('T')[0]}
                    onChange={(e) => setNewTask({...newTask, ngay_ket_thuc_du_kien: new Date(e.target.value)})}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Liên kết KPI</InputLabel>
                    <Select
                      value={newTask.lien_ket_kpi_id}
                      label="Liên kết KPI"
                      onChange={(e) => setNewTask({...newTask, lien_ket_kpi_id: e.target.value})}
                    >
                      <MenuItem value="">Không liên kết</MenuItem>
                      {kpiCriteria.map((kpi) => (
                        <MenuItem key={kpi.kpi_id} value={kpi.kpi_id}>
                          {kpi.ten_kpi}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={[]}
                    value={newTask.tags}
                    onChange={(event, newValue) => setNewTask({...newTask, tags: newValue})}
                    freeSolo
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tags"
                        placeholder="Thêm tags..."
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
            <Button
              variant="contained"
              onClick={handleCreateTask}
              disabled={!newTask.ten_cong_viec || !newTask.nguoi_thuc_hien_did}
            >
              Tạo công việc
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Task Dialog */}
        {editingTask && (
          <Dialog
            open={editDialogOpen}
            onClose={handleEditDialogClose}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Chỉnh sửa công việc</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tên công việc"
                      value={editingTask.ten_cong_viec}
                      onChange={(e) => setEditingTask({ ...editingTask, ten_cong_viec: e.target.value })}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Mô tả"
                      value={editingTask.mo_ta}
                      onChange={(e) => setEditingTask({ ...editingTask, mo_ta: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Phòng ban</InputLabel>
                      <Select
                        value={editingTask.phong_ban_id}
                        label="Phòng ban"
                        onChange={(e) => setEditingTask({ ...editingTask, phong_ban_id: e.target.value, nguoi_thuc_hien_did: '' })}
                      >
                        {departments.map((dept) => (
                          <MenuItem key={dept.phong_ban_id} value={dept.phong_ban_id}>
                            {dept.ten_phong_ban}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Người thực hiện</InputLabel>
                      <Select
                        value={editingTask.nguoi_thuc_hien_did}
                        label="Người thực hiện"
                        onChange={(e) => setEditingTask({ ...editingTask, nguoi_thuc_hien_did: e.target.value })}
                        required
                        disabled={!editingTask.phong_ban_id}
                      >
                        {getFilteredEmployeesForEdit().map((emp) => (
                          <MenuItem key={emp.employee_did} value={emp.employee_did}>
                            {emp.employee_did}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Độ ưu tiên</InputLabel>
                      <Select
                        value={editingTask.do_uu_tien}
                        label="Độ ưu tiên"
                        onChange={(e) => setEditingTask({ ...editingTask, do_uu_tien: e.target.value })}
                      >
                        <MenuItem value="Thấp">Thấp</MenuItem>
                        <MenuItem value="Trung bình">Trung bình</MenuItem>
                        <MenuItem value="Cao">Cao</MenuItem>
                        <MenuItem value="Khẩn cấp">Khẩn cấp</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                        value={editingTask.trang_thai}
                        label="Trạng thái"
                        onChange={(e) => setEditingTask({ ...editingTask, trang_thai: e.target.value })}
                      >
                        <MenuItem value="Chờ bắt đầu">Chờ bắt đầu</MenuItem>
                        <MenuItem value="Đang thực hiện">Đang thực hiện</MenuItem>
                        <MenuItem value="Chờ review">Chờ review</MenuItem>
                        <MenuItem value="Hoàn thành">Hoàn thành</MenuItem>
                        <MenuItem value="Tạm dừng">Tạm dừng</MenuItem>
                        <MenuItem value="Hủy bỏ">Hủy bỏ</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Ngày bắt đầu"
                      value={editingTask.ngay_bat_dau.toISOString().split('T')[0]}
                      onChange={(e) => setEditingTask({ ...editingTask, ngay_bat_dau: new Date(e.target.value) })}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Deadline"
                      value={editingTask.ngay_ket_thuc_du_kien.toISOString().split('T')[0]}
                      onChange={(e) => setEditingTask({ ...editingTask, ngay_ket_thuc_du_kien: new Date(e.target.value) })}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditDialogClose}>Hủy</Button>
              <Button
                variant="contained"
                onClick={() => handleUpdateTask(editingTask.task_id, editingTask)}
                disabled={!editingTask.ten_cong_viec || !editingTask.nguoi_thuc_hien_did}
              >
                Lưu thay đổi
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Task Detail Dialog */}
        <Dialog
          open={taskDialogOpen}
          onClose={() => setTaskDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <AssignmentIcon />
              <Typography variant="h6">
                {selectedTask?.ten_cong_viec}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedTask && (
              <Box>
                {/* Status and Priority */}
                <Box display="flex" gap={1} mb={2}>
                  <Chip
                    label={selectedTask.trang_thai}
                    color={getStatusColor(selectedTask.trang_thai)}
                  />
                  <Chip
                    label={selectedTask.do_uu_tien}
                    color={getPriorityColor(selectedTask.do_uu_tien)}
                    icon={<PriorityHighIcon />}
                  />
                  {isOverdue(selectedTask.ngay_ket_thuc_du_kien) && (
                    <Chip
                      label="Quá hạn"
                      color="error"
                      icon={<WarningIcon />}
                    />
                  )}
                </Box>

                {/* Progress */}
                <Box mb={3}>
                  <Typography variant="body2" gutterBottom>
                    Tiến độ: {selectedTask.tien_do || 0}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={selectedTask.tien_do || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {/* Description */}
                <Typography variant="h6" gutterBottom>
                  Mô tả công việc
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedTask.mo_ta || 'Không có mô tả'}
                </Typography>

                {/* Task Details */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Người giao việc
                    </Typography>
                    <Typography variant="body1">
                      {selectedTask.nguoi_giao_did}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Người thực hiện
                    </Typography>
                    <Typography variant="body1">
                      {selectedTask.nguoi_thuc_hien_did}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Phòng ban
                    </Typography>
                    <Typography variant="body1">
                      {departments.find(d => d.phong_ban_id === selectedTask.phong_ban_id)?.ten_phong_ban || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Giờ ước tính
                    </Typography>
                    <Typography variant="body1">
                      {selectedTask.gio_uoc_tinh || 'N/A'} giờ
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày bắt đầu
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedTask.ngay_bat_dau)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Deadline
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedTask.ngay_ket_thuc_du_kien)}
                    </Typography>
                  </Grid>
                </Grid>

                {/* KPI Link */}
                {selectedTask.lien_ket_kpi_id && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Liên kết KPI
                    </Typography>
                    <Typography variant="body1">
                      {kpiCriteria.find(k => k.kpi_id === selectedTask.lien_ket_kpi_id)?.ten_kpi || 'N/A'}
                    </Typography>
                  </Box>
                )}

                {/* AI Insights */}
                {selectedTask.ai_insights && (
                  <Accordion sx={{ mb: 3 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">AI Insights</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Mức độ rủi ro: {selectedTask.ai_insights.risk_level}
                        </Typography>
                        {selectedTask.ai_insights.predicted_completion_date && (
                          <Typography variant="body2" gutterBottom>
                            Dự kiến hoàn thành: {formatDate(selectedTask.ai_insights.predicted_completion_date)}
                          </Typography>
                        )}
                        {selectedTask.ai_insights.recommendations && selectedTask.ai_insights.recommendations.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Khuyến nghị:
                            </Typography>
                            <List dense>
                              {selectedTask.ai_insights.recommendations.map((rec, index) => (
                                <ListItem key={index}>
                                  <ListItemText primary={rec} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* File Attachments */}
                {selectedTask.file_dinh_kem && selectedTask.file_dinh_kem.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      File đính kèm
                    </Typography>
                    <List dense>
                      {selectedTask.file_dinh_kem.map((file, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <DescriptionIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.file_name}
                            secondary={`Upload: ${formatDate(file.uploaded_at)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Comments */}
                {selectedTask.nhan_xet && selectedTask.nhan_xet.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Nhận xét
                    </Typography>
                    <List dense>
                      {selectedTask.nhan_xet.map((comment, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={comment.noi_dung}
                            secondary={`${comment.nguoi_nhan_xet_did} - ${formatDate(comment.timestamp)}`}
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
            <Button onClick={() => setTaskDialogOpen(false)}>Đóng</Button>
            {selectedTask?.trang_thai === 'Chờ review' && (
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  handleApproveTask(selectedTask.task_id, {});
                  setTaskDialogOpen(false);
                }}
              >
                Phê duyệt
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}

export default AdminTaskManagement;
