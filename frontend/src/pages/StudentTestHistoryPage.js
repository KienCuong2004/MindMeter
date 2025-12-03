import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { authFetch } from "../authFetch";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import { getCurrentUser } from "../services/anonymousService";
import { FaBrain, FaChartLine } from "react-icons/fa";

const severityLevels = ["MINIMAL", "MILD", "MODERATE", "SEVERE"];
const severityColors = {
  MINIMAL: "#22c55e",
  MILD: "#facc15",
  MODERATE: "#fb923c",
  SEVERE: "#ef4444",
};

const PAGE_SIZE = 5;

const getPagination = (current, total) => {
  // Hiển thị tối đa 5 nút số trang, có ... nếu nhiều trang
  let pages = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) {
      pages = [1, 2, 3, 4, "...", total];
    } else if (current >= total - 2) {
      pages = [1, "...", total - 3, total - 2, total - 1, total];
    } else {
      pages = [1, "...", current - 1, current, current + 1, "...", total];
    }
  }
  return pages;
};

const StudentTestHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [month, setMonth] = useState("");
  const [quarter, setQuarter] = useState("");
  const [year, setYear] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const user = getCurrentUser();

  // Đặt title cho trang
  useEffect(() => {
    document.title =
      i18n.language === "vi"
        ? "Lịch sử bài test | MindMeter"
        : "Test History | MindMeter";
  }, [i18n.language]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const fetchHistory = async () => {
      try {
        const res = await authFetch("/api/depression-test/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Lỗi lấy lịch sử");
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [navigate]);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, startDate, endDate, month, quarter, year, history]);

  // Lấy danh sách năm có trong dữ liệu
  const years = Array.from(
    new Set(history.map((item) => new Date(item.testedAt).getFullYear()))
  );
  years.sort((a, b) => b - a);

  // Lọc dữ liệu theo filter
  let filteredHistory = history;
  if (filterType === "date" && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    filteredHistory = history.filter((item) => {
      const d = new Date(item.testedAt);
      return d >= start && d <= end;
    });
  } else if (filterType === "month" && month && year) {
    filteredHistory = history.filter((item) => {
      const d = new Date(item.testedAt);
      return (
        d.getMonth() + 1 === parseInt(month) &&
        d.getFullYear() === parseInt(year)
      );
    });
  } else if (filterType === "quarter" && quarter && year) {
    filteredHistory = history.filter((item) => {
      const d = new Date(item.testedAt);
      const q = Math.floor(d.getMonth() / 3) + 1;
      return q === parseInt(quarter) && d.getFullYear() === parseInt(year);
    });
  } else if (filterType === "year" && year) {
    filteredHistory = history.filter((item) => {
      const d = new Date(item.testedAt);
      return d.getFullYear() === parseInt(year);
    });
  }

  // Nếu số lượng test < 10, hiển thị từng lần test (ngày + giờ); nếu >= 10, gộp theo ngày
  let composedData = [];
  if (filteredHistory.length < 10) {
    composedData = filteredHistory.map((item) => {
      const obj = {
        date: new Date(item.testedAt).toLocaleString(),
      };
      severityLevels.forEach((sev) => {
        obj[sev] = item.severityLevel === sev || item.severity === sev ? 1 : 0;
      });
      obj.score = item.totalScore || 0;
      return obj;
    });
  } else {
    // Gộp theo ngày như cũ
    const uniqueDates = Array.from(
      new Set(
        filteredHistory.map((item) =>
          new Date(item.testedAt).toLocaleDateString()
        )
      )
    );
    composedData = uniqueDates.map((date) => {
      const items = filteredHistory.filter(
        (item) => new Date(item.testedAt).toLocaleDateString() === date
      );
      const obj = { date };
      severityLevels.forEach((sev) => {
        obj[sev] = items.filter(
          (item) => item.severityLevel === sev || item.severity === sev
        ).length;
      });
      obj.score =
        items.length > 0
          ? (
              items.reduce((sum, i) => sum + (i.totalScore || 0), 0) /
              items.length
            ).toFixed(2)
          : 0;
      return obj;
    });
  }

  // Kiểm tra dữ liệu biểu đồ có hợp lệ không (ít nhất 2 ngày có test hoặc có dữ liệu khác 0)
  const hasValidChartData =
    composedData.length > 1 ||
    (composedData.length === 1 &&
      severityLevels.some((sev) => composedData[0][sev] > 0));

  // Xác định domain cho YAxis
  const yAxisDomain =
    history.length < 10
      ? [0, (dataMax) => Math.max(10, dataMax)]
      : [0, (dataMax) => Math.max(3, dataMax)];

  // Thêm dữ liệu mẫu test vào composedData nếu số lượng test < 10
  if (history.length < 10) {
    composedData.forEach((item, idx) => {
      item.test = 10 + idx * 5; // test: 10, 15, 20, ...
    });
  }

  // Phân trang dữ liệu bảng
  const totalRows = filteredHistory.length;
  const totalPages = Math.ceil(totalRows / PAGE_SIZE);
  const pagedHistory = filteredHistory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("testHistory.title")}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }}
        onProfile={() => {
          if (!user) return;
          if (user.role === "ADMIN") window.location.href = "/admin/profile";
          else if (user.role === "EXPERT")
            window.location.href = "/expert/profile";
          else window.location.href = "/student/profile";
        }}
      />
      {/* Padding top để tránh bị che bởi header fixed */}
      <div className="flex-grow pt-20">
        <div className="max-w-3xl mx-auto p-8 min-h-screen flex flex-col items-center justify-start">
          <div className="flex flex-col items-center w-full mb-8">
            <h1 className="text-4xl font-extrabold text-center dark:text-white w-full tracking-tight mb-2 flex items-center justify-center gap-2">
              <svg
                className="w-8 h-8 text-indigo-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8Zm0 0v-4m0 0c-2.21 0-4-1.79-4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("testHistory.title")}
            </h1>
            <p className="text-gray-500 dark:text-gray-300 text-lg font-medium mb-2">
              {t("testHistory.subtitle") ||
                "Xem lại tiến trình tâm lý của bạn qua từng lần test"}
            </p>
            <button
              onClick={() => navigate("/analytics")}
              className="mt-4 flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <FaChartLine />
              <span>{t("analytics.title") || "View Analytics Dashboard"}</span>
            </button>
          </div>
          {/* FILTER UI ĐẸP HƠN */}
          <div className="flex flex-wrap gap-2 items-center mb-6 w-full max-w-2xl mx-auto justify-center">
            {[
              { type: "all", label: t("testHistory.filter.all") },
              { type: "date", label: t("testHistory.filter.date") },
              { type: "month", label: t("testHistory.filter.month") },
              { type: "quarter", label: t("testHistory.filter.quarter") },
              { type: "year", label: t("testHistory.filter.year") },
            ].map(({ type, label }) => (
              <button
                key={type}
                className={`px-4 py-2 rounded-full border text-base font-semibold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400
                ${
                  filterType === type
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700"
                }
              `}
                onClick={() => setFilterType(type)}
                type="button"
              >
                {label}
              </button>
            ))}
            {filterType !== "all" &&
              (startDate || endDate || month || quarter || year) && (
                <button
                  className={`px-4 py-2 rounded-full border text-base font-semibold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-500 text-white border-red-500 hover:bg-red-600`}
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setMonth("");
                    setQuarter("");
                    setYear("");
                  }}
                  type="button"
                >
                  Xóa lọc
                </button>
              )}
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-center mb-8">
            {filterType === "date" && (
              <>
                <input
                  type="date"
                  className="border border-indigo-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 outline-none text-base shadow-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  type="date"
                  className="border border-indigo-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 outline-none text-base shadow-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </>
            )}
            {filterType === "month" && (
              <>
                <select
                  className="border border-indigo-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 outline-none text-base shadow-sm"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  <option value="">{t("testHistory.month")}</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <select
                  className="border border-indigo-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 outline-none text-base shadow-sm"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="">{t("testHistory.year")}</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}
            {filterType === "quarter" && (
              <>
                <select
                  className="border border-indigo-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 outline-none text-base shadow-sm"
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                >
                  <option value="">{t("testHistory.quarter")}</option>
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <select
                  className="border border-indigo-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 outline-none text-base shadow-sm"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="">{t("testHistory.year")}</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}
            {filterType === "year" && (
              <select
                className="border border-indigo-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 outline-none text-base shadow-sm"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">{t("testHistory.year")}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
          </div>
          {loading ? (
            <div className="text-center dark:text-white w-full">
              {t("testHistory.loading")}
            </div>
          ) : error ? (
            <div className="text-red-500 text-center dark:text-red-400 w-full">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full mt-12">
              <span className="mb-3 text-base text-gray-800 dark:text-gray-200">
                {t("testHistory.noHistoryMessage")}
              </span>
              <button
                className="px-5 py-2 rounded-full font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all duration-200"
                onClick={() => navigate("/home#test-section")}
              >
                {t("testHistory.takeTestNow")}
              </button>
            </div>
          ) : (
            <>
              {/* CHART UI NỔI BẬT */}
              {!hasValidChartData ? (
                <div className="mb-8 flex justify-center">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-2xl border border-gray-200 dark:border-gray-700 text-center text-gray-700 dark:text-gray-200 text-lg font-medium">
                    {t("testHistory.needMoreTestsForChart")}
                  </div>
                </div>
              ) : (
                <div className="mb-10 flex justify-center">
                  <div
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-indigo-200 dark:border-indigo-700 flex justify-center items-center w-full mx-auto"
                    style={{ minWidth: 672, maxWidth: 672, minHeight: 380 }}
                  >
                    <div
                      style={{
                        width: 672,
                        height: 340,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ComposedChart
                        width={672}
                        height={340}
                        data={composedData}
                        barCategoryGap="20%"
                        margin={{ top: 40, right: 40, left: 40, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis
                          dataKey="date"
                          className="dark:text-white"
                          tick={{ fontSize: 14, fill: "#6366f1" }}
                          angle={-15}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          allowDecimals={false}
                          domain={yAxisDomain}
                          className="dark:text-white"
                          tick={{ fontSize: 14, fill: "#6366f1" }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#232a36",
                            color: "#fff",
                            borderRadius: 12,
                            fontSize: 15,
                            boxShadow: "0 4px 24px 0 rgba(99,102,241,0.12)",
                          }}
                          labelStyle={{ color: "#fff", fontWeight: 600 }}
                        />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ fontSize: 15, paddingTop: 8 }}
                        />
                        {history.length < 10 ? (
                          <Bar
                            dataKey="score"
                            fill="#6366f1"
                            name={t("testHistory.avgScore")}
                            barSize={60}
                            minPointSize={10}
                            radius={[8, 8, 0, 0]}
                          />
                        ) : (
                          severityLevels.map((sev) => (
                            <Bar
                              key={sev}
                              dataKey={sev}
                              fill={severityColors[sev]}
                              name={t(`testHistory.severity.${sev}`)}
                              stackId="a"
                              barSize={32}
                              radius={[8, 8, 0, 0]}
                            />
                          ))
                        )}
                        {history.length >= 10 && (
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#6366f1"
                            strokeWidth={3}
                            name={t("testHistory.avgScore")}
                            dot={{
                              r: 5,
                              fill: "#6366f1",
                              stroke: "#fff",
                              strokeWidth: 2,
                            }}
                          />
                        )}
                      </ComposedChart>
                    </div>
                  </div>
                </div>
              )}
              {/* BẢNG DỮ LIỆU ĐẸP */}
              <div className="overflow-x-auto flex justify-center">
                <table className="min-w-full max-w-2xl bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-700 rounded-2xl shadow-xl text-center">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-400 to-blue-400 dark:from-indigo-700 dark:to-blue-700 text-white text-lg">
                      <th className="border border-indigo-200 dark:border-indigo-700 px-4 py-3 rounded-tl-2xl">
                        {t("testHistory.tableHeaders.date")}
                      </th>
                      <th className="border border-indigo-200 dark:border-indigo-700 px-4 py-3">
                        {t("testHistory.tableHeaders.type")}
                      </th>
                      <th className="border border-indigo-200 dark:border-indigo-700 px-4 py-3">
                        {t("testHistory.tableHeaders.diagnosis")}
                      </th>
                      <th className="border border-indigo-200 dark:border-indigo-700 px-4 py-3">
                        {t("testHistory.tableHeaders.score")}
                      </th>
                      <th className="border border-indigo-200 dark:border-indigo-700 px-4 py-3">
                        {t("testHistory.tableHeaders.severity")}
                      </th>
                      <th className="border border-indigo-200 dark:border-indigo-700 px-4 py-3 rounded-tr-2xl">
                        {t("testHistory.tableHeaders.recommendation")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-gray-400 dark:text-gray-300 text-lg font-medium"
                        >
                          {t("common.noData")}
                        </td>
                      </tr>
                    ) : (
                      pagedHistory.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`transition-all duration-150 ${
                            ((currentPage - 1) * PAGE_SIZE + idx) % 2 === 0
                              ? "bg-indigo-50 dark:bg-gray-800"
                              : "bg-white dark:bg-gray-900"
                          } hover:bg-indigo-100 dark:hover:bg-gray-700`}
                        >
                          <td className="border border-indigo-200 dark:border-indigo-700 px-4 py-3 dark:text-white font-medium text-base">
                            {new Date(item.testedAt).toLocaleString()}
                          </td>
                          <td className="border border-indigo-200 dark:border-indigo-700 px-4 py-3">
                            {item.testType && item.testType !== "-" ? (
                              <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200 font-semibold text-sm shadow">
                                {item.testType}
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300 font-medium text-sm">
                                -
                              </span>
                            )}
                          </td>
                          <td className="border border-indigo-200 dark:border-indigo-700 px-4 py-3 dark:text-white font-bold text-base">
                            {item.diagnosis}
                          </td>
                          <td className="border border-indigo-200 dark:border-indigo-700 px-4 py-3 font-extrabold text-indigo-600 dark:text-indigo-300 text-lg">
                            {item.totalScore}
                          </td>
                          <td className="border border-indigo-200 dark:border-indigo-700 px-4 py-3 dark:text-white font-semibold text-base">
                            {t(`testHistory.severity.${item.severityLevel}`) ||
                              item.severityLevel}
                          </td>
                          <td className="border border-indigo-200 dark:border-indigo-700 px-4 py-3 text-left dark:text-white text-sm max-w-xs whitespace-pre-line">
                            {item.recommendation}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* PHÂN TRANG */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                  <button
                    className={`px-3 py-1 rounded-full border text-base font-semibold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </button>
                  {getPagination(currentPage, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span key={i} className="px-2 py-1 text-lg text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        className={`px-3 py-1 rounded-full border text-base font-semibold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                          currentPage === p
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    className={`px-3 py-1 rounded-full border text-base font-semibold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default StudentTestHistoryPage;
