import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip,
  LinearProgress, IconButton, Tooltip, Divider, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as RankingIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import apiService from '../../services/apiService';

const KpiDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalKpiCriteria: 0,
    totalEvaluations: 0,
    averageScore: 0,
    outstandingEmployees: 0,
    departmentStats: [],
    topPerformers: [],
    kpiTrends: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchKpiDashboardData();
  }, []);

  const fetchKpiDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch KPI data
      const [criteriaRes, evaluationsRes, employeesRes, departmentsRes] = await Promise.allSettled([
        apiService.getAllKpiCriteria(),
        apiService.get('/danh-gia-kpi'),
        apiService.getAllEmployees(),
        apiService.getAllDepartments()
      ]);

      const criteria = criteriaRes.status === 'fulfilled' ? criteriaRes.value : [];
      const evaluations = evaluationsRes.status === 'fulfilled' ? evaluationsRes.value?.data || [] : [];
      const employees = employeesRes.status === 'fulfilled' ? employeesRes.value : [];
      const departments = departmentsRes.status === 'fulfilled' ? departmentsRes.value : [];

      // Calculate stats
      const totalKpiCriteria = criteria.length;
      const totalEvaluations = evaluations.length;

      // Calculate average score
      const averageScore = evaluations.length > 0
        ? evaluations.reduce((sum, evaluation) => sum + (evaluation.diem_so || 0), 0) / evaluations.length
        : 0;

      // Count outstanding employees (score >= 90)
      const outstandingEmployees = evaluations.filter(evaluation => evaluation.diem_so >= 90).length;

      // Department stats
      const departmentStats = departments.map(dept => {
        const deptEmployees = employees.filter(emp => emp.phong_ban_id === dept.phong_ban_id);
        const deptEvaluations = evaluations.filter(evaluation =>
          deptEmployees.some(emp => emp.employee_did === evaluation.employee_did)
        );
        const avgScore = deptEvaluations.length > 0
          ? deptEvaluations.reduce((sum, evaluation) => sum + (evaluation.diem_so || 0), 0) / deptEvaluations.length
          : 0;

        return {
          name: dept.ten_phong_ban,
          employees: deptEmployees.length,
          evaluations: deptEvaluations.length,
          averageScore: Math.round(avgScore * 100) / 100
        };
      });

      // Top performers
      const employeeScores = {};
      evaluations.forEach(evaluation => {
        if (!employeeScores[evaluation.employee_did]) {
          employeeScores[evaluation.employee_did] = { total: 0, count: 0 };
        }
        employeeScores[evaluation.employee_did].total += evaluation.diem_so || 0;
        employeeScores[evaluation.employee_did].count += 1;
      });

      const topPerformers = Object.entries(employeeScores)
        .map(([did, scores]) => ({
          employee_did: did,
          name: employees.find(emp => emp.employee_did === did)?.ho_ten || did,
          averageScore: Math.round((scores.total / scores.count) * 100) / 100
        }))
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 10);

      // KPI trends (last 6 months)
      const currentDate = new Date();
      const kpiTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('vi-VN', { month: 'short' });

        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthEvaluations = evaluations.filter(evaluation =>
          new Date(evaluation.createdAt) >= monthStart && new Date(evaluation.createdAt) <= monthEnd
        );

        const avgScore = monthEvaluations.length > 0
          ? monthEvaluations.reduce((sum, evaluation) => sum + (evaluation.diem_so || 0), 0) / monthEvaluations.length
          : 0;

        kpiTrends.push({
          month: monthName,
          averageScore: Math.round(avgScore * 100) / 100,
          evaluations: monthEvaluations.length
        });
      }

      setStats({
        totalKpiCriteria,
        totalEvaluations,
        averageScore: Math.round(averageScore * 100) / 100,
        outstandingEmployees,
        departmentStats,
        topPerformers,
        kpiTrends
      });

    } catch (error) {
      console.error('Error fetching KPI dashboard data:', error);
      setError('Không thể tải dữ liệu dashboard KPI');
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
          {typeof value === 'number' ? value.toLocaleString() : value}
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

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#f59e0b';
    if (score >= 50) return '#3b82f6';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 75) return 'Tốt';
    if (score >= 50) return 'Đạt';
    return 'Chưa đạt';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary" mb={1}>
            Dashboard KPI Toàn Công Ty
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tổng quan hiệu suất và đánh giá KPI của nhân viên
          </Typography>
        </Box>
        <Tooltip title="Làm mới dữ liệu">
          <IconButton
            onClick={fetchKpiDashboardData}
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.main',
              '&:hover': { bgcolor: 'primary.main', color: 'white' },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* KPI Stats Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tiêu chí KPI"
            value={stats.totalKpiCriteria}
            icon={AssessmentIcon}
            color="#2563eb"
            subtitle="Đang áp dụng"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng Đánh giá"
            value={stats.totalEvaluations}
            icon={BarChartIcon}
            color="#7c3aed"
            subtitle="Đã thực hiện"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Điểm Trung bình"
            value={`${stats.averageScore}/100`}
            icon={StarIcon}
            color="#f59e0b"
            subtitle="Toàn công ty"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Nhân viên Xuất sắc"
            value={stats.outstandingEmployees}
            icon={RankingIcon}
            color="#10b981"
            subtitle="Điểm ≥ 90"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Xu hướng Điểm KPI (6 tháng)
              </Typography>
              <Box sx={{ width: '100%', height: 'calc(100% - 80px)', minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.kpiTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
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
                      dataKey="averageScore"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      name="Điểm trung bình"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Thống kê theo Phòng ban
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {stats.departmentStats.map((dept, index) => (
                  <Box key={index} mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="500">
                        {dept.name}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {dept.averageScore}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={dept.averageScore}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getScoreColor(dept.averageScore),
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        {dept.employees} NV • {dept.evaluations} ĐG
                      </Typography>
                      <Chip
                        label={getScoreLabel(dept.averageScore)}
                        size="small"
                        sx={{
                          bgcolor: getScoreColor(dept.averageScore),
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Performers Table */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            Top 10 Nhân viên Xuất sắc
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell>Tên nhân viên</TableCell>
                  <TableCell align="center">Điểm trung bình</TableCell>
                  <TableCell align="center">Xếp loại</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.topPerformers.map((performer, index) => (
                  <TableRow key={performer.employee_did} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {index < 3 && <StarIcon sx={{ color: '#f59e0b' }} />}
                        <Typography variant="body2" fontWeight="bold">
                          {index + 1}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {performer.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {performer.averageScore}/100
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getScoreLabel(performer.averageScore)}
                        size="small"
                        sx={{
                          bgcolor: getScoreColor(performer.averageScore),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default KpiDashboard;
