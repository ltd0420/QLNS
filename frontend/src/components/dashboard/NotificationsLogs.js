
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Chip, List, ListItem,
  ListItemIcon, ListItemText, ListItemSecondaryAction, IconButton,
  Alert, CircularProgress, useTheme, useMediaQuery, Tabs, Tab,
  Badge, Divider, Avatar, Tooltip, Button
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Done as DoneIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';

function NotificationsLogs({ user, employeeData, onDataUpdate }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all'); // all, unread, read

  useEffect(() => {
    fetchData();

    // Initialize Socket.IO connection for real-time notifications
    if (user?.employee_did) {
      // Delay socket initialization to avoid connection issues
      const timer = setTimeout(() => {
        apiService.initSocket(user.employee_did);

        // Listen for real-time notifications
        const handleNotification = (notification) => {
          setNotifications(prev => [notification, ...prev]);
        };

        apiService.onNotification(handleNotification);

        // Cleanup on unmount
        return () => {
          apiService.offNotification(handleNotification);
          apiService.disconnectSocket();
        };
      }, 1000);

      return () => {
        clearTimeout(timer);
        apiService.disconnectSocket();
      };
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch notifications (event logs)
      const { employee_did } = user;
      const notificationsResponse = await apiService.getNotifications(employee_did);
      setNotifications(notificationsResponse || []);

      // Fetch audit logs
      const auditResponse = await apiService.getAuditLogs(employee_did);
      setAuditLogs(auditResponse.data || []);
    } catch (err) {
      console.error('Fetch notifications/logs error:', err);
      setError('Không thể tải dữ liệu thông báo và nhật ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Mark as read error:', err);
      setError('Không thể đánh dấu đã đọc. Vui lòng thử lại.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(notif => apiService.markNotificationAsRead(notif._id))
      );
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (err) {
      console.error('Mark all as read error:', err);
      setError('Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.');
    }
  };

  const handleDeleteReadNotifications = async () => {
    try {
      await apiService.deleteReadNotifications(user.employee_did);
      setNotifications(prev => prev.filter(notif => !notif.is_read));

      // Update parent component's notifications state if onDataUpdate is provided
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (err) {
      console.error('Delete read notifications error:', err);
      setError('Không thể xóa thông báo đã đọc. Vui lòng thử lại.');
    }
  };

  const getNotificationIcon = (eventType) => {
    switch (eventType) {
      case 'login':
        return <CheckCircleIcon color="success" />;
      case 'logout':
        return <InfoIcon color="info" />;
      case 'checkin':
        return <CheckCircleIcon color="primary" />;
      case 'checkout':
        return <ScheduleIcon color="secondary" />;
      case 'kpi_update':
        return <InfoIcon color="warning" />;
      case 'salary_update':
        return <InfoIcon color="success" />;
      case 'security_alert':
        return <SecurityIcon color="error" />;
      case 'system_update':
        return <InfoIcon color="info" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="primary" />;
    }
  };

  const getNotificationColor = (eventType) => {
    switch (eventType) {
      case 'login':
      case 'logout':
      case 'checkin':
      case 'checkout':
        return 'primary';
      case 'kpi_update':
      case 'salary_update':
        return 'success';
      case 'security_alert':
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'system_update':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAuditLogIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return <CheckCircleIcon color="success" />;
      case 'UPDATE':
        return <InfoIcon color="primary" />;
      case 'DELETE':
        return <ErrorIcon color="error" />;
      case 'LOGIN':
        return <CheckCircleIcon color="success" />;
      case 'LOGOUT':
        return <InfoIcon color="info" />;
      case 'VIEW':
        return <InfoIcon color="default" />;
      default:
        return <InfoIcon color="default" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return `${Math.floor(diffMs / (1000 * 60))} phút trước`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} giờ trước`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filterStatus === 'unread') return !notification.is_read;
    if (filterStatus === 'read') return notification.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
        Thông báo & Nhật ký
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Thông báo chưa đọc
              </Typography>
              <Typography variant="h3" color="primary" fontWeight="bold">
                {unreadCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Cần xem ngay
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tổng thông báo
              </Typography>
              <Typography variant="h3" color="secondary" fontWeight="bold">
                {notifications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tất cả thời gian
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Nhật ký hoạt động
              </Typography>
              <Typography variant="h3" color="success.main" fontWeight="bold">
                {auditLogs.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Lịch sử thao tác
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab
              label={
                <Badge badgeContent={unreadCount} color="error">
                  <Box display="flex" alignItems="center" gap={1}>
                    <NotificationsIcon />
                    <Typography>Thông báo</Typography>
                  </Box>
                </Badge>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <SecurityIcon />
                  <Typography>Nhật ký</Typography>
                </Box>
              }
            />
          </Tabs>

          {/* Notifications Tab */}
          {activeTab === 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" gap={1}>
                  <Button
                    variant={filterStatus === 'all' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setFilterStatus('all')}
                  >
                    Tất cả
                  </Button>
                  <Button
                    variant={filterStatus === 'unread' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setFilterStatus('unread')}
                  >
                    Chưa đọc ({unreadCount})
                  </Button>
                  <Button
                    variant={filterStatus === 'read' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setFilterStatus('read')}
                  >
                    Đã đọc
                  </Button>
                </Box>

                <Box display="flex" gap={1}>
                  {unreadCount > 0 && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleMarkAllAsRead}
                      startIcon={<DoneIcon />}
                    >
                      Đánh dấu tất cả đã đọc
                    </Button>
                  )}
                  {notifications.some(n => n.is_read) && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleDeleteReadNotifications}
                      startIcon={<ClearIcon />}
                      color="error"
                    >
                      Xóa thông báo đã đọc
                    </Button>
                  )}
                  <IconButton onClick={fetchData} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Box>
              </Box>

              {filteredNotifications.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {filterStatus === 'unread' ? 'Không có thông báo chưa đọc' :
                     filterStatus === 'read' ? 'Không có thông báo đã đọc' :
                     'Không có thông báo nào'}
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredNotifications
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((notification, index) => (
                    <React.Fragment key={notification._id}>
                      <ListItem
                        sx={{
                          backgroundColor: !notification.is_read ? 'action.hover' : 'transparent',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: getNotificationColor(notification.event_type) + '.light' }}>
                            {getNotificationIcon(notification.event_type)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight={!notification.is_read ? 'bold' : 'normal'}>
                                {notification.message}
                              </Typography>
                              {!notification.is_read && (
                                <Chip label="Mới" color="error" size="small" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box component="span">
                              <Typography variant="body2" color="text.secondary" component="span">
                                {formatTimestamp(notification.createdAt)}
                              </Typography>
                              {notification.details && (
                                <>
                                  <br />
                                  <Typography variant="body2" color="text.secondary" component="span" sx={{ mt: 0.5 }}>
                                    {notification.details}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          {!notification.is_read && (
                            <Tooltip title="Đánh dấu đã đọc">
                              <IconButton
                                edge="end"
                                onClick={() => handleMarkAsRead(notification._id)}
                                size="small"
                              >
                                <DoneIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < filteredNotifications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 1 && (
            <Box>
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <IconButton onClick={fetchData} size="small">
                  <RefreshIcon />
                </IconButton>
              </Box>

              {auditLogs.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Không có nhật ký hoạt động
                  </Typography>
                </Box>
              ) : (
                <List>
                  {auditLogs
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((log, index) => (
                    <React.Fragment key={log._id}>
                      <ListItem sx={{ borderRadius: 1, mb: 1 }}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'grey.100' }}>
                            {getAuditLogIcon(log.action)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="medium">
                                {log.action}
                              </Typography>
                              <Chip
                                label={log.resource_type}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {log.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatTimestamp(log.timestamp)} • IP: {log.ip_address}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < auditLogs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default NotificationsLogs;
