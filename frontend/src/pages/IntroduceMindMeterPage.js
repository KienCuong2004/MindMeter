import React, { useEffect } from "react";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { FaBrain } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";
import {
  getCurrentUser,
  getCurrentToken,
  clearAnonymousData,
} from "../services/anonymousService";
import { jwtDecode } from "jwt-decode";

export default function IntroduceMindMeterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Đặt title cho trang
  useEffect(() => {
    document.title =
      i18n.language === "vi"
        ? "Giới thiệu MindMeter | MindMeter"
        : "About MindMeter | MindMeter";
  }, [i18n.language]);

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

  // Xác định đường dẫn profile phù hợp
  let onProfile = undefined;
  if (user && user.role) {
    if (user.role === "ADMIN") {
      onProfile = () => navigate("/admin/profile");
    } else if (user.role === "EXPERT") {
      onProfile = () => navigate("/expert/profile");
    } else {
      onProfile = () => navigate("/student/profile");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("introduce.title1")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onProfile={onProfile}
        onLogout={() => handleLogout(navigate)}
      />
      <main className="flex-grow">
        {/* Nội dung giới thiệu */}
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
          {/* Tiêu đề */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 dark:text-white mb-6">
            {t("introduce.title1")}{" "}
            <span className="text-blue-700 dark:text-blue-400">MindMeter</span>
          </h1>
          {/* Sứ mệnh và tổng quan */}
          <p className="text-lg md:text-xl text-center text-gray-700 dark:text-gray-200 mb-8 max-w-3xl mx-auto">
            <b className="text-gray-900 dark:text-white">MindMeter</b>{" "}
            {t("introduce.intro1")}
          </p>
          <div className="mb-8 max-w-3xl mx-auto text-gray-700 dark:text-gray-200 text-base md:text-lg space-y-6">
            <p>
              <b className="text-gray-900 dark:text-white">
                {t("introduce.missionTitle")}
              </b>{" "}
              {t("introduce.mission")}
            </p>
            <p>
              <b className="text-gray-900 dark:text-white">
                {t("introduce.valueTitle")}
              </b>{" "}
              {t("introduce.value1")}{" "}
              <b className="text-gray-900 dark:text-white">
                {t("introduce.value2")}
              </b>
              . {t("introduce.value3")}
            </p>
            {/* Sửa lỗi: không để ul trong p */}
            <div>
              <b className="text-gray-900 dark:text-white">
                {t("introduce.strengthTitle")}
              </b>
              :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t("introduce.strength1")}</li>
                <li>{t("introduce.strength2")}</li>
                <li>{t("introduce.strength3")}</li>
                <li>{t("introduce.strength4")}</li>
                <li>{t("introduce.strength5")}</li>
              </ul>
            </div>
            <p>
              <b className="text-gray-900 dark:text-white">
                {t("introduce.visionTitle")}
              </b>{" "}
              {t("introduce.vision")}
            </p>
            <p>
              <b className="text-gray-900 dark:text-white">
                {t("introduce.whyTitle")}
              </b>{" "}
              {t("introduce.why")}
            </p>
          </div>
          {/* Call to action */}
          <div className="flex justify-center mt-8">
            <a
              href="/home"
              className="px-10 py-4 bg-blue-700 hover:bg-blue-800 text-white text-lg font-semibold rounded-full shadow-lg transition dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {t("introduce.cta")}
            </a>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
