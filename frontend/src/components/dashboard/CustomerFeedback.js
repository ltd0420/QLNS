import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Alert, CircularProgress, useTheme, useMediaQuery, Rating,
  LinearProgress, Tooltip, IconButton, Collapse, Avatar,
  TextField, MenuItem, Button
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
  Chat as ChatIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import apiService from '../../services/apiService';

function CustomerFeedback({ user, employeeData }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [newFeedback, setNewFeedback] = useState({
    tieu_de: '',
    noi_dung: '',
    files: []
  });
  const [submittedFeedback, setSubmittedFeedback] = useState(null);

  useEffect(() => {
    fetchFeedbackData();
  }, [user]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      setError('');

      const employeeDid = user?.employee_did || user?.employeeDid || user?.id;
      if (!employeeDid) {
        setError('Không tìm thấy thông tin nhân viên.');
        return;
      }

      const response = await apiService.getCustomerFeedback(employeeDid);
      // apiService.getCustomerFeedback already returns response.data, which is the array
      setFeedbackData(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Fetch feedback data error:', err);
      setError('Không thể tải dữ liệu phản hồi khách hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setNewFeedback((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setNewFeedback((prev) => ({
      ...prev,
      files: files
    }));
  };

  const handleSubmitFeedback = async (event) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmittedFeedback(null);

    if (!newFeedback.noi_dung.trim()) {
      setFormError('Vui lòng nhập nội dung phản hồi.');
      return;
    }

    try {
      setSubmitting(true);
      const employeeDid = user?.employee_did || user?.employeeDid || user?.id;
      if (!employeeDid) {
        setFormError('Không tìm thấy thông tin nhân viên.');
        return;
      }

      const formData = new FormData();
      formData.append('employee_did', employeeDid);
      formData.append('tieu_de', newFeedback.tieu_de || '');
      formData.append('noi_dung', newFeedback.noi_dung.trim());
      // AI will auto-detect loai_phan_hoi and diem_danh_gia
      formData.append('ngay_phan_hoi', new Date().toISOString());
      formData.append('trang_thai_xu_ly', 'Chờ xử lý');
      
      // Append files
      newFeedback.files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiService.submitCustomerFeedback(formData, true);
      setSubmittedFeedback(response);
      setFormSuccess('Gửi phản hồi thành công!');
      setNewFeedback({
        tieu_de: '',
        noi_dung: '',
        files: []
      });
      fetchFeedbackData();
    } catch (err) {
      console.error('Submit feedback error:', err);
      setFormError('Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
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

      <Card sx={{ mb: 3 }}>
        <CardContent component="form" onSubmit={handleSubmitFeedback}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Gửi phản hồi mới
          </Typography>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          {formSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {formSuccess}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Tiêu đề phản hồi"
                fullWidth
                value={newFeedback.tieu_de}
                onChange={(e) => handleFormChange('tieu_de', e.target.value)}
                placeholder="Nhập tiêu đề phản hồi (tùy chọn)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nội dung phản hồi"
                multiline
                minRows={3}
                fullWidth
                required
                value={newFeedback.noi_dung}
                onChange={(e) => handleFormChange('noi_dung', e.target.value)}
                placeholder="Nhập chi tiết phản hồi, góp ý hoặc khiếu nại..."
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Hệ thống AI sẽ tự động:</strong>
                </Typography>
                <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  <li>Nhận diện loại phản hồi từ nội dung</li>
                  <li>Đánh giá mức độ hài lòng (1-5)</li>
                  <li>Phân tích cảm xúc (Tích cực/Trung lập/Tiêu cực)</li>
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFileIcon />}
                fullWidth
              >
                Đính kèm tệp
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
              </Button>
              {newFeedback.files.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {newFeedback.files.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      onDelete={() => {
                        const newFiles = newFeedback.files.filter((_, i) => i !== index);
                        setNewFeedback((prev) => ({ ...prev, files: newFiles }));
                      }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
            <Grid item xs={12} textAlign="right">
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                size="large"
              >
                {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </Button>
            </Grid>
          </Grid>
          
          {/* Display submission result */}
          {submittedFeedback && (
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'success.light', borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6" fontWeight="bold" color="success.dark">
                  Phản hồi của bạn đã được tiếp nhận
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Mã phản hồi:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {submittedFeedback.ma_phan_hoi || 'N/A'}
                  </Typography>
                </Grid>
                    {submittedFeedback.ai_sentiment && (
                      <>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Cảm xúc hệ thống nhận diện:
                          </Typography>
                          <Chip
                            label={submittedFeedback.ai_sentiment.sentiment}
                            color={getSentimentColor(submittedFeedback.ai_sentiment.sentiment)}
                            icon={getSentimentIcon(submittedFeedback.ai_sentiment.sentiment)}
                            sx={{ mt: 0.5 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Điểm số: {submittedFeedback.ai_sentiment.sentiment_score?.toFixed(2) || 'N/A'}
                          </Typography>
                        </Grid>
                        {submittedFeedback.ai_sentiment.topic && (
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">
                              Loại phản hồi (AI nhận diện):
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {submittedFeedback.loai_phan_hoi || submittedFeedback.ai_sentiment.topic}
                            </Typography>
                            {submittedFeedback.ai_sentiment.topic_score && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Độ tin cậy: {(submittedFeedback.ai_sentiment.topic_score * 100).toFixed(0)}%
                              </Typography>
                            )}
                          </Grid>
                        )}
                        {submittedFeedback.diem_danh_gia && (
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">
                              Mức độ hài lòng (AI đánh giá):
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Rating value={submittedFeedback.diem_danh_gia} readOnly precision={0.1} size="small" />
                              <Typography variant="body1" fontWeight="bold">
                                {submittedFeedback.diem_danh_gia}/5
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </>
                    )}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
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

        <Grid item xs={12} md={8}>
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
                          {feedback.ai_sentiment.topic && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Chủ đề:</strong> {feedback.ai_sentiment.topic}
                              {feedback.ai_sentiment.topic_score && (
                                <span style={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                  {' '}({feedback.ai_sentiment.topic_score.toFixed(2)})
                                </span>
                              )}
                            </Typography>
                          )}
                          {feedback.ai_sentiment.embedding_dim_original && (
                            <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                              <strong>Vector embedding:</strong> {feedback.ai_sentiment.embedding_dim_original} chiều
                              {feedback.ai_sentiment.embedding_dim_reduced && (
                                <span> → {feedback.ai_sentiment.embedding_dim_reduced} chiều (sau giảm chiều)</span>
                              )}
                            </Typography>
                          )}
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

                  {feedback.phan_hoi_admin && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                        Phản hồi từ Admin:
                      </Typography>
                      <Box sx={{ mt: 1, p: 2, backgroundColor: 'success.light', borderRadius: 1, opacity: 0.1 }}>
                        <Typography variant="body2" sx={{ color: 'success.dark' }}>
                          {feedback.phan_hoi_admin}
                        </Typography>
                        {feedback.ngay_xu_ly && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Cập nhật: {new Date(feedback.ngay_xu_ly).toLocaleDateString('vi-VN')}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  )}
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
