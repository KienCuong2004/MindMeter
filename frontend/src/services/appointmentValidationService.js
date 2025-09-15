/**
 * Service để validation thời gian đặt lịch
 */
class AppointmentValidationService {
  /**
   * Kiểm tra thời gian đặt lịch có hợp lệ không
   * @param {Date} appointmentTime - Thời gian đặt lịch
   * @param {Object} expertSchedule - Lịch làm việc của chuyên gia
   * @returns {Object} - { isValid: boolean, message: string }
   */
  static validateAppointmentTime(appointmentTime, expertSchedule) {
    const now = new Date();
    const appointment = new Date(appointmentTime);

    // 1. Kiểm tra thời gian không được trong quá khứ
    if (appointment <= now) {
      return {
        isValid: false,
        message: "Thời gian đặt lịch không được trong quá khứ",
      };
    }

    // 2. Kiểm tra thời gian phải cách hiện tại ít nhất 2 giờ
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (appointment < twoHoursFromNow) {
      return {
        isValid: false,
        message: "Thời gian đặt lịch phải cách hiện tại ít nhất 2 giờ",
      };
    }

    // 3. Kiểm tra thời gian không được quá 30 ngày trong tương lai
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    if (appointment > thirtyDaysFromNow) {
      return {
        isValid: false,
        message: "Thời gian đặt lịch không được quá 30 ngày trong tương lai",
      };
    }

    // 4. Kiểm tra thời gian có trong giờ làm việc không
    if (expertSchedule) {
      const dayOfWeek = appointment.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
      const hour = appointment.getHours();
      const minute = appointment.getMinutes();

      // Kiểm tra ngày trong tuần
      const workingDays = expertSchedule.workingDays || [1, 2, 3, 4, 5]; // Thứ 2-6
      if (!workingDays.includes(dayOfWeek)) {
        return {
          isValid: false,
          message: "Chuyên gia không làm việc vào ngày này",
        };
      }

      // Kiểm tra giờ làm việc
      const startHour = expertSchedule.startHour || 8;
      const endHour = expertSchedule.endHour || 17;

      if (hour < startHour || hour >= endHour) {
        return {
          isValid: false,
          message: `Chuyên gia chỉ làm việc từ ${startHour}:00 đến ${endHour}:00`,
        };
      }

      // Kiểm tra thời gian phải là giờ chẵn (0, 30 phút)
      if (minute !== 0 && minute !== 30) {
        return {
          isValid: false,
          message: "Thời gian đặt lịch phải là giờ chẵn (ví dụ: 9:00, 9:30)",
        };
      }
    }

    // 5. Kiểm tra thời gian không trùng với lịch nghỉ
    if (expertSchedule && expertSchedule.breaks) {
      for (const breakTime of expertSchedule.breaks) {
        const breakStart = new Date(breakTime.startTime);
        const breakEnd = new Date(breakTime.endTime);

        if (appointment >= breakStart && appointment <= breakEnd) {
          return {
            isValid: false,
            message: "Thời gian này chuyên gia đang nghỉ",
          };
        }
      }
    }

    return {
      isValid: true,
      message: "Thời gian đặt lịch hợp lệ",
    };
  }

  /**
   * Lấy danh sách thời gian có thể đặt lịch
   * @param {Object} expertSchedule - Lịch làm việc của chuyên gia
   * @param {Date} startDate - Ngày bắt đầu tìm kiếm
   * @param {number} days - Số ngày tìm kiếm
   * @returns {Array} - Danh sách thời gian có thể đặt
   */
  static getAvailableTimeSlots(
    expertSchedule,
    startDate = new Date(),
    days = 7
  ) {
    const availableSlots = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Bỏ qua ngày trong quá khứ
      if (currentDate < now) continue;

      const dayOfWeek = currentDate.getDay();
      const workingDays = expertSchedule?.workingDays || [1, 2, 3, 4, 5];

      if (!workingDays.includes(dayOfWeek)) continue;

      const startHour = expertSchedule?.startHour || 8;
      const endHour = expertSchedule?.endHour || 17;

      // Tạo các slot 30 phút
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotTime = new Date(currentDate);
          slotTime.setHours(hour, minute, 0, 0);

          // Kiểm tra slot có hợp lệ không
          const validation = this.validateAppointmentTime(
            slotTime,
            expertSchedule
          );
          if (validation.isValid) {
            availableSlots.push({
              time: slotTime,
              display: slotTime.toLocaleString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            });
          }
        }
      }
    }

    return availableSlots;
  }

  /**
   * Format thời gian hiển thị
   * @param {Date} date - Thời gian
   * @returns {string} - Thời gian đã format
   */
  static formatAppointmentTime(date) {
    return new Date(date).toLocaleString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

export default AppointmentValidationService;
