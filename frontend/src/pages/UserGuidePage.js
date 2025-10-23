import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { FaBookOpen, FaBrain } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { getCurrentUser, getCurrentToken } from "../services/anonymousService";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";
import { sanitizeHtmlSafe } from "../utils/sanitizeHtml";

export default function UserGuidePage() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const sections = t("guide.sections", { returnObjects: true });

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

  useEffect(() => {
    document.title = t("guide.header") + " | MindMeter";
  }, [t]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6fa] dark:bg-[#181e29]">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("guide.header")}
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-green-600 rounded-full mb-4 shadow-lg">
              <FaBookOpen className="text-white text-3xl" />
            </div>
            <h1
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 bg-clip-text text-transparent"
              dangerouslySetInnerHTML={{ __html: t("guide.title") }}
            />
          </div>
          <div className="space-y-6 text-gray-800 dark:text-gray-200">
            {Array.isArray(sections) &&
              sections.map((section, sec) => (
                <div
                  key={sec}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-l-4 border-blue-500 dark:border-blue-400"
                >
                  <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300 flex items-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full mr-3 text-sm font-bold">
                      {sec + 1}
                    </span>
                    {section.title}
                  </h2>
                  <ul className="space-y-3">
                    {Array.isArray(section.content) &&
                      section.content.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start text-gray-700 dark:text-gray-300 leading-relaxed"
                        >
                          <span className="text-blue-500 mr-3 flex-shrink-0 mt-1">
                            •
                          </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtmlSafe(item),
                            }}
                          />
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
