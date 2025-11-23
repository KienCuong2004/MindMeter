import React, { useEffect, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";
import {
  getCurrentUser,
  getCurrentToken,
  clearAnonymousData,
} from "../services/anonymousService";
import {
  FaUserMd,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaComments,
  FaBrain,
} from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

const EMAIL = "mindmeter.app@gmail.com";
const PHONE = "0369702376";

// Định nghĩa màu sắc cho mức độ trầm cảm
const severityColors = {
  MINIMAL:
    "text-green-600 border-green-400 bg-green-50 dark:text-green-300 dark:border-green-500 dark:bg-green-900",
  MILD: "text-yellow-600 border-yellow-400 bg-yellow-50 dark:text-yellow-200 dark:border-yellow-500 dark:bg-yellow-900",
  MODERATE:
    "text-orange-600 border-orange-400 bg-orange-50 dark:text-orange-300 dark:border-orange-500 dark:bg-orange-900",
  SEVERE:
    "text-red-600 border-red-400 bg-red-50 dark:text-red-300 dark:border-red-500 dark:bg-red-900",
};

const ConsultTherapyPage = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy thông tin từ test result nếu có
  const testResult = location.state?.testResult;
  const testType = location.state?.testType;

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
    document.title =
      i18n.language === "vi"
        ? t("consult.pageTitle") + " | MindMeter"
        : t("consult.pageTitle") + " | MindMeter";
  }, [i18n.language, t]);

  const bullets = t("consult.bullets", { returnObjects: true });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("consult.pageTitle")}
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
      <main className="flex-grow flex flex-col items-center justify-center pt-28 pb-8 px-4">
        <div className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 dark:text-blue-300 mb-6 text-center">
            {t("consult.title")}
          </h1>

          {/* Hiển thị thông tin test result nếu có */}
          {testResult && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-3 text-center">
                {t("consult.testResultTitle")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {t("consult.testType")}
                  </p>
                  <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                    {testType || "-"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {t("consult.severity")}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${
                      severityColors[
                        testResult.severityLevel || testResult.severity
                      ] || "text-gray-700 border-gray-300 bg-gray-50"
                    }`}
                  >
                    {t(
                      `studentTestResultPage.severityVi.${
                        testResult.severityLevel || testResult.severity
                      }`
                    ) ||
                      testResult.severityLevel ||
                      testResult.severity}
                  </span>
                </div>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                {t("consult.testResultDesc")}
              </p>
            </div>
          )}

          <p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 mb-6 text-center">
            {t("consult.intro")}
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-3 mb-6">
            {Array.isArray(bullets) &&
              bullets.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>

          {/* Nút hành động nhanh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => navigate("/appointments")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <FaCalendarAlt className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {t("consult.bookAppointment")}
            </button>

            <button
              onClick={() =>
                window.open(
                  `https://zalo.me/${PHONE.replace(/\D/g, "")}`,
                  "_blank"
                )
              }
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <FaComments className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {t("consult.chatZalo")}
            </button>
          </div>
          <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-6 text-center mb-6">
            <p className="text-base md:text-lg text-blue-900 dark:text-blue-200 font-semibold mb-2">
              {t("consult.contactTitle")}
            </p>
            <p className="text-gray-800 dark:text-gray-200">
              <Trans
                i18nKey="consult.contactDesc"
                values={{ email: EMAIL, phone: PHONE }}
                components={{
                  1: (
                    <a
                      href={`mailto:${EMAIL}`}
                      className="text-blue-700 dark:text-blue-300 underline hover:text-blue-800 dark:hover:text-blue-200"
                    />
                  ),
                  3: (
                    <a
                      href={`tel:${PHONE}`}
                      className="text-blue-700 dark:text-blue-300 underline hover:text-blue-800 dark:hover:text-blue-200"
                    />
                  ),
                }}
              />
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {t("consult.note")}
          </p>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default ConsultTherapyPage;
