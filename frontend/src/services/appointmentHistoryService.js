/**
 * Service để quản lý lịch sử đặt lịch qua chatbot
 */
class AppointmentHistoryService {
  /**
   * Lưu lịch sử đặt lịch qua chatbot
   * @param {Object} appointmentData - Dữ liệu lịch hẹn
   * @param {Object} chatContext - Ngữ cảnh chat
   * @param {string} bookingMethod - Phương thức đặt lịch (auto, manual)
   * @returns {Promise<Object>} - Kết quả lưu lịch sử
   */
  static async saveAppointmentHistory(
    appointmentData,
    chatContext,
    bookingMethod = "auto"
  ) {
    try {
      const historyData = {
        appointmentId: appointmentData.id,
        userId: appointmentData.userId,
        expertId: appointmentData.expertId,
        expertName: appointmentData.expertName,
        appointmentTime: appointmentData.appointmentTime,
        duration: appointmentData.duration || 60,
        meetingType: appointmentData.meetingType || "online",
        bookingMethod: bookingMethod,
        chatContext: {
          conversationId: chatContext.conversationId,
          messageCount: chatContext.messageCount,
          userIntent: chatContext.userIntent,
          suggestedBy: chatContext.suggestedBy || "chatbot",
          keywords: chatContext.keywords || [],
        },
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };

      const response = await fetch("/api/appointment-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(historyData),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: "Lịch sử đặt lịch đã được lưu",
        };
      } else {
        throw new Error("Không thể lưu lịch sử đặt lịch");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi khi lưu lịch sử đặt lịch",
      };
    }
  }

  /**
   * Lấy lịch sử đặt lịch của user
   * @param {number} userId - ID của user
   * @param {Object} filters - Bộ lọc
   * @returns {Promise<Object>} - Lịch sử đặt lịch
   */
  static async getAppointmentHistory(userId, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        userId: userId,
        ...filters,
      });

      const response = await fetch(`/api/appointment-history?${queryParams}`, {
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
        throw new Error("Không thể lấy lịch sử đặt lịch");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Lấy thống kê đặt lịch qua chatbot
   * @param {number} userId - ID của user
   * @param {string} period - Khoảng thời gian (7d, 30d, 90d, 1y)
   * @returns {Promise<Object>} - Thống kê đặt lịch
   */
  static async getAppointmentStats(userId, period = "30d") {
    try {
      const response = await fetch(
        `/api/appointment-history/stats?userId=${userId}&period=${period}`,
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
        throw new Error("Không thể lấy thống kê đặt lịch");
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
   * Cập nhật trạng thái lịch hẹn
   * @param {string} appointmentId - ID lịch hẹn
   * @param {string} status - Trạng thái mới
   * @param {string} reason - Lý do thay đổi
   * @returns {Promise<Object>} - Kết quả cập nhật
   */
  static async updateAppointmentStatus(appointmentId, status, reason = "") {
    try {
      const updateData = {
        status: status,
        reason: reason,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(
        `/api/appointment-history/${appointmentId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: "Trạng thái đã được cập nhật",
        };
      } else {
        throw new Error("Không thể cập nhật trạng thái");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi khi cập nhật trạng thái",
      };
    }
  }

  /**
   * Lấy danh sách lịch hẹn sắp tới
   * @param {number} userId - ID của user
   * @param {number} limit - Số lượng tối đa
   * @returns {Promise<Object>} - Danh sách lịch hẹn sắp tới
   */
  static async getUpcomingAppointments(userId, limit = 5) {
    try {
      const response = await fetch(
        `/api/appointment-history/upcoming?userId=${userId}&limit=${limit}`,
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
        throw new Error("Không thể lấy lịch hẹn sắp tới");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Tạo conversation ID duy nhất
   * @returns {string} - Conversation ID
   */
  static generateConversationId() {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Phân tích intent của user từ tin nhắn
   * @param {string} message - Tin nhắn của user
   * @returns {Object} - Intent và keywords
   */
  static analyzeUserIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Keywords cho đặt lịch
    const appointmentKeywords = [
      "đặt lịch",
      "hẹn",
      "tư vấn",
      "gặp chuyên gia",
      "appointment",
      "booking",
      "lịch hẹn",
      "tư vấn tâm lý",
      "trò chuyện",
    ];

    // Keywords cho hủy lịch
    const cancelKeywords = [
      "hủy",
      "cancel",
      "bỏ lịch",
      "không cần",
      "thay đổi",
    ];

    // Keywords cho thay đổi lịch
    const rescheduleKeywords = [
      "thay đổi",
      "đổi lịch",
      "reschedule",
      "dời lịch",
      "chuyển lịch",
    ];

    const keywords = [];
    let intent = "general";

    if (appointmentKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      intent = "book_appointment";
      keywords.push(
        ...appointmentKeywords.filter((keyword) =>
          lowerMessage.includes(keyword)
        )
      );
    } else if (
      cancelKeywords.some((keyword) => lowerMessage.includes(keyword))
    ) {
      intent = "cancel_appointment";
      keywords.push(
        ...cancelKeywords.filter((keyword) => lowerMessage.includes(keyword))
      );
    } else if (
      rescheduleKeywords.some((keyword) => lowerMessage.includes(keyword))
    ) {
      intent = "reschedule_appointment";
      keywords.push(
        ...rescheduleKeywords.filter((keyword) =>
          lowerMessage.includes(keyword)
        )
      );
    }

    return {
      intent: intent,
      keywords: [...new Set(keywords)], // Loại bỏ duplicate
      confidence: keywords.length > 0 ? Math.min(keywords.length * 0.3, 1) : 0,
    };
  }
}

export default AppointmentHistoryService;
