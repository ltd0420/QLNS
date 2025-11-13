import React, { useState, useEffect } from 'react';
import {
  Box, Container, Grid, Paper, Typography, Avatar, Chip, Card, CardContent,
  List, ListItem, ListItemIcon, ListItemText, Divider, Badge, IconButton,
  useTheme, useMediaQuery, Drawer, AppBar, Toolbar, CssBaseline,
  Fab, Tooltip, CircularProgress, Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  QrCode as QrCodeIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Feedback as FeedbackIcon,
  EmojiEvents as RankingIcon,
  AccountBalanceWallet as SalaryIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  ChevronLeft as ChevronLeftIcon,
  AccountBalance as WalletIcon,
  Business as DepartmentIcon,
  Work as RoleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  PrivacyTip as ConsentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import apiService from '../services/apiService';

// Import dashboard components
import PersonalProfile from './dashboard/PersonalProfile';
import QrAuthentication from './dashboard/QrAuthentication';
import AttendanceHistory from './dashboard/AttendanceHistory';
import KpiEvaluation from './dashboard/KpiEvaluation';
import CustomerFeedback from './dashboard/CustomerFeedback';
import AiRanking from './dashboard/AiRanking';
import SalaryBonus from './dashboard/SalaryBonus';
import ConsentManagement from './dashboard/ConsentManagement';
import NotificationsLogs from './dashboard/NotificationsLogs';
import TaskManagement from './dashboard/TaskManagement';
import DepartmentInfo from './dashboard/DepartmentInfo';

const drawerWidth = 280;



const menuItems = [
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: PersonIcon, component: PersonalProfile },
  { id: 'department', label: 'Thông tin phòng ban', icon: DepartmentIcon, component: DepartmentInfo },
  { id: 'tasks', label: 'Công việc được giao', icon: AssessmentIcon, component: TaskManagement },
  { id: 'qr', label: 'QR Xác thực', icon: QrCodeIcon, component: QrAuthentication },
  { id: 'attendance', label: 'Lịch sử chấm công', icon: ScheduleIcon, component: AttendanceHistory },
  { id: 'kpi', label: 'Đánh giá KPI', icon: AssessmentIcon, component: KpiEvaluation },
  { id: 'feedback', label: 'Phản hồi khách hàng', icon: FeedbackIcon, component: CustomerFeedback },
  { id: 'ranking', label: 'Xếp hạng AI', icon: RankingIcon, component: AiRanking },
  { id: 'salary', label: 'Lương & Thưởng', icon: SalaryIcon, component: SalaryBonus },
  { id: 'consent', label: 'Quản lý Đồng ý', icon: ConsentIcon, component: ConsentManagement },
  { id: 'notifications', label: 'Thông báo & Nhật ký', icon: NotificationsIcon, component: NotificationsLogs },
];

// Department Head specific menu items
const departmentHeadMenuItems = [
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: PersonIcon, component: PersonalProfile },
  { id: 'department', label: 'Quản lý phòng ban', icon: DepartmentIcon, component: DepartmentInfo },
  { id: 'tasks', label: 'Công việc được giao', icon: AssessmentIcon, component: TaskManagement },
  { id: 'qr', label: 'QR Xác thực', icon: QrCodeIcon, component: QrAuthentication },
  { id: 'attendance', label: 'Lịch sử chấm công', icon: ScheduleIcon, component: AttendanceHistory },
  { id: 'kpi', label: 'Đánh giá KPI', icon: AssessmentIcon, component: KpiEvaluation },
  { id: 'feedback', label: 'Phản hồi khách hàng', icon: FeedbackIcon, component: CustomerFeedback },
  { id: 'ranking', label: 'Xếp hạng AI', icon: RankingIcon, component: AiRanking },
  { id: 'salary', label: 'Lương & Thưởng', icon: SalaryIcon, component: SalaryBonus },
  { id: 'consent', label: 'Quản lý Đồng ý', icon: ConsentIcon, component: ConsentManagement },
  { id: 'notifications', label: 'Thông báo & Nhật ký', icon: NotificationsIcon, component: NotificationsLogs },
];

function EmployeeDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employeeData, setEmployeeData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Determine menu items based on user role
  const isDepartmentHead = user && user.role_id === '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7d';
  const currentMenuItems = isDepartmentHead ? departmentHeadMenuItems : menuItems;

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      // Check authentication
      if (!authService.isAuthenticated()) {
        navigate('/');
        return;
      }

      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      // Fetch employee profile
      const profileResponse = await apiService.getEmployeeProfile(currentUser.employee_did);
      setEmployeeData(profileResponse);

      // Fetch notifications
      const notificationsResponse = await apiService.getNotifications(currentUser.employee_did);
      setNotifications(notificationsResponse || []);

    } catch (err) {
      console.error('Dashboard initialization error:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  
  // ... (phần còn lại của file giữ nguyên)
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      authService.logout();
      navigate('/');
    }
  };

  const getNotificationIcon = (eventType) => {
    switch (eventType) {
      case 'login':
        return <CheckCircleIcon color="success" />;
      case 'logout':
        return <InfoIcon color="info" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="primary" />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            }}
          >
            <DashboardIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nhân viên
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <WalletIcon fontSize="small" color="primary" />
            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
              {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <RoleIcon fontSize="small" color="primary" />
            <Chip
              label={user.chuc_vu || 'Nhân viên'}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>
          {employeeData?.phong_ban_id && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <DepartmentIcon fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                {employeeData.phong_ban_id.ten_phong_ban || employeeData.phong_ban_id}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Navigation Menu */}
      <List sx={{ flex: 1, pt: 1 }}>
        {currentMenuItems.map((item) => (
          <ListItem
            button
            key={item.id}
            selected={activeSection === item.id}
            onClick={() => handleSectionChange(item.id)}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main + '20',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '30',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <item.icon color={activeSection === item.id ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: activeSection === item.id ? 600 : 400,
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Notifications Preview */}
      {notifications.length > 0 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            Thông báo gần đây
          </Typography>
          <List dense>
            {notifications.slice(0, 3).map((notification) => (
              <ListItem key={notification._id} sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  {getNotificationIcon(notification.event_type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.message}
                  primaryTypographyProps={{
                    fontSize: '0.8rem',
                    noWrap: true,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Logout Button */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <IconButton
          onClick={handleLogout}
          sx={{
            width: '100%',
            borderRadius: 1,
            py: 1,
            backgroundColor: theme.palette.error.main + '10',
            '&:hover': {
              backgroundColor: theme.palette.error.main + '20',
            },
          }}
        >
          <LogoutIcon sx={{ mr: 1 }} />
          <Typography variant="body2">Đăng xuất</Typography>
        </IconButton>
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Đang tải dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          gap={2}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
          <IconButton onClick={initializeDashboard} color="primary">
            <Typography>Thử lại</Typography>
          </IconButton>
        </Box>
      </Container>
    );
  }

  const ActiveComponent = currentMenuItems.find(item => item.id === activeSection)?.component;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* App Bar for Mobile */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {currentMenuItems.find(item => item.id === activeSection)?.label}
            </Typography>
            {unreadNotifications > 0 && (
              <Box sx={{ flexGrow: 1 }} />
            )}
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationsIcon />
            </Badge>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: isMobile ? '64px' : 0,
        }}
      >
        <Container maxWidth="xl">
          {ActiveComponent && (
            <ActiveComponent
              user={user}
              employeeData={employeeData}
              onDataUpdate={initializeDashboard}
            />
          )}
        </Container>
      </Box>

      {/* Floating Action Button for Notifications */}
      {!isMobile && unreadNotifications > 0 && (
        <Tooltip title={`${unreadNotifications} thông báo chưa đọc`}>
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
            onClick={() => setActiveSection('notifications')}
          >
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationsIcon />
            </Badge>
          </Fab>
        </Tooltip>
      )}
    </Box>
  );
}

export default EmployeeDashboard;
