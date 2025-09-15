import React from "react";
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
import {
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaChartBar,
} from "react-icons/fa";

export default function DepressionStatsChart({ testStats, t }) {
  if (
    !testStats ||
    !testStats.totalTests ||
    !testStats.severeTests ||
    !testStats.dates
  )
    return null;
  // Tính toán số test mới 7 ngày qua và so sánh
  const last7 = testStats.totalTests.slice(7, 14).reduce((a, b) => a + b, 0);
  const prev7 = testStats.totalTests.slice(0, 7).reduce((a, b) => a + b, 0);
  const diff = last7 - prev7;
  const percent =
    prev7 === 0 ? 100 : Math.abs(Math.round((diff / prev7) * 100));
  const severeLast7 = testStats.severeTests
    .slice(7, 14)
    .reduce((a, b) => a + b, 0);
  const severePrev7 = testStats.severeTests
    .slice(0, 7)
    .reduce((a, b) => a + b, 0);
  return (
    <div className="bg-white dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700 rounded-3xl shadow-xl dark:shadow-2xl p-8 mt-8">
      <h2 className="text-2xl font-extrabold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
        <FaChartBar className="text-indigo-400 animate-spin-slow" />{" "}
        {t("stat_depression_ratio")}
      </h2>
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="text-indigo-600 dark:text-indigo-300">
            {t("newTests7Days")}:
          </span>
          <span className="text-2xl font-bold">{last7}</span>
        </div>
        {diff > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <FaArrowUp /> +{percent}%
          </span>
        )}
        {diff < 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <FaArrowDown /> -{percent}%
          </span>
        )}
        {diff === 0 && <span className="text-gray-500">{t("noChange")}</span>}
        {severeLast7 > severePrev7 && severeLast7 >= 2 && (
          <span className="flex items-center gap-1 text-red-500 font-bold">
            <FaExclamationTriangle /> {t("severeWarning")}
          </span>
        )}
      </div>
      <div className="w-full flex flex-col md:flex-row gap-8">
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 shadow">
          <h3 className="font-bold mb-2 text-indigo-600 dark:text-indigo-300">
            {t("barChartTitle") || "Biểu đồ cột: Số lượt test mỗi ngày"}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={testStats.dates.map((date, i) => ({
                date: date.slice(5),
                total: testStats.totalTests[i],
                severe: testStats.severeTests[i],
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="total"
                fill="#6366f1"
                name={t("totalTests") || "Tổng test"}
              />
              <Bar
                dataKey="severe"
                fill="#ef4444"
                name={t("severeTests") || "Test nặng"}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 shadow">
          <h3 className="font-bold mb-2 text-indigo-600 dark:text-indigo-300">
            {t("lineChartTitle") || "Biểu đồ đường: Xu hướng test"}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={testStats.dates.map((date, i) => ({
                date: date.slice(5),
                total: testStats.totalTests[i],
                severe: testStats.severeTests[i],
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                name={t("totalTests") || "Tổng test"}
              />
              <Line
                type="monotone"
                dataKey="severe"
                stroke="#ef4444"
                name={t("severeTests") || "Test nặng"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
