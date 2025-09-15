import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "react-i18next";
import { FaBrain } from "react-icons/fa";
import ChatBotModal from "../components/ChatBotModal";
import AnonymousTestModal from "../components/AnonymousTestModal";
import UpgradeAnonymousModal from "../components/UpgradeAnonymousModal";
import AnonymousChatbotNotice from "../components/AnonymousChatbotNotice";
import AppointmentList from "../components/AppointmentList";
import DashboardHeader from "../components/DashboardHeader";
import HeroSection from "../components/HeroSection";
import TestListSection from "../components/TestListSection";
import AboutSection from "../components/AboutSection";
import FAQSection from "../components/FAQSection";
import FooterSection from "../components/FooterSection";
import HomePageTour from "../components/HomePageTour";
import {
  createAnonymousAccount,
  upgradeAnonymousAccount,
  isAnonymousUser,
  saveAnonymousUser,
  saveAnonymousToken,
  getCurrentUser,
  getCurrentToken,
  clearAnonymousData,
} from "../services/anonymousService";
import NotificationModal from "../components/NotificationModal";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";

const StudentHomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);
  const [anonymousModalOpen, setAnonymousModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [chatbotBottom, setChatbotBottom] = useState(24); // px, default bottom-6
  const dragRef = useRef(null);
  const dragData = useRef({ startY: 0, startBottom: 0, dragging: false });
  const [selectedTestType, setSelectedTestType] = useState(null); // Thêm state lưu testType
  const [tourOpen, setTourOpen] = useState(false); // State cho tour
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    document.title =
      i18n.language === "vi" ? t("pageTitles.home") : "Home | MindMeter";
  }, [i18n.language]);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  // Lấy thông tin user từ token hoặc anonymous account
  let user = null;
  const currentUser = getCurrentUser();
  const currentToken = getCurrentToken();

  if (currentUser) {
    if (
      isAnonymousUser(currentUser) ||
      currentUser.role === "ANONYMOUS" ||
      currentUser.email === null ||
      currentUser.email === "anonymous"
    ) {
      // User ẩn danh
      user = {
        ...currentUser,
        firstName: currentUser.firstName || t("anonymous.user"),
        lastName: currentUser.lastName || t("anonymous.anonymous"),
        anonymous: true, // Đảm bảo luôn set anonymous = true
        role: "STUDENT", // Đảm bảo role luôn là STUDENT cho anonymous user
        email: currentUser.email || "anonymous",
      };
    } else {
      // User đã đăng nhập
      user = currentUser;
    }
  } else if (currentToken) {
    try {
      const decoded = jwtDecode(currentToken);
      user = {
        firstName: decoded.firstName || "",
        lastName: decoded.lastName || "",
        email: decoded.sub || decoded.email || "",
        avatarUrl: decoded.avatarUrl,
        role: decoded.role,
        anonymous: decoded.anonymous || false,
        plan: decoded.plan || "FREE",
        phone: decoded.phone,
      };
    } catch {}
  }

  const handleLogoutLocal = () => handleLogout(navigate, true); // Force reload để reset state

  const handleProfile = () => {
    // Navigate to profile page or show profile modal
    navigate("/student/profile");
  };

  // Các loại bài test hiện có
  const testTypes = [
    {
      key: "PHQ-9",
      name: t("testTypes.PHQ9.name"),
      description: t("testTypes.PHQ9.description"),
      icon: (
        <svg
          className="w-8 h-8 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      key: "GAD-7",
      name: t("testTypes.GAD7.name"),
      description: t("testTypes.GAD7.description"),
      icon: (
        <svg
          className="w-8 h-8 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
          />
        </svg>
      ),
    },
    {
      key: "BDI",
      name: t("testTypes.BDI.name"),
      description: t("testTypes.BDI.description"),
      icon: (
        <svg
          className="w-8 h-8 text-purple-600 dark:text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 1.343-3 3 0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.657-1.343-3-3-3zm0 10c-4.418 0-8-1.79-8-4V6a2 2 0 012-2h12a2 2 0 012 2v8c0 2.21-3.582 4-8 4z"
          />
        </svg>
      ),
    },
  ];

  // Thay đổi hàm handleTakeTest để nhận loại test
  const handleTakeTest = (testType) => {
    // Kiểm tra xem user đã đăng nhập hoặc có tài khoản ẩn danh chưa
    if (!currentUser && !currentToken) {
      // Chưa có tài khoản, lưu lại testType và hiển thị modal chọn
      setSelectedTestType(testType); // Lưu testType
      setAnonymousModalOpen(true);
      return;
    }
    // Truyền ngôn ngữ hiện tại vào URL để đảm bảo test hiển thị đúng ngôn ngữ
    const currentLanguage = i18n.language;
    const testUrl = `/student/test?type=${testType}&lang=${currentLanguage}`;

    navigate(testUrl);
  };

  // Sửa hàm handleAnonymousStart để dùng selectedTestType
  const handleAnonymousStart = async () => {
    try {
      const response = await createAnonymousAccount();

      const { user: anonymousUser, token } = response;
      if (!token) {
        setNotificationModal({
          isOpen: true,
          type: "error",
          title: t("common.error"),
          message: t("errors.tokenNotFound"),
          onConfirm: null,
        });
        return;
      }
      // Lưu thông tin user và token
      saveAnonymousUser(anonymousUser);
      saveAnonymousToken(token);
      // Đóng modal
      setAnonymousModalOpen(false);
      // Lưu pendingTestType vào localStorage để AppRoutes xử lý điều hướng
      const type = selectedTestType || "DASS-21";
      localStorage.setItem("pendingTestType", type);
      // Navigate trực tiếp thay vì reload
      navigate(`/student/test?type=${type}`);
    } catch (error) {
      // Error creating anonymous account
      setNotificationModal({
        isOpen: true,
        type: "error",
        title: t("common.error"),
        message: t("errors.anonymousAccountCreationFailed"),
        onConfirm: null,
      });
    }
  };

  // Xử lý chuyển đến trang đăng nhập
  const handleLoginStart = () => {
    navigate("/login");
  };

  // Xử lý nâng cấp tài khoản ẩn danh
  const handleUpgradeAccount = async (userId, upgradeData) => {
    try {
      const response = await upgradeAnonymousAccount(userId, upgradeData);

      // Xóa dữ liệu anonymous
      clearAnonymousData();

      // Lưu thông tin user mới
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Refresh trang để cập nhật thông tin user
      window.location.reload();
    } catch (error) {
      // Error upgrading account
      throw error;
    }
  };

  // Xử lý hiển thị modal nâng cấp
  const handleUpgradeClick = () => {
    setUpgradeModalOpen(true);
  };

  // Đặt function vào window object để DashboardHeader có thể gọi
  useEffect(() => {
    window.handleUpgradeClick = handleUpgradeClick;
    return () => {
      delete window.handleUpgradeClick;
    };
  }, []);

  // Drag handlers for chatbot icon
  const handleDragStart = (e) => {
    dragData.current.dragging = true;
    dragData.current.startY =
      e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    dragData.current.startBottom = chatbotBottom;
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchmove", handleDragMove);
    document.addEventListener("touchend", handleDragEnd);
  };
  const handleDragMove = (e) => {
    if (!dragData.current.dragging) return;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    const deltaY = dragData.current.startY - clientY;
    let newBottom = dragData.current.startBottom + deltaY;
    // Clamp to window height
    const minBottom = 16;
    const maxBottom = window.innerHeight - 100;
    if (newBottom < minBottom) newBottom = minBottom;
    if (newBottom > maxBottom) newBottom = maxBottom;
    setChatbotBottom(newBottom);
  };
  const handleDragEnd = () => {
    dragData.current.dragging = false;
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchmove", handleDragMove);
    document.removeEventListener("touchend", handleDragEnd);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Dashboard Header */}
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300" />
        }
        logoText={t("studentHomeHeader")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        i18n={i18n}
        onLogout={handleLogoutLocal}
        onProfile={handleProfile}
        onStartTour={() => setTourOpen(true)}
        className="mb-4"
      />

      <div>
        {/* Hero Section */}
        <div id="hero-section">
          <HeroSection user={user} onLogout={handleLogoutLocal} />
        </div>

        {/* Test List Section */}
        <div id="test-section">
          <TestListSection onTakeTest={handleTakeTest} />
        </div>

        {/* About Section */}
        <AboutSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Footer Section */}
        <FooterSection />
      </div>

      {/* Chatbot Icon Floating Button - Chỉ hiển thị khi user đã đăng nhập */}
      {user && !user.anonymous && (
        <button
          id="chatbot-button"
          ref={dragRef}
          onClick={() => setChatOpen(true)}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{
            position: "fixed",
            right: 24,
            bottom: chatbotBottom,
            zIndex: 50,
            cursor: "grab",
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl focus:outline-none select-none"
          title={t("pageTitles.chatWithAI")}
        >
          <img
            src="/src/assets/images/Chatbot.png"
            alt="Chatbot"
            className="w-10 h-10 object-contain"
            draggable={false}
          />
        </button>
      )}

      {/* Anonymous Chatbot Notice - Hiển thị cho anonymous user */}
      {user && user.anonymous && (
        <AnonymousChatbotNotice onUpgrade={() => navigate("/register")} />
      )}

      {/* Modals */}
      <ChatBotModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        user={user}
      />

      <AnonymousTestModal
        isOpen={anonymousModalOpen}
        onClose={() => setAnonymousModalOpen(false)}
        onAnonymousStart={handleAnonymousStart}
        onLoginStart={handleLoginStart}
      />

      <UpgradeAnonymousModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onUpgrade={handleUpgradeAccount}
        userId={user ? user.id : undefined}
      />

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

      {/* Home Page Tour */}
      <HomePageTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
};

export default StudentHomePage;
