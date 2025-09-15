/**
 * Service để gửi thông báo real-time
 */
class NotificationService {
  /**
   * Gửi thông báo đặt lịch thành công
   * @param {Object} appointmentData - Dữ liệu lịch hẹn
   * @param {Object} user - Thông tin user
   * @returns {Promise<Object>} - Kết quả gửi thông báo
   */
  static async sendAppointmentConfirmation(appointmentData, user) {
    try {
      const notificationData = {
        type: "appointment_confirmation",
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        appointment: {
          id: appointmentData.id,
          expertName: appointmentData.expertName,
          appointmentTime: appointmentData.appointmentTime,
          duration: appointmentData.duration || 60,
          meetingType: appointmentData.meetingType || "online",
          meetingLink: appointmentData.meetingLink,
        },
        channels: ["email", "sms", "push"], // Các kênh gửi thông báo
      };

      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: "Thông báo đã được gửi thành công",
        };
      } else {
        throw new Error("Gửi thông báo thất bại");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Không thể gửi thông báo",
      };
    }
  }

  /**
   * Gửi thông báo nhắc nhở lịch hẹn
   * @param {Object} appointmentData - Dữ liệu lịch hẹn
   * @param {string} reminderType - Loại nhắc nhở (1h, 24h, 1week)
   * @returns {Promise<Object>} - Kết quả gửi thông báo
   */
  static async sendAppointmentReminder(appointmentData, reminderType = "1h") {
    try {
      const notificationData = {
        type: "appointment_reminder",
        appointment: appointmentData,
        reminderType: reminderType,
        channels: ["email", "sms", "push"],
      };

      const response = await fetch("/api/notifications/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: "Nhắc nhở đã được lên lịch",
        };
      } else {
        throw new Error("Lên lịch nhắc nhở thất bại");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Không thể lên lịch nhắc nhở",
      };
    }
  }

  /**
   * Gửi thông báo hủy lịch hẹn
   * @param {Object} appointmentData - Dữ liệu lịch hẹn
   * @param {string} reason - Lý do hủy
   * @returns {Promise<Object>} - Kết quả gửi thông báo
   */
  static async sendAppointmentCancellation(appointmentData, reason) {
    try {
      const notificationData = {
        type: "appointment_cancellation",
        appointment: appointmentData,
        reason: reason,
        channels: ["email", "sms", "push"],
      };

      const response = await fetch("/api/notifications/cancellation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: "Thông báo hủy lịch đã được gửi",
        };
      } else {
        throw new Error("Gửi thông báo hủy thất bại");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Không thể gửi thông báo hủy",
      };
    }
  }

  /**
   * Lấy danh sách thông báo của user
   * @param {number} page - Trang hiện tại
   * @param {number} limit - Số lượng mỗi trang
   * @returns {Promise<Object>} - Danh sách thông báo
   */
  static async getNotifications(page = 1, limit = 10) {
    try {
      const response = await fetch(
        `/api/notifications?page=${page}&limit=${limit}`,
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
        throw new Error("Không thể lấy danh sách thông báo");
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
   * Đánh dấu thông báo đã đọc
   * @param {string} notificationId - ID thông báo
   * @returns {Promise<Object>} - Kết quả cập nhật
   */
  static async markAsRead(notificationId) {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        return {
          success: true,
          message: "Đã đánh dấu đã đọc",
        };
      } else {
        throw new Error("Không thể đánh dấu đã đọc");
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default NotificationService;
