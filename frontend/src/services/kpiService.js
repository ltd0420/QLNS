import apiService from './apiService'; // This path is likely correct if kpiService is in the same folder

class KpiService {
  // Get all KPI criteria
  async getKpiCriteria() {
    return await apiService.getKpiCriteria();
  }

  // Get KPI criteria by ID
  async getKpiCriteriaById(kpiId) {
    return await apiService.getKpiCriteriaById(kpiId);
  }

  // Create new KPI criteria
  async createKpiCriteria(kpiData) {
    return await apiService.createKpiCriteria(kpiData);
  }

  // Update KPI criteria
  async updateKpiCriteria(kpiId, kpiData) {
    return await apiService.updateKpiCriteria(kpiId, kpiData);
  }

  // Delete KPI criteria
  async deleteKpiCriteria(kpiId) {
    return await apiService.deleteKpiCriteria(kpiId);
  }
}

export default new KpiService();
