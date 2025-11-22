import axios from 'axios';
import authService from './authService';
import io from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token expiration
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          authService.logout();
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );

    // Initialize Socket.IO connection
    this.socket = null;
    this.notificationCallbacks = [];
  }

  // Generic HTTP methods for custom endpoints
  async get(endpoint, params = {}) {
    const response = await this.client.get(endpoint, { params });
    return response;
  }

  async post(endpoint, data = {}) {
    const response = await this.client.post(endpoint, data);
    return response;
  }

  async put(endpoint, data = {}) {
    const response = await this.client.put(endpoint, data);
    return response;
  }

  async delete(endpoint) {
    const response = await this.client.delete(endpoint);
    return response;
  }

  // Initialize Socket.IO connection
  initSocket(userDid) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(API_BASE_URL.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
      this.socket.emit('join', userDid);
    });

    this.socket.on('notification', (notification) => {
      console.log('Received notification:', notification);
      this.notificationCallbacks.forEach(callback => callback(notification));
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from notification server:', reason);
      // Don't automatically reconnect to avoid loops
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  // Add notification callback
  onNotification(callback) {
    this.notificationCallbacks.push(callback);
  }

  // Remove notification callback
  offNotification(callback) {
    this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
  }

  // Disconnect socket
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Employee Profile
  async getEmployeeProfile(employeeDid) {
    const response = await this.client.get(`/employees/${employeeDid}`);
    return response.data;
  }

  async updateEmployeeProfile(employeeDid, data) {
    const response = await this.client.put(`/employees/${employeeDid}`, data);
    return response.data;
  }

  // Update user wallet address
  async updateUserWallet(employeeDid, walletAddress) {
    const response = await this.client.put(`/employees/${employeeDid}/wallet`, { walletAddress });
    return response.data;
  }

  // Attendance
  async getAttendanceByEmployee(employeeDid, params = {}) {
    const response = await this.client.get(`/attendance/employee/${employeeDid}`, { params });
    return response.data;
  }

  async checkIn(data) {
    const response = await this.client.post('/attendance/checkin', data);
    return response.data;
  }

  async checkOut(data) {
    const response = await this.client.post('/attendance/checkout', data);
    return response.data;
  }

  // KPI Evaluations
  async getKpiEvaluations(employeeDid) {
    const response = await this.client.get(`/kpi/evaluations/${employeeDid}`);
    return response.data;
  }

  // Customer Feedback
  async getCustomerFeedback(employeeDid) {
    const response = await this.client.get(`/reviews/${employeeDid}`);
    return response.data;
  }

  async submitCustomerFeedback(payload, isFormData = false) {
    const config = isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};
    const response = await this.client.post('/reviews', payload, config);
    return response.data;
  }

  async updateFeedbackStatus(feedbackId, statusData) {
    const response = await this.client.put(`/reviews/${feedbackId}/status`, statusData);
    return response.data;
  }

  async getAllCustomerFeedback() {
    const response = await this.client.get('/reviews');
    return response.data;
  }

  // Employee Ranking
  async getEmployeeRanking(employeeDid) {
    const response = await this.client.get(`/rankings/${employeeDid}`);
    return response.data;
  }

  async getAttritionOverview(params = {}) {
    const response = await this.client.get('/ai/attrition/overview', { params });
    return response.data;
  }

  // AI Model Metadata
  async getCnnMetadata() {
    const response = await this.client.get('/ai/models/cnn/metadata');
    return response.data;
  }

  async getPcaMetadata() {
    const response = await this.client.get('/ai/models/pca/metadata');
    return response.data;
  }

  // Salary & Bonus
  async getSalaryInfo(employeeDid) {
    const response = await this.client.get(`/payroll/${employeeDid}`);
    return response.data;
  }

  // QR Authentication with Blockchain support
  async getQrCode(employeeDid) {
    const response = await this.client.get(`/qr/employee/${employeeDid}`);
    return response.data;
  }

  async generateNewQrCode(employeeDid, walletAddress) {
    const response = await this.client.post(`/qr/generate/${employeeDid}`, { walletAddress });
    return response.data;
  }

  async validateQrForLogin(qrData) {
    const response = await this.client.post('/qr/validate-login', qrData);
    return response.data;
  }

  // Get smart contract logs for attendance record
  async getSmartContractLogsForAttendance(recordId) {
    const response = await this.client.get(`/logs/contracts/attendance/${recordId}`);
    return response.data;
  }

  // Notifications & Logs
  async getNotifications(employeeDid) {
    const response = await this.client.get(`/logs/events/${employeeDid}`);
    return response.data;
  }

  async markNotificationAsRead(notificationId) {
    const response = await this.client.put(`/logs/events/${notificationId}`, { is_read: true });
    return response.data;
  }

  // Departments
  async getDepartments() {
    const response = await this.client.get('/departments');
    return response.data;
  }

  async createDepartment(departmentData) {
    const response = await this.client.post('/departments', departmentData);
    return response.data;
  }

  async updateDepartment(departmentId, departmentData) {
    const response = await this.client.put(`/departments/${departmentId}`, departmentData);
    return response.data;
  }

  async deleteDepartment(departmentId) {
    const response = await this.client.delete(`/departments/${departmentId}`);
    return response.data;
  }

  // Employees
  async getEmployees() {
    const response = await this.client.get('/employees');
    return response.data;
  }

  async createEmployee(employeeData) {
    const response = await this.client.post('/employees', employeeData);
    return response.data;
  }

  async updateEmployee(employeeId, employeeData) {
    const response = await this.client.put(`/employees/${employeeId}`, employeeData);
    return response.data;
  }

  async deleteEmployee(employeeId) {
    const response = await this.client.delete(`/employees/${employeeId}`);
    return response.data;
  }

  // Audit Logs
  async getAuditLogs(employeeDid) {
    const response = await this.client.get(`/logs/audit/${employeeDid}`);
    return response.data;
  }

  // Consent Management
  async giveConsent(consentData) {
    const response = await this.client.post('/consent', consentData);
    return response.data;
  }

  async revokeConsent(consentId) {
    const response = await this.client.put(`/consent/${consentId}/revoke`);
    return response.data;
  }

  async checkConsentValidity(consentId) {
    const response = await this.client.get(`/consent/${consentId}/valid`);
    return response.data;
  }

  async checkActiveConsent(employeeDid, consentType) {
    const response = await this.client.get(`/consent/employee/${employeeDid}/type/${consentType}/active`);
    return response.data;
  }

  async getEmployeeConsents(employeeDid) {
    const response = await this.client.get(`/consent/employee/${employeeDid}`);
    return response.data;
  }

  async getConsentDetails(consentId) {
    const response = await this.client.get(`/consent/${consentId}`);
    return response.data;
  }

  async deleteReadNotifications(employeeDid) {
    const response = await this.client.delete(`/logs/events/read/${employeeDid}`);
    return response.data;
  }

  // Department Information
  async getDepartments() {
    const response = await this.client.get('/departments');
    return response.data;
  }

  async getAllDepartments() {
    const response = await this.client.get('/departments');
    return response.data;
  }

  async getDepartmentById(departmentId) {
    const response = await this.client.get(`/departments/${departmentId}`);
    return response.data;
  }

  async getEmployeesByDepartment(departmentId) {
    const response = await this.client.get(`/employees/department/${departmentId}`);
    return response.data;
  }

  async assignEmployeeToDepartment(employeeDid, departmentId) {
    const response = await this.client.post(`/departments/${departmentId}/assign-employee`, { employee_did: employeeDid });
    return response.data;
  }

  async removeEmployeeFromDepartment(employeeDid) {
    const response = await this.client.delete(`/departments/remove-employee/${employeeDid}`);
    return response.data;
  }

  async getAllEmployees() {
    const response = await this.client.get('/employees');
    return response.data;
  }

  // Task Management
  async getTasksByEmployee(employeeDid) {
    const response = await this.client.get(`/tasks/employee/${employeeDid}`);
    return response.data;
  }

  async getAllTasks() {
    const response = await this.client.get('/tasks');
    return response.data;
  }

  async getTaskById(taskId) {
    const response = await this.client.get(`/tasks/${taskId}`);
    return response.data;
  }

  async createTask(taskData) {
    const response = await this.client.post('/tasks', taskData);
    return response.data;
  }

  async updateTask(taskId, taskData) {
    const response = await this.client.put(`/tasks/${taskId}`, taskData);
    return response.data;
  }

  async updateTaskProgress(taskId, progressData) {
    const response = await this.client.put(`/tasks/${taskId}/progress`, progressData);
    return response.data;
  }

  async approveTask(taskId, approvalData) {
    const response = await this.client.put(`/tasks/${taskId}/approve`, approvalData);
    return response.data;
  }

  async deleteTask(taskId) {
    const response = await this.client.delete(`/tasks/${taskId}`);
    return response.data;
  }

  async getTaskStats() {
    const response = await this.client.get('/tasks/stats');
    return response.data;
  }

  async getTasksByStatus(status) {
    const response = await this.client.get(`/tasks/status/${status}`);
    return response.data;
  }

  async getTasksByPriority(priority) {
    const response = await this.client.get(`/tasks/priority/${priority}`);
    return response.data;
  }

  async getTasksByDepartment(departmentId) {
    const response = await this.client.get(`/tasks/department/${departmentId}`);
    return response.data;
  }

  async getOverdueTasks() {
    const response = await this.client.get('/tasks/overdue');
    return response.data;
  }

  // File upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/tasks/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async attachFileToTask(taskId, fileData) {
    const response = await this.client.post(`/tasks/${taskId}/attach`, fileData);
    return response.data;
  }

  // AI Insights
  async generateAiInsights(taskId) {
    const response = await this.client.post(`/tasks/${taskId}/ai-insights`);
    return response.data;
  }

  // Bulk operations
  async bulkCreateTasks(tasks) {
    const response = await this.client.post('/tasks/bulk', { tasks });
    return response.data;
  }

  async bulkUpdateTasks(taskIds, updates) {
    const response = await this.client.put('/tasks/bulk', { task_ids: taskIds, updates });
    return response.data;
  }

  async bulkDeleteTasks(taskIds) {
    const response = await this.client.delete('/tasks/bulk', { data: { task_ids: taskIds } });
    return response.data;
  }

  // Enhanced statistics
  async getDetailedTaskStats() {
    const response = await this.client.get('/tasks/stats/detailed');
    return response.data;
  }

  // KPI Criteria
  async getAllKpiCriteria() {
    const response = await this.client.get('/kpi/criteria');
    return response.data;
  }

  async getKpiCriteriaById(kpiId) {
    const response = await this.client.get(`/kpi/criteria/${kpiId}`);
    return response.data;
  }

  async createKpiCriteria(kpiData) {
    const response = await this.client.post('/kpi/criteria', kpiData);
    return response.data;
  }

  async updateKpiCriteria(kpiId, kpiData) {
    const response = await this.client.put(`/kpi/criteria/${kpiId}`, kpiData);
    return response.data;
  }

  async deleteKpiCriteria(kpiId) {
    const response = await this.client.delete(`/kpi/criteria/${kpiId}`);
    return response.data;
  }
}

export default new ApiService();
