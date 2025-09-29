import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaUserGraduate,
  FaUserMd,
  FaUserShield,
  FaVial,
  FaSmile,
  FaMeh,
  FaSadTear,
  FaUsers,
  FaChartPie,
  FaQuestionCircle,
  FaBullhorn,
  FaChartBar,
  FaChevronDown,
  FaSignOutAlt,
  FaUserCircle,
  FaMoon,
  FaSun,
  FaGlobe,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaBrain,
  FaNewspaper,
} from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "react-i18next";
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
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import NotificationCenter from "../components/NotificationCenter";
import { authFetch } from "../authFetch";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";

const statCards = [
  {
    key: "totalUsers",
    icon: <FaUsers className="text-blue-400 text-4xl" />,
    color: "bg-blue-50",
    onClick: (navigate) => navigate("/admin/users"),
  },
  {
    key: "studentCount",
    icon: <FaUserGraduate className="text-green-400 text-4xl" />,
    color: "bg-green-50",
    onClick: (navigate) => navigate("/admin/users?role=STUDENT"),
  },
  {
    key: "expertCount",
    icon: <FaUserMd className="text-yellow-400 text-4xl" />,
    color: "bg-yellow-50",
    onClick: (navigate) => navigate("/admin/users?role=EXPERT"),
  },
  {
    key: "adminCount",
    icon: <FaUserShield className="text-purple-400 text-4xl" />,
    color: "bg-purple-50",
    onClick: (navigate) => navigate("/admin/users?role=ADMIN"),
  },
  {
    key: "totalTests",
    icon: <FaVial className="text-indigo-400 text-4xl" />,
    color: "bg-indigo-50",
    onClick: (navigate) => navigate("/admin/tests"),
  },
  {
    key: "minimalTests",
    icon: <FaSmile className="text-green-400 text-4xl" />,
    color: "bg-green-100",
    onClick: (navigate) => navigate("/admin/tests?severity=MINIMAL"),
  },
  {
    key: "mildTests",
    icon: <FaMeh className="text-yellow-400 text-4xl" />,
    color: "bg-yellow-100",
    onClick: (navigate) => navigate("/admin/tests?severity=MILD"),
  },
  {
    key: "severeTests",
    icon: <FaSadTear className="text-red-400 text-4xl" />,
    color: "bg-red-100",
    onClick: (navigate) => navigate("/admin/tests?severity=SEVERE"),
  },
];

