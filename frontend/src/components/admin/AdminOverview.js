import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip,
  LinearProgress, IconButton, Tooltip, Divider, Paper, Button
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as RankingIcon,
  AccountBalanceWallet as WalletIcon,
  Feedback as FeedbackIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiService from '../../services/apiService';
import { useNavigate } from 'react-router-dom';

const AdminOverview = ({ user, onDataUpdate }) => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    activeTasks: 0,
    completedTasks: 0,
    pendingKpiEvaluations: 0,
    totalFeedback: 0,
    smartContractTransactions: 0,
    systemHealth: 95
  });

  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const useChartReady = (height) => {
    const containerRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      const element = containerRef.current;
      if (!element) return;

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        const { width, height: observedHeight } = entry.contentRect;
        setIsReady(width > 0 && observedHeight > 0);
      });

      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    const ChartWrapper = ({ children }) => (
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height,
          minHeight: height,
          position: 'relative'
        }}
      >
        {isReady ? (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <Typography variant="body2" color="text.secondary">
              Đang chuẩn bị biểu đồ...
            </Typography>
          </Box>
        )}
      </Box>
    );

    return ChartWrapper;
  };

  const LineChartContainer = useChartReady(280);
  const PieChartContainer = useChartReady(260);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch data from multiple endpoints
      const [employeesRes, departmentsRes, tasksRes, kpiEvaluationsRes, feedbackRes, smartContractLogsRes] = await Promise.allSettled([
        apiService.getEmployees(),
        apiService.getDepartments(),
        apiService.getAllTasks(),
        apiService.get('/danh-gia-kpi'), // Assuming this returns all KPIs
        apiService.get('/phan-hoi-khach-hang'), // Assuming this returns all feedback
        apiService.get('/smart-contract-logs'), // Assuming this returns all logs
      ]);

      // Process employees data
      const employees = employeesRes.status === 'fulfilled' ? employeesRes.value : [];
      const totalEmployees = employees.length;

      // Process departments data
      const departments = departmentsRes.status === 'fulfilled' ? departmentsRes.value : [];
      const totalDepartments = departments.length;

      // Process tasks data
      const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value : [];
      const activeTasks = tasks.filter(task =>
        task.trang_thai === 'Đang thực hiện' || task.trang_thai === 'Chờ bắt đầu'
      ).length;
      const completedTasks = tasks.filter(task => task.trang_thai === 'Hoàn thành').length;

      // Process KPI evaluations data
      const kpiEvaluationsResponse = kpiEvaluationsRes.status === 'fulfilled' ? kpiEvaluationsRes.value?.data : null;
      const kpiEvaluationsData = kpiEvaluationsResponse?.data ?? kpiEvaluationsResponse ?? [];
      const kpiEvaluations = Array.isArray(kpiEvaluationsData) ? kpiEvaluationsData : [];
      const pendingKpiEvaluations = kpiEvaluations.filter(evaluation =>
        evaluation.trang_thai === 'Đã gửi' || evaluation.trang_thai === 'Nháp'
      ).length;

      // Process feedback data
      const feedbackResponse = feedbackRes.status === 'fulfilled' ? feedbackRes.value?.data : null;
      const feedbackData = feedbackResponse?.data ?? feedbackResponse ?? [];
      const feedback = Array.isArray(feedbackData) ? feedbackData : [];
      const totalFeedback = feedback.length;

      // Process smart contract logs
      const smartContractLogsResponse = smartContractLogsRes.status === 'fulfilled' ? smartContractLogsRes.value?.data : null;
      const smartContractLogsData = smartContractLogsResponse?.data ?? smartContractLogsResponse ?? [];
      const smartContractLogs = Array.isArray(smartContractLogsData) ? smartContractLogsData : [];
      const smartContractTransactions = smartContractLogs.length;

      setStats({
        totalEmployees,
        totalDepartments,
        activeTasks,
        completedTasks,
        pendingKpiEvaluations,
        totalFeedback,
        smartContractTransactions,
        systemHealth: 98 // This could be calculated based on system metrics
      });

      // Generate chart data from the last 6 months
      const currentDate = new Date();
      const chartDataPoints = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });

        // Filter data for this month
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const employeesThisMonth = employees.filter(emp =>
          new Date(emp.createdAt) >= monthStart && new Date(emp.createdAt) <= monthEnd
        ).length;

        const tasksThisMonth = tasks.filter(task =>
          new Date(task.createdAt) >= monthStart && new Date(task.createdAt) <= monthEnd
        ).length;

        const feedbackThisMonth = feedback.filter(fb =>
          new Date(fb.createdAt) >= monthStart && new Date(fb.createdAt) <= monthEnd
        ).length;

        chartDataPoints.push({
          month: monthName,
          employees: employeesThisMonth,
          tasks: tasksThisMonth,
          feedback: feedbackThisMonth
        });
      }

      setChartData(chartDataPoints);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values if API calls fail
      setStats({
        totalEmployees: 0,
        totalDepartments: 0,
        activeTasks: 0,
        completedTasks: 0,
        pendingKpiEvaluations: 0,
        totalFeedback: 0,
        smartContractTransactions: 0,
        systemHealth: 95
      });
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        border: `1px solid ${color}20`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 24px ${color}20`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar
            sx={{
              bgcolor: color,
              width: 48,
              height: 48,
              boxShadow: `0 4px 12px ${color}30`,
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </Avatar>
          {trend && (
            <Chip
              label={`${trend > 0 ? '+' : ''}${trend}%`}
              size="small"
              sx={{
                bgcolor: trend > 0 ? 'success.light' : 'error.light',
                color: trend > 0 ? 'success.dark' : 'error.dark',
                fontWeight: 600,
              }}
            />
          )}
        </Box>
        <Typography variant="h3" fontWeight="bold" color="text.primary" mb={1}>
          {value.toLocaleString()}
        </Typography>
        <Typography variant="h6" color="text.primary" fontWeight={600} mb={1}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const pieData = [
    { name: 'Hoàn thành', value: stats.completedTasks, color: '#10b981' },
    { name: 'Đang thực hiện', value: stats.activeTasks, color: '#f59e0b' },
    { name: 'Chờ xử lý', value: stats.pendingKpiEvaluations, color: '#6b7280' },
  ];

  const systemAlerts = [
    { type: 'success', message: 'Tất cả hệ thống hoạt động bình thường', icon: CheckCircleIcon },
    { type: 'warning', message: `${stats.pendingKpiEvaluations} đánh giá KPI đang chờ phê duyệt`, icon: WarningIcon },
    { type: 'info', message: `${stats.smartContractTransactions} giao dịch Smart Contract trong tháng`, icon: InfoIcon },
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary" mb={1}>
            Tổng quan Hệ thống
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Theo dõi các chỉ số quan trọng và tình trạng hệ thống
          </Typography>
        </Box>
        <Tooltip title="Làm mới dữ liệu">
          <span>
            <IconButton
              onClick={fetchDashboardData}
              disabled={loading}
              sx={{
                bgcolor: 'primary.light',
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.main', color: 'white' },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng Nhân viên"
            value={stats.totalEmployees}
            icon={PeopleIcon}
            color="#2563eb"
            subtitle="Đang làm việc"
            trend={stats.totalEmployees > 0 ? 5.2 : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Phòng ban"
            value={stats.totalDepartments}
            icon={BusinessIcon}
            color="#7c3aed"
            subtitle="Đang hoạt động"
            trend={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Công việc Hoạt động"
            value={stats.activeTasks}
            icon={AssessmentIcon}
            color="#f59e0b"
            subtitle="Đang thực hiện"
            trend={stats.activeTasks > 0 ? 12.5 : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Đánh giá KPI"
            value={stats.pendingKpiEvaluations}
            icon={RankingIcon}
            color="#dc2626"
            subtitle="Chờ phê duyệt"
            trend={stats.pendingKpiEvaluations > 0 ? -8.3 : 0}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Xu hướng Hệ thống (6 tháng)
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography>Đang tải dữ liệu...</Typography>
                </Box>
              ) : (
                <LineChartContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="employees"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                        name="Nhân viên"
                      />
                      <Line
                        type="monotone"
                        dataKey="tasks"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        name="Công việc"
                      />
                      <Line
                        type="monotone"
                        dataKey="feedback"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                        name="Phản hồi"
                      />
                    </LineChart>
                </LineChartContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Trạng thái Công việc
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                  <Typography>Đang tải dữ liệu...</Typography>
                </Box>
              ) : (
                <PieChartContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                    </PieChart>
                </PieChartContainer>
              )}
              <Box sx={{ mt: 2 }}>
                {pieData.map((item, index) => (
                  <Box key={index} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: item.color,
                        }}
                      />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Health & Alerts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Tình trạng Hệ thống
              </Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Sức khỏe tổng thể
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {stats.systemHealth}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.systemHealth}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'success.main',
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Smart Contract
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    Đang hoạt động
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Thông báo Hệ thống
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {systemAlerts.map((alert, index) => {
                  const IconComponent = alert.icon;
                  return (
                    <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                      <IconComponent
                        sx={{
                          color: alert.type === 'success' ? 'success.main' :
                                 alert.type === 'warning' ? 'warning.main' :
                                 alert.type === 'error' ? 'error.main' : 'info.main'
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {alert.message}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminOverview;
