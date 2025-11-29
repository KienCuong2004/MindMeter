import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { authFetch } from "../authFetch";

const ExpertScheduleManager = ({ theme = "dark" }) => {
  const { t, i18n } = useTranslation();
  const [schedules, setSchedules] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showAddBreak, setShowAddBreak] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editingBreak, setEditingBreak] = useState(null);

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "17:00",
    maxAppointmentsPerDay: 8,
    appointmentDurationMinutes: 60,
    breakDurationMinutes: 15,
  });

  const [breakForm, setBreakForm] = useState({
    breakDate: "",
    startTime: "12:00",
    endTime: "13:00",
    reason: "",
    isRecurring: false,
    recurringPattern: "WEEKLY",
  });

  const daysOfWeek = [
    { value: "MONDAY", label: t("schedule.monday") },
    { value: "TUESDAY", label: t("schedule.tuesday") },
    { value: "WEDNESDAY", label: t("schedule.wednesday") },
    { value: "THURSDAY", label: t("schedule.thursday") },
    { value: "FRIDAY", label: t("schedule.friday") },
    { value: "SATURDAY", label: t("schedule.saturday") },
    { value: "SUNDAY", label: t("schedule.sunday") },
  ];

  useEffect(() => {
    fetchSchedules();
    fetchBreaks();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await authFetch("/api/expert-schedules/my-schedules");
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.message || t("schedule.cannotLoadSchedule"));
        } catch (parseError) {
          setError(t("schedule.cannotLoadSchedule"));
        }
      }
    } catch (error) {
      setError(t("schedule.errorOccurred"));
    }
  };

  const fetchBreaks = async () => {
    try {
      const response = await authFetch("/api/expert-schedules/my-breaks");
      if (response.ok) {
        const data = await response.json();
        setBreaks(data);
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.message || t("schedule.cannotLoadBreak"));
        } catch (parseError) {
          setError(t("schedule.cannotLoadBreak"));
        }
      }
    } catch (error) {
      setError(t("schedule.errorOccurredBreak"));
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Đảm bảo các giá trị số được parse đúng cách
      const formData = {
        ...scheduleForm,
        maxAppointmentsPerDay:
          parseInt(scheduleForm.maxAppointmentsPerDay) || 8,
        appointmentDurationMinutes:
          parseInt(scheduleForm.appointmentDurationMinutes) || 60,
        breakDurationMinutes: parseInt(scheduleForm.breakDurationMinutes) || 15,
      };

      const endpoint = editingSchedule
        ? `/api/expert-schedules/${editingSchedule.id}`
        : "/api/expert-schedules";

      const method = editingSchedule ? "PUT" : "POST";

      const response = await authFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchSchedules();
        resetScheduleForm();
        setShowAddSchedule(false);
        setEditingSchedule(null);
        setError(""); // Clear error if success
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.message || t("schedule.cannotSaveSchedule"));
        } catch (parseError) {
          // If JSON parsing fails, show status text
          if (response.status === 403) {
            setError(t("common.noPermission"));
          } else if (response.status === 500) {
            setError(t("common.serverError"));
          } else {
            setError(t("schedule.cannotSaveSchedule"));
          }
        }
      }
    } catch (error) {
      // Error when submitting work schedule form
      setError(t("schedule.connectionError"));
    }
  };

  const handleBreakSubmit = async (e) => {
    e.preventDefault();

    try {
      // Đảm bảo các giá trị được parse đúng cách
      const formData = {
        ...breakForm,
        isRecurring: Boolean(breakForm.isRecurring),
      };

      const endpoint = editingBreak
        ? `/api/expert-schedules/breaks/${editingBreak.id}`
        : "/api/expert-schedules/breaks";

      const method = editingBreak ? "PUT" : "POST";

      const response = await authFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchBreaks();
        resetBreakForm();
        setShowAddBreak(false);
        setEditingBreak(null);
        setError(""); // Clear error if success
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.message || t("schedule.cannotSaveBreak"));
        } catch (parseError) {
          // If JSON parsing fails, show status text
          if (response.status === 403) {
            setError(t("common.noPermission"));
          } else if (response.status === 500) {
            setError(t("common.serverError"));
          } else {
            setError(t("schedule.cannotSaveBreak"));
          }
        }
      }
    } catch (error) {
      // Error when submitting break time form
      setError(t("schedule.connectionError"));
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm(t("schedule.confirmDeleteSchedule"))) {
      try {
        const response = await authFetch(
          `/api/expert-schedules/${scheduleId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          fetchSchedules();
          setError(""); // Clear error if success
        } else {
          if (response.status === 403) {
            setError(t("common.noPermissionDeleteWorkSchedule"));
          } else if (response.status === 500) {
            setError(t("common.serverError"));
          } else {
            setError(t("schedule.cannotDeleteSchedule"));
          }
        }
      } catch (error) {
        // Error when deleting work schedule
        setError(t("schedule.connectionError"));
      }
    }
  };

  const handleDeleteBreak = async (breakId) => {
    if (window.confirm(t("schedule.confirmDeleteBreak"))) {
      try {
        const response = await authFetch(
          `/api/expert-schedules/breaks/${breakId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          fetchBreaks();
          setError(""); // Clear error if success
        } else {
          if (response.status === 403) {
            setError(t("common.noPermissionDeleteBreakTime"));
          } else if (response.status === 500) {
            setError(t("common.serverError"));
          } else {
            setError(t("schedule.cannotDeleteBreak"));
          }
        }
      } catch (error) {
        // Error when deleting break time
        setError(t("schedule.connectionError"));
      }
    }
  };

  const editSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      dayOfWeek: schedule.dayOfWeek || "MONDAY",
      startTime: schedule.startTime || "09:00",
      endTime: schedule.endTime || "17:00",
      maxAppointmentsPerDay: parseInt(schedule.maxAppointmentsPerDay) || 8,
      appointmentDurationMinutes:
        parseInt(schedule.appointmentDurationMinutes) || 60,
      breakDurationMinutes: parseInt(schedule.breakDurationMinutes) || 15,
    });
    setShowAddSchedule(true);
  };

  const editBreak = (break_) => {
    setEditingBreak(break_);
    setBreakForm({
      breakDate: break_.breakDate || "",
      startTime: break_.startTime || "12:00",
      endTime: break_.endTime || "13:00",
      reason: break_.reason || "",
      isRecurring: Boolean(break_.isRecurring) || false,
      recurringPattern: break_.recurringPattern || "WEEKLY",
    });
    setShowAddBreak(true);
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "17:00",
      maxAppointmentsPerDay: 8,
      appointmentDurationMinutes: 60,
      breakDurationMinutes: 15,
    });
  };

  const resetBreakForm = () => {
    setBreakForm({
      breakDate: "",
      startTime: "12:00",
      endTime: "13:00",
      reason: "",
      isRecurring: false,
      recurringPattern: "WEEKLY",
    });
  };

  const getDayLabel = (dayOfWeek) => {
    const day = daysOfWeek.find((d) => d.value === dayOfWeek);
    if (!day) return dayOfWeek;

    // Tính ngày cụ thể cho thứ này trong tuần hiện tại
    const today = new Date();
    const currentDay = today.getDay();

    let targetDay;
    switch (dayOfWeek) {
      case "MONDAY":
        targetDay = 1;
        break;
      case "TUESDAY":
        targetDay = 2;
        break;
      case "WEDNESDAY":
        targetDay = 3;
        break;
      case "THURSDAY":
        targetDay = 4;
        break;
      case "FRIDAY":
        targetDay = 5;
        break;
      case "SATURDAY":
        targetDay = 6;
        break;
      case "SUNDAY":
        targetDay = 0;
        break;
      default:
        targetDay = currentDay;
    }

    // Tính số ngày cần cộng để đến ngày thứ targetDay
    let daysToAdd = targetDay - currentDay;

    // Nếu ngày hôm nay đã qua ngày thứ targetDay, lấy tuần tới
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);

    // Format ngày tháng năm
    const dateStr = targetDate.toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );

    return `${day.label} (${dateStr})`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    // If time has HH:mm:ss format, only take HH:mm
    if (timeString.includes(":")) {
      const parts = timeString.split(":");
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // If parsing fails, return original string
      return date.toLocaleDateString(
        i18n.language === "vi" ? "vi-VN" : "en-US"
      );
    } catch (error) {
      return dateString; // If error occurs, return original string
    }
  };

  const getRecurringPatternLabel = (pattern) => {
    switch (pattern) {
      case "WEEKLY":
        return t("schedule.weekly");
      case "MONTHLY":
        return t("schedule.monthly");
      case "YEARLY":
        return t("schedule.yearly");
      default:
        return pattern;
    }
  };

  // Hàm để lấy ngày thực tế cho việc sắp xếp
  const getActualDate = (dayOfWeek) => {
    const today = new Date();
    const currentDay = today.getDay();

    let targetDay;
    switch (dayOfWeek) {
      case "MONDAY":
        targetDay = 1;
        break;
      case "TUESDAY":
        targetDay = 2;
        break;
      case "WEDNESDAY":
        targetDay = 3;
        break;
      case "THURSDAY":
        targetDay = 4;
        break;
      case "FRIDAY":
        targetDay = 5;
        break;
      case "SATURDAY":
        targetDay = 6;
        break;
      case "SUNDAY":
        targetDay = 0;
        break;
      default:
        targetDay = currentDay;
    }

    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    return targetDate;
  };

  // Sắp xếp schedules theo ngày từ gần nhất đến xa nhất
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = getActualDate(a.dayOfWeek);
    const dateB = getActualDate(b.dayOfWeek);
    return dateA - dateB;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => {
              resetScheduleForm();
              setEditingSchedule(null);
              setShowAddSchedule(true);
            }}
            className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <PlusIcon className="h-5 w-5" />
            </div>
            <span>{t("schedule.addWorkSchedule")}</span>
          </button>

          <button
            onClick={() => {
              resetBreakForm();
              setEditingBreak(null);
              setShowAddBreak(true);
            }}
            className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <PlusIcon className="h-5 w-5" />
            </div>
            <span>{t("schedule.addBreakTime")}</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Work Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("schedule.weeklyWorkSchedule")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("schedule.manageWeeklySchedule")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {schedules.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t("schedule.workingDays")}
            </div>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("common.noWorkSchedule")}
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t("common.addWorkScheduleForStudents")}
            </p>
            <button
              onClick={() => {
                resetScheduleForm();
                setEditingSchedule(null);
                setShowAddSchedule(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              {t("schedule.addFirstWorkSchedule")}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedSchedules.map((schedule, index) => (
              <div
                key={schedule.id}
                className="relative group bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Day indicator - removed to avoid overlapping with action buttons */}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          {getDayLabel(schedule.dayOfWeek)}
                        </h4>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                          {t("schedule.active")}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">
                            {formatTime(schedule.startTime)} -{" "}
                            {formatTime(schedule.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>
                            {t("schedule.maxAppointmentsPerDay", {
                              count: schedule.maxAppointmentsPerDay || 0,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => editSchedule(schedule)}
                      className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
                      title={t("schedule.edit")}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
                      title={t("schedule.delete")}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Break Time */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <ClockIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("schedule.breakTime")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("schedule.manageBreakTime")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {breaks.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t("schedule.breakDays")}
            </div>
          </div>
        </div>

        {breaks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("common.noBreakTime")}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t("schedule.addBreakTimeDescription")}
            </p>
            <button
              onClick={() => {
                resetBreakForm();
                setEditingBreak(null);
                setShowAddBreak(true);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              {t("schedule.addBreakTimeButton")}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {breaks.map((break_, index) => (
              <div
                key={break_.id}
                className="relative group bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Break indicator - removed to avoid overlapping with action buttons */}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <ClockIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatDate(break_.breakDate)}
                        </h4>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                          {t("schedule.break")}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="font-medium">
                            {formatTime(break_.startTime)} -{" "}
                            {formatTime(break_.endTime)}
                          </span>
                        </div>
                        {break_.reason && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>{break_.reason}</span>
                          </div>
                        )}
                        {break_.isRecurring && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>
                              {getRecurringPatternLabel(
                                break_.recurringPattern
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => editBreak(break_)}
                      className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
                      title={t("schedule.edit")}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBreak(break_.id)}
                      className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
                      title={t("schedule.delete")}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add/Edit Work Schedule */}
      {showAddSchedule && (
        <div
          style={{
            position: "fixed",
            top: "-100px",
            left: "-100px",
            right: "-100px",
            bottom: "-100px",
            width: "calc(100vw + 200px)",
            height: "calc(100vh + 200px)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddSchedule(false);
              setEditingSchedule(null);
              resetScheduleForm();
            }
          }}
        >
          <div
            className={`${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}
          >
            <div
              className={`flex items-center justify-between p-6 border-b ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {editingSchedule
                  ? t("schedule.editWorkSchedule")
                  : t("schedule.addWorkSchedule")}
              </h3>
              <button
                onClick={() => {
                  setShowAddSchedule(false);
                  setEditingSchedule(null);
                  resetScheduleForm();
                }}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-6">
              {/* Day of Week */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("schedule.dayOfWeek")}
                </label>
                <select
                  value={scheduleForm.dayOfWeek}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      dayOfWeek: e.target.value,
                    })
                  }
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors ${
                    theme === "dark"
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                  required
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Working Time */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("schedule.workingTime")}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">
                      {t("schedule.startTime")}
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.startTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          startTime: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">
                      {t("schedule.endTime")}
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.endTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          endTime: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Appointment Settings */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("schedule.appointmentSettings")}
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">
                      {t("schedule.maxAppointmentsPerDayLabel")}
                    </label>
                    <input
                      type="number"
                      value={scheduleForm.maxAppointmentsPerDay}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          maxAppointmentsPerDay: Math.max(
                            1,
                            Math.min(20, parseInt(e.target.value) || 8)
                          ),
                        })
                      }
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      min="1"
                      max="20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">
                      {t("schedule.appointmentDurationLabel")}
                    </label>
                    <input
                      type="number"
                      value={scheduleForm.appointmentDurationMinutes}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          appointmentDurationMinutes: Math.max(
                            15,
                            Math.min(180, parseInt(e.target.value) || 60)
                          ),
                        })
                      }
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      min="15"
                      max="180"
                      step="15"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">
                      {t("schedule.breakDurationLabel")}
                    </label>
                    <input
                      type="number"
                      value={scheduleForm.breakDurationMinutes}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          breakDurationMinutes: Math.max(
                            0,
                            Math.min(60, parseInt(e.target.value) || 15)
                          ),
                        })
                      }
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      min="0"
                      max="60"
                      step="5"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {editingSchedule ? t("schedule.update") : t("schedule.add")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSchedule(false);
                    setEditingSchedule(null);
                    resetScheduleForm();
                  }}
                  className={`flex-1 py-3 px-6 rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl ${
                    theme === "dark"
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  {t("schedule.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Break Time */}
      {showAddBreak && (
        <div
          style={{
            position: "fixed",
            top: "-100px",
            left: "-100px",
            right: "-100px",
            bottom: "-100px",
            width: "calc(100vw + 200px)",
            height: "calc(100vh + 200px)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddBreak(false);
              setEditingBreak(null);
              resetBreakForm();
            }
          }}
        >
          <div
            className={`${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}
          >
            <div
              className={`flex items-center justify-between p-6 border-b ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {editingBreak
                  ? t("schedule.editBreakTime")
                  : t("schedule.addBreakTime")}
              </h3>
              <button
                onClick={() => {
                  setShowAddBreak(false);
                  setEditingBreak(null);
                  resetBreakForm();
                }}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleBreakSubmit} className="p-6 space-y-6">
              {/* Break Date */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("schedule.breakDate")}
                </label>
                <input
                  type="date"
                  value={breakForm.breakDate}
                  onChange={(e) =>
                    setBreakForm({ ...breakForm, breakDate: e.target.value })
                  }
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-colors ${
                    theme === "dark"
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                  required
                />
              </div>

              {/* Break Time */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("schedule.breakTimeLabel")}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">
                      {t("schedule.startTime")}
                    </label>
                    <input
                      type="time"
                      value={breakForm.startTime}
                      onChange={(e) =>
                        setBreakForm({
                          ...breakForm,
                          startTime: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-400">
                      {t("schedule.endTime")}
                    </label>
                    <input
                      type="time"
                      value={breakForm.endTime}
                      onChange={(e) =>
                        setBreakForm({ ...breakForm, endTime: e.target.value })
                      }
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Break Reason */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("schedule.breakReason")}
                </label>
                <input
                  type="text"
                  value={breakForm.reason}
                  onChange={(e) =>
                    setBreakForm({ ...breakForm, reason: e.target.value })
                  }
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-colors ${
                    theme === "dark"
                      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder={t("schedule.breakReasonPlaceholder")}
                />
              </div>

              {/* Recurring Break */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={breakForm.isRecurring}
                    onChange={(e) =>
                      setBreakForm({
                        ...breakForm,
                        isRecurring: e.target.checked,
                      })
                    }
                    className="h-5 w-5 text-green-500 focus:ring-green-400 border-gray-500 rounded transition-colors"
                  />
                  <label
                    htmlFor="isRecurring"
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {t("schedule.isRecurring")}
                  </label>
                </div>

                {breakForm.isRecurring && (
                  <div className="space-y-2 ml-8">
                    <label
                      className={`block text-sm font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {t("schedule.recurringPattern")}
                    </label>
                    <select
                      value={breakForm.recurringPattern}
                      onChange={(e) =>
                        setBreakForm({
                          ...breakForm,
                          recurringPattern: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                    >
                      <option value="WEEKLY">{t("schedule.weekly")}</option>
                      <option value="MONTHLY">{t("schedule.monthly")}</option>
                      <option value="YEARLY">{t("schedule.yearly")}</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {editingBreak ? t("schedule.update") : t("schedule.add")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBreak(false);
                    setEditingBreak(null);
                    resetBreakForm();
                  }}
                  className={`flex-1 py-3 px-6 rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl ${
                    theme === "dark"
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  {t("schedule.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertScheduleManager;
