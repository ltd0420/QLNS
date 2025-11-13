import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Chip, List, ListItem,
  ListItemText, ListItemSecondaryAction, IconButton, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, LinearProgress,
  Alert, CircularProgress, useTheme, Tabs, Tab, Avatar, Tooltip,
  Paper, Divider, Accordion, AccordionSummary, AccordionDetails,
  FormControl, InputLabel, Select, MenuItem, Fab, Badge, ListItemIcon
} from '@mui/material';
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
  Done as DoneIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';
import { useAuth } from '../../AuthContext';

function TaskManagement({ user, employeeData }) {
  const theme = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [progressValue, setProgressValue] = useState(0);
  const [progressNote, setProgressNote] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getTasksByEmployee(user.employee_did);
      setTasks(response || []);
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setError('Không thể tải danh sách công việc. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  const handleUpdateProgress = (task) => {
    setSelectedTask(task);
    setProgressValue(task.tien_do || 0);
    setProgressNote('');
    setProgressDialogOpen(true);
  };

  const handleProgressSubmit = async () => {
    try {
      await apiService.updateTaskProgress(selectedTask.task_id, {
        tien_do: progressValue,
        ghi_chu: progressNote
      });
      await fetchTasks();
      setProgressDialogOpen(false);
      setSelectedTask(null);
    } catch (err) {
      console.error('Update progress error:', err);
      setError('Không thể cập nhật tiến độ. Vui lòng thử lại.');
    }
  };

  const handleMarkComplete = async (task) => {
    try {
      await apiService.updateTaskProgress(task.task_id, {
        tien_do: 100,
        ghi_chu: 'Đã hoàn thành công việc'
      });
      await fetchTasks();
    } catch (err) {
      console.error('Mark complete error:', err);
      setError('Không thể đánh dấu hoàn thành. Vui lòng thử lại.');
    }
  };

  const handleFileUpload = async (event, taskId) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);

      // Note: This would need backend implementation for file upload
      // For now, we'll just show a placeholder
      console.log('File upload not implemented yet:', file.name);
      setError('Tính năng upload file đang được phát triển.');
    } catch (err) {
      console.error('File upload error:', err);
      setError('Không thể upload file. Vui lòng thử lại.');
    } finally {
      setUploading(false);
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

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Cao':
      case 'Khẩn cấp':
        return <PriorityHighIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date() && selectedTask?.trang_thai !== 'Hoàn thành';
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.trang_thai !== filterStatus) return false;
    if (filterPriority !== 'all' && task.do_uu_tien !== filterPriority) return false;
    return true;
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.trang_thai === 'Hoàn thành').length;
    const inProgress = tasks.filter(t => t.trang_thai === 'Đang thực hiện').length;
    const overdue = tasks.filter(t => isOverdue(t.ngay_ket_thuc_du_kien)).length;

    return { total, completed, inProgress, overdue };
  };

  const stats = getTaskStats();

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
        Quản lý công việc
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
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

        <Grid item xs={12} md={3}>
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

        <Grid item xs={12} md={3}>
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

        <Grid item xs={12} md={3}>
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
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
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

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTasks}
            size="small"
          >
            Làm mới
          </Button>
        </Box>
      </Paper>

      {/* Tasks List */}
      <Card>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <Box textAlign="center" py={4}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {filterStatus === 'all' && filterPriority === 'all'
                  ? 'Không có công việc nào'
                  : 'Không có công việc phù hợp với bộ lọc'}
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredTasks
                .sort((a, b) => {
                  // Sort by priority first, then by deadline
                  const priorityOrder = { 'Khẩn cấp': 4, 'Cao': 3, 'Trung bình': 2, 'Thấp': 1 };
                  const priorityDiff = priorityOrder[b.do_uu_tien] - priorityOrder[a.do_uu_tien];
                  if (priorityDiff !== 0) return priorityDiff;

                  // Then sort by deadline (closest first)
                  return new Date(a.ngay_ket_thuc_du_kien) - new Date(b.ngay_ket_thuc_du_kien);
                })
                .map((task, index) => (
                <React.Fragment key={task.task_id}>
                  <ListItem
                    button
                    onClick={() => handleTaskClick(task)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      border: isOverdue(task.ngay_ket_thuc_du_kien) ? '1px solid red' : 'none'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="body1" fontWeight="medium">
                            {task.ten_cong_viec}
                          </Typography>
                          <Chip
                            label={task.trang_thai}
                            color={getStatusColor(task.trang_thai)}
                            size="small"
                          />
                          <Chip
                            label={task.do_uu_tien}
                            color={getPriorityColor(task.do_uu_tien)}
                            size="small"
                            icon={getPriorityIcon(task.do_uu_tien)}
                          />
                          {isOverdue(task.ngay_ket_thuc_du_kien) && (
                            <Chip
                              label="Quá hạn"
                              color="error"
                              size="small"
                              icon={<WarningIcon />}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Deadline: {formatDate(task.ngay_ket_thuc_du_kien)}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={1}>
                            <Typography variant="body2" color="text.secondary">
                              Tiến độ:
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={task.tien_do || 0}
                              sx={{ flexGrow: 1, maxWidth: 100 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {task.tien_do || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1}>
                        {task.trang_thai !== 'Hoàn thành' && task.trang_thai !== 'Chờ review' && (
                          <Tooltip title="Cập nhật tiến độ">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateProgress(task);
                              }}
                              size="small"
                            >
                              <TimelineIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {task.trang_thai === 'Đang thực hiện' && (
                          <Tooltip title="Đánh dấu hoàn thành">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkComplete(task);
                              }}
                              size="small"
                              color="success"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredTasks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

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
                  icon={getPriorityIcon(selectedTask.do_uu_tien)}
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

              {/* Dates */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
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
          {selectedTask?.trang_thai === 'Đang thực hiện' && (
            <Button
              variant="contained"
              onClick={() => {
                handleUpdateProgress(selectedTask);
                setTaskDialogOpen(false);
              }}
            >
              Cập nhật tiến độ
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Progress Update Dialog */}
      <Dialog
        open={progressDialogOpen}
        onClose={() => setProgressDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cập nhật tiến độ</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Công việc: {selectedTask?.ten_cong_viec}
            </Typography>

            <Box sx={{ my: 3 }}>
              <Typography variant="body2" gutterBottom>
                Tiến độ hiện tại: {progressValue}%
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Tiến độ (%)"
                value={progressValue}
                onChange={(e) => setProgressValue(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                inputProps={{ min: 0, max: 100 }}
                sx={{ mb: 2 }}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi chú"
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              placeholder="Thêm ghi chú về tiến độ công việc..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleProgressSubmit}
            disabled={uploading}
          >
            {uploading ? <CircularProgress size={20} /> : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TaskManagement;
