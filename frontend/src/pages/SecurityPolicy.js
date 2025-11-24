import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaBrain } from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";
import { getCurrentUser, getCurrentToken } from "../services/anonymousService";
import { jwtDecode } from "jwt-decode";

export default function SecurityPolicy() {
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
  document.title = t("securityPolicy.title") + " | MindMeter";

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6fa] dark:bg-[#181e29] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200/30 to-blue-200/30 dark:from-green-800/20 dark:to-blue-800/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-green-200/30 dark:from-blue-800/20 dark:to-green-800/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-200/20 to-teal-200/20 dark:from-emerald-800/10 dark:to-teal-800/10 rounded-full blur-3xl"></div>
      </div>

      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("securityPolicy.title")}
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

      <main className="flex-grow flex flex-col items-center justify-center pt-28 pb-8 relative z-10">
        <div className="w-full max-w-4xl p-10 bg-white dark:bg-[#232a36] shadow-2xl dark:shadow-2xl rounded-2xl text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-[#232a36]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
              <FaShieldAlt className="text-white text-3xl" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
              {t("securityPolicy.title")}
            </h1>
          </div>

          {/* Introduction */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-l-4 border-green-500 dark:border-green-400 mb-6">
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              {t("securityPolicy.intro")}
            </p>
          </div>

          {/* Security Measures Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-blue-700 dark:text-blue-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full mr-3 text-sm font-bold">
                1
              </span>
              {t("securityPolicy.measures.title")}
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("securityPolicy.measures.intro")}
            </p>
            <ul className="list-none ml-0 space-y-3">
              <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-blue-600 dark:text-blue-400">
                    {t("securityPolicy.measures.encryption")}:
                  </strong>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("securityPolicy.measures.encryptionDesc")}
                  </span>
                </div>
              </li>
              <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-green-600 dark:text-green-400">
                    {t("securityPolicy.measures.access")}:
                  </strong>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("securityPolicy.measures.accessDesc")}
                  </span>
                </div>
              </li>
              <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-purple-600 dark:text-purple-400">
                    {t("securityPolicy.measures.monitoring")}:
                  </strong>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("securityPolicy.measures.monitoringDesc")}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Data Protection Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border-l-4 border-purple-500 dark:border-purple-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-purple-700 dark:text-purple-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full mr-3 text-sm font-bold">
                2
              </span>
              {t("securityPolicy.protection.title")}
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("securityPolicy.protection.intro")}
            </p>
            <ul className="list-none ml-0 space-y-3">
              <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-purple-600 dark:text-purple-400">
                    {t("securityPolicy.protection.backup")}:
                  </strong>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("securityPolicy.protection.backupDesc")}
                  </span>
                </div>
              </li>
              <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-pink-600 dark:text-pink-400">
                    {t("securityPolicy.protection.recovery")}:
                  </strong>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("securityPolicy.protection.recoveryDesc")}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Incident Response Section */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-xl border-l-4 border-red-500 dark:border-red-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-red-700 dark:text-red-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full mr-3 text-sm font-bold">
                3
              </span>
              {t("securityPolicy.incident.title")}
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("securityPolicy.incident.intro")}
            </p>
            <ul className="list-none ml-0 space-y-3">
              <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-red-600 dark:text-red-400">
                    {t("securityPolicy.incident.detection")}:
                  </strong>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("securityPolicy.incident.detectionDesc")}
                  </span>
                </div>
              </li>
              <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-orange-600 dark:text-orange-400">
                    {t("securityPolicy.incident.response")}:
                  </strong>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("securityPolicy.incident.responseDesc")}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Compliance Section */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 rounded-xl border-l-4 border-teal-500 dark:border-teal-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-teal-700 dark:text-teal-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-teal-500 text-white rounded-full mr-3 text-sm font-bold">
                4
              </span>
              {t("securityPolicy.compliance.title")}
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("securityPolicy.compliance.intro")}
            </p>
            <ul className="list-none ml-0 space-y-3">
              <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-teal-600 dark:text-teal-400">
                    {t("securityPolicy.compliance.standards")}:
                  </strong>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("securityPolicy.compliance.standardsDesc")}
                  </span>
                </div>
              </li>
              <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong className="text-cyan-600 dark:text-cyan-400">
                    {t("securityPolicy.compliance.certification")}:
                  </strong>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("securityPolicy.compliance.certificationDesc")}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 rounded-xl border-l-4 border-emerald-500 dark:border-emerald-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-emerald-700 dark:text-emerald-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-full mr-3 text-sm font-bold">
                5
              </span>
              {t("securityPolicy.contact.title")}
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("securityPolicy.contact.intro")}
            </p>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300">
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {t("securityPolicy.contact.email")}:
                </strong>{" "}
                mindmeter.app@gmail.com
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {t("securityPolicy.contact.response")}:
                </strong>{" "}
                {t("securityPolicy.contact.responseTime")}
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            © {new Date().getFullYear()} MindMeter.{" "}
            {t("securityPolicy.copyrightRights")}
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
