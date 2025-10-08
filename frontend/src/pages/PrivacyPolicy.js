import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { FaShieldAlt, FaBrain } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import {
  getCurrentUser,
  getCurrentToken,
  clearAnonymousData,
} from "../services/anonymousService";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Đồng bộ logic lấy user như trang Home
  const [user, setUser] = useState(() => {
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
      return u;
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
        return userObj;
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    // Lắng nghe sự kiện storage để cập nhật user khi đăng nhập/đăng xuất ở tab khác
    const handleStorage = () => {
      // Lặp lại logic đồng bộ user
      let u = getCurrentUser();
      const token = getCurrentToken();
      if (u) {
        if (
          u.anonymous === true ||
          u.role === "ANONYMOUS" ||
          u.email === null
        ) {
          u = {
            ...u,
            name: u.name || t("anonymousUser.name"),
            anonymous: true,
            role: u.role || "STUDENT",
          };
        }
        setUser(u);
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
          setUser(userObj);
        } catch {}
      } else {
        setUser(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    setUser((prev) => prev); // trigger update on mount
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    document.title = t("privacyPolicy.title") + " | MindMeter";
  }, [t]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6fa] dark:bg-[#181e29] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-800/20 dark:to-purple-800/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-200/30 to-blue-200/30 dark:from-green-800/20 dark:to-blue-800/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 dark:from-purple-800/10 dark:to-pink-800/10 rounded-full blur-3xl"></div>
      </div>
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("privacyPolicy.mainTitle")}
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <FaShieldAlt className="text-white text-3xl" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t("privacyPolicy.mainTitle")}
            </h1>
          </div>
          <p className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            <strong className="text-green-700 dark:text-green-400">
              MindMeter
            </strong>{" "}
            {t("privacyPolicy.intro")}
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-blue-700 dark:text-blue-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full mr-3 text-sm font-bold">
                1
              </span>
              {t("privacyPolicy.section1.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section1.intro")}
            </p>
          </div>
          <ul className="list-none ml-0 mb-6 space-y-3">
            <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className="text-blue-600 dark:text-blue-400">
                  {t("privacyPolicy.section1.personalInfo")}:
                </strong>{" "}
                <span className="text-gray-700 dark:text-gray-300">
                  {t("privacyPolicy.section1.personalInfoDesc")}
                </span>
              </div>
            </li>
            <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className="text-green-600 dark:text-green-400">
                  {t("privacyPolicy.section1.loginInfo")}:
                </strong>{" "}
                <span className="text-gray-700 dark:text-gray-300">
                  {t("privacyPolicy.section1.loginInfoDesc")}
                </span>
              </div>
            </li>
            <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className="text-purple-600 dark:text-purple-400">
                  {t("privacyPolicy.section1.socialInfo")}:
                </strong>{" "}
                <span className="text-gray-700 dark:text-gray-300">
                  {t("privacyPolicy.section1.socialInfoDesc")}
                </span>
              </div>
            </li>
            <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className="text-red-600 dark:text-red-400">
                  {t("privacyPolicy.section1.technicalInfo")}:
                </strong>{" "}
                <span className="text-gray-700 dark:text-gray-300">
                  {t("privacyPolicy.section1.technicalInfoDesc")}
                </span>
              </div>
            </li>
            <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className="text-teal-600 dark:text-teal-400">
                  {t("privacyPolicy.section1.behaviorInfo")}:
                </strong>{" "}
                <span className="text-gray-700 dark:text-gray-300">
                  {t("privacyPolicy.section1.behaviorInfoDesc")}
                </span>
              </div>
            </li>
            <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className="text-amber-600 dark:text-amber-400">
                  {t("privacyPolicy.section1.healthInfo")}:
                </strong>{" "}
                <span className="text-gray-700 dark:text-gray-300">
                  {t("privacyPolicy.section1.healthInfoDesc")}
                </span>
              </div>
            </li>
            <li className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {t("privacyPolicy.section1.paymentInfo")}:
                </strong>{" "}
                <span className="text-gray-800 dark:text-gray-200">
                  {t("privacyPolicy.section1.paymentInfoDesc")}
                </span>
              </div>
            </li>
          </ul>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-l-4 border-green-500 dark:border-green-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-green-700 dark:text-green-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full mr-3 text-sm font-bold">
                2
              </span>
              {t("privacyPolicy.section2.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section2.intro")}
            </p>
          </div>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>{t("privacyPolicy.section2.purpose1")}</li>
            <li>{t("privacyPolicy.section2.purpose2")}</li>
            <li>{t("privacyPolicy.section2.purpose3")}</li>
            <li>{t("privacyPolicy.section2.purpose4")}</li>
            <li>{t("privacyPolicy.section2.purpose5")}</li>
            <li>{t("privacyPolicy.section2.purpose6")}</li>
            <li>{t("privacyPolicy.section2.purpose7")}</li>
            <li>{t("privacyPolicy.section2.purpose8")}</li>
          </ul>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border-l-4 border-purple-500 dark:border-purple-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-purple-700 dark:text-purple-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full mr-3 text-sm font-bold">
                3
              </span>
              {t("privacyPolicy.section3.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section3.intro")}
            </p>
          </div>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>{t("privacyPolicy.section3.sharing1")}</li>
            <li>{t("privacyPolicy.section3.sharing2")}</li>
            <li>{t("privacyPolicy.section3.sharing3")}</li>
            <li>{t("privacyPolicy.section3.sharing4")}</li>
            <li>{t("privacyPolicy.section3.sharing5")}</li>
          </ul>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-xl border-l-4 border-red-500 dark:border-red-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-red-700 dark:text-red-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full mr-3 text-sm font-bold">
                4
              </span>
              {t("privacyPolicy.section4.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section4.intro")}
            </p>
          </div>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>{t("privacyPolicy.section4.security1")}</li>
            <li>{t("privacyPolicy.section4.security2")}</li>
            <li>{t("privacyPolicy.section4.security3")}</li>
            <li>{t("privacyPolicy.section4.security4")}</li>
            <li>{t("privacyPolicy.section4.security5")}</li>
            <li>{t("privacyPolicy.section4.security6")}</li>
          </ul>

          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 rounded-xl border-l-4 border-teal-500 dark:border-teal-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-teal-700 dark:text-teal-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-teal-500 text-white rounded-full mr-3 text-sm font-bold">
                5
              </span>
              {t("privacyPolicy.section5.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section5.intro")}
            </p>
          </div>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>{t("privacyPolicy.section5.rights1")}</li>
            <li>{t("privacyPolicy.section5.rights2")}</li>
            <li>{t("privacyPolicy.section5.rights3")}</li>
            <li>{t("privacyPolicy.section5.rights4")}</li>
            <li>{t("privacyPolicy.section5.rights5")}</li>
            <li>{t("privacyPolicy.section5.rights6")}</li>
            <li>{t("privacyPolicy.section5.rights7")}</li>
            <li>{t("privacyPolicy.section5.rights8")}</li>
          </ul>

          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-6 rounded-xl border-l-4 border-amber-500 dark:border-amber-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-amber-700 dark:text-amber-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-500 text-white rounded-full mr-3 text-sm font-bold">
                6
              </span>
              {t("privacyPolicy.section6.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section6.intro")}
            </p>
          </div>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>{t("privacyPolicy.section6.storage1")}</li>
            <li>{t("privacyPolicy.section6.storage2")}</li>
            <li>{t("privacyPolicy.section6.storage3")}</li>
            <li>{t("privacyPolicy.section6.storage4")}</li>
            <li>{t("privacyPolicy.section6.storage5")}</li>
            <li>{t("privacyPolicy.section6.storage6")}</li>
          </ul>

          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-xl border-l-4 border-indigo-500 dark:border-indigo-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-indigo-700 dark:text-indigo-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-500 text-white rounded-full mr-3 text-sm font-bold">
                7
              </span>
              {t("privacyPolicy.section7.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section7.intro")}
            </p>
          </div>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>{t("privacyPolicy.section7.cookies1")}</li>
            <li>{t("privacyPolicy.section7.cookies2")}</li>
            <li>{t("privacyPolicy.section7.cookies3")}</li>
            <li>{t("privacyPolicy.section7.cookies4")}</li>
            <li>{t("privacyPolicy.section7.cookies5")}</li>
            <li>{t("privacyPolicy.section7.cookies6")}</li>
          </ul>

          <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 p-6 rounded-xl border-l-4 border-slate-500 dark:border-slate-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-slate-700 dark:text-slate-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-500 text-white rounded-full mr-3 text-sm font-bold">
                8
              </span>
              {t("privacyPolicy.section8.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section8.intro")}
            </p>
          </div>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>{t("privacyPolicy.section8.links1")}</li>
            <li>{t("privacyPolicy.section8.links2")}</li>
            <li>{t("privacyPolicy.section8.links3")}</li>
            <li>{t("privacyPolicy.section8.links4")}</li>
          </ul>

          <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 p-6 rounded-xl border-l-4 border-rose-500 dark:border-rose-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-rose-700 dark:text-rose-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-rose-500 text-white rounded-full mr-3 text-sm font-bold">
                9
              </span>
              {t("privacyPolicy.section9.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section9.intro")}
            </p>
          </div>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>{t("privacyPolicy.section9.changes1")}</li>
            <li>{t("privacyPolicy.section9.changes2")}</li>
            <li>{t("privacyPolicy.section9.changes3")}</li>
            <li>{t("privacyPolicy.section9.changes4")}</li>
            <li>{t("privacyPolicy.section9.changes5")}</li>
            <li>{t("privacyPolicy.section9.changes6")}</li>
          </ul>

          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-xl border-l-4 border-emerald-500 dark:border-emerald-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-emerald-700 dark:text-emerald-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-full mr-3 text-sm font-bold">
                10
              </span>
              {t("privacyPolicy.section10.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section10.intro")}
            </p>
          </div>
          <p className="mb-2 font-semibold">
            {t("privacyPolicy.section10.contactMethods")}
          </p>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>
              {t("privacyPolicy.section10.email")}{" "}
              <a
                href="mailto:trankiencuong30072003@gmail.com"
                className="text-blue-500 dark:text-blue-300 underline"
              >
                trankiencuong30072003@gmail.com
              </a>
            </li>
            <li>{t("privacyPolicy.section10.address")}</li>
            <li>{t("privacyPolicy.section10.hotline")}</li>
            <li>{t("privacyPolicy.section10.workingHours")}</li>
            <li>{t("privacyPolicy.section10.responseTime")}</li>
            <li>{t("privacyPolicy.section10.emergency")}</li>
          </ul>

          <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-6 rounded-xl border-l-4 border-violet-500 dark:border-violet-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-violet-700 dark:text-violet-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-violet-500 text-white rounded-full mr-3 text-sm font-bold">
                11
              </span>
              {t("privacyPolicy.section11.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section11.intro")}
            </p>
          </div>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>{t("privacyPolicy.section11.compliance1")}</li>
            <li>{t("privacyPolicy.section11.compliance2")}</li>
            <li>{t("privacyPolicy.section11.compliance3")}</li>
            <li>{t("privacyPolicy.section11.compliance4")}</li>
            <li>{t("privacyPolicy.section11.compliance5")}</li>
          </ul>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-blue-700 dark:text-blue-300 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full mr-3 text-sm font-bold">
                12
              </span>
              {t("privacyPolicy.section12.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacyPolicy.section12.intro")}
            </p>
          </div>
          <ul className="list-disc ml-8 mb-4 space-y-2">
            <li>{t("privacyPolicy.section12.commitment1")}</li>
            <li>{t("privacyPolicy.section12.commitment2")}</li>
            <li>{t("privacyPolicy.section12.commitment3")}</li>
            <li>{t("privacyPolicy.section12.commitment4")}</li>
            <li>{t("privacyPolicy.section12.commitment5")}</li>
            <li>{t("privacyPolicy.section12.commitment6")}</li>
          </ul>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            &copy; {new Date().getFullYear()} MindMeter.{" "}
            {t("privacyPolicy.copyright")}
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default PrivacyPolicy;
