import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaShieldAlt,
  FaUserMd,
  FaCheckCircle,
  FaBrain,
} from "react-icons/fa";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";
import { jwtDecode } from "jwt-decode";
import {
  getCurrentUser,
  getCurrentToken,
  clearAnonymousData,
} from "../services/anonymousService";

export default function Disclaimer() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const items = t("disclaimer.items", { returnObjects: true });

  // Đồng bộ logic lấy user như trang Home
  let user = null;
  let u = getCurrentUser();
  const token = getCurrentToken();
  if (u) {
    if (u.anonymous === true || u.role === "ANONYMOUS" || u.email === null) {
      u = {
        ...u,
        name: u.name || t("anonymousUser.name"),
        anonymous: true,
        role: u.role || "STUDENT",
      };
    }
    user = u;
  } else if (token) {
    try {
      const decoded = jwtDecode(token);
      let userObj = {};
      userObj.name = (
        (decoded.firstName || "") +
        (decoded.lastName ? " " + decoded.lastName : "")
      ).trim();
      userObj.email = decoded.sub || decoded.email || "";
      if (!userObj.name) userObj.name = userObj.email || "Student";
      if (decoded.avatar) userObj.avatar = decoded.avatar;
      if (decoded.role) userObj.role = decoded.role;
      if (decoded.anonymous) userObj.anonymous = true;
      if (userObj.anonymous && !userObj.role) userObj.role = "STUDENT";
      if (userObj.anonymous && !userObj.name)
        userObj.name = t("anonymousUser.name");
      user = userObj;
    } catch {}
  }

  // Set document title
  document.title = t("disclaimer.title") + " | MindMeter";

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6fa] dark:bg-[#181e29]">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("disclaimer.title")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onLogout={() => handleLogout(navigate)}
        onProfile={() => {
          if (!user) return;
          if (user.role === "ADMIN") {
            window.location.href = "/admin/profile";
          } else if (user.role === "EXPERT") {
            window.location.href = "/expert/profile";
          } else {
            window.location.href = "/student/profile";
          }
        }}
      />
      <main className="flex-grow flex flex-col items-center justify-center pt-28 pb-8">
        <div className="w-full max-w-4xl p-10 bg-white dark:bg-[#232a36] shadow-2xl dark:shadow-2xl rounded-2xl text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-[#232a36]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mb-4 shadow-lg">
              <FaExclamationTriangle className="text-white text-3xl" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
              {t("disclaimer.title")}
            </h1>
          </div>
          <div className="text-gray-800 dark:text-gray-200 space-y-6">
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              {t("disclaimer.intro")}
            </p>
            <div className="space-y-6">
              {Array.isArray(items) &&
                items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border-l-4 border-yellow-500 dark:border-yellow-400"
                  >
                    <h2 className="text-xl font-bold mb-3 text-yellow-700 dark:text-yellow-300 flex items-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full mr-3 text-sm font-bold">
                        {idx + 1}
                      </span>
                      {item.bold}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} MindMeter.{" "}
            {t("disclaimer.copyrightRights")}
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
