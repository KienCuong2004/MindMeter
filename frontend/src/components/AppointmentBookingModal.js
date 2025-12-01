import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  XMarkIcon,
  CalendarIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { authFetch } from "../authFetch";
import logger from "../utils/logger";

const AppointmentBookingModal = ({
  isOpen,
  onClose,
  expertId,
  expertName,
  onAppointmentCreated,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [consultationType, setConsultationType] = useState("ONLINE");
  const [notes, setNotes] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // Lấy ngày hiện tại và 7 ngày tiếp theo
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Fetch available slots từ API khi chọn ngày
  useEffect(() => {
    if (selectedDate && expertId && selectedDuration) {
      const fetchAvailableSlots = async () => {
        try {
          setLoading(true);
          const response = await authFetch(
            "/api/appointments/available-slots",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                expertId: expertId,
                startDate: selectedDate,
                endDate: selectedDate,
                durationMinutes: selectedDuration,
                consultationType: consultationType || "ONLINE",
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Format slots từ API để hiển thị
            const formattedSlots =
              data.availableSlots?.map((slot) => {
                const slotDate = new Date(slot.startTime);
                return {
                  startTime: slot.startTime,
                  durationMinutes: slot.durationMinutes || selectedDuration,
                  isAvailable: slot.isAvailable !== false,
                  displayTime: `${slotDate
                    .getHours()
                    .toString()
                    .padStart(2, "0")}:${slotDate
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`,
                };
              }) || [];
            setAvailableSlots(formattedSlots);
            setError(""); // Clear any previous errors
          } else {
            const errorText = await response.text();
            logger.error("Error fetching available slots:", {
              status: response.status,
              body: errorText,
            });
            setError(
              t("errorFetchingSlots") || "Không thể tải danh sách giờ hẹn"
            );
            setAvailableSlots([]);
          }
        } catch (error) {
          logger.error("Error fetching available slots:", error);
          setError(
            t("errorFetchingSlots") || "Không thể tải danh sách giờ hẹn"
          );
          setAvailableSlots([]);
        } finally {
          setLoading(false);
        }
      };

      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, expertId, selectedDuration, consultationType]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleTimeSelect = (slot) => {
    // Chỉ cho phép chọn slot khả dụng
    if (slot.isAvailable !== false) {
      setSelectedTime(slot.startTime);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setError(t("pleaseSelectDateAndTime"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Format appointmentDate để match với backend pattern: yyyy-MM-dd'T'HH:mm:ss
      // Backend expect LocalDateTime format without timezone
      let formattedAppointmentDate = selectedTime;
      if (selectedTime) {
        // Parse và format lại để đảm bảo format đúng (không có timezone, không có milliseconds)
        const date = new Date(selectedTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        formattedAppointmentDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      }

      // Tạo appointment payload theo định dạng backend mong đợi
      const appointmentData = {
        expertId,
        appointmentDate: formattedAppointmentDate,
        durationMinutes: selectedDuration,
        consultationType,
        notes,
        meetingLocation:
          consultationType === "IN_PERSON" ? meetingLocation : "",
        meetingLink: consultationType === "ONLINE" ? meetingLink : "", // Có thể để trống để backend tự generate
        status: "PENDING",
      };

      // Gửi API để tạo lịch hẹn thực sự
      const response = await authFetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        // Đọc chi tiết lỗi từ server để hiển thị rõ ràng
        let serverMessage = "";
        try {
          serverMessage = await response.text();
        } catch {}
        throw new Error(serverMessage || t("cannotBookAppointment"));
      }

      const createdAppointment = await response.json();
      // Bổ sung expertName nếu backend không trả về
      if (createdAppointment && !createdAppointment.expertName && expertName) {
        createdAppointment.expertName = expertName;
      }

      // Lưu appointment và hiển thị modal thành công
      setCreatedAppointment(createdAppointment);
      setShowSuccessModal(true);

      // KHÔNG gọi callback ngay lập tức để modal thành công có thể hiển thị
      // Callback sẽ được gọi khi user ấn "Hoàn tất" hoặc "Đặt lịch khác"
      // if (onAppointmentCreated) {
      //   onAppointmentCreated();
      // }
    } catch (error) {
      // Error creating appointment
      setError(
        typeof error?.message === "string" && error.message
          ? error.message
          : t("errorOccurredWhileBooking")
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {expertName &&
              expertName.trim() !== "" &&
              !expertName.includes("{{") &&
              !expertName.includes("expertName")
                ? t("appointmentWith").replace("{{expertName}}", expertName)
                : t("bookAppointment")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Chọn ngày */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t("selectDate")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {getAvailableDates().map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() =>
                      handleDateSelect(date.toISOString().split("T")[0])
                    }
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      selectedDate === date.toISOString().split("T")[0]
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatDate(date)}
                    </div>
                  </button>
                ))}
              </div>
              {selectedDate && (
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t("continue")}
                </button>
              )}
            </div>
          )}

          {/* Step 2: Chọn giờ và cài đặt */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← {t("back")}
                </button>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t("selectTimeAndSettings")}
                </h3>
              </div>

              {/* Chọn giờ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {t("selectTime")}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t("workingHours")}
                  </span>
                </div>
                {loading ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    {t("loading") || "Đang tải..."}
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot, index) => {
                      const isUnavailable = slot.isAvailable === false;

                      return (
                        <button
                          key={index}
                          onClick={() => handleTimeSelect(slot)}
                          disabled={isUnavailable}
                          className={`p-3 text-center rounded-lg border transition-colors ${
                            selectedTime === slot.startTime
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : isUnavailable
                              ? "border-red-300 bg-red-50 dark:bg-red-900/20 opacity-50 cursor-not-allowed"
                              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                          }`}
                        >
                          <div
                            className={`font-medium ${
                              isUnavailable
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {slot.displayTime}
                          </div>
                          <div
                            className={`text-sm ${
                              isUnavailable
                                ? "text-red-500 dark:text-red-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {slot.durationMinutes} {t("minutes")}
                            {isUnavailable && " - " + t("unavailable")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    {selectedDate
                      ? t("noWorkingHoursToday") ||
                        "Không có giờ làm việc trong ngày này"
                      : t("selectDateToSeeWorkingHours") ||
                        "Vui lòng chọn ngày để xem giờ làm việc"}
                  </div>
                )}
              </div>

              {/* Cài đặt lịch hẹn */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {t("appointmentSettings")}
                </h4>

                {/* Loại tư vấn */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("consultationType")}
                  </label>
                  <select
                    value={consultationType}
                    onChange={(e) => setConsultationType(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ONLINE">{t("onlineConsultation")}</option>
                    <option value="PHONE">{t("phoneConsultation")}</option>
                    <option value="IN_PERSON">
                      {t("inPersonConsultation")}
                    </option>
                  </select>
                </div>

                {/* Thời lượng */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("duration")} ({t("minutes")})
                  </label>
                  <select
                    value={selectedDuration}
                    onChange={(e) =>
                      setSelectedDuration(parseInt(e.target.value))
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={30}>30 {t("minutes")}</option>
                    <option value={60}>60 {t("minutes")}</option>
                    <option value={90}>90 {t("minutes")}</option>
                    <option value={120}>120 {t("minutes")}</option>
                  </select>
                </div>

                {/* Ghi chú */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("notes")} ({t("optional")})
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t("describeYourIssue")}
                  />
                </div>

                {/* Link meeting (nếu tư vấn trực tuyến) */}
                {consultationType === "ONLINE" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("meetingLink")} ({t("optional")})
                    </label>
                    <input
                      type="text"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={
                        t("meetingLinkPlaceholder") ||
                        "Link Zoom/Google Meet (để trống để hệ thống tự tạo)"
                      }
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("meetingLinkHint") ||
                        "Nếu để trống, hệ thống sẽ tự động tạo link Google Meet khi chuyên gia xác nhận"}
                    </p>
                  </div>
                )}

                {/* Địa điểm (nếu tư vấn trực tiếp) */}
                {consultationType === "IN_PERSON" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("meetingLocation")}
                    </label>
                    <input
                      type="text"
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t("enterAddressOrLocation")}
                    />
                  </div>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedTime || loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t("bookingInProgress") : t("confirmBooking")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>

              {/* Success Message */}
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t("bookingSuccess")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("weWillContactYouSoon")}
              </p>

              {/* Appointment Details */}
              {createdAppointment && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    {t("appointmentDetails")}:
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>{t("expert")}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {createdAppointment.expertName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("date")}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(
                          createdAppointment.appointmentDate
                        ).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("time")}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(
                          createdAppointment.appointmentDate
                        ).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("duration")}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {createdAppointment.durationMinutes} {t("minutes")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("consultationType")}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {createdAppointment.consultationType === "ONLINE"
                          ? t("onlineConsultation")
                          : createdAppointment.consultationType === "PHONE"
                          ? t("phoneConsultation")
                          : t("inPersonConsultation")}
                      </span>
                    </div>
                    {createdAppointment.consultationType === "ONLINE" &&
                      createdAppointment.meetingLink && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {t("meetingLink")}:
                            </span>
                            <a
                              href={createdAppointment.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                            >
                              {createdAppointment.meetingLink}
                            </a>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Gọi callback khi user ấn "Hoàn tất"
                    if (onAppointmentCreated) {
                      onAppointmentCreated();
                    }
                    // Chuyển về trang lịch hẹn
                    window.location.href = "/appointments";
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t("complete")}
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setCreatedAppointment(null);
                    setStep(1);
                    setSelectedDate("");
                    setSelectedTime("");
                    setSelectedDuration(60);
                    setConsultationType("ONLINE");
                    setNotes("");
                    setMeetingLocation("");
                    setMeetingLink("");

                    // Gọi callback khi user ấn "Đặt lịch khác"
                    if (onAppointmentCreated) {
                      onAppointmentCreated();
                    }
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  {t("bookAnotherAppointment")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBookingModal;
