import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaGlobe,
  FaChartPie,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaUserGraduate,
  FaSmile,
  FaSadTear,
  FaVial,
  FaComments,
  FaMeh,
  FaFrown,
  FaBrain,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import DepressionStatsChart from "../components/DepressionStatsChart";
import logo from "../logo.svg";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  CartesianGrid,
} from "recharts";
import { authFetch } from "../authFetch";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";

export default function ExpertDashboardPage({
  handleLogout: propHandleLogout,
}) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdvices: 0,
    depressionLevels: {},
    recentSurveys: [],
  });
  const [testStats, setTestStats] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const [sentAdviceCount, setSentAdviceCount] = useState(0);

  // Lấy token
  const token = localStorage.getItem("token");

  // Lấy user từ token
  const [user, setUser] = useState(() => {
    let userObj = {
      firstName: "",
      lastName: "",
      avatarUrl: null,
      email: "",
      role: "",
    };
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userObj.firstName = decoded.firstName || "";
        userObj.lastName = decoded.lastName || "";
        userObj.email = decoded.sub || decoded.email || "";
        userObj.avatarUrl = decoded.avatarUrl || decoded.avatar || null;
        userObj.role = decoded.role || "";
        userObj.plan = decoded.plan || "FREE";
        userObj.phone = decoded.phone || "";
      } catch {}
    }
    return userObj;
  });
  const handleLogoutLocal = propHandleLogout || (() => handleLogout(navigate));
  const handleLang = (lang) => i18n.changeLanguage(lang);

  useEffect(() => {
    document.title = t("expertDashboardTitle");
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        // Lấy thống kê dành cho expert
        const resStats = await authFetch("/api/expert/statistics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resStats.ok) throw new Error("Lỗi lấy thống kê");
        const statsData = await resStats.json();
        // Lấy thống kê test theo ngày cho expert
        const resTestStats = await authFetch(
          "/api/expert/statistics/test-count-by-date?days=14",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (resTestStats.ok) {
          const testStatsData = await resTestStats.json();
          setTestStats(testStatsData);
        }
        // Lấy 5 khảo sát gần đây nhất cho expert
        const resRecent = await authFetch("/api/expert/test-results/recent", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resRecent.ok) {
          const recentSurveys = await resRecent.json();
          setStats({
            totalTests: statsData.totalTests || 0,
            depressionLevels: {
              MINIMAL: statsData.minimalTests || 0,
              MILD: statsData.mildTests || 0,
              MODERATE: statsData.moderateTests || 0,
              SEVERE: statsData.severeTests || 0,
            },
            recentSurveys: recentSurveys.slice(0, 5) || [],
          });
        }
        // Lấy số lượng lời khuyên đã gửi của chuyên gia hiện tại
        const resAdvice = await authFetch("/api/expert/messages/sent", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resAdvice.ok) {
          const adviceList = await resAdvice.json();
          setSentAdviceCount(adviceList.length);
        } else {
          setSentAdviceCount(0);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  // Thêm AnimatedNumber giống AdminDashboardPage.js
  const AnimatedNumber = ({ value }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      let start = 0;
      const end = Number(value);
      if (start === end) return;
      let increment = end / 30;
      let current = start;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setDisplay(end);
          clearInterval(timer);
        } else {
          setDisplay(Math.floor(current));
        }
      }, 15);
      return () => clearInterval(timer);
    }, [value]);
    return <span>{display}</span>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-spin-slow"></div>
      </div>
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("expertDashboardTitle")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        i18n={i18n}
        onLogout={handleLogoutLocal}
        onProfile={() => navigate("/expert/profile")}
        updateUserAvatar={(newAvatarUrl) => {
          // Cập nhật user object với avatar mới
          setUser((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));

          // Cập nhật token với avatar mới
          const token = localStorage.getItem("token");
          if (token) {
            try {
              const decoded = jwtDecode(token);
              decoded.avatarUrl = newAvatarUrl;
              // Lưu token mới vào localStorage
              localStorage.setItem("token", token);
            } catch (error) {}
          }
        }}
      />
      <div className="flex-grow pt-32 max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="inline-block relative">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4 flex flex-col md:flex-row items-center justify-center gap-4 animate-fade-in">
              <span className="text-5xl md:text-6xl animate-bounce-slow">
                🎓
              </span>
              <span className="whitespace-nowrap overflow-visible leading-tight">
                {t("expertDashboardTitle")}
              </span>
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 rounded-full animate-slide-in"></div>
          </div>
          <div className="text-xl text-gray-600 dark:text-gray-300 italic mt-6 animate-fade-in-slow max-w-2xl mx-auto leading-relaxed">
            {t("expertDashboardSlogan")}
          </div>

          {/* Decorative elements */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <div
              className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div
              className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>
        {/* Stats Cards Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={
              <FaVial className="text-indigo-400 dark:text-white text-4xl" />
            }
            value={stats.totalTests || 0}
            label={t("totalTests")}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
            iconBg="bg-indigo-100"
            onClick={() => navigate("/expert/students?filter=ALL")}
            className="cursor-pointer hover:scale-105"
          />
          <StatCard
            icon={
              <FaComments className="text-blue-400 dark:text-white text-4xl" />
            }
            value={sentAdviceCount}
            label={t("totalAdvices")}
            color="text-blue-600"
            bgColor="bg-blue-50"
            iconBg="bg-blue-100"
            onClick={() => navigate("/expert/advice-sent")}
            className="cursor-pointer hover:scale-105"
          />
          <StatCard
            icon={
              <FaSmile className="text-green-400 dark:text-white text-4xl" />
            }
            value={stats.depressionLevels?.MINIMAL || 0}
            label={t("minimalDepression")}
            color="text-green-600"
            bgColor="bg-green-50"
            iconBg="bg-green-100"
            onClick={() => navigate("/expert/students?filter=MINIMAL")}
            className="cursor-pointer hover:scale-105"
          />
          <StatCard
            icon={
              <FaMeh className="text-yellow-400 dark:text-white text-4xl" />
            }
            value={stats.depressionLevels?.MILD || 0}
            label={t("mildDepression")}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
            iconBg="bg-yellow-100"
            onClick={() => navigate("/expert/students?filter=MILD")}
            className="cursor-pointer hover:scale-105"
          />
          <StatCard
            icon={
              <FaFrown className="text-orange-400 dark:text-white text-4xl" />
            }
            value={stats.depressionLevels?.MODERATE || 0}
            label={t("moderateDepression")}
            color="text-orange-600"
            bgColor="bg-orange-50"
            iconBg="bg-orange-100"
            className="md:col-start-2 cursor-pointer hover:scale-105"
            onClick={() => navigate("/expert/students?filter=MODERATE")}
          />
          <StatCard
            icon={
              <FaSadTear className="text-red-400 dark:text-white text-4xl" />
            }
            value={stats.depressionLevels?.SEVERE || 0}
            label={t("severeDepression")}
            color="text-red-600"
            bgColor="bg-red-50"
            iconBg="bg-red-100"
            onClick={() => navigate("/expert/students?filter=SEVERE")}
            className="cursor-pointer hover:scale-105"
          />
        </div>
        {/* Charts Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm dark:text-white dark:border dark:border-gray-700 rounded-3xl shadow-2xl dark:shadow-2xl p-8 mb-12 border border-white/20">
          <DepressionStatsChart testStats={testStats} t={t} />
        </div>

        {/* Recent Surveys Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm dark:text-white dark:border dark:border-gray-700 rounded-3xl shadow-2xl dark:shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-2">
              <FaChartPie className="text-indigo-500" />
              {t("recentSurveys")}
            </div>
            <button
              className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all duration-200"
              onClick={() => navigate("/expert/students")}
            >
              {t("seeAll")}
            </button>
          </div>
          {stats.recentSurveys.length === 0 ? (
            <div className="text-gray-400">{t("noData")}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">
                    {t("studentNameHeader")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">
                    {t("emailHeader")}
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">
                    {t("scoreHeader")}
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">
                    {t("levelHeader")}
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">
                    {t("dateHeader")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSurveys.map((s, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-2 dark:text-white">
                      {s.studentName}
                    </td>
                    <td className="px-4 py-2 dark:text-white">{s.email}</td>
                    <td className="px-4 py-2 text-center dark:text-white">
                      {s.totalScore}
                    </td>
                    <td className="px-4 py-2 text-center dark:text-white">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          s.severityLevel === "SEVERE"
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                            : s.severityLevel === "MODERATE"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                            : s.severityLevel === "MILD"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {t(s.severityLevel?.toLowerCase())}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center dark:text-white">
                      {s.testedAt
                        ? new Date(s.testedAt).toLocaleDateString("vi-VN")
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,2,.6,1) both; }
        .animate-fade-in-up { animation: fade-in 0.8s cubic-bezier(.4,2,.6,1) both; }
        @keyframes fade-in-slow {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-slow { animation: fade-in-slow 1.5s both; }
        @keyframes slide-in {
          from { width: 0; }
          to { width: 10rem; }
        }
        .animate-slide-in { animation: slide-in 1s cubic-bezier(.4,2,.6,1) both; }
        @keyframes count {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-count { animation: count 0.7s both; }
        @keyframes pulse-slow {
          0%, 100% { filter: drop-shadow(0 0 0 #fff); }
          50% { filter: drop-shadow(0 0 12px #a5b4fc); }
        }
        .animate-pulse-slow { animation: pulse-slow 2.5s infinite; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2.2s infinite; }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 6s linear infinite; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
      `}</style>

      <FooterSection />
    </div>
  );
}
