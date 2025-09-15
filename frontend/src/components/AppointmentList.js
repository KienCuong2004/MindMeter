import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  VideoCameraIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon as ClockIconSolid,
} from "@heroicons/react/24/outline";
import { authFetch } from "../authFetch";

const AppointmentList = ({ userRole = "STUDENT" }) => {
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, CONFIRMED, COMPLETED, CANCELLED

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [userRole]);

  // Force re-render when language changes
  useEffect(() => {
    // This will trigger re-render when i18n.language changes
  }, [i18n.language]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");

    try {
      const endpoint =
        userRole === "EXPERT"
          ? "/api/appointments/expert"
          : "/api/appointments/student";

      const response = await authFetch(endpoint);

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        // Failed to fetch appointments
        setError(t("cannotLoadAppointments"));
      }
    } catch (error) {
      // Error in fetchAppointments
      setError(t("errorLoadingAppointments"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, action, reason = "") => {
    try {
      let endpoint = "";
      let method = "PUT";

      if (action === "confirm") {
        endpoint = `/api/appointments/${appointmentId}/confirm`;
      } else if (action === "cancel") {
        endpoint = `/api/appointments/${appointmentId}/cancel?reason=${encodeURIComponent(
          reason
        )}&cancelledBy=${userRole}`;
      }

      const response = await authFetch(endpoint, { method });

      if (response.ok) {
        // Cập nhật lại danh sách
        fetchAppointments();
      } else {
        setError(t("cannotUpdateAppointment"));
      }
    } catch (error) {
      setError(t("errorUpdatingAppointment"));
    }
  };

  const openCancelModal = (appointmentId) => {
    setCancelAppointmentId(appointmentId);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelAppointmentId(null);
    setCancelReason("");
    setIsCancelling(false);
  };

  const submitCancel = async () => {
    if (!cancelAppointmentId) return;
    // Require a reason (same behavior as previous prompt which only proceeded when truthy)
    if (!cancelReason || !cancelReason.trim()) {
      return;
    }
    try {
      setIsCancelling(true);
      await handleStatusUpdate(
        cancelAppointmentId,
        "cancel",
        cancelReason.trim()
      );
      closeCancelModal();
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <ClockIconSolid className="h-5 w-5 text-yellow-500" />;
      case "CONFIRMED":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "COMPLETED":
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case "CANCELLED":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "NO_SHOW":
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PENDING":
        return t("statusPending");
      case "CONFIRMED":
        return t("statusConfirmed");
      case "COMPLETED":
        return t("statusCompleted");
      case "CANCELLED":
        return t("statusCancelled");
      case "NO_SHOW":
        return t("statusNoShow");
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "NO_SHOW":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getConsultationTypeIcon = (type) => {
    switch (type) {
      case "ONLINE":
        return <VideoCameraIcon className="h-4 w-4" />;
      case "PHONE":
        return <PhoneIcon className="h-4 w-4" />;
      case "IN_PERSON":
        return <MapPinIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getConsultationTypeText = (type) => {
    switch (type) {
      case "ONLINE":
        return t("consultationTypeOnline");
      case "PHONE":
        return t("consultationTypePhone");
      case "IN_PERSON":
        return t("consultationTypeInPerson");
      default:
        return type;
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    // Use UI language for locale; prefer en-GB to keep dd/mm/yyyy in English
    const locale = i18n?.language?.toLowerCase().startsWith("vi")
      ? "vi-VN"
      : "en-GB";
    return {
      date: date.toLocaleDateString(locale, {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      time: date.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === "ALL") return true;
    return appointment.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
        <button
          onClick={fetchAppointments}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {t("noAppointments")}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {userRole === "STUDENT"
            ? t("noAppointmentsStudent")
            : t("noAppointmentsExpert")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header và Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("myAppointments")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {userRole === "STUDENT"
              ? t("appointmentManagementStudent")
              : t("appointmentManagementExpert")}
          </p>
        </div>

        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="ALL">{t("all")}</option>
            <option value="PENDING">{t("pending")}</option>
            <option value="CONFIRMED">{t("confirmed")}</option>
            <option value="COMPLETED">{t("completed")}</option>
            <option value="CANCELLED">{t("cancelled")}</option>
          </select>
        </div>
      </div>

      {/* Danh sách lịch hẹn */}
      <div className="space-y-4">
        {filteredAppointments.map((appointment) => {
          const { date, time } = formatDateTime(appointment.appointmentDate);

          return (
            <div
              key={appointment.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Thông tin chính */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(appointment.status)}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {getStatusText(appointment.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {date}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {time}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {userRole === "STUDENT"
                          ? `${t("expert")}: ${appointment.expertName}`
                          : `${t("student")}: ${appointment.studentName}`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getConsultationTypeIcon(appointment.consultationType)}
                      <span className="text-gray-900 dark:text-white">
                        {getConsultationTypeText(appointment.consultationType)}
                      </span>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="text-gray-600 dark:text-gray-400">
                      <strong>{t("notes")}:</strong> {appointment.notes}
                    </div>
                  )}

                  {appointment.meetingLocation &&
                    appointment.consultationType === "IN_PERSON" && (
                      <div className="text-gray-600 dark:text-gray-400">
                        <strong>{t("meetingLocation")}:</strong>{" "}
                        {appointment.meetingLocation}
                      </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  {appointment.status === "PENDING" &&
                    userRole === "EXPERT" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(appointment.id, "confirm")
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        {t("confirm")}
                      </button>
                    )}

                  {appointment.status === "PENDING" && (
                    <button
                      onClick={() => openCancelModal(appointment.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      {t("cancelAppointment")}
                    </button>
                  )}

                  {appointment.status === "CONFIRMED" && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t("appointmentConfirmed")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("cancelAppointment")}
              </h3>
              <button
                onClick={closeCancelModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {t("confirmCancelAppointment")}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("cancelReason")}
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {!cancelReason.trim() && (
                  <div className="text-xs text-red-500 mt-1">
                    {t("reasonRequired")}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={closeCancelModal}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                {t("cancelAction")}
              </button>
              <button
                onClick={submitCancel}
                disabled={isCancelling || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isCancelling ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t("processing")}</span>
                  </div>
                ) : (
                  t("confirm")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
