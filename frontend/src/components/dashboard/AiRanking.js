import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Alert, CircularProgress, useTheme, useMediaQuery, LinearProgress,
  Tooltip, IconButton, Avatar, Badge
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Leaderboard as LeaderboardIcon,
  Whatshot as HotIcon,
  WorkspacePremium as PremiumIcon,
  MilitaryTech as MedalIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';

function AiRanking({ user, employeeData }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRankingData();
  }, [user]);

  const fetchRankingData = async () => {
    try {
      setLoading(true);
      setError('');

      const { employee_did } = user;
      const response = await apiService.getEmployeeRanking(employee_did);
      setRankingData(response.data || []);
    } catch (err) {
      console.error('Fetch ranking data error:', err);
      setError('Không thể tải dữ liệu xếp hạng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
        return 'success';
      case 'A':
        return 'primary';
      case 'B+':
        return 'info';
      case 'B':
        return 'warning';
      case 'C+':
        return 'secondary';
      case 'C':
        return 'default';
      case 'D':
        return 'error';
      default:
        return 'default';
    }
  };

  const getGradeIcon = (grade) => {
    switch (grade) {
      case 'A+':
        return <TrophyIcon />;
      case 'A':
        return <PremiumIcon />;
      case 'B+':
        return <MedalIcon />;
      case 'B':
        return <StarIcon />;
      default:
        return <LeaderboardIcon />;
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

  const getRankBadge = (rank) => {
    if (rank === 1) return { color: 'gold', icon: <TrophyIcon />, label: '🥇' };
    if (rank === 2) return { color: 'silver', icon: <MedalIcon />, label: '🥈' };
    if (rank === 3) return { color: '#CD7F32', icon: <MedalIcon />, label: '🥉' };
    return { color: 'default', icon: null, label: `#${rank}` };
  };

  const calculateOverallScore = (rankings) => {
    if (!rankings || rankings.length === 0) return 0;
    const latest = rankings[0]; // Assuming sorted by date
    return latest.diem_ai_tong_hop || 0;
  };

  const getLatestRanking = (rankings) => {
    if (!rankings || rankings.length === 0) return null;
    return rankings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  };

  const getRankingTrend = (rankings) => {
    if (!rankings || rankings.length < 2) return 'N/A';
    const sorted = rankings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const current = sorted[0].thu_hang;
    const previous = sorted[1].thu_hang;
    if (current < previous) return 'Tăng';
    if (current > previous) return 'Giảm';
    return 'Ổn định';
  };

  const latestRanking = getLatestRanking(rankingData);
  const overallScore = calculateOverallScore(rankingData);
  const rankingTrend = getRankingTrend(rankingData);

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
        Xếp hạng AI
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
                Xếp hạng hiện tại
              </Typography>
              {latestRanking ? (
                <>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Badge
                      badgeContent={getRankBadge(latestRanking.thu_hang).label}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: getRankBadge(latestRanking.thu_hang).color,
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                        }
                      }}
                    >
                      <Avatar sx={{ width: 60, height: 60, backgroundColor: 'primary.main' }}>
                        {getRankBadge(latestRanking.thu_hang).icon || <LeaderboardIcon />}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="h3" color="primary" fontWeight="bold">
                        #{latestRanking.thu_hang}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {latestRanking.pham_vi_xep_hang}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getTrendIcon(rankingTrend)}
                    <Typography variant="body2" color="text.secondary">
                      Xu hướng: {rankingTrend}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Chưa có dữ liệu xếp hạng
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Điểm tổng hợp AI
              </Typography>
              <Typography variant="h3" color="secondary" fontWeight="bold">
                {overallScore.toFixed(1)}/100
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overallScore}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
              {latestRanking && (
                <Chip
                  label={latestRanking.xep_loai}
                  color={getGradeColor(latestRanking.xep_loai)}
                  icon={getGradeIcon(latestRanking.xep_loai)}
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Kỳ xếp hạng gần nhất
              </Typography>
              {latestRanking ? (
                <>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {latestRanking.ky_xep_hang}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Cập nhật: {new Date(latestRanking.updatedAt).toLocaleDateString('vi-VN')}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Chưa có kỳ xếp hạng
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Scores */}
      {latestRanking && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Chi tiết điểm số ({latestRanking.ky_xep_hang})
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    KPI
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {latestRanking.tong_diem_kpi}/100
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={latestRanking.tong_diem_kpi}
                    sx={{ mt: 1, height: 6 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Phản hồi KH
                  </Typography>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {latestRanking.diem_phan_hoi_khach_hang}/100
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={latestRanking.diem_phan_hoi_khach_hang}
                    sx={{ mt: 1, height: 6 }}
                    color="success"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chấm công
                  </Typography>
                  <Typography variant="h5" color="warning.main" fontWeight="bold">
                    {latestRanking.diem_cham_cong}/100
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={latestRanking.diem_cham_cong}
                    sx={{ mt: 1, height: 6 }}
                    color="warning"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tổng hợp AI
                  </Typography>
                  <Typography variant="h5" color="secondary" fontWeight="bold">
                    {latestRanking.diem_ai_tong_hop}/100
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={latestRanking.diem_ai_tong_hop}
                    sx={{ mt: 1, height: 6 }}
                    color="secondary"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {latestRanking?.ai_insights && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Phân tích và dự đoán từ AI
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Xu hướng hiệu suất
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {getTrendIcon(latestRanking.ai_insights.performance_trend)}
                    <Typography variant="body1">
                      {latestRanking.ai_insights.performance_trend}
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Dự đoán kỳ tiếp theo
                  </Typography>
                  <Typography variant="h6" color="secondary" fontWeight="bold">
                    {latestRanking.ai_insights.predicted_next_quarter?.toFixed(1)}/100
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  <HotIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Yếu tố rủi ro
                </Typography>
                <Box mb={2}>
                  {latestRanking.ai_insights.risk_factors?.length > 0 ? (
                    latestRanking.ai_insights.risk_factors.map((risk, index) => (
                      <Chip
                        key={index}
                        label={risk}
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Không có yếu tố rủi ro
                    </Typography>
                  )}
                </Box>

                <Typography variant="subtitle2" color="primary" gutterBottom>
                  <StarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Khuyến nghị cải thiện
                </Typography>
                <Box>
                  {latestRanking.ai_insights.recommendations?.length > 0 ? (
                    latestRanking.ai_insights.recommendations.map((rec, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        • {rec}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Không có khuyến nghị
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Historical Rankings Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Lịch sử xếp hạng
          </Typography>

          {rankingData.length === 0 ? (
            <Box textAlign="center" py={4}>
              <LeaderboardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Chưa có dữ liệu xếp hạng
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Kỳ xếp hạng</strong></TableCell>
                    <TableCell align="center"><strong>Xếp hạng</strong></TableCell>
                    <TableCell align="center"><strong>Xếp loại</strong></TableCell>
                    <TableCell align="center"><strong>Điểm KPI</strong></TableCell>
                    <TableCell align="center"><strong>Điểm KH</strong></TableCell>
                    <TableCell align="center"><strong>Điểm CC</strong></TableCell>
                    <TableCell align="center"><strong>Tổng AI</strong></TableCell>
                    <TableCell><strong>Cập nhật</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rankingData
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((ranking) => (
                    <TableRow key={ranking._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {ranking.ky_xep_hang}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ranking.pham_vi_xep_hang}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Badge
                          badgeContent={getRankBadge(ranking.thu_hang).label}
                          color="primary"
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: getRankBadge(ranking.thu_hang).color,
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                            }
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold">
                            #{ranking.thu_hang}
                          </Typography>
                        </Badge>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={ranking.xep_loai}
                          color={getGradeColor(ranking.xep_loai)}
                          icon={getGradeIcon(ranking.xep_loai)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {ranking.tong_diem_kpi}/100
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {ranking.diem_phan_hoi_khach_hang}/100
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {ranking.diem_cham_cong}/100
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold">
                          {ranking.diem_ai_tong_hop}/100
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(ranking.updatedAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default AiRanking;
