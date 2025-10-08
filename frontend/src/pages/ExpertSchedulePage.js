import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBrain, FaClock } from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import ExpertScheduleManager from "../components/ExpertScheduleManager";
import { useTheme } from "../hooks/useTheme";

export default function ExpertSchedulePage({ handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [user, setUser] = useState(null);

  // Sử dụng theme từ context
  const { theme, setTheme, toggleTheme } = useTheme();

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
            if (parsedUser.role !== "EXPERT") {
              // Nếu không phải expert, redirect về trang phù hợp
              if (parsedUser.role === "STUDENT") {
                navigate("/appointments", { replace: true });
              } else if (parsedUser.role === "ADMIN") {
                navigate("/admin/dashboard", { replace: true });
              }
            }
          } catch (e) {
            navigate("/login", { replace: true });
          }
        } else {
          navigate("/login", { replace: true });
        }
      } catch (e) {
        navigate("/login", { replace: true });
      }
    };

    initializePage();
  }, [navigate]);

  const navigateToHome = useCallback(() => {
    navigate("/expert/dashboard");
  }, [navigate]);

  const navigateToProfile = useCallback(() => {
    navigate("/expert/profile");
  }, [navigate]);

  // Set browser tab title khi i18n sẵn sàng
  useEffect(() => {
    if (t && t("scheduleManagement")) {
      document.title = t("scheduleManagement");
    }
  }, [t]);

  // Kiểm tra role để đảm bảo chỉ expert mới có thể truy cập
  if (!user || user.role !== "EXPERT") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Dashboard Header */}
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("scheduleManagement")}
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
          {/* Expert Schedule Manager */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border-t-4 border-green-400">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <FaClock className="text-2xl text-green-500 dark:text-green-400" />
                <div className="text-xl font-bold text-green-700 dark:text-green-300">
                  {t("scheduleManagement")}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-11 text-base leading-relaxed">
                {t("scheduleDescription")}
              </p>
            </div>
            <ExpertScheduleManager theme={theme} />
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <FooterSection />
    </div>
  );
}
