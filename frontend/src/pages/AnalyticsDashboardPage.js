import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaChartLine,
  FaChartBar,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaArrowLeft,
  FaBrain,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import analyticsService from "../services/analyticsService";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";
import { jwtDecode } from "jwt-decode";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsDashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [progressChart, setProgressChart] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [daysFilter, setDaysFilter] = useState(90);
  const [exporting, setExporting] = useState("");

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryData, trendsData, progressData, comparisonsData] =
        await Promise.all([
          analyticsService.getAnalyticsSummary(),
          analyticsService.getMentalHealthTrends(daysFilter),
          analyticsService.getProgressChart(daysFilter),
          analyticsService.compareTestResults(),
        ]);

      setSummary(summaryData);
      setTrends(trendsData);
      setProgressChart(progressData);
      setComparisons(comparisonsData);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(t("analytics.fetchError") || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [daysFilter, t]);

  useEffect(() => {
    // Get user from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          firstName: decoded.firstName || "",
          lastName: decoded.lastName || "",
          email: decoded.sub || decoded.email || "",
          avatarUrl: decoded.avatarUrl || decoded.avatar || null,
          role: decoded.role || "STUDENT",
        });
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }

    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async (type) => {
    try {
      setExporting(type);
      let blob;
      let filename;

      switch (type) {
        case "pdf-summary":
          blob = await analyticsService.exportAnalyticsPDF();
          filename = "analytics-summary.pdf";
          break;
        case "csv":
          blob = await analyticsService.exportToCSV();
          filename = "test-results.csv";
          break;
        case "excel":
          blob = await analyticsService.exportToExcel();
          filename = "test-results.xlsx";
          break;
        default:
          return;
      }

      analyticsService.downloadFile(blob, filename);
    } catch (err) {
      console.error(`Error exporting ${type}:`, err);
      setError(t("analytics.exportError") || "Failed to export data");
    } finally {
      setExporting("");
    }
  };

  // Prepare chart data
  const trendsChartData = {
    labels: trends.map((t) =>
      new Date(t.date).toLocaleDateString(
        i18n.language === "vi" ? "vi-VN" : "en-US",
        {
          month: "short",
          day: "numeric",
        }
      )
    ),
    datasets: [
      {
        label: t("analytics.score") || "Score",
        data: trends.map((t) => t.score),
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const progressChartData = progressChart
    ? {
        labels: progressChart.labels || [],
        datasets: [
          {
            label: t("analytics.score") || "Score",
            data: progressChart.scores || [],
            borderColor: "rgb(99, 102, 241)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      }
    : null;

  const severityDistributionData = summary?.severityDistribution
    ? {
        labels: Object.keys(summary.severityDistribution).map(
          (key) => t(`studentTestResultPage.severityVi.${key}`) || key
        ),
        datasets: [
          {
            data: Object.values(summary.severityDistribution),
            backgroundColor: [
              "rgba(34, 197, 94, 0.8)", // Green for MINIMAL
              "rgba(251, 191, 36, 0.8)", // Yellow for MILD
              "rgba(249, 115, 22, 0.8)", // Orange for MODERATE
              "rgba(239, 68, 68, 0.8)", // Red for SEVERE
            ],
            borderColor: [
              "rgba(34, 197, 94, 1)",
              "rgba(251, 191, 36, 1)",
              "rgba(249, 115, 22, 1)",
              "rgba(239, 68, 68, 1)",
            ],
            borderWidth: 2,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme === "dark" ? "#e5e7eb" : "#374151",
        },
      },
      tooltip: {
        backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
        titleColor: theme === "dark" ? "#e5e7eb" : "#374151",
        bodyColor: theme === "dark" ? "#e5e7eb" : "#374151",
        borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme === "dark" ? "#9ca3af" : "#6b7280",
        },
        grid: {
          color: theme === "dark" ? "#374151" : "#e5e7eb",
        },
      },
      y: {
        ticks: {
          color: theme === "dark" ? "#9ca3af" : "#6b7280",
        },
        grid: {
          color: theme === "dark" ? "#374151" : "#e5e7eb",
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            {t("loading") || "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={t("analytics.title") || "Analytics Dashboard"}
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onLogout={() => handleLogout(navigate)}
      />

      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
          >
            <FaArrowLeft />
            <span>
              {t("analytics.backToHome") || t("backToHome") || "Back to Home"}
            </span>
          </button>

          {/* Export Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport("pdf-summary")}
              disabled={exporting !== ""}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting === "pdf-summary" ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaFilePdf />
              )}
              <span>{t("analytics.exportPdf") || "PDF"}</span>
            </button>
            <button
              onClick={() => handleExport("excel")}
              disabled={exporting !== ""}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting === "excel" ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaFileExcel />
              )}
              <span>{t("analytics.exportExcel") || "Excel"}</span>
            </button>
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting !== ""}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting === "csv" ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaFileCsv />
              )}
              <span>{t("analytics.exportCsv") || "CSV"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
            <FaExclamationTriangle className="text-red-500" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t("analytics.totalTests") || "Total Tests"}
                  </p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                    {summary.totalTests || 0}
                  </p>
                </div>
                <FaChartBar className="text-4xl text-indigo-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t("analytics.averageScore") || "Average Score"}
                  </p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                    {summary.averageScore || 0}
                  </p>
                </div>
                <FaChartLine className="text-4xl text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t("analytics.currentSeverity") || "Current Severity"}
                  </p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                    {summary.currentSeverityLevel
                      ? t(
                          `studentTestResultPage.severityVi.${summary.currentSeverityLevel}`
                        ) || summary.currentSeverityLevel
                      : t("analytics.notAvailable") || "N/A"}
                  </p>
                </div>
                <FaBrain className="text-4xl text-purple-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t("analytics.improvementRate") || "Improvement Rate"}
                  </p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                    {summary.improvementRate
                      ? `${Math.round(summary.improvementRate)}%`
                      : "0%"}
                  </p>
                </div>
                <FaChartLine className="text-4xl text-green-500 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {t("analytics.trendsChart") || "Mental Health Trends"}
              </h3>
              <select
                value={daysFilter}
                onChange={(e) => setDaysFilter(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value={30}>30 {t("days") || "Days"}</option>
                <option value={90}>90 {t("days") || "Days"}</option>
                <option value={180}>180 {t("days") || "Days"}</option>
                <option value={365}>365 {t("days") || "Days"}</option>
              </select>
            </div>
            <div className="h-64">
              {trendsChartData && (
                <Line data={trendsChartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              {t("analytics.progressChart") || "Progress Chart"}
            </h3>
            <div className="h-64">
              {progressChartData && (
                <Line data={progressChartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Severity Distribution */}
        {severityDistributionData && summary?.severityDistribution && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              {t("analytics.severityDistribution") || "Severity Distribution"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Chart */}
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={severityDistributionData}
                  options={chartOptions}
                />
              </div>

              {/* Statistics */}
              <div className="space-y-4">
                {Object.entries(summary.severityDistribution)
                  .sort((a, b) => b[1] - a[1]) // Sort by count descending
                  .map(([severity, count]) => {
                    const total = Object.values(
                      summary.severityDistribution
                    ).reduce((sum, val) => sum + val, 0);
                    const percentage =
                      total > 0 ? Math.round((count / total) * 100) : 0;
                    const severityColors = {
                      MINIMAL:
                        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-300 dark:border-green-700",
                      MILD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
                      MODERATE:
                        "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border-orange-300 dark:border-orange-700",
                      SEVERE:
                        "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-300 dark:border-red-700",
                    };

                    return (
                      <div
                        key={severity}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          severityColors[severity] ||
                          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor:
                                severity === "MINIMAL"
                                  ? "rgba(34, 197, 94, 0.8)"
                                  : severity === "MILD"
                                  ? "rgba(251, 191, 36, 0.8)"
                                  : severity === "MODERATE"
                                  ? "rgba(249, 115, 22, 0.8)"
                                  : "rgba(239, 68, 68, 0.8)",
                            }}
                          />
                          <span className="font-semibold">
                            {t(
                              `studentTestResultPage.severityVi.${severity}`
                            ) || severity}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-sm opacity-75">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Test Comparison Table */}
        {comparisons.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              {t("analytics.testComparison") || "Test Comparison"}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                      {t("analytics.testDate") || "Test Date"}
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                      {t("analytics.testType") || "Test Type"}
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                      {t("analytics.score") || "Score"}
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                      {t("analytics.severity") || "Severity"}
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                      {t("analytics.change") || "Change"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.slice(0, 10).map((comparison, index) => (
                    <tr
                      key={comparison.testId}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {new Date(comparison.testedAt).toLocaleDateString(
                          i18n.language === "vi" ? "vi-VN" : "en-US"
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {comparison.testType ||
                          t("analytics.notAvailable") ||
                          "N/A"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">
                        {comparison.totalScore}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            comparison.severityLevel === "SEVERE"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              : comparison.severityLevel === "MODERATE"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                              : comparison.severityLevel === "MILD"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          }`}
                        >
                          {t(
                            `studentTestResultPage.severityVi.${comparison.severityLevel}`
                          ) || comparison.severityLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {comparison.scoreChange !== 0 && (
                          <span
                            className={`font-semibold ${
                              comparison.scoreChange < 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {comparison.scoreChange > 0 ? "+" : ""}
                            {comparison.scoreChange} (
                            {comparison.percentageChange > 0 ? "+" : ""}
                            {Math.round(comparison.percentageChange)}%)
                          </span>
                        )}
                        {comparison.scoreChange === 0 && (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <FooterSection />
    </div>
  );
}
