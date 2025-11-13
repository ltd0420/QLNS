import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Alert, CircularProgress, useTheme, useMediaQuery, LinearProgress,
  Tooltip, IconButton, Collapse
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';
import { useAuth } from '../../AuthContext';

function KpiEvaluation({ user, employeeData }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    fetchKpiData();
  }, [user]);

  const fetchKpiData = async () => {
    try {
      setLoading(true);
      setError('');

      const { employee_did } = user;
      const response = await apiService.getKpiEvaluations(employee_did);
      setKpiData(response.data || []);
    } catch (err) {
      console.error('Fetch KPI data error:', err);
      setError('Không thể tải dữ liệu KPI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowExpand = (kpiId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(kpiId)) {
      newExpanded.delete(kpiId);
    } else {
      newExpanded.add(kpiId);
    }
    setExpandedRows(newExpanded);
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'Xuất sắc':
        return 'success';
      case 'Tốt':
        return 'primary';
      case 'Đạt':
        return 'warning';
      case 'Chưa đạt':
        return 'error';
      default:
        return 'default';
    }
  };

  const getGradeIcon = (grade) => {
    switch (grade) {
      case 'Xuất sắc':
        return <TrophyIcon />;
      case 'Tốt':
        return <StarIcon />;
      case 'Đạt':
        return <TrendingUpIcon />;
      case 'Chưa đạt':
        return <TrendingDownIcon />;
      default:
        return <AssessmentIcon />;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'Tăng':
        return <TrendingUpIcon color="success" />;
      case 'Giảm':
        return <TrendingDownIcon color="error" />;
      case 'Ổn định':
        return <TrendingFlatIcon color="warning" />;
      default:
        return <TimelineIcon />;
    }
  };

  const calculateOverallScore = (evaluations) => {
    if (!evaluations || evaluations.length === 0) return 0;
    const totalScore = evaluations.reduce((sum, evaluation) => sum + (evaluation.diem_so || 0), 0);
    return (totalScore / evaluations.length).toFixed(1);
  };

  const getLatestEvaluation = (evaluations) => {
    if (!evaluations || evaluations.length === 0) return null;
    return evaluations.sort((a, b) => new Date(b.ngay_ket_thuc) - new Date(a.ngay_ket_thuc))[0];
  };

  const formatPeriod = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
    const endMonth = end.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
    return `${startMonth} - ${endMonth}`;
  };

  const groupedKpiData = kpiData.reduce((acc, item) => {
    const key = item.ky_danh_gia;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const sortedPeriods = Object.keys(groupedKpiData).sort((a, b) => b.localeCompare(a));

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
        Đánh giá KPI
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
                Điểm trung bình
              </Typography>
              <Typography variant="h3" color="primary" fontWeight="bold">
                {calculateOverallScore(kpiData)}/100
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculateOverallScore(kpiData)}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Kỳ đánh giá gần nhất
              </Typography>
              {(() => {
                const latest = getLatestEvaluation(kpiData);
                return latest ? (
                  <>
                    <Typography variant="h5" color="secondary" fontWeight="bold">
                      {latest.ky_danh_gia}
                    </Typography>
                    <Chip
                      label={latest.xep_loai}
                      color={getGradeColor(latest.xep_loai)}
                      icon={getGradeIcon(latest.xep_loai)}
                      sx={{ mt: 1 }}
                    />
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có đánh giá
                  </Typography>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tổng số đánh giá
              </Typography>
              <Typography variant="h3" color="success.main" fontWeight="bold">
                {kpiData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Đã hoàn thành
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* KPI Details Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Chi tiết đánh giá KPI
          </Typography>

          {sortedPeriods.length === 0 ? (
            <Box textAlign="center" py={4}>
              <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Chưa có dữ liệu đánh giá KPI
              </Typography>
            </Box>
          ) : (
            sortedPeriods.map((period) => {
              const periodEvaluations = groupedKpiData[period];
              const periodScore = calculateOverallScore(periodEvaluations);
              const latestEval = getLatestEvaluation(periodEvaluations);

              return (
                <Box key={period} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleRowExpand(period)}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {period}
                      </Typography>
                      <Chip
                        label={`${periodScore}/100`}
                        color={periodScore >= 80 ? 'success' : periodScore >= 60 ? 'warning' : 'error'}
                        size="small"
                      />
                      {latestEval && (
                        <Chip
                          label={latestEval.xep_loai}
                          color={getGradeColor(latestEval.xep_loai)}
                          icon={getGradeIcon(latestEval.xep_loai)}
                          size="small"
                        />
                      )}
                    </Box>
                    <IconButton size="small">
                      {expandedRows.has(period) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={expandedRows.has(period)}>
                    <TableContainer component={Paper} elevation={0} sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Tiêu chí KPI</strong></TableCell>
                            <TableCell align="center"><strong>Mục tiêu</strong></TableCell>
                            <TableCell align="center"><strong>Thực tế</strong></TableCell>
                            <TableCell align="center"><strong>Điểm số</strong></TableCell>
                            <TableCell align="center"><strong>Xếp loại</strong></TableCell>
                            <TableCell><strong>Người đánh giá</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {periodEvaluations.map((evaluation) => (
                            <TableRow key={evaluation._id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {evaluation.kpi_id?.ten_kpi || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {evaluation.kpi_id?.mo_ta || ''}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2">
                                  {evaluation.kpi_id?.nguong_dat || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" fontWeight="bold">
                                  {evaluation.gia_tri_thuc_te}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {evaluation.diem_so}/100
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={evaluation.diem_so}
                                    sx={{ width: 60, height: 6 }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={evaluation.xep_loai}
                                  color={getGradeColor(evaluation.xep_loai)}
                                  icon={getGradeIcon(evaluation.xep_loai)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {evaluation.nguoi_danh_gia_did || 'N/A'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* AI Analysis Section */}
                    {latestEval?.ai_analysis && (
                      <Box sx={{ mt: 2, p: 2, backgroundColor: 'blue.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                          Phân tích AI
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2">
                              <strong>Điểm mạnh:</strong> {latestEval.ai_analysis.key_strengths?.join(', ') || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2">
                              <strong>Cần cải thiện:</strong> {latestEval.ai_analysis.improvement_areas?.join(', ') || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>Nhận xét:</strong> {latestEval.nhan_xet || 'Không có nhận xét'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Collapse>
                </Box>
              );
            })
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default KpiEvaluation;
