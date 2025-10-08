import React, {
  useState,
  useEffect,
  useCallback,
  Suspense,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { authFetch } from "../authFetch";
import AppointmentList from "../components/AppointmentList";
import AppointmentBookingModal from "../components/AppointmentBookingModal";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import ErrorBoundary from "../components/ErrorBoundary";
import NotificationModal from "../components/NotificationModal";
import { FaPlus, FaCalendarAlt, FaBrain } from "react-icons/fa";
import { useTheme } from "../hooks/useTheme";
import { jwtDecode } from "jwt-decode";

const StudentAppointmentsPage = ({ handleLogout }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize user from token
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return {
          id: decoded.id,
          firstName: decoded.firstName || "",
          lastName: decoded.lastName || "",
          email: decoded.sub || decoded.email || "",
          role: decoded.role || "STUDENT",
          avatarUrl: decoded.avatarUrl,
          plan: decoded.plan || "FREE",
          phone: decoded.phone || "",
        };
      } catch (error) {
        // Error decoding token
        localStorage.removeItem("token");
        navigate("/login");
        return null;
      }
    }
    return null;
  });
  const [availableExperts, setAvailableExperts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [myAppointments, setMyAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Sử dụng ThemeContext thay vì reducer
  const { theme, toggleTheme } = useTheme();

  // Fetch available experts
  const fetchAvailableExperts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await authFetch(
        "/api/expert-schedules/available-experts"
      );

      if (response.ok) {
        const experts = await response.json();
        // Endpoint trả về List<User> trực tiếp, không phải {experts: [...]}
        setAvailableExperts(Array.isArray(experts) ? experts : []);
      } else {
        setError(t("loadExpertsError"));
      }
    } catch (error) {
      setError(t("errors.generalError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Fetch my appointments
  const fetchMyAppointments = useCallback(async () => {
    try {
      setIsLoadingAppointments(true);
      const response = await authFetch("/api/appointments/student");
      if (response.ok) {
        const appointments = await response.json();
        // Endpoint trả về List<AppointmentResponse> trực tiếp
        setMyAppointments(Array.isArray(appointments) ? appointments : []);
      } else {
        // Failed to fetch appointments
      }
    } catch (error) {
      // Error fetching appointments
    } finally {
      setIsLoadingAppointments(false);
    }
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user is student
    if (user.role !== "STUDENT") {
      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "EXPERT") {
        navigate("/expert/dashboard");
      } else {
        navigate("/home");
      }
      return;
    }
  }, [user, navigate]);

  // Set document title
  useEffect(() => {
    document.title = `${t("appointments")} | MindMeter`;
  }, [t, i18n.language]);

  // Fetch data on mount
  useEffect(() => {
    if (user && user.role === "STUDENT") {
      fetchAvailableExperts();
      fetchMyAppointments();
    }
  }, [user?.id, user?.role, fetchAvailableExperts, fetchMyAppointments]);

  const navigateToHome = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  const navigateToAppointments = useCallback(() => {
    if (user?.role === "EXPERT") {
      navigate("/expert/appointments");
    } else if (user?.role === "ADMIN") {
      navigate("/admin/dashboard");
    } else {
      navigate("/appointments");
    }
  }, [navigate, user?.role]);

  const navigateToIntroduce = useCallback(() => {
    navigate("/introduce");
  }, [navigate]);

  const navigateToStudentTest = useCallback(() => {
    navigate("/student/test");
  }, [navigate]);

  const navigateToContact = useCallback(() => {
    navigate("/contact");
  }, [navigate]);

  const openBookingModal = useCallback(() => {
    if (availableExperts.length > 0) {
      setShowBookingModal(true);
    } else {
      // Hiển thị thông báo nếu không có chuyên gia nào có sẵn
      setNotificationModal({
        isOpen: true,
        type: "warning",
        title: t("noExpertsAvailable"),
        message: t("noExpertsAvailableForBooking"),
        onConfirm: null,
      });
    }
  }, [availableExperts.length, t]);

  const closeBookingModal = useCallback(() => {
    setShowBookingModal(false);
  }, []);

  const handleAppointmentCreated = useCallback(() => {
    setShowBookingModal(false);
    // Refresh appointments list bằng cách fetch lại data
    // Không reload toàn bộ trang
    fetchMyAppointments(); // Refresh my appointments
  }, [fetchMyAppointments]);

  const handleProfile = useCallback(() => {
    navigate("/student/profile");
  }, [navigate]);

  // Show loading only if we don't have user data yet
  if (!user) {
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

  // Authentication and role check is handled in useEffect

  return (
    <div
      className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}
    >
      {/* Dashboard Header */}
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("appointments")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onLogout={handleLogout}
        onProfile={() => navigate("/profile")}
        updateUserAvatar={() => {}} // Sửa lỗi updateUserAvatar không tồn tại
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-24">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1
              className={`text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-200 mb-4`}
            >
              {t("appointments")}
            </h1>
            <p
              className={`text-lg text-gray-600 dark:text-gray-400 transition-colors duration-200 max-w-3xl mx-auto leading-relaxed`}
            >
              {t("appointmentsDescription")}
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div
                className={`mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin`}
              >
                <svg fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h3
                className={`mt-2 text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200`}
              >
                {t("loading")}
              </h3>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div
              className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className={`h-5 w-5 text-red-400 dark:text-red-300`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium text-red-800 dark:text-red-200 transition-colors duration-200`}
                  >
                    {t("common.error")}
                  </h3>
                  <div
                    className={`text-sm text-red-700 dark:text-red-300 transition-colors duration-200`}
                  >
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <>
              {/* Available Experts Section */}
              {availableExperts.length > 0 && (
                <div className="mb-8">
                  <h2
                    className={`text-2xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-200`}
                  >
                    {t("bookNewAppointment")}
                  </h2>
                  <p
                    className={`text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-200`}
                  >
                    {t("selectExpertToBook")}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableExperts.map((expert) => (
                      <div
                        key={expert.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200`}
                      >
                        <div className="flex items-center mb-4">
                          {expert.avatarUrl ? (
                            <img
                              src={expert.avatarUrl}
                              alt={`${expert.firstName} ${expert.lastName}`}
                              className="w-12 h-12 rounded-full border-2 border-indigo-400 shadow-md object-cover"
                              onError={(e) => {
                                // Fallback to default icon if image fails to load
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center ${
                              expert.avatarUrl ? "hidden" : ""
                            }`}
                          >
                            <span
                              className={`text-indigo-600 dark:text-indigo-300 font-semibold text-lg transition-colors duration-200`}
                            >
                              {expert.firstName?.charAt(0)}
                              {expert.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <h3
                              className={`text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200`}
                            >
                              {expert.firstName} {expert.lastName}
                            </h3>
                            <p
                              className={`text-gray-600 dark:text-gray-400 transition-colors duration-200`}
                            >
                              {t("consultingExpert")}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedExpert(expert);
                            setShowBookingModal(true);
                          }}
                          className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200`}
                        >
                          {t("bookAppointment")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Experts Available */}
              {availableExperts.length === 0 && !error && (
                <div className="text-center py-12">
                  <div
                    className={`mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 transition-colors duration-200`}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h3
                    className={`mt-2 text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200`}
                  >
                    {t("noExpertsAvailable")}
                  </h3>
                  <p
                    className={`mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200`}
                  >
                    {t("noExpertsAvailableForBooking")}
                  </p>
                </div>
              )}

              {/* My Appointments Section */}
              <div className="mt-12">
                {isLoadingAppointments ? (
                  <div className="text-center py-12">
                    <div
                      className={`mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin`}
                    >
                      <svg fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                    <h3
                      className={`mt-2 text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200`}
                    >
                      {t("loadingAppointments")}
                    </h3>
                  </div>
                ) : myAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <div
                      className={`mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 transition-colors duration-200`}
                    >
                      <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <h3
                      className={`mt-2 text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200`}
                    >
                      {t("noAppointmentsYet")}
                    </h3>
                    <p
                      className={`mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200`}
                    >
                      {t("noAppointmentsYet")}. {t("bookAppointmentNow")}
                    </p>
                  </div>
                ) : (
                  <AppointmentList
                    appointments={myAppointments}
                    onCancelAppointment={fetchMyAppointments}
                    userRole="STUDENT"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer Section */}
      <FooterSection />

      {/* Booking Modal */}
      {showBookingModal && selectedExpert && (
        <AppointmentBookingModal
          isOpen={showBookingModal}
          onClose={closeBookingModal}
          expertId={selectedExpert.id}
          expertName={`${selectedExpert.firstName} ${selectedExpert.lastName}`}
          onAppointmentCreated={handleAppointmentCreated}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={() =>
          setNotificationModal((prev) => ({ ...prev, isOpen: false }))
        }
        type={notificationModal.type}
        title={notificationModal.title}
        message={notificationModal.message}
        onConfirm={notificationModal.onConfirm}
      />
    </div>
  );
};

export default StudentAppointmentsPage;
