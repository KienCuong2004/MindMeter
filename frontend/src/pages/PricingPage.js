import React, { useState, useEffect } from "react";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import DynamicPrice from "../components/DynamicPrice";
import { useTranslation } from "react-i18next";
import { FaBrain, FaSync, FaCheck } from "react-icons/fa";
import { useTheme } from "../hooks/useTheme";
import { getCurrentUser, refreshToken } from "../services/anonymousService";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import NotificationModal from "../components/NotificationModal";
import RateLimitModal from "../components/RateLimitModal";
import NotFoundPage from "./NotFoundPage";

export default function PricingPage() {
  const { t, i18n } = useTranslation();
  const user = getCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(user?.plan || "FREE");
  const [planExpiryInfo, setPlanExpiryInfo] = useState(null);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const location = useLocation();
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rateLimitModal, setRateLimitModal] = useState({
    isOpen: false,
    retryAfterSeconds: 60,
  });

  useEffect(() => {
    document.title = t("pricing.title") + " | MindMeter";
    // Hiển thị thông báo nếu có ?success=true trên URL
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "true") {
      setShowSuccess(true);
      // Xoá param khỏi URL sau khi hiển thị
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [t, location]);

  // Cập nhật currentPlan khi user thay đổi
  useEffect(() => {
    if (user && user.plan) {
      setCurrentPlan(user.plan);
    } else {
      setCurrentPlan("FREE");
    }
  }, [user]);

  // Cập nhật currentPlan từ localStorage khi component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.plan) {
          setCurrentPlan(userData.plan);
        }
      } catch (e) {
        // Error parsing stored user data
      }
    }
  }, []);

  // Khi nâng cấp thành công, fetch lại profile để cập nhật plan mới nhất
  useEffect(() => {
    if (
      showSuccess &&
      user &&
      (user.role === "STUDENT" ||
        user.role === "ADMIN" ||
        user.role === "EXPERT")
    ) {
      // Delay một chút để đảm bảo backend đã xử lý xong webhook
      const timer = setTimeout(() => {
        setIsUpdatingPlan(true); // Bắt đầu loading
        refreshToken()
          .then((data) => {
            setIsUpdatingPlan(false); // Kết thúc loading

            // Cập nhật user trong localStorage với plan mới
            localStorage.setItem("user", JSON.stringify(data.user));

            // Cập nhật currentPlan state để UI cập nhật ngay lập tức
            setCurrentPlan(data.user.plan);

            // Cập nhật plan expiry information
            if (data.user.planExpiryDate) {
              setPlanExpiryInfo({
                startDate: new Date(data.user.planStartDate),
                expiryDate: new Date(data.user.planExpiryDate),
              });
            }

            // Cập nhật JWT token với plan mới
            try {
              jwtDecode(data.token);
            } catch (error) {
              // Error updating JWT claims
            }

            // Reload trang để cập nhật UI hoàn toàn
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          })
          .catch((error) => {
            // Error refreshing token

            // Thử lại sau 3 giây nếu lần đầu fail
            setTimeout(() => {
              refreshToken()
                .then((data) => {
                  setIsUpdatingPlan(false); // Kết thúc loading
                  localStorage.setItem("user", JSON.stringify(data.user));
                  setCurrentPlan(data.user.plan);
                  if (data.user.planExpiryDate) {
                    setPlanExpiryInfo({
                      startDate: new Date(data.user.planStartDate),
                      expiryDate: new Date(data.user.planExpiryDate),
                    });
                  }
                  // Reload sau khi retry thành công
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                })
                .catch((retryError) => {
                  // Retry also failed
                  setIsUpdatingPlan(false); // Kết thúc loading
                  // Không hiển thị alert lỗi, chỉ log để debug
                  // User có thể refresh trang thủ công
                });
            }, 3000);
          });
      }, 2000); // Delay 2 giây trước khi gọi API

      // Cleanup timer
      return () => clearTimeout(timer);
    }
  }, [showSuccess, user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("anonymousToken");
    window.location.href = "/login";
  };

  const handleBuyPlan = async (plan) => {
    console.log("handleBuyPlan called with plan:", plan);
    console.log("Current plan:", currentPlan);

    // 🚫 Chống spam: Kiểm tra cooldown period (3 giây)
    const now = Date.now();
    const COOLDOWN_PERIOD = 3000; // 3 giây

    if (now - lastClickTime < COOLDOWN_PERIOD) {
      console.log("Rate limited - too soon since last click");
      setNotificationModal({
        isOpen: true,
        type: "warning",
        title: t("pricing.rateLimitTitle"),
        message: t("pricing.rateLimitMessage"),
        onConfirm: null,
      });
      return;
    }

    // 🚫 Chống spam: Kiểm tra đang xử lý
    if (isProcessing) {
      console.log("Already processing a request");
      return;
    }

    // Kiểm tra xem user có thể mua plan này không
    const planHierarchy = { FREE: 0, PLUS: 1, PRO: 2 };
    const currentPlanLevel = planHierarchy[currentPlan] || 0;
    const targetPlanLevel = planHierarchy[plan.toUpperCase()] || 0;

    console.log(
      "Plan levels - current:",
      currentPlanLevel,
      "target:",
      targetPlanLevel
    );

    // Chỉ cho phép nâng cấp lên plan cao hơn
    if (targetPlanLevel <= currentPlanLevel) {
      console.log("Cannot upgrade - target level not higher than current");
      setNotificationModal({
        isOpen: true,
        type: "warning",
        title: t("pricing.higherPlan"),
        message: t("pricing.cannotDowngrade"),
        onConfirm: null,
      });
      return;
    }

    // Cập nhật state để chống spam
    setLastClickTime(now);
    setIsProcessing(true);
    setLoadingPlan(plan);

    try {
      console.log("Navigating to payment method page...");
      // Navigate to payment method selection page
      navigate(`/payment-method?plan=${plan}`);
    } catch (err) {
      console.error("Navigation error:", err);
      setNotificationModal({
        isOpen: true,
        type: "error",
        title: t("common.error"),
        message: err.message || t("pricing.createSessionError"),
        onConfirm: null,
      });
    } finally {
      setLoadingPlan(null);
      setIsProcessing(false);
    }
  };

  // Chỉ cho phép STUDENT truy cập trang pricing
  // Nếu không phải STUDENT (bao gồm ADMIN, EXPERT, ANONYMOUS) thì hiển thị trang 404
  if (!user || user.role !== "STUDENT") {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("pricing.title") || "Chọn gói dịch vụ"}
        user={user}
        i18n={i18n}
        theme={theme}
        setTheme={toggleTheme}
        onLogout={handleLogout}
      />
      {showSuccess && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-800 px-8 py-4 rounded-xl shadow-lg text-lg font-semibold animate-fade-in">
          {t("pricing.upgradeSuccess")}
        </div>
      )}

      {isUpdatingPlan && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 bg-blue-100 border border-blue-400 text-blue-800 px-8 py-4 rounded-xl shadow-lg text-lg font-semibold animate-fade-in">
          <FaSync className="inline-block w-5 h-5 mr-2 animate-spin" />
          {t("pricing.updatingPlan")}
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center py-16 px-4 pt-32">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-blue-700 dark:text-indigo-300 mb-8">
          {t("pricing.title")}
        </h1>
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center items-stretch">
          {/* Free Plan */}
          <div
            className={`flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col border-2 ${
              currentPlan === "FREE"
                ? "border-blue-500 dark:border-blue-400"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className="flex flex-col items-center flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                {t("pricing.freeTitle")}
              </h2>
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">
                <DynamicPrice
                  plan="free"
                  fallbackPrice={t("pricing.freePrice")}
                />
              </div>
              <div className="text-sm text-gray-500 mb-6">
                {t("pricing.perMonth")}
              </div>

              {/* Hiển thị badge plan hiện tại */}
              {currentPlan === "FREE" && (
                <div className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {t("pricing.currentPlan")}
                </div>
              )}

              {/* Hiển thị thông tin thời hạn gói */}
              {currentPlan === "FREE" && planExpiryInfo && (
                <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                  <div>{t("pricing.freeUnlimited")}</div>
                </div>
              )}

              <ul className="text-gray-700 dark:text-gray-200 text-left mb-8 space-y-2 w-full max-w-xs mx-auto flex-1">
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.free1")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.free2")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.free3")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.free4")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.free5")}
                </li>
              </ul>
            </div>

            <button
              className={`w-full py-3 rounded-lg font-semibold transition ${
                currentPlan === "FREE"
                  ? "bg-blue-100 text-blue-800 cursor-not-allowed"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled
            >
              {currentPlan === "FREE"
                ? t("pricing.currentPlan")
                : t("pricing.cannotDowngrade")}
            </button>
          </div>

          {/* Plus Plan */}
          <div
            className={`flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 flex flex-col border-4 ${
              currentPlan === "PLUS"
                ? "border-green-500 dark:border-green-400"
                : currentPlan === "PRO"
                ? "border-purple-500 dark:border-purple-400"
                : "border-green-400 dark:border-green-600"
            } scale-105`}
          >
            <div className="flex flex-col items-center flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                {t("pricing.plusTitle")}
              </h2>
              <div className="text-3xl font-extrabold text-green-600 dark:text-green-400 mb-2">
                <DynamicPrice
                  plan="plus"
                  fallbackPrice={t("pricing.plusPrice")}
                />
              </div>
              <div className="text-sm text-gray-500 mb-6">
                {t("pricing.perMonth")}
              </div>

              {/* Hiển thị badge plan hiện tại */}
              {currentPlan === "PLUS" && (
                <div className="mb-4 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  {t("pricing.currentPlan")}
                </div>
              )}
              {currentPlan === "PRO" && (
                <div className="mb-4 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                  {t("pricing.upgradedToPro")}
                </div>
              )}

              <ul className="text-gray-700 dark:text-gray-200 text-left mb-8 space-y-2 w-full max-w-xs mx-auto flex-1">
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.plus1")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.plus2")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.plus3")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.plus4")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.plus5")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.plus6")}
                </li>
              </ul>
            </div>

            <button
              className={`w-full py-3 rounded-lg font-semibold transition ${
                currentPlan === "PLUS" || currentPlan === "PRO" || isProcessing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
              onClick={() => handleBuyPlan("plus")}
              disabled={
                loadingPlan !== null ||
                currentPlan === "PLUS" ||
                currentPlan === "PRO" ||
                isProcessing
              }
            >
              {loadingPlan === "plus"
                ? t("pricing.loading")
                : currentPlan === "PLUS"
                ? t("pricing.currentPlan")
                : currentPlan === "PRO"
                ? t("pricing.higherPlan")
                : t("pricing.upgradePlus")}
            </button>
          </div>

          {/* Pro Plan */}
          <div
            className={`flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col border-2 ${
              currentPlan === "PRO"
                ? "border-purple-500 dark:border-purple-400"
                : "border-purple-400 dark:border-purple-600"
            }`}
          >
            <div className="flex flex-col items-center flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                {t("pricing.proTitle")}
              </h2>
              <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mb-2">
                <DynamicPrice
                  plan="pro"
                  fallbackPrice={t("pricing.proPrice")}
                />
              </div>
              <div className="text-sm text-gray-500 mb-6">
                {t("pricing.perMonth")}
              </div>

              {/* Hiển thị badge plan hiện tại */}
              {currentPlan === "PRO" && (
                <div className="mb-4 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                  {t("pricing.currentPlan")}
                </div>
              )}

              <ul className="text-gray-700 dark:text-gray-200 text-left mb-8 space-y-2 w-full max-w-xs mx-auto flex-1">
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.pro1")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.pro2")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.pro3")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.pro4")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.pro5")}
                </li>
                <li>
                  <FaCheck className="inline-block w-4 h-4 mr-2 text-green-500" />{" "}
                  {t("pricing.pro6")}
                </li>
              </ul>
            </div>

            <button
              className={`w-full py-3 rounded-lg font-semibold transition ${
                currentPlan === "PRO" || isProcessing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
              onClick={() => handleBuyPlan("pro")}
              disabled={
                loadingPlan !== null || currentPlan === "PRO" || isProcessing
              }
            >
              {loadingPlan === "pro"
                ? t("pricing.loading")
                : currentPlan === "PRO"
                ? t("pricing.currentPlan")
                : t("pricing.upgradePro")}
            </button>
          </div>
        </div>
        <div className="mt-10 text-center text-gray-500 dark:text-gray-400 text-sm max-w-2xl mx-auto">
          {t("pricing.demoNote")}
        </div>
      </main>
      <FooterSection />

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

      {/* Rate Limit Modal */}
      <RateLimitModal
        isOpen={rateLimitModal.isOpen}
        onClose={() =>
          setRateLimitModal((prev) => ({ ...prev, isOpen: false }))
        }
        retryAfterSeconds={rateLimitModal.retryAfterSeconds}
        title={t("pricing.rateLimitTitle")}
        message={t("pricing.rateLimitExceeded")}
      />
    </div>
  );
}
