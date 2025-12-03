import { authFetch } from "../authFetch";

/**
 * Service để gọi các API analytics và reporting
 */
class AnalyticsService {
  /**
   * Lấy xu hướng sức khỏe tâm thần theo thời gian
   * @param {number} days - Số ngày (mặc định 365)
   * @returns {Promise<Array>} - Danh sách xu hướng
   */
  async getMentalHealthTrends(days = 365) {
    try {
      const response = await authFetch(`/api/analytics/trends?days=${days}`);
      if (!response.ok) {
        throw new Error("Failed to fetch mental health trends");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching mental health trends:", error);
      throw error;
    }
  }

  /**
   * So sánh kết quả test theo thời gian
   * @returns {Promise<Array>} - Danh sách so sánh
   */
  async compareTestResults() {
    try {
      const response = await authFetch("/api/analytics/compare");
      if (!response.ok) {
        throw new Error("Failed to fetch test comparisons");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching test comparisons:", error);
      throw error;
    }
  }

  /**
   * Lấy dữ liệu cho biểu đồ tiến độ cá nhân
   * @param {number} days - Số ngày (mặc định 90)
   * @returns {Promise<Object>} - Dữ liệu biểu đồ
   */
  async getProgressChart(days = 90) {
    try {
      const response = await authFetch(`/api/analytics/progress?days=${days}`);
      if (!response.ok) {
        throw new Error("Failed to fetch progress chart");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching progress chart:", error);
      throw error;
    }
  }

  /**
   * Lấy tổng quan analytics
   * @returns {Promise<Object>} - Tổng quan analytics
   */
  async getAnalyticsSummary() {
    try {
      const response = await authFetch("/api/analytics/summary");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics summary");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      throw error;
    }
  }

  /**
   * Export test result to PDF
   * @param {number} testResultId - ID của test result
   * @returns {Promise<Blob>} - PDF file
   */
  async exportTestResultPDF(testResultId) {
    try {
      const response = await authFetch(
        `/api/analytics/export/pdf/test/${testResultId}`
      );
      if (!response.ok) {
        throw new Error("Failed to export test result PDF");
      }
      return await response.blob();
    } catch (error) {
      console.error("Error exporting test result PDF:", error);
      throw error;
    }
  }

  /**
   * Export analytics summary to PDF
   * @returns {Promise<Blob>} - PDF file
   */
  async exportAnalyticsPDF() {
    try {
      const response = await authFetch("/api/analytics/export/pdf/summary");
      if (!response.ok) {
        throw new Error("Failed to export analytics PDF");
      }
      return await response.blob();
    } catch (error) {
      console.error("Error exporting analytics PDF:", error);
      throw error;
    }
  }

  /**
   * Export test results to CSV
   * @returns {Promise<Blob>} - CSV file
   */
  async exportToCSV() {
    try {
      const response = await authFetch("/api/analytics/export/csv");
      if (!response.ok) {
        throw new Error("Failed to export to CSV");
      }
      return await response.blob();
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      throw error;
    }
  }

  /**
   * Export test results to Excel
   * @returns {Promise<Blob>} - Excel file
   */
  async exportToExcel() {
    try {
      const response = await authFetch("/api/analytics/export/excel");
      if (!response.ok) {
        throw new Error("Failed to export to Excel");
      }
      return await response.blob();
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw error;
    }
  }

  /**
   * Helper method để download file
   * @param {Blob} blob - File blob
   * @param {string} filename - Tên file
   */
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

const analyticsServiceInstance = new AnalyticsService();
export default analyticsServiceInstance;
