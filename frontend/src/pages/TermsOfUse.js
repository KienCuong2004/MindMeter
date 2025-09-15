import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import {
  FaFileContract,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaHandshake,
  FaGavel,
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

export default function TermsOfUse() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
  document.title = t("terms.title") + " | MindMeter";

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6fa] dark:bg-[#181e29]">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300" />
        }
        logoText={t("terms.title")}
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
              <FaFileContract className="text-white text-3xl" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
              {t("terms.title")}
            </h1>
          </div>
          <p className="mb-6 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            {t("terms.intro")}
          </p>

          <div className="space-y-6">
            {Object.keys(t("terms.items", { returnObjects: true })).map(
              (key, index) => {
                const item = t(`terms.items.${key}`, { returnObjects: true });
                return (
                  <div
                    key={key}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-l-4 border-green-500 dark:border-green-400"
                  >
                    <h2 className="text-xl font-bold mb-3 text-green-700 dark:text-green-300 flex items-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full mr-3 text-sm font-bold">
                        {index + 1}
                      </span>
                      {item.title}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              }
            )}
          </div>
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            © {new Date().getFullYear()} MindMeter. {t("terms.copyrightRights")}
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
