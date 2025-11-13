import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Alert, CircularProgress, useTheme, useMediaQuery, Rating,
  LinearProgress, Tooltip, IconButton, Collapse, Avatar
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  SentimentVerySatisfied as PositiveIcon,
  SentimentSatisfied as NeutralIcon,
  SentimentVeryDissatisfied as NegativeIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';

function CustomerFeedback({ user, employeeData }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    fetchFeedbackData();
  }, [user]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      setError('');

      const { employee_did } = user;
      const response = await apiService.getCustomerFeedback(employee_did);
      setFeedbackData(response.data || []);
    } catch (err) {
      console.error('Fetch feedback data error:', err);
      setError('Không thể tải dữ liệu phản hồi khách hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowExpand = (feedbackId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(feedbackId)) {
      newExpanded.delete(feedbackId);
    } else {
      newExpanded.add(feedbackId);
    }
    setExpandedRows(newExpanded);
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'Tích cực':
        return 'success';
      case 'Trung lập':
        return 'warning';
      case 'Tiêu cực':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'Tích cực':
        return <PositiveIcon />;
      case 'Trung lập':
        return <NeutralIcon />;
      case 'Tiêu cực':
        return <NegativeIcon />;
      default:
        return <FeedbackIcon />;
    }
  };

  const getFeedbackTypeColor = (type) => {
    switch (type) {
      case 'Khen ngợi':
        return 'success';
      case 'Khiếu nại':
        return 'error';
      case 'Góp ý':
        return 'info';
      case 'Đánh giá chung':
        return 'primary';
      default:
        return 'default';
    }
  };

  const calculateAverageRating = (feedbacks) => {
    if (!feedbacks || feedbacks.length === 0) return 0;
    const ratedFeedbacks = feedbacks.filter(f => f.diem_danh_gia);
    if (ratedFeedbacks.length === 0) return 0;
    const totalRating = ratedFeedbacks.reduce((sum, f) => sum + f.diem_danh_gia, 0);
    return (totalRating / ratedFeedbacks.length).toFixed(1);
  };

  const getSentimentDistribution = (feedbacks) => {
    const distribution = { positive: 0, neutral: 0, negative: 0 };
    feedbacks.forEach(feedback => {
      if (feedback.ai_sentiment?.sentiment === 'Tích cực') distribution.positive++;
      else if (feedback.ai_sentiment?.sentiment === 'Trung lập') distribution.neutral++;
      else if (feedback.ai_sentiment?.sentiment === 'Tiêu cực') distribution.negative++;
    });
    return distribution;
  };

  const getTopKeywords = (feedbacks) => {
    const keywordCount = {};
    feedbacks.forEach(feedback => {
      if (feedback.ai_sentiment?.keywords) {
        feedback.ai_sentiment.keywords.forEach(keyword => {
          keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
        });
      }
    });
    return Object.entries(keywordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }));
  };

  const sentimentDist = getSentimentDistribution(feedbackData);
  const averageRating = calculateAverageRating(feedbackData);
  const topKeywords = getTopKeywords(feedbackData);

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
        Phản hồi khách hàng
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Đánh giá trung bình
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {averageRating}
                </Typography>
                <StarIcon sx={{ color: 'gold', fontSize: 32 }} />
              </Box>
              <Rating value={parseFloat(averageRating)} readOnly precision={0.1} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tổng phản hồi
              </Typography>
              <Typography variant="h3" color="secondary" fontWeight="bold">
                {feedbackData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Phản hồi đã nhận
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Phân tích cảm xúc
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <PositiveIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Tích cực</Typography>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {sentimentDist.positive}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <NeutralIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Trung lập</Typography>
                    <Typography variant="h6" color="warning.main" fontWeight="bold">
                      {sentimentDist.neutral}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <NegativeIcon color="error" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Tiêu cực</Typography>
                    <Typography variant="h6" color="error.main" fontWeight="bold">
                      {sentimentDist.negative}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Keywords */}
      {topKeywords.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Từ khóa nổi bật
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {topKeywords.map(({ keyword, count }) => (
                <Chip
                  key={keyword}
                  label={`${keyword} (${count})`}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Feedback Details Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Chi tiết phản hồi
          </Typography>

          {feedbackData.length === 0 ? (
            <Box textAlign="center" py={4}>
              <FeedbackIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Chưa có phản hồi từ khách hàng
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Ngày</strong></TableCell>
                    <TableCell><strong>Loại</strong></TableCell>
                    <TableCell><strong>Đánh giá</strong></TableCell>
                    <TableCell><strong>Cảm xúc</strong></TableCell>
                    <TableCell><strong>Nội dung</strong></TableCell>
                    <TableCell><strong>Chi tiết</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feedbackData.map((feedback) => (
                    <TableRow key={feedback._id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(feedback.ngay_phan_hoi).toLocaleDateString('vi-VN')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={feedback.loai_phan_hoi}
                          color={getFeedbackTypeColor(feedback.loai_phan_hoi)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {feedback.diem_danh_gia ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Rating value={feedback.diem_danh_gia} readOnly size="small" />
                            <Typography variant="body2">
                              {feedback.diem_danh_gia}/5
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">--</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {feedback.ai_sentiment ? (
                          <Chip
                            label={feedback.ai_sentiment.sentiment}
                            color={getSentimentColor(feedback.ai_sentiment.sentiment)}
                            icon={getSentimentIcon(feedback.ai_sentiment.sentiment)}
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">--</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {feedback.noi_dung}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleRowExpand(feedback._id)}
                        >
                          {expandedRows.has(feedback._id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Expanded Details */}
          {feedbackData.map((feedback) => (
            <Collapse key={feedback._id} in={expandedRows.has(feedback._id)}>
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                      Nội dung phản hồi:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                      {feedback.noi_dung}
                    </Typography>
                  </Grid>

                  {feedback.ai_sentiment && (
                    <>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">
                          Phân tích AI:
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Cảm xúc:</strong> {feedback.ai_sentiment.sentiment}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Điểm số:</strong> {feedback.ai_sentiment.sentiment_score?.toFixed(2)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Từ khóa:</strong> {feedback.ai_sentiment.keywords?.join(', ') || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">
                          Phân loại:
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {feedback.ai_sentiment.categories?.map((category, index) => (
                            <Chip
                              key={index}
                              label={category}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          )) || <Typography variant="body2" color="text.secondary">N/A</Typography>}
                        </Box>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                      Trạng thái xử lý:
                    </Typography>
                    <Chip
                      label={feedback.trang_thai_xu_ly}
                      color={
                        feedback.trang_thai_xu_ly === 'Đã xử lý' ? 'success' :
                        feedback.trang_thai_xu_ly === 'Đang xử lý' ? 'warning' : 'default'
                      }
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}

export default CustomerFeedback;
