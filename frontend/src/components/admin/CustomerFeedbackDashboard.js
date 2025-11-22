import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  SentimentVerySatisfied as PositiveIcon,
  SentimentSatisfied as NeutralIcon,
  SentimentVeryDissatisfied as NegativeIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import apiService from '../../services/apiService';
import authService from '../../services/authService';

function CustomerFeedbackDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [attritionSummary, setAttritionSummary] = useState({
    total: 0,
    high_risk: 0,
    average_probability: 0,
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    trang_thai_xu_ly: 'Chờ xử lý',
    phan_hoi_admin: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [feedbackRes, attritionRes] = await Promise.all([
        apiService.getAllCustomerFeedback(),
        apiService.getAttritionOverview({ limit: 100 }),
      ]);

      const feedbackData = feedbackRes?.data ?? feedbackRes ?? [];
      setFeedbacks(Array.isArray(feedbackData) ? feedbackData : feedbackData.data || []);
      if (attritionRes) {
        setAttritionSummary({
          total: attritionRes.total || 0,
          high_risk: attritionRes.high_risk || 0,
          average_probability: attritionRes.average_probability || 0,
          items: attritionRes.items || [],
        });
      }
    } catch (err) {
      console.error('Admin feedback overview error:', err);
      setError('Không thể tải dữ liệu phản hồi khách hàng hoặc dự báo nghỉ việc.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdateDialog = (feedback) => {
    setSelectedFeedback(feedback);
    setUpdateForm({
      trang_thai_xu_ly: feedback.trang_thai_xu_ly || 'Chờ xử lý',
      phan_hoi_admin: feedback.phan_hoi_admin || '',
    });
    setUpdateDialogOpen(true);
  };

  const handleCloseUpdateDialog = () => {
    setUpdateDialogOpen(false);
    setSelectedFeedback(null);
    setUpdateForm({
      trang_thai_xu_ly: 'Chờ xử lý',
      phan_hoi_admin: '',
    });
  };

  const handleUpdateStatus = async () => {
    if (!selectedFeedback) return;

    try {
      setUpdating(true);
      const user = authService.getCurrentUser();
      await apiService.updateFeedbackStatus(selectedFeedback._id, {
        trang_thai_xu_ly: updateForm.trang_thai_xu_ly,
        phan_hoi_admin: updateForm.phan_hoi_admin.trim() || null,
        nguoi_xu_ly: user?.walletAddress || user?.id || null,
      });
      handleCloseUpdateDialog();
      fetchData(); // Reload data
    } catch (err) {
      console.error('Update feedback status error:', err);
      setError('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã xử lý':
        return 'success';
      case 'Đang xử lý':
        return 'warning';
      case 'Chờ xử lý':
        return 'default';
      case 'Đã đóng':
        return 'info';
      default:
        return 'default';
    }
  };

  const ratedFeedbacks = feedbacks.filter((fb) => typeof fb.diem_danh_gia === 'number');
  const averageRating =
    ratedFeedbacks.length > 0
      ? (ratedFeedbacks.reduce((sum, fb) => sum + fb.diem_danh_gia, 0) / ratedFeedbacks.length).toFixed(1)
      : 0;

  const sentimentDistribution = feedbacks.reduce(
    (acc, fb) => {
      const sentiment = fb.ai_sentiment?.sentiment;
      if (sentiment === 'Tích cực') acc.positive += 1;
      else if (sentiment === 'Trung lập') acc.neutral += 1;
      else if (sentiment === 'Tiêu cực') acc.negative += 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const latestFeedbacks = feedbacks
    .slice()
    .sort((a, b) => new Date(b.ngay_phan_hoi) - new Date(a.ngay_phan_hoi))
    .slice(0, 10);

  const highRiskEmployees = attritionSummary.items
    .filter((item) => item.probability !== null)
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
    .slice(0, 10);

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
        Phản hồi khách hàng & Dự báo nghỉ việc
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Đánh giá trung bình
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      {averageRating}
                    </Typography>
                    <FeedbackIcon sx={{ color: 'gold', fontSize: 28 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tổng phản hồi
                  </Typography>
                  <Typography variant="h3" color="secondary" fontWeight="bold" mt={1}>
                    {feedbacks.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phân tích cảm xúc
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Box textAlign="center">
                      <PositiveIcon color="success" />
                      <Typography variant="body2">{sentimentDistribution.positive}</Typography>
                    </Box>
                    <Box textAlign="center">
                      <NeutralIcon color="warning" />
                      <Typography variant="body2">{sentimentDistribution.neutral}</Typography>
                    </Box>
                    <Box textAlign="center">
                      <NegativeIcon color="error" />
                      <Typography variant="body2">{sentimentDistribution.negative}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Phản hồi mới nhất
              </Typography>
              {latestFeedbacks.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <FeedbackIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Chưa có phản hồi nào
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ngày</TableCell>
                        <TableCell>Nhân viên</TableCell>
                        <TableCell>Loại</TableCell>
                        <TableCell>Đánh giá</TableCell>
                        <TableCell>Cảm xúc</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {latestFeedbacks.map((feedback) => (
                        <TableRow key={feedback._id}>
                          <TableCell>
                            {new Date(feedback.ngay_phan_hoi).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell>{feedback.employee_did}</TableCell>
                          <TableCell>
                            <Chip label={feedback.loai_phan_hoi} size="small" />
                          </TableCell>
                          <TableCell>{feedback.diem_danh_gia ? `${feedback.diem_danh_gia}/5` : '--'}</TableCell>
                          <TableCell>{feedback.ai_sentiment?.sentiment || '--'}</TableCell>
                          <TableCell>
                            <Chip
                              label={feedback.trang_thai_xu_ly || 'Chờ xử lý'}
                              size="small"
                              color={getStatusColor(feedback.trang_thai_xu_ly)}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenUpdateDialog(feedback)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Nguy cơ nghỉ việc (AI)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Top nhân viên có xác suất nghỉ việc cao dựa trên mô hình AI (PCA + Logistic Regression).
              </Typography>
              <List sx={{ maxHeight: 360, overflow: 'auto', mt: 2 }}>
                {highRiskEmployees.length === 0 && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <TrendingUpIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Không có rủi ro cao"
                      secondary="Tất cả nhân viên đang ổn định."
                    />
                  </ListItem>
                )}
                {highRiskEmployees.map((item) => (
                  <ListItem key={`${item.ten_mo_hinh}-${item.phien_ban}`} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'error.main' }}>
                        <WarningIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${item.thong_tin_ca_nhan?.ma_nhan_vien || item.ten_mo_hinh} • ${(item.probability * 100).toFixed(1)}%`}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {item.thong_tin_cong_viec?.vi_tri_cong_viec} — {item.thong_tin_ca_nhan?.phong_ban}
                          </Typography>
                          <br />
                          Mức độ hài lòng: {item.thai_do_phuc_loi?.muc_do_hai_long}/5 • Cân bằng: {item.thai_do_phuc_loi?.can_bang_cong_viec}/5
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Trung bình xác suất nghỉ việc
              </Typography>
              <Typography variant="h3" color="secondary" fontWeight="bold">
                {(attritionSummary.average_probability * 100).toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(attritionSummary.average_probability || 0) * 100}
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tổng {attritionSummary.total} mẫu, {attritionSummary.high_risk} nhân viên rủi ro cao.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onClose={handleCloseUpdateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật trạng thái phản hồi</DialogTitle>
        <DialogContent>
          {selectedFeedback && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nhân viên: {selectedFeedback.employee_did}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Loại: {selectedFeedback.loai_phan_hoi}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Nội dung: {selectedFeedback.noi_dung}
              </Typography>
            </Box>
          )}
          <TextField
            select
            fullWidth
            label="Trạng thái xử lý"
            value={updateForm.trang_thai_xu_ly}
            onChange={(e) => setUpdateForm({ ...updateForm, trang_thai_xu_ly: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Chờ xử lý">Chờ xử lý</MenuItem>
            <MenuItem value="Đang xử lý">Đang xử lý</MenuItem>
            <MenuItem value="Đã xử lý">Đã xử lý</MenuItem>
            <MenuItem value="Đã đóng">Đã đóng</MenuItem>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Phản hồi từ Admin (tùy chọn)"
            placeholder="Nhập phản hồi hoặc ghi chú cho nhân viên..."
            value={updateForm.phan_hoi_admin}
            onChange={(e) => setUpdateForm({ ...updateForm, phan_hoi_admin: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateDialog} disabled={updating}>
            Hủy
          </Button>
          <Button onClick={handleUpdateStatus} variant="contained" disabled={updating}>
            {updating ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerFeedbackDashboard;

