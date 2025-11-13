const CongViecGiao = require('../models/CongViecGiao');
const HoSoNhanVien = require('../models/HoSoNhanVien');
const RolesPermissions = require('../models/RolesPermissions');
const AuditLogs = require('../models/AuditLogs');
const EventLogsUser = require('../models/EventLogsUser');
const multer = require('multer');
const path = require('path');
// IPFS integration removed due to deprecated package - will use placeholder for now

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all tasks (Admin only)
const getAll = async (req, res) => {
  try {
    // Check if user has admin permissions based on role_id
    const userRole = await RolesPermissions.findOne({ role_id: req.user.role_id });
    if (!userRole || userRole.ten_vai_tro !== 'Super Admin') {
      return res.status(403).json({ message: 'Access denied. Admin permissions required.' });
    }

    const congViecGiao = await CongViecGiao.find();
    res.json(congViecGiao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task by ID
const getById = async (req, res) => {
  try {
    const congViecGiao = await CongViecGiao.findOne({ task_id: req.params.id });
    if (!congViecGiao) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(congViecGiao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by employee (assignee)
const getByEmployee = async (req, res) => {
  try {
    const congViecGiao = await CongViecGiao.find({ nguoi_thuc_hien_did: req.params.employeeDid });
    res.json(congViecGiao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by assigner
const getByAssigner = async (req, res) => {
  try {
    const congViecGiao = await CongViecGiao.find({ nguoi_giao_did: req.params.assignerDid });
    res.json(congViecGiao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by status
const getByStatus = async (req, res) => {
  try {
    const congViecGiao = await CongViecGiao.find({ trang_thai: req.params.status });
    res.json(congViecGiao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by priority
const getByPriority = async (req, res) => {
  try {
    const congViecGiao = await CongViecGiao.find({ do_uu_tien: req.params.priority });
    res.json(congViecGiao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by department
const getByDepartment = async (req, res) => {
  try {
    const congViecGiao = await CongViecGiao.find({ phong_ban_id: req.params.departmentId });
    res.json(congViecGiao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get overdue tasks
const getOverdueTasks = async (req, res) => {
  try {
    const today = new Date();
    const congViecGiao = await CongViecGiao.find({
      ngay_ket_thuc_du_kien: { $lt: today },
      trang_thai: { $nin: ['Hoàn thành', 'Hủy bỏ'] }
    });
    res.json(congViecGiao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new task (Admin/Manager only)
const createTask = async (req, res) => {
  try {
    // Check if user has permission to create tasks based on role_id
    const userRole = await RolesPermissions.findOne({ role_id: req.user.role_id });
    if (!userRole || (userRole.ten_vai_tro !== 'Super Admin' && userRole.ten_vai_tro !== 'Manager')) {
      return res.status(403).json({ message: 'Access denied. Admin or Manager permissions required.' });
    }

    const congViecGiao = new CongViecGiao(req.body);
    const newCongViecGiao = await congViecGiao.save();

    // Log audit
    await AuditLogs.create({
      user_did: req.user?.employee_did || req.body.nguoi_giao_did,
      action: 'CREATE',
      resource_type: 'cong_viec_giao',
      resource_id: newCongViecGiao.task_id,
      status: 'Success',
      timestamp: new Date()
    });

    // Create event log for assignee
    await EventLogsUser.create({
      user_did: req.body.nguoi_thuc_hien_did,
      event_type: 'task_assigned',
      message: `Bạn được giao công việc: ${req.body.ten_cong_viec}`,
      resource_type: 'cong_viec_giao',
      resource_id: newCongViecGiao.task_id,
      timestamp: new Date()
    });

    res.status(201).json(newCongViecGiao);
  } catch (error) {
    // Log failed audit
    await AuditLogs.create({
      user_did: req.user?.employee_did || req.body.nguoi_giao_did,
      action: 'CREATE',
      resource_type: 'cong_viec_giao',
      resource_id: req.body.task_id,
      status: 'Failed',
      error_message: error.message,
      timestamp: new Date()
    });

    res.status(400).json({ message: error.message });
  }
};

// Update task
const update = async (req, res) => {
  try {
    // Check if user has permission to update tasks based on role_id
    const userRole = await RolesPermissions.findOne({ role_id: req.user.role_id });
    if (!userRole || userRole.ten_vai_tro !== 'Super Admin') {
      return res.status(403).json({ message: 'Access denied. Super Admin permissions required.' });
    }

    const updatedCongViecGiao = await CongViecGiao.findOneAndUpdate(
      { task_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCongViecGiao) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Log audit
    await AuditLogs.create({
      user_did: req.user?.employee_did || req.body.nguoi_giao_did,
      action: 'UPDATE',
      resource_type: 'cong_viec_giao',
      resource_id: req.params.id,
      changes: {
        before: {}, // In a real implementation, you'd compare old vs new
        after: req.body
      },
      status: 'Success',
      timestamp: new Date()
    });

    // Create event log if status changed
    if (req.body.trang_thai) {
      await EventLogsUser.create({
        user_did: updatedCongViecGiao.nguoi_thuc_hien_did,
        event_type: 'task_status_updated',
        message: `Trạng thái công việc "${updatedCongViecGiao.ten_cong_viec}" đã được cập nhật thành: ${req.body.trang_thai}`,
        resource_type: 'cong_viec_giao',
        resource_id: updatedCongViecGiao.task_id,
        timestamp: new Date()
      });
    }

    res.json(updatedCongViecGiao);
  } catch (error) {
    // Log failed audit
    await AuditLogs.create({
      user_did: req.user?.employee_did,
      action: 'UPDATE',
      resource_type: 'cong_viec_giao',
      resource_id: req.params.id,
      status: 'Failed',
      error_message: error.message,
      timestamp: new Date()
    });

    res.status(400).json({ message: error.message });
  }
};

// Update task progress
const updateProgress = async (req, res) => {
  try {
    const { tien_do, ghi_chu } = req.body;

    const updatedTask = await CongViecGiao.findOneAndUpdate(
      { task_id: req.params.id },
      {
        tien_do,
        $push: {
          nhan_xet: {
            nguoi_nhan_xet_did: req.user?.employee_did,
            noi_dung: ghi_chu || `Cập nhật tiến độ: ${tien_do}%`,
            timestamp: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Auto-complete if progress reaches 100%
    if (tien_do === 100 && updatedTask.trang_thai !== 'Hoàn thành') {
      await CongViecGiao.findOneAndUpdate(
        { task_id: req.params.id },
        {
          trang_thai: 'Chờ review',
          ngay_hoan_thanh_thuc_te: new Date()
        }
      );

      // Notify assigner
      await EventLogsUser.create({
        user_did: updatedTask.nguoi_giao_did,
        event_type: 'task_completed',
        message: `Công việc "${updatedTask.ten_cong_viec}" đã hoàn thành và chờ phê duyệt`,
        resource_type: 'cong_viec_giao',
        resource_id: updatedTask.task_id,
        timestamp: new Date()
      });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Approve task completion
const approveTask = async (req, res) => {
  try {
    const { danh_gia_chat_luong, diem_danh_gia, nhan_xet_nguoi_giao } = req.body;

    const updatedTask = await CongViecGiao.findOneAndUpdate(
      { task_id: req.params.id },
      {
        trang_thai: 'Hoàn thành',
        danh_gia_chat_luong,
        diem_danh_gia,
        nhan_xet_nguoi_giao,
        $push: {
          nhan_xet: {
            nguoi_nhan_xet_did: req.user?.employee_did,
            // Provide a default comment if none is given
            noi_dung: nhan_xet_nguoi_giao || `Công việc đã được phê duyệt bởi ${req.user?.employee_did}.`,
            timestamp: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Notify assignee
    await EventLogsUser.create({
      user_did: updatedTask.nguoi_thuc_hien_did,
      event_type: 'task_approved',
      message: `Công việc "${updatedTask.ten_cong_viec}" đã được phê duyệt`,
      resource_type: 'cong_viec_giao',
      resource_id: updatedTask.task_id,
      timestamp: new Date()
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete task (Admin only)
const deleteTask = async (req, res) => {
  try {
    // Check if user has admin permissions based on role_id
    const userRole = await RolesPermissions.findOne({ role_id: req.user.role_id });
    if (!userRole || userRole.ten_vai_tro !== 'Super Admin') {
      return res.status(403).json({ message: 'Access denied. Admin permissions required.' });
    }

    const deletedTask = await CongViecGiao.findOneAndDelete({ task_id: req.params.id });

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Log audit
    await AuditLogs.create({
      user_did: req.user?.employee_did,
      action: 'DELETE',
      resource_type: 'cong_viec_giao',
      resource_id: req.params.id,
      status: 'Success',
      timestamp: new Date()
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    // Log failed audit
    await AuditLogs.create({
      user_did: req.user?.employee_did,
      action: 'DELETE',
      resource_type: 'cong_viec_giao',
      resource_id: req.params.id,
      status: 'Failed',
      error_message: error.message,
      timestamp: new Date()
    });

    res.status(500).json({ message: error.message });
  }
};

// Get task statistics
const getTaskStats = async (req, res) => {
  try {
    const stats = await CongViecGiao.aggregate([
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Hoàn thành'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Đang thực hiện'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$ngay_ket_thuc_du_kien', new Date()] },
                    { $nin: ['$trang_thai', ['Hoàn thành', 'Hủy bỏ']] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgProgress: { $avg: '$tien_do' }
        }
      }
    ]);

    res.json(stats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      avgProgress: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload file to IPFS (placeholder - IPFS not available)
const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Placeholder response since IPFS is not available
    res.json({
      file_name: file.originalname,
      file_uri: `placeholder://${file.originalname}`,
      file_type: file.mimetype,
      file_size: file.size,
      message: 'File upload placeholder - IPFS not configured'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
};

// Attach file to task
const attachFileToTask = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { file_name, file_uri, file_type } = req.body;

    const updatedTask = await CongViecGiao.findOneAndUpdate(
      { task_id },
      {
        $push: {
          file_dinh_kem: {
            file_name,
            file_uri,
            file_type,
            uploaded_at: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Log audit
    await AuditLogs.create({
      user_did: req.user?.employee_did,
      action: 'ATTACH_FILE',
      resource_type: 'cong_viec_giao',
      resource_id: task_id,
      status: 'Success',
      timestamp: new Date()
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Generate AI insights for task
const generateAiInsights = async (req, res) => {
  try {
    const { task_id } = req.params;

    const task = await CongViecGiao.findOne({ task_id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Simple AI logic (in a real implementation, this would call an AI service)
    const today = new Date();
    const deadline = new Date(task.ngay_ket_thuc_du_kien);
    const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    let riskLevel = 'Thấp';
    let workloadScore = 50;
    const recommendations = [];

    // Risk assessment logic
    if (daysUntilDeadline < 0) {
      riskLevel = 'Cao';
      workloadScore = 90;
      recommendations.push('Công việc đã quá hạn, cần ưu tiên xử lý ngay');
    } else if (daysUntilDeadline <= 3) {
      riskLevel = 'Cao';
      workloadScore = 80;
      recommendations.push('Deadline sắp đến, cần tăng tốc độ thực hiện');
    } else if (daysUntilDeadline <= 7) {
      riskLevel = 'Trung bình';
      workloadScore = 65;
      recommendations.push('Cần theo dõi sát sao tiến độ công việc');
    }

    if (task.do_uu_tien === 'Khẩn cấp') {
      riskLevel = 'Cao';
      workloadScore += 20;
      recommendations.push('Đây là công việc ưu tiên cao, cần tập trung nguồn lực');
    }

    if (task.tien_do < 30 && daysUntilDeadline < 14) {
      recommendations.push('Tiến độ chậm, cần điều chỉnh kế hoạch thực hiện');
    }

    // Calculate predicted completion date
    const progressRate = task.tien_do / 100;
    const estimatedDaysLeft = task.gio_uoc_tinh ? (task.gio_uoc_tinh * (1 - progressRate)) / 8 : daysUntilDeadline;
    const predictedCompletionDate = new Date(today.getTime() + (estimatedDaysLeft * 24 * 60 * 60 * 1000));

    const aiInsights = {
      risk_level: riskLevel,
      predicted_completion_date: predictedCompletionDate,
      workload_score: Math.min(workloadScore, 100),
      recommendations
    };

    // Update task with AI insights
    const updatedTask = await CongViecGiao.findOneAndUpdate(
      { task_id },
      { ai_insights: aiInsights },
      { new: true, runValidators: true }
    );

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk create tasks
const bulkCreate = async (req, res) => {
  try {
    // Check if user has permission to create tasks based on role_id
    const userRole = await RolesPermissions.findOne({ role_id: req.user.role_id });
    if (!userRole || (userRole.ten_vai_tro !== 'Super Admin' && userRole.ten_vai_tro !== 'Manager')) {
      return res.status(403).json({ message: 'Access denied. Admin or Manager permissions required.' });
    }

    const tasks = req.body.tasks;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: 'Tasks array is required' });
    }

    const createdTasks = [];
    const errors = [];

    for (let i = 0; i < tasks.length; i++) {
      try {
        const taskData = {
          ...tasks[i],
          nguoi_giao_did: req.user.employee_did,
          task_id: `task_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          trang_thai: 'Chờ bắt đầu',
          tien_do: 0
        };

        const congViecGiao = new CongViecGiao(taskData);
        const newTask = await congViecGiao.save();
        createdTasks.push(newTask);

        // Create event log for assignee
        await EventLogsUser.create({
          user_did: taskData.nguoi_thuc_hien_did,
          event_type: 'task_assigned',
          message: `Bạn được giao công việc: ${taskData.ten_cong_viec}`,
          resource_type: 'cong_viec_giao',
          resource_id: newTask.task_id,
          timestamp: new Date()
        });
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    // Log audit
    await AuditLogs.create({
      user_did: req.user.employee_did,
      action: 'BULK_CREATE',
      resource_type: 'cong_viec_giao',
      resource_id: 'bulk_operation',
      status: errors.length === 0 ? 'Success' : 'Partial',
      timestamp: new Date(),
      details: { created: createdTasks.length, errors: errors.length }
    });

    res.status(201).json({
      message: `Created ${createdTasks.length} tasks${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      createdTasks,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk update tasks
const bulkUpdate = async (req, res) => {
  try {
    const { task_ids, updates } = req.body;

    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({ message: 'Task IDs array is required' });
    }

    const updatedTasks = [];
    const errors = [];

    for (const taskId of task_ids) {
      try {
        const updatedTask = await CongViecGiao.findOneAndUpdate(
          { task_id: taskId },
          updates,
          { new: true, runValidators: true }
        );

        if (updatedTask) {
          updatedTasks.push(updatedTask);
        } else {
          errors.push({ task_id: taskId, error: 'Task not found' });
        }
      } catch (error) {
        errors.push({ task_id: taskId, error: error.message });
      }
    }

    // Log audit
    await AuditLogs.create({
      user_did: req.user.employee_did,
      action: 'BULK_UPDATE',
      resource_type: 'cong_viec_giao',
      resource_id: 'bulk_operation',
      status: errors.length === 0 ? 'Success' : 'Partial',
      timestamp: new Date(),
      details: { updated: updatedTasks.length, errors: errors.length }
    });

    res.json({
      message: `Updated ${updatedTasks.length} tasks${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      updatedTasks,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk delete tasks
const bulkDelete = async (req, res) => {
  try {
    // Check if user has admin permissions based on role_id
    const userRole = await RolesPermissions.findOne({ role_id: req.user.role_id });
    if (!userRole || userRole.ten_vai_tro !== 'Super Admin') {
      return res.status(403).json({ message: 'Access denied. Admin permissions required.' });
    }

    const { task_ids } = req.body;

    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({ message: 'Task IDs array is required' });
    }

    const deletedTasks = [];
    const errors = [];

    for (const taskId of task_ids) {
      try {
        const deletedTask = await CongViecGiao.findOneAndDelete({ task_id: taskId });
        if (deletedTask) {
          deletedTasks.push(deletedTask);
        } else {
          errors.push({ task_id: taskId, error: 'Task not found' });
        }
      } catch (error) {
        errors.push({ task_id: taskId, error: error.message });
      }
    }

    // Log audit
    await AuditLogs.create({
      user_did: req.user.employee_did,
      action: 'BULK_DELETE',
      resource_type: 'cong_viec_giao',
      resource_id: 'bulk_operation',
      status: errors.length === 0 ? 'Success' : 'Partial',
      timestamp: new Date(),
      details: { deleted: deletedTasks.length, errors: errors.length }
    });

    res.json({
      message: `Deleted ${deletedTasks.length} tasks${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      deletedTasks,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed task statistics
const getDetailedTaskStats = async (req, res) => {
  try {
    const stats = await CongViecGiao.aggregate([
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Hoàn thành'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Đang thực hiện'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Chờ bắt đầu'] }, 1, 0] }
          },
          reviewTasks: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Chờ review'] }, 1, 0] }
          },
          pausedTasks: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Tạm dừng'] }, 1, 0] }
          },
          cancelledTasks: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Hủy bỏ'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$ngay_ket_thuc_du_kien', new Date()] },
                    { $nin: ['$trang_thai', ['Hoàn thành', 'Hủy bỏ']] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgProgress: { $avg: '$tien_do' },
          avgEstimatedHours: { $avg: '$gio_uoc_tinh' },
          totalEstimatedHours: { $sum: '$gio_uoc_tinh' },
          highPriorityTasks: {
            $sum: { $cond: [{ $eq: ['$do_uu_tien', 'Cao'] }, 1, 0] }
          },
          urgentTasks: {
            $sum: { $cond: [{ $eq: ['$do_uu_tien', 'Khẩn cấp'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [
              { $divide: ['$completedTasks', { $max: ['$totalTasks', 1] }] },
              100
            ]
          },
          overdueRate: {
            $multiply: [
              { $divide: ['$overdueTasks', { $max: ['$totalTasks', 1] }] },
              100
            ]
          }
        }
      }
    ]);

    // Get priority distribution
    const priorityStats = await CongViecGiao.aggregate([
      {
        $group: {
          _id: '$do_uu_tien',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get department stats
    const departmentStats = await CongViecGiao.aggregate([
      {
        $match: { phong_ban_id: { $ne: null } }
      },
      {
        $group: {
          _id: '$phong_ban_id',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$trang_thai', 'Hoàn thành'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [
              { $divide: ['$completedTasks', { $max: ['$totalTasks', 1] }] },
              100
            ]
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      reviewTasks: 0,
      pausedTasks: 0,
      cancelledTasks: 0,
      overdueTasks: 0,
      avgProgress: 0,
      avgEstimatedHours: 0,
      totalEstimatedHours: 0,
      highPriorityTasks: 0,
      urgentTasks: 0,
      completionRate: 0,
      overdueRate: 0
    };

    res.json({
      overview: result,
      priorityDistribution: priorityStats,
      departmentStats: departmentStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  getByEmployee,
  getByAssigner,
  getByStatus,
  getByPriority,
  getByDepartment,
  getOverdueTasks,
  create: createTask,
  update,
  updateProgress,
  approveTask,
  delete: deleteTask,
  getTaskStats,
  uploadFile,
  attachFileToTask,
  generateAiInsights,
  bulkCreate,
  bulkUpdate,
  bulkDelete,
  getDetailedTaskStats
};
