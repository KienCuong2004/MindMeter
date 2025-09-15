/**
 * Service để theo dõi analytics và tỷ lệ thành công của auto-booking
 */
class AnalyticsService {
  /**
   * Ghi lại sự kiện auto-booking
   * @param {Object} eventData - Dữ liệu sự kiện
   * @returns {Promise<Object>} - Kết quả ghi sự kiện
   */
  static async trackAutoBookingEvent(eventData) {
    try {
      const analyticsData = {
        eventType: "auto_booking",
        timestamp: new Date().toISOString(),
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        conversationId: eventData.conversationId,
        data: {
          success: eventData.success,
          appointmentId: eventData.appointmentId,
          expertId: eventData.expertId,
          expertName: eventData.expertName,
          appointmentTime: eventData.appointmentTime,
          bookingMethod: eventData.bookingMethod || "auto",
          userIntent: eventData.userIntent,
          keywords: eventData.keywords || [],
          responseTime: eventData.responseTime,
          errorMessage: eventData.errorMessage,
          userRole: eventData.userRole,
          userPlan: eventData.userPlan,
        },
      };

      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(analyticsData),
      });

      if (response.ok) {
        return {
          success: true,
          message: "Sự kiện đã được ghi lại",
        };
      } else {
        throw new Error("Không thể ghi sự kiện analytics");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lấy thống kê tỷ lệ thành công auto-booking
   * @param {Object} filters - Bộ lọc thời gian và điều kiện
   * @returns {Promise<Object>} - Thống kê auto-booking
   */
  static async getAutoBookingStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
      });

      const response = await fetch(
        `/api/analytics/auto-booking-stats?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result,
        };
      } else {
        throw new Error("Không thể lấy thống kê auto-booking");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Lấy thống kê tổng quan chatbot
   * @param {Object} filters - Bộ lọc
   * @returns {Promise<Object>} - Thống kê chatbot
   */
  static async getChatbotStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
      });

      const response = await fetch(
        `/api/analytics/chatbot-stats?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result,
        };
      } else {
        throw new Error("Không thể lấy thống kê chatbot");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Lấy thống kê user engagement
   * @param {Object} filters - Bộ lọc
   * @returns {Promise<Object>} - Thống kê engagement
   */
  static async getUserEngagementStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
      });

      const response = await fetch(
        `/api/analytics/user-engagement?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result,
        };
      } else {
        throw new Error("Không thể lấy thống kê engagement");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Lấy dashboard analytics cho admin
   * @param {Object} filters - Bộ lọc
   * @returns {Promise<Object>} - Dashboard analytics
   */
  static async getDashboardAnalytics(filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
      });

      const response = await fetch(`/api/analytics/dashboard?${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result,
        };
      } else {
        throw new Error("Không thể lấy dashboard analytics");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Ghi lại sự kiện user interaction
   * @param {string} eventType - Loại sự kiện
   * @param {Object} eventData - Dữ liệu sự kiện
   * @returns {Promise<Object>} - Kết quả ghi sự kiện
   */
  static async trackUserInteraction(eventType, eventData) {
    try {
      const analyticsData = {
        eventType: eventType,
        timestamp: new Date().toISOString(),
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        data: eventData,
      };

      const response = await fetch("/api/analytics/track-interaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(analyticsData),
      });

      if (response.ok) {
        return {
          success: true,
          message: "Sự kiện interaction đã được ghi lại",
        };
      } else {
        throw new Error("Không thể ghi sự kiện interaction");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Tính toán tỷ lệ thành công
   * @param {Array} events - Danh sách sự kiện
   * @returns {Object} - Tỷ lệ thành công
   */
  static calculateSuccessRate(events) {
    if (!events || events.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
      };
    }

    const successful = events.filter((event) => event.success).length;
    const failed = events.length - successful;
    const successRate = (successful / events.length) * 100;

    return {
      total: events.length,
      successful: successful,
      failed: failed,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Tạo session ID duy nhất
   * @returns {string} - Session ID
   */
  static generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Lấy thời gian phản hồi trung bình
   * @param {Array} events - Danh sách sự kiện
   * @returns {number} - Thời gian phản hồi trung bình (ms)
   */
  static calculateAverageResponseTime(events) {
    if (!events || events.length === 0) return 0;

    const responseTimes = events
      .filter((event) => event.responseTime)
      .map((event) => event.responseTime);

    if (responseTimes.length === 0) return 0;

    const total = responseTimes.reduce((sum, time) => sum + time, 0);
    return Math.round(total / responseTimes.length);
  }
}

export default AnalyticsService;
