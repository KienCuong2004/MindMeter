import React, { useState, useEffect } from "react";
import {
  FaCheck,
  FaGoogle,
  FaUser,
  FaInfoCircle,
  FaArrowRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";

const AccountLinkingNotification = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(10);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Get user info from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email") || localStorage.getItem("linkedEmail");
    const name = urlParams.get("name") || "Người dùng";
    const token = urlParams.get("token");

    if (email) {
      setUserInfo({ email, name });
      localStorage.setItem("linkedEmail", email);

      // Lưu token vào localStorage và decode để lưu user object
      if (token) {
        localStorage.setItem("token", token);

        try {
          // Decode token để lấy thông tin user
          const decoded = jwtDecode(token);

          // Lưu user object vào localStorage giống như AuthCallback
          const user = {
            email: decoded.sub || email,
            role: decoded.role,
            firstName: decoded.firstName || "",
            lastName: decoded.lastName || "",
            avatarUrl: decoded.avatarUrl || null,
            plan: decoded.plan || "FREE",
            phone: decoded.phone,
            anonymous: decoded.anonymous || false,
          };

          // Tạo name từ firstName và lastName
          user.name =
            (user.firstName || "") +
              (user.lastName ? " " + user.lastName : "") ||
            user.email ||
            "User";

          localStorage.setItem("user", JSON.stringify(user));

          // Lưu thời gian đăng nhập để chống spam mua gói
          const loginTimeKey = `lastLogin_${user.email}`;
          localStorage.setItem(loginTimeKey, Date.now().toString());
        } catch (error) {
          console.error(
            "[AccountLinkingNotification] Error decoding token:",
            error
          );
        }
      }
    }

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          navigate("/home");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, t]);

  const handleContinueNow = () => {
    navigate("/home");
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/90 dark:bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="text-gray-800 dark:text-white">
            {t("accountLinking.loadingInfo")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/95 dark:bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse-slow">
            <FaCheck className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {t("accountLinking.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {t("accountLinking.subtitle")}
          </p>
        </div>

        <div className="bg-gray-100/80 dark:bg-white/5 rounded-3xl p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <FaInfoCircle className="mr-2 text-blue-500 dark:text-blue-400" />
            {t("accountLinking.accountInfo")}
          </h2>

          <div className="space-y-3">
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <FaUser className="mr-3 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">{t("accountLinking.email")}</span>
              <span className="ml-2">{userInfo.email}</span>
            </div>

            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <FaGoogle className="mr-3 text-red-500 dark:text-red-400" />
              <span className="font-medium">
                {t("accountLinking.loginMethod")}
              </span>
              <span className="ml-2">
                {t("accountLinking.loginMethodValue")}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-100/80 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-400/30 rounded-3xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3">
            {t("accountLinking.howItWorks")}
          </h3>
          <div className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
            <p>• {t("accountLinking.explanation1")}</p>
            <p>• {t("accountLinking.explanation2")}</p>
            <p>• {t("accountLinking.explanation3")}</p>
            <div className="ml-4 space-y-1">
              <p>• {t("accountLinking.explanation4")}</p>
              <p>• {t("accountLinking.explanation5")}</p>
            </div>
            <p>• {t("accountLinking.explanation6")}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleContinueNow}
            className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          >
            {t("accountLinking.continueToHome")}
            <FaArrowRight className="ml-2" />
          </button>

          <button
            onClick={handleGoToLogin}
            className="flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {t("accountLinking.goToLogin")}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t("accountLinking.autoRedirect", { count: countdown })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountLinkingNotification;