const actionButtons = [
  {
    key: "userManagement",
    color: "bg-blue-500",
    icon: <FaUser />,
    path: "/admin/users",
  },
  {
    key: "questionManagement",
    color: "bg-green-500",
    icon: <FaQuestionCircle />,
    path: "/admin/questions",
  },
  {
    key: "blogManagement",
    color: "bg-purple-500",
    icon: <FaNewspaper />,
    path: "/admin/blog",
  },
  {
    key: "announcementManagement",
    color: "bg-yellow-500",
    icon: <FaBullhorn />,
    path: "/admin/announcements",
  },
  {
    key: "statistics",
    color: "bg-indigo-500",
    icon: <FaChartBar />,
    path: "/admin/statistics",
  },
];

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

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState(null);
  const [testStats, setTestStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sử dụng user từ props nếu có, nếu không thì fallback về JWT token
  const [user, setUser] = useState(() => {
    let userObj = {
      firstName: "",
      lastName: "",
      avatarUrl: null,
      email: "",
      role: "",
    };

    // Nếu không có user từ props, lấy từ JWT token
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

  // State để force re-render khi avatar thay đổi
  const [avatarUpdateKey, setAvatarUpdateKey] = useState(0);

  useEffect(() => {
    document.title =
      t("pageTitles.adminDashboard") || "Admin Dashboard | MindMeter";
    // Gọi API lấy thống kê hệ thống
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await authFetch("/api/admin/statistics");
        if (!res.ok) throw new Error(t("errors.cannotLoadStatistics"));
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    // Gọi API lấy thống kê test theo ngày
    const fetchTestStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await authFetch(
          "/api/admin/statistics/test-count-by-date?days=14"
        );
        if (!res.ok) throw new Error(t("errors.cannotLoadTestStatistics"));
        const data = await res.json();
        setTestStats(data);
      } catch {}
    };
    fetchTestStats();
  }, [t]);

  useEffect(() => {
    if (error) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [error, navigate]);

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogoutLocal = () => handleLogout(navigate);

  const handleProfile = () => {
    navigate("/admin/profile");
  };

  const handleUserManagement = () => {
    navigate("/admin/users");
  };

  const handleTestResults = () => {
    navigate("/admin/tests");
  };

  const handleQuestionManagement = () => {
    navigate("/admin/questions");
  };

  const handleAnnouncementManagement = () => {
    navigate("/admin/announcements");
  };

  const handleStatistics = () => {
    navigate("/admin/statistics");
  };

  if (loading || error || !stats) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-spin-slow"></div>
      </div>
      {/* Header */}
      <DashboardHeader
        key={`${user?.avatarUrl || "no-avatar"}-${avatarUpdateKey}`} // Force re-render khi avatar thay đổi
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("adminDashboardTitle")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onProfile={handleProfile}
        onLogout={handleLogoutLocal}
        onNotificationClick={() => setShowNotifications(true)}
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

          // Tăng avatarUpdateKey để force re-render
          setAvatarUpdateKey((prev) => prev + 1);
        }}
      />
      {/* Nội dung dashboard */}
      <div className="flex-grow flex flex-col py-10 overflow-x-hidden relative z-10">
        <div className="pt-24 max-w-7xl mx-auto relative px-4">
          {/* Hero Section */}
          <div className="text-center mb-12 relative">
            <div className="inline-block relative">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4 flex flex-col md:flex-row items-center justify-center gap-4 animate-fade-in">
                <FaChartPie className="text-indigo-500 animate-bounce-slow text-5xl md:text-6xl" />
                <span className="whitespace-nowrap overflow-visible leading-tight">
                  {t("adminDashboardTitle")}
                </span>
              </h1>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 rounded-full animate-slide-in"></div>
            </div>
            <div className="text-xl text-gray-600 dark:text-gray-300 italic mt-6 animate-fade-in-slow max-w-2xl mx-auto leading-relaxed">
              {t("dashboardSlogan") || t("adminDashboard.description")}
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
            {statCards.map((card, idx) => (
              <StatCard
                key={card.key}
                icon={React.cloneElement(card.icon, {
                  className:
                    card.icon.props.className + " text-5xl dark:text-white",
                })}
                value={stats[card.key]}
                label={t(card.key)}
                color="text-gray-800 dark:text-white"
                bgColor={card.color}
                iconBg={card.color.replace("50", "100")}
                onClick={() => card.onClick && card.onClick(navigate)}
                className="cursor-pointer"
              />
            ))}
          </div>
          {/* Action Buttons Section */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            {actionButtons.map((btn, idx) => (
              <button
                key={btn.key}
                className={`${btn.color} flex items-center gap-3 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:shadow-lg group relative overflow-hidden`}
                onClick={() => navigate(btn.path)}
                style={{
                  animationDelay: `${idx * 0.1}s`,
                  animation: "fadeInUp 0.6s ease-out forwards",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 dark:from-gray-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 text-lg">{btn.icon}</span>
                <span className="relative z-10">{t(btn.key)}</span>
              </button>
            ))}
          </div>
          {/* Charts Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm dark:text-white dark:border dark:border-gray-700 rounded-3xl shadow-2xl dark:shadow-2xl p-8 mt-8 border border-white/20 dark:border-gray-600/20">
            <h2 className="text-2xl font-extrabold mb-4 text-gray-800 flex items-center gap-2">
              <FaChartPie className="text-indigo-400 animate-spin-slow" />{" "}
              {t("stat_depression_ratio")}
            </h2>
            {/* Chỉ số động: test mới, tăng/giảm, cảnh báo */}
            {testStats && (
              <>
                <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Số lượt test mới 7 ngày gần nhất */}
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <span className="text-indigo-600 dark:text-indigo-300">
                      {t("newTests7Days")}:
                    </span>
                    <span className="text-2xl font-bold">
                      {testStats.totalTests
                        .slice(7, 14)
                        .reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                  {/* So sánh với 7 ngày trước đó */}
                  {(() => {
                    const last7 = testStats.totalTests
                      .slice(7, 14)
                      .reduce((a, b) => a + b, 0);
                    const prev7 = testStats.totalTests
                      .slice(0, 7)
                      .reduce((a, b) => a + b, 0);
                    const diff = last7 - prev7;
                    const percent =
                      prev7 === 0
                        ? 100
                        : Math.abs(Math.round((diff / prev7) * 100));
                    if (diff > 0)
                      return (
                        <span className="flex items-center gap-1 text-green-600">
                          <FaArrowUp /> +{percent}%
                        </span>
                      );
                    if (diff < 0)
                      return (
                        <span className="flex items-center gap-1 text-red-600">
                          <FaArrowDown /> -{percent}%
                        </span>
                      );
                    return (
                      <span className="text-gray-500">{t("noChange")}</span>
                    );
                  })()}
                  {/* Cảnh báo nếu severe tăng cao */}
                  {(() => {
                    const severeLast7 = testStats.severeTests
                      .slice(7, 14)
                      .reduce((a, b) => a + b, 0);
                    const severePrev7 = testStats.severeTests
                      .slice(0, 7)
                      .reduce((a, b) => a + b, 0);
                    if (severeLast7 > severePrev7 && severeLast7 >= 2)
                      return (
                        <span className="flex items-center gap-1 text-red-500 font-bold">
                          <FaExclamationTriangle /> {t("severeWarning")}
                        </span>
                      );
                    return null;
                  })()}
                </div>
                {/* Biểu đồ cột và đường */}
                <div className="w-full flex flex-col md:flex-row gap-8">
                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 shadow-xl border border-blue-100 dark:border-gray-700">
                    <h3 className="font-bold mb-4 text-indigo-600 dark:text-indigo-300 text-lg flex items-center gap-2">
                      <FaChartBar className="text-indigo-500" />
                      {t("adminDashboard.barChartTitle")}
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={testStats.dates.map((date, i) => ({
                          date: date.slice(5),
                          total: testStats.totalTests[i],
                          severe: testStats.severeTests[i],
                        }))}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
                        />
                        <XAxis
                          dataKey="date"
                          stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                        />
                        <YAxis
                          allowDecimals={false}
                          stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor:
                              theme === "dark"
                                ? "rgba(31, 41, 55, 0.95)"
                                : "rgba(255, 255, 255, 0.95)",
                            border:
                              theme === "dark"
                                ? "1px solid #374151"
                                : "1px solid #e5e7eb",
                            borderRadius: "12px",
                            boxShadow:
                              theme === "dark"
                                ? "0 10px 25px rgba(0, 0, 0, 0.3)"
                                : "0 10px 25px rgba(0, 0, 0, 0.1)",
                            color: theme === "dark" ? "#f9fafb" : "#1f2937",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="total"
                          fill="url(#totalGradient)"
                          name={t("adminDashboard.totalTests")}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="severe"
                          fill="url(#severeGradient)"
                          name={t("adminDashboard.severeTests")}
                          radius={[4, 4, 0, 0]}
                        />
                        <defs>
                          <linearGradient
                            id="totalGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                          <linearGradient
                            id="severeGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#f87171" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 shadow-xl border border-purple-100 dark:border-gray-700">
                    <h3 className="font-bold mb-4 text-purple-600 dark:text-purple-300 text-lg flex items-center gap-2">
                      <FaChartPie className="text-purple-500" />
                      {t("adminDashboard.lineChartTitle")}
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart
                        data={testStats.dates.map((date, i) => ({
                          date: date.slice(5),
                          total: testStats.totalTests[i],
                          severe: testStats.severeTests[i],
                        }))}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
                        />
                        <XAxis
                          dataKey="date"
                          stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                        />
                        <YAxis
                          allowDecimals={false}
                          stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor:
                              theme === "dark"
                                ? "rgba(31, 41, 55, 0.95)"
                                : "rgba(255, 255, 255, 0.95)",
                            border:
                              theme === "dark"
                                ? "1px solid #374151"
                                : "1px solid #e5e7eb",
                            borderRadius: "12px",
                            boxShadow:
                              theme === "dark"
                                ? "0 10px 25px rgba(0, 0, 0, 0.3)"
                                : "0 10px 25px rgba(0, 0, 0, 0.1)",
                            color: theme === "dark" ? "#f9fafb" : "#1f2937",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="url(#totalLineGradient)"
                          strokeWidth={4}
                          name={t("adminDashboard.totalTests")}
                          dot={{
                            r: 6,
                            fill: "#6366f1",
                            stroke: theme === "dark" ? "#f9fafb" : "#ffffff",
                            strokeWidth: 2,
                          }}
                          activeDot={{
                            r: 8,
                            fill: "#6366f1",
                            stroke: theme === "dark" ? "#f9fafb" : "#ffffff",
                            strokeWidth: 3,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="severe"
                          stroke="url(#severeLineGradient)"
                          strokeWidth={4}
                          name={t("adminDashboard.severeTests")}
                          dot={{
                            r: 6,
                            fill: "#ef4444",
                            stroke: theme === "dark" ? "#f9fafb" : "#ffffff",
                            strokeWidth: 2,
                          }}
                          activeDot={{
                            r: 8,
                            fill: "#ef4444",
                            stroke: theme === "dark" ? "#f9fafb" : "#ffffff",
                            strokeWidth: 3,
                          }}
                        />
                        <defs>
                          <linearGradient
                            id="totalLineGradient"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                          <linearGradient
                            id="severeLineGradient"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#f87171" />
                          </linearGradient>
                        </defs>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
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
            0%, 100% { filter: drop-shadow(0 0 0 ${
              theme === "dark" ? "#f9fafb" : "#fff"
            }); }
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
      </div>
      <FooterSection />
    </div>
  );
}

export function AdminProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isEdit, setIsEdit] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [alert, setAlert] = React.useState("");
  const [error, setError] = React.useState("");
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    document.title = t("pageTitles.adminProfile");
  }, []);

  // Default user data from token (fallback)
  let user = {
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    avatar: null,
    createdAt: "",
    phone: "",
  };

  try {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      user.email = decoded.sub || decoded.email || "";
      user.role = decoded.role || "";
      user.firstName = decoded.firstName || "";
      user.lastName = decoded.lastName || "";
      user.phone = decoded.phone || "";
      user.createdAt = decoded.createdAt
        ? new Date(decoded.createdAt).toLocaleString()
        : "";
      if (decoded.avatar) user.avatar = decoded.avatar;
    }
  } catch {}

  const [profile, setProfile] = React.useState(user);
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Fetch fresh user data from backend
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await authFetch("/api/admin/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        const userData = await response.json();

        // Update profile with fresh data from database
        const updatedProfile = {
          ...user,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          phone: userData.phone || "",
          email: userData.email || user.email,
          role: userData.role || user.role,
          createdAt: userData.createdAt
            ? new Date(userData.createdAt).toLocaleString()
            : user.createdAt,
        };

        setProfile(updatedProfile);
        setForm({
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          phone: updatedProfile.phone,
        });
      } catch (err) {
        setError("Failed to load user profile");
        // Fallback to token data
        setForm({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  React.useEffect(() => {
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
    });
  }, [isEdit, profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert("");
    // TODO: Gọi API cập nhật thông tin user ở đây
    setTimeout(() => {
      setSaving(false);
      setIsEdit(false);
      setAlert(t("updateUserSuccess"));
      setProfile((prev) => ({ ...prev, ...form }));
    }, 1200);
  };
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 flex flex-col items-center border border-blue-100 dark:border-gray-700 min-w-[340px] w-full max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300 text-center">
            {t("loading")}...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 flex flex-col items-center border border-blue-100 dark:border-gray-700 min-w-[340px] w-full max-w-md">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt="avatar"
            className="w-24 h-24 rounded-full border-2 border-indigo-400 shadow mb-4"
          />
        ) : (
          <FaUserCircle className="w-24 h-24 text-indigo-400 bg-white dark:bg-gray-800 rounded-full border-2 border-indigo-200 dark:border-indigo-600 shadow mb-4" />
        )}
        <form className="w-full" onSubmit={handleSave}>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-gray-600 dark:text-gray-300 text-sm mb-1">
                  {t("firstNameHeader")}
                </label>
                {isEdit ? (
                  <input
                    type="text"
                    className="w-full rounded-xl px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    required
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                    {profile.firstName}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-gray-600 dark:text-gray-300 text-sm mb-1">
                  {t("lastNameHeader")}
                </label>
                {isEdit ? (
                  <input
                    type="text"
                    className="w-full rounded-xl px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    required
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                    {profile.lastName}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-300 text-sm mb-1">
                Email
              </label>
              <div className="text-lg font-semibold text-gray-800 dark:text-white">
                {profile.email}
              </div>
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-300 text-sm mb-1">
                {t("phoneHeader")}
              </label>
              {isEdit ? (
                <input
                  type="text"
                  className="w-full rounded-xl px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              ) : (
                <div className="text-lg font-semibold text-gray-800 dark:text-white">
                  {profile.phone || t("notUpdated")}
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-300 text-sm mb-1">
                {t("roleHeader")}
              </label>
              <div className="text-base text-blue-600 dark:text-blue-300 font-semibold">
                {profile.role === "ADMIN" ? t("roleAdmin") : profile.role}
              </div>
            </div>
            {profile.createdAt && (
              <div>
                <label className="block text-gray-600 dark:text-gray-300 text-sm mb-1">
                  {t("createdAtHeader")}
                </label>
                <div className="text-sm text-gray-400 dark:text-gray-400">
                  {profile.createdAt}
                </div>
              </div>
            )}
          </div>
          {error && (
            <div className="mb-4 text-red-600 dark:text-red-400 text-center font-semibold">
              {error}
            </div>
          )}
          {alert && (
            <div className="mb-4 text-green-600 dark:text-green-400 text-center font-semibold">
              {alert}
            </div>
          )}
          <div className="flex gap-4 justify-between mt-6">
            <button
              className="bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-indigo-600 transition"
              type="button"
              onClick={() => navigate("/admin/dashboard")}
            >
              {t("backToDashboard")}
            </button>
            <div className="flex gap-4">
              {isEdit ? (
                <>
                  <button
                    type="button"
                    className="px-6 py-2 rounded-xl font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
                    onClick={() => {
                      setIsEdit(false);
                      setAlert("");
                    }}
                    disabled={saving}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                    disabled={saving}
                  >
                    {saving ? t("saving") : t("update")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="px-6 py-2 rounded-xl font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
                  onClick={() => setIsEdit(true)}
                >
                  {t("edit")}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        user={user}
      />
    </div>
  );
}
