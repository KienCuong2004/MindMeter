import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaBrain,
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaComments,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { authFetch } from "../authFetch";
import { useTheme } from "../hooks/useTheme";

export default function ExpertAppointmentsPage({ handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmingAppointmentId, setConfirmingAppointmentId] = useState(null);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState(null);

  // Sử dụng theme từ context
  const { theme, setTheme, toggleTheme } = useTheme();

  // Custom confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmAppointmentId, setConfirmAppointmentId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Filter và pagination state
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Tính toán số lượng cho từng filter
  const getFilterCounts = () => {
    const counts = {
      all: appointments.length,
      pending: appointments.filter((apt) => apt.status === "PENDING").length,
      confirmed: appointments.filter((apt) => apt.status === "CONFIRMED")
        .length,
      cancelled: appointments.filter((apt) => apt.status === "CANCELLED")
        .length,
      completed: appointments.filter((apt) => apt.status === "COMPLETED")
        .length,
    };
    return counts;
  };

  // Filter appointments dựa trên trạng thái
  const filterAppointments = useCallback(() => {
    let filtered = appointments;

    if (activeFilter !== "all") {
      filtered = appointments.filter(
        (apt) => apt.status === activeFilter.toUpperCase()
      );
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1); // Reset về trang đầu khi filter
  }, [appointments, activeFilter]);

  // Tính toán pagination
  const getPaginationData = () => {
    const totalItems = filteredAppointments.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredAppointments.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex,
      endIndex,
    };
  };

  // Tạo array các trang để hiển thị
  const getPageNumbers = () => {
    const { totalPages } = getPaginationData();
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page) => {
    if (page !== "..." && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  // Xử lý thay đổi filter
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Effect để filter appointments khi appointments hoặc activeFilter thay đổi
  useEffect(() => {
    filterAppointments();
  }, [filterAppointments]);

  // Force re-render when language changes
  useEffect(() => {
    // This will trigger re-render when i18n.language changes
  }, [i18n.language]);

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Lấy user data từ localStorage
        const userData = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (userData && token) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            // Kiểm tra role
            if (parsedUser.role === "EXPERT") {
              fetchExpertAppointments();
            } else {
              // Nếu không phải expert, redirect về trang phù hợp
              if (parsedUser.role === "STUDENT") {
                navigate("/appointments", { replace: true });
              } else if (parsedUser.role === "ADMIN") {
                navigate("/admin/dashboard", { replace: true });
              }
            }
          } catch (e) {
            setError(t("invalidUserData"));
          }
        } else {
          setError(t("userDataNotFound"));
        }
      } catch (e) {
        setError(t("unexpectedError"));
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [navigate]);

  // Auto-hide message after 5 seconds with smooth fade out
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Auto-hide error after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch appointments on component mount
  const fetchExpertAppointments = useCallback(async () => {
    try {
      const response = await authFetch("/api/appointments/expert");

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        // Failed to fetch appointments
      }
    } catch (error) {
      setError(t("errorLoadingAppointments"));
    }
  }, []);

  const navigateToHome = useCallback(() => {
    navigate("/expert/dashboard");
  }, [navigate]);

  const navigateToProfile = useCallback(() => {
    navigate("/expert/profile");
  }, [navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Sử dụng locale tiếng Việt
    const locale = i18n.language === "vi" ? "vi-VN" : "en-GB";
    return date.toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (appointmentDate) => {
    if (!appointmentDate) {
      return "N/A";
    }

    try {
      // Parse appointmentDate (có thể là string hoặc Date object)
      const date = new Date(appointmentDate);

      if (isNaN(date.getTime())) {
        return "N/A";
      }

      const locale = t("_lang", { defaultValue: "en-GB" }) || "en-GB";
      return date.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      return "N/A";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "NO_SHOW":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "Đã xác nhận";
      case "PENDING":
        return "Chờ xác nhận";
      case "CANCELLED":
        return "Đã hủy";
      case "COMPLETED":
        return "Hoàn thành";
      case "NO_SHOW":
        return "Không đến";
      default:
        return status;
    }
  };

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      setConfirmingAppointmentId(appointmentId);
      const response = await authFetch(
        `/api/appointments/${appointmentId}/confirm`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        // Refresh appointments list
        fetchExpertAppointments();
        // Show success message
        setMessage({ type: "success", text: t("confirmAppointmentSuccess") });
      } else {
        // Lấy thông tin lỗi chi tiết từ server
        let errorMessage = t("confirmAppointmentFailed");
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Nếu không parse được JSON, dùng status text
          if (response.statusText) {
            errorMessage = `${t("confirmAppointmentFailed")}: ${
              response.statusText
            }`;
          }
        }

        setMessage({ type: "error", text: errorMessage });
      }
    } catch (error) {
      // Confirm appointment exception
      setMessage({
        type: "error",
        text: `${t("connectionError")}: ${
          error.message || t("cannotConnectToServer")
        }`,
      });
    } finally {
      setConfirmingAppointmentId(null);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    // Hiển thị custom confirmation modal
    setConfirmAction("cancel");
    setConfirmAppointmentId(appointmentId);
    setCancellingAppointmentId(appointmentId);
    setShowConfirmModal(true);
  };

  const executeCancelAppointment = async () => {
    if (!confirmAppointmentId) return;

    try {
      // Ensure reason provided
      if (!cancelReason || !cancelReason.trim()) {
        return;
      }
      setCancellingAppointmentId(confirmAppointmentId);
      setIsCancelling(true);

      // Sử dụng endpoint đúng với query parameters như backend yêu cầu
      const response = await authFetch(
        `/api/appointments/${confirmAppointmentId}/cancel?reason=${encodeURIComponent(
          cancelReason.trim()
        )}&cancelledBy=EXPERT`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        // Refresh appointments list
        fetchExpertAppointments();
        // Show success message
        setMessage({ type: "success", text: t("cancelAppointmentSuccess") });
      } else {
        // Lấy thông tin lỗi chi tiết từ server
        let errorMessage = t("cancelAppointmentFailed");
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Nếu không parse được JSON, dùng status text
          if (response.statusText) {
            errorMessage = `${t("cancelAppointmentFailed")}: ${
              response.statusText
            }`;
          }
        }

        // Tạo error message chi tiết hơn
        let detailedErrorMessage = errorMessage;
        if (response.status === 405) {
          detailedErrorMessage = t("methodNotSupported");
        } else if (response.status === 400) {
          detailedErrorMessage = t("invalidData");
        } else if (response.status === 404) {
          detailedErrorMessage = t("appointmentNotFound");
        } else if (response.status === 403) {
          detailedErrorMessage = t("noPermission");
        } else if (response.status >= 500) {
          detailedErrorMessage = t("serverError");
        }

        setMessage({ type: "error", text: detailedErrorMessage });
      }
    } catch (error) {
      // Cancel appointment exception
      setMessage({
        type: "error",
        text: `${t("connectionError")}: ${
          error.message || t("cannotConnectToServer")
        }`,
      });
    } finally {
      setCancellingAppointmentId(null);
      setIsCancelling(false);
      // Đóng modal
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmAppointmentId(null);
      setCancelReason("");
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmAppointmentId(null);
    setCancelReason("");
    setIsCancelling(false);
    setCancellingAppointmentId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-xl font-medium">
            {t("loadingData")}
          </div>
          <div className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            {t("pleaseWait")}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (error) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-xl mb-4">
              {error}
            </div>
            <button
              onClick={navigateToHome}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {t("goToHome")}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400 text-xl mb-4">
            {t("loading")}
          </div>
        </div>
      </div>
    );
  }

  // Kiểm tra role để đảm bảo chỉ expert mới có thể truy cập
  if (user.role !== "EXPERT") {
    navigate("/expert/dashboard", { replace: true });
    return null;
  }

  const { currentItems } = getPaginationData();
  const filterCounts = getFilterCounts();
  const pageNumbers = getPageNumbers();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Dashboard Header */}
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("expertAppointments")}
        user={user}
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
        onProfile={navigateToProfile}
        className="mb-4"
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-24">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
              <FaCalendarAlt className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t("myAppointments")}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {t("appointmentManagementExpert")}
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl border-l-4 shadow-lg animate-fade-in-down ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-500 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-500 text-red-800 dark:text-red-200"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {message.type === "success" ? (
                    <svg
                      className="h-6 w-6 text-green-500 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6 text-red-500 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">
                    {message.type === "success"
                      ? t("success")
                      : t("errorOccurred")}
                  </p>
                  <p className="mt-1 text-sm opacity-90">{message.text}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setMessage(null)}
                    className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                      message.type === "success"
                        ? "text-green-500 hover:bg-green-100 dark:hover:bg-green-800/50 focus:ring-green-500"
                        : "text-red-500 hover:bg-red-100 dark:hover:bg-red-800/50 focus:ring-red-500"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
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
              </div>
            </div>
          )}

          {/* Enhanced Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 shadow-lg animate-fade-in-down">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {t("attention")}
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
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
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <>
              {/* Filter Buttons */}
              <div className="flex flex-wrap justify-center items-center gap-3 mb-8">
                <button
                  onClick={() => handleFilterChange("all")}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                    activeFilter === "all"
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-800"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activeFilter === "all" ? "bg-white" : "bg-gray-400"
                      }`}
                    ></div>
                    {t("all")} ({filterCounts.all})
                  </div>
                </button>
                <button
                  onClick={() => handleFilterChange("pending")}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                    activeFilter === "pending"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-yellow-200 dark:shadow-yellow-800"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activeFilter === "pending"
                          ? "bg-white"
                          : "bg-yellow-400"
                      }`}
                    ></div>
                    {t("pending")} ({filterCounts.pending})
                  </div>
                </button>
                <button
                  onClick={() => handleFilterChange("confirmed")}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                    activeFilter === "confirmed"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-200 dark:shadow-green-800"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activeFilter === "confirmed"
                          ? "bg-white"
                          : "bg-green-400"
                      }`}
                    ></div>
                    {t("confirmed")} ({filterCounts.confirmed})
                  </div>
                </button>
                <button
                  onClick={() => handleFilterChange("cancelled")}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                    activeFilter === "cancelled"
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200 dark:shadow-red-800"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activeFilter === "cancelled" ? "bg-white" : "bg-red-400"
                      }`}
                    ></div>
                    {t("cancelled")} ({filterCounts.cancelled})
                  </div>
                </button>
                <button
                  onClick={() => handleFilterChange("completed")}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                    activeFilter === "completed"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200 dark:shadow-blue-800"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activeFilter === "completed"
                          ? "bg-white"
                          : "bg-blue-400"
                      }`}
                    ></div>
                    {t("completed")} ({filterCounts.completed})
                  </div>
                </button>
              </div>

              {/* Appointments List */}
              {currentItems.length > 0 ? (
                <>
                  <div className="mb-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("displaying")} {getPaginationData().startIndex + 1}-
                      {Math.min(
                        getPaginationData().endIndex,
                        getPaginationData().totalItems
                      )}{" "}
                      {t("outOf")} {getPaginationData().totalItems}{" "}
                      {t("appointments")}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {currentItems.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            {appointment.studentAvatarUrl ? (
                              <img
                                src={
                                  appointment.studentAvatarUrl.startsWith(
                                    "http"
                                  )
                                    ? appointment.studentAvatarUrl
                                    : `${window.location.origin}${appointment.studentAvatarUrl}`
                                }
                                alt={appointment.studentName || t("student")}
                                className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-indigo-200 dark:border-indigo-700"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const fallback =
                                    e.target.parentElement.querySelector(
                                      ".avatar-fallback"
                                    );
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full items-center justify-center shadow-md avatar-fallback ${
                                appointment.studentAvatarUrl ? "hidden" : "flex"
                              }`}
                            >
                              <FaUser className="text-indigo-600 dark:text-indigo-300 text-lg" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {appointment.studentName ||
                                  t("common.students")}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                {t("student")}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <FaCalendarAlt className="text-indigo-500 dark:text-indigo-400 text-lg" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                                {t("date")}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatDate(appointment.appointmentDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <FaClock className="text-green-500 dark:text-green-400 text-lg" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                                {t("time")}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatTime(appointment.appointmentDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <FaComments className="text-blue-500 dark:text-blue-400 text-lg" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                                {t("type")}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {appointment.consultationType === "ONLINE"
                                  ? t("online")
                                  : t("offline")}
                              </p>
                            </div>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 mb-6">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg
                                  className="w-3 h-3 text-blue-600 dark:text-blue-300"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-1">
                                  {t("notes")}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {appointment.notes}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {appointment.consultationType === "ONLINE" &&
                          appointment.meetingLink && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700 mb-6">
                              <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg
                                    className="w-3 h-3 text-green-600 dark:text-green-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wide mb-1">
                                    {t("meetingLink") || "Link Google Meet"}
                                  </p>
                                  <a
                                    href={appointment.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 underline break-all"
                                  >
                                    {appointment.meetingLink}
                                  </a>
                                  {/* Thông báo nếu link là fallback (link demo) */}
                                  {appointment.meetingLink &&
                                    (() => {
                                      // Kiểm tra xem link có phải là link demo không
                                      // Link thật từ Google Calendar thường có format khác hoặc có thêm params
                                      // Link demo thường chỉ có format: https://meet.google.com/xxx-xxxx-xxx
                                      const isDemoLink =
                                        appointment.meetingLink.match(
                                          /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/
                                        );
                                      return isDemoLink ? (
                                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-xs text-yellow-700 dark:text-yellow-300">
                                          <p className="font-semibold mb-1">
                                            ⚠️ Link demo
                                          </p>
                                          <p>
                                            Link này là link demo và không hoạt
                                            động. Để có link Google Meet thật,
                                            vui lòng setup Google Calendar API
                                            trong backend.
                                          </p>
                                        </div>
                                      ) : null;
                                    })()}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Appointment Actions */}
                        <div className="mt-6 flex flex-wrap gap-3">
                          {appointment.status === "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  handleConfirmAppointment(appointment.id)
                                }
                                disabled={
                                  confirmingAppointmentId === appointment.id ||
                                  cancellingAppointmentId === appointment.id
                                }
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                              >
                                {confirmingAppointmentId === appointment.id ? (
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>{t("processing")}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    {t("confirmAppointment")}
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleCancelAppointment(appointment.id)
                                }
                                disabled={
                                  confirmingAppointmentId === appointment.id ||
                                  cancellingAppointmentId === appointment.id
                                }
                                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                              >
                                {cancellingAppointmentId === appointment.id ? (
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>{t("processing")}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-4 h-4"
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
                                    {t("cancelAppointment")}
                                  </div>
                                )}
                              </button>
                            </>
                          )}
                          {appointment.status === "CONFIRMED" && (
                            <button
                              onClick={() =>
                                handleCancelAppointment(appointment.id)
                              }
                              disabled={
                                cancellingAppointmentId === appointment.id
                              }
                              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                            >
                              {cancellingAppointmentId === appointment.id ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>{t("processing")}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4"
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
                                  {t("cancel")}
                                </div>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <FaCalendarAlt className="h-full w-full" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {activeFilter === "all"
                      ? t("noAppointmentsYet")
                      : activeFilter === "pending"
                      ? t("noPendingAppointments")
                      : activeFilter === "confirmed"
                      ? t("noConfirmedAppointments")
                      : activeFilter === "cancelled"
                      ? t("noCancelledAppointments")
                      : activeFilter === "completed"
                      ? t("noCompletedAppointments")
                      : t("noAppointmentsFilter")}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {activeFilter === "all"
                      ? t("common.noAppointmentsWithStudent")
                      : t("common.noAppointmentsMatchFilter")}
                  </p>
                </div>
              )}

              {/* Pagination */}
              {pageNumbers.length > 1 && (
                <div className="flex justify-center items-center mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft className="h-4 w-4" />
                  </button>
                  {pageNumbers.map((page, index) => (
                    <span
                      key={index}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer ${
                        page === "..." ? "opacity-50 cursor-default" : ""
                      } ${
                        page === currentPage ? "bg-indigo-600 text-white" : ""
                      }`}
                    >
                      {page}
                    </span>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === getPaginationData().totalPages}
                    className="px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer Section */}
      <FooterSection />

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-fade-in-down">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("confirmAction")}
              </h3>
              <button
                onClick={closeConfirmModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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

            {/* Modal Body */}
            <div className="p-6">
              {/* Warning Icon - Centered and Larger */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>

              {/* Message Text */}
              <p className="text-gray-600 dark:text-gray-300 text-center text-lg">
                {confirmAction === "cancel" && t("confirmCancelAppointment")}
              </p>
              {confirmAction === "cancel" && (
                <div className="mt-4 text-left">
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
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                {t("cancelAction")}
              </button>
              <button
                onClick={executeCancelAppointment}
                disabled={
                  isCancelling ||
                  (confirmAction === "cancel" && !cancelReason.trim())
                }
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
}
