import React, { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  FaChartBar,
  FaChartPie,
  FaUser,
  FaArrowLeft,
  FaBrain,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TestDetailModal from "../components/TestDetailModal";
import { authFetch } from "../authFetch";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { jwtDecode } from "jwt-decode";
import { useTheme } from "../hooks/useTheme";

const COLORS = ["#34d399", "#fbbf24", "#60a5fa", "#f87171"];

// Custom Tooltip cho PieChart (tỷ lệ mức trầm cảm)
const CustomPieTooltip = ({ active, payload, dark, t }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={`rounded shadow px-3 py-2 border text-sm ${
          dark ? "bg-gray-800 text-white border-gray-600" : "bg-white"
        }`}
      >
        <div>
          <b>{payload[0].name}</b>
        </div>
        <div>
          {t("count")}: <b>{payload[0].value}</b>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip cho BarChart mức độ test
const CustomBarTooltip = ({ active, payload, label, dark, t }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={`rounded shadow px-3 py-2 border text-sm ${
          dark ? "bg-gray-800 text-white border-gray-600" : "bg-white"
        }`}
      >
        <div>
          <b>
            {t("level")}: {label}
          </b>
        </div>
        <div>
          {t("testCount")}: <b>{payload[0].value}</b>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip cho BarChart user theo vai trò
const CustomUserRoleTooltip = ({ active, payload, label, dark, t }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={`rounded shadow px-3 py-2 border text-sm ${
          dark ? "bg-gray-800 text-white border-gray-600" : "bg-white"
        }`}
      >
        <div>
          <b>
            {t("role")}: {label}
          </b>
        </div>
        <div>
          {t("count")}: <b>{payload[0].value}</b>
        </div>
      </div>
    );
  }
  return null;
};

// Custom label function for PieChart
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
  value,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is significant (>5%)
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const AdminStatisticsPage = ({ handleLogout: propHandleLogout }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [openTestDetail, setOpenTestDetail] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Lấy thông tin user từ localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Kiểm tra role để đảm bảo chỉ admin mới có thể truy cập
        if (parsedUser.role !== "ADMIN") {
          navigate("/admin/dashboard", { replace: true });
        }
      } catch (e) {
        // Error parsing user data
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    document.title = t("systemStatisticsTitle") + " | MindMeter";
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await authFetch("/api/admin/statistics");
        if (!res.ok) throw new Error(t("loadingStatistics"));
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [t]);

  // Các hook useMemo phải đặt ở đây, trước mọi return sớm
  const pieData = useMemo(
    () => [
      { name: t("noDepression"), value: stats?.minimalTests || 0 },
      { name: t("mildDepression"), value: stats?.mildTests || 0 },
      { name: t("moderateDepression"), value: stats?.moderateTests || 0 },
      { name: t("severeDepression"), value: stats?.severeTests || 0 },
    ],
    [t, stats]
  );

  const barData = useMemo(
    () => [
      { name: t("noDepression"), value: stats?.minimalTests || 0 },
      { name: t("mildDepression"), value: stats?.mildTests || 0 },
      { name: t("moderateDepression"), value: stats?.moderateTests || 0 },
      { name: t("severeDepression"), value: stats?.severeTests || 0 },
    ],
    [t, stats]
  );

  const userRoleData = useMemo(
    () => [
      { name: t("admin"), value: stats?.adminCount || 0 },
      { name: t("expert"), value: stats?.expertCount || 0 },
      { name: t("student"), value: stats?.studentCount || 0 },
    ],
    [t, stats]
  );

  if (loading)
    return <div className="p-8 text-center">{t("loadingStatistics")}</div>;
  if (error || !stats)
    return (
      <div className="p-8 text-red-500">{error || t("noStatisticsData")}</div>
    );

  const handleLogout =
    propHandleLogout ||
    (() => {
      localStorage.removeItem("token");
      navigate("/login");
    });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Add CSS to prevent text overlap */}
      <style jsx>{`
        .recharts-legend-wrapper {
          overflow: visible !important;
        }
        .recharts-legend-item {
          margin: 4px 8px !important;
        }
        .recharts-text {
          dominant-baseline: middle !important;
        }
        .recharts-label {
          font-size: 12px !important;
          font-weight: bold !important;
        }
      `}</style>
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300" />
        }
        logoText={
          <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 dark:from-indigo-300 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent tracking-wide">
            {t("systemStatisticsTitle") || "MindMeter System Statistics"}
          </span>
        }
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onProfile={() => navigate("/admin/profile")}
        onLogout={handleLogout}
      />
      <div className="flex-grow flex flex-col py-10 overflow-x-hidden pt-24">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-blue-300 mb-8 flex items-center gap-3 justify-center">
            <FaChartBar className="text-indigo-500" />{" "}
            {t("systemStatisticsTitle")} | MindMeter
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div className="rounded-2xl shadow-lg p-6 flex flex-col items-center h-full transition-all duration-300 border dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <FaChartPie className="text-green-400" />{" "}
                {t("depressionLevelRatio")}
              </h2>
              <p className="mb-4 text-gray-500 dark:text-gray-300 text-sm text-center w-full">
                {t("depressionLevelRatioChartDesc")}
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={renderCustomLabel}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip dark={true} t={t} />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl shadow-lg p-6 flex flex-col items-center h-full transition-all duration-300 border dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <FaChartBar className="text-blue-400" />{" "}
                {t("testCountByLevelTitle")}
              </h2>
              <p className="mb-4 text-gray-500 dark:text-gray-300 text-sm text-center w-full">
                {t("testCountByLevelDesc")}
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={barData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} height={60} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip content={<CustomBarTooltip dark={true} t={t} />} />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Hai card cuối: Số lượng người dùng theo vai trò & Tỷ lệ các mức trầm cảm ngang hàng, giao diện đồng nhất, hover đẹp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto mt-10">
            {/* Card: Số lượng người dùng theo vai trò */}
            <div className="rounded-2xl shadow-lg p-6 flex flex-col items-center h-full transition-all duration-300 border dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <FaUser className="text-purple-400" /> {t("userCountByRole")}
              </h2>
              <p className="mb-4 text-gray-500 dark:text-gray-300 text-sm text-center w-full">
                {t("userCountByRoleDesc")}
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={userRoleData}
                  layout="vertical"
                  margin={{ top: 10, left: 80, right: 30, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    stroke="#8884d8"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#8884d8"
                    tick={{ fontSize: 12 }}
                    width={70}
                  />
                  <Tooltip content={<CustomUserRoleTooltip t={t} />} />
                  <Bar
                    dataKey="value"
                    fill="#a78bfa"
                    radius={[0, 8, 8, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Card: Tỷ lệ các mức trầm cảm */}
            <div className="rounded-2xl shadow-lg p-6 flex flex-col items-center h-full transition-all duration-300 border dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <FaChartPie className="text-2xl text-blue-400" />
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">
                  {t("depressionLevelRatio")}
                </h3>
              </div>
              <p className="mb-2 text-gray-500 dark:text-gray-300 text-sm text-center w-full">
                {t("depressionLevelRatioDesc")}
              </p>
              <div className="mb-3 text-xs text-blue-600 dark:text-blue-200 w-full text-center">
                {t("totalTestCount")}:{" "}
                <span className="font-bold">{stats?.totalTests || 0}</span>
              </div>
              <div className="space-y-2 w-full">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-green-500 dark:text-green-300 text-lg">
                    😊
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">
                    {t("noDepression")}:
                  </span>
                  <span className="font-bold text-green-500 dark:text-green-300 ml-auto">
                    {(
                      ((stats?.minimalTests || 0) / (stats?.totalTests || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-yellow-500 dark:text-yellow-300 text-lg">
                    😐
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">
                    {t("mildDepression")}:
                  </span>
                  <span className="font-bold text-yellow-500 dark:text-yellow-300 ml-auto">
                    {(
                      ((stats?.mildTests || 0) / (stats?.totalTests || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-blue-500 dark:text-blue-300 text-lg">
                    😔
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">
                    {t("moderateDepression")}:
                  </span>
                  <span className="font-bold text-blue-500 dark:text-blue-300 ml-auto">
                    {(
                      ((stats?.moderateTests || 0) / (stats?.totalTests || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-red-500 dark:text-red-300 text-lg">
                    😢
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">
                    {t("severeDepression")}:
                  </span>
                  <span className="font-bold text-red-500 dark:text-red-300 ml-auto">
                    {(
                      ((stats?.severeTests || 0) / (stats?.totalTests || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white text-xs font-semibold shadow hover:bg-blue-700 transition"
                onClick={() => setOpenTestDetail(true)}
              >
                {t("viewDetails")}
              </button>
              <div className="absolute right-4 bottom-4 opacity-20 text-8xl pointer-events-none select-none text-blue-200 dark:text-blue-400">
                <FaChartBar />
              </div>
            </div>
          </div>
        </div>
        <TestDetailModal
          open={openTestDetail}
          onClose={() => setOpenTestDetail(false)}
          adminMode={true}
        />
      </div>
      <FooterSection />
    </div>
  );
};

export default AdminStatisticsPage;
