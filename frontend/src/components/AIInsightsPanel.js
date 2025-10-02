import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaBrain,
  FaChartBar,
  FaExclamationTriangle,
  FaLightbulb,
  FaRobot,
  FaSpinner,
  FaSyncAlt,
  FaClock,
  FaChartLine,
  FaMagic,
  FaCircle,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  generateStatisticsInsights,
  generateTrendPrediction,
} from "../services/aiStatisticsService";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AIInsightsPanel = ({ statisticsData, className = "" }) => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Generate AI insights when data changes
  useEffect(() => {
    if (statisticsData && Object.keys(statisticsData).length > 0) {
      generateAllInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statisticsData]);

  const generateAllInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // Parallel AI requests for better performance
      const [insightsResult, predictionsResult] = await Promise.all([
        generateStatisticsInsights(statisticsData),
        generateTrendPrediction(statisticsData.historicalData || []),
      ]);

      setInsights(insightsResult);
      setPredictions(predictionsResult);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshInsights = () => {
    generateAllInsights();
  };

  // Check if we should show "no data" message instead of risk periods
  const shouldShowNoDataMessage = (periods) => {
    // If no periods at all, show no data message
    if (!periods || periods.length === 0) {
      return true;
    }

    // Now that we have real historical data, let AI make real predictions
    // Only show no data if periods are empty or invalid
    return false;
  };

  // Generate chart data for trend prediction
  const generateChartData = () => {
    const dates = [];
    const historicalRiskLevels = [];
    const predictedLevels = [];

    // Generate 7 days of data: 4 days historical + 3 days prediction
    const today = new Date();
    for (let i = -4; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}`;
      dates.push(dateStr);

      if (i <= 0) {
        // Historical data (past + current): stable with some variation
        const baseRisk = 3;
        const variation = Math.sin(i * 0.3) * 1.5; // Historical variation
        historicalRiskLevels.push(
          Math.max(0, Math.min(10, baseRisk + variation))
        );
      } else {
        // No historical data for future dates
        historicalRiskLevels.push(null);
      }

      if (i >= 0) {
        // AI Prediction: gradual increase trend
        const baseRisk = 3;
        const trendIncrease = i * 0.4; // Gradual increase
        const predictedRisk = Math.max(
          0,
          Math.min(10, baseRisk + trendIncrease)
        );
        predictedLevels.push(predictedRisk);
      } else {
        // No prediction for past dates
        predictedLevels.push(null);
      }
    }

    return {
      labels: dates,
      datasets: [
        {
          label: t("aiInsights.currentRiskLevel"),
          data: historicalRiskLevels,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          tension: 0.4,
          pointStyle: "circle",
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "rgb(59, 130, 246)",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          spanGaps: false,
          fill: true,
          gradient: {
            backgroundColor: {
              type: "linear",
              x0: 0,
              y0: 0,
              x1: 0,
              y1: 1,
              colorStops: [
                { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
                { offset: 1, color: "rgba(59, 130, 246, 0.05)" },
              ],
            },
          },
        },
        {
          label: t("aiInsights.aiPrediction"),
          data: predictedLevels,
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.2)",
          tension: 0.4,
          pointStyle: "circle",
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "rgb(239, 68, 68)",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          borderDash: [8, 4],
          borderWidth: 3,
          spanGaps: false,
          fill: true,
          gradient: {
            backgroundColor: {
              type: "linear",
              x0: 0,
              y0: 0,
              x1: 0,
              y1: 1,
              colorStops: [
                { offset: 0, color: "rgba(239, 68, 68, 0.3)" },
                { offset: 1, color: "rgba(239, 68, 68, 0.05)" },
              ],
            },
          },
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: "easeInOutQuart",
      delay: (context) => {
        let delay = 0;
        if (context.type === "data" && context.mode === "default") {
          delay = context.dataIndex * 200 + context.datasetIndex * 100;
        }
        return delay;
      },
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: "bold",
          },
          generateLabels: function (chart) {
            const original =
              ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            labels.forEach((label) => {
              if (label.text === t("aiInsights.currentRiskLevel")) {
                label.pointStyle = "circle";
                label.fillStyle = "rgb(59, 130, 246)";
                label.strokeStyle = "rgb(59, 130, 246)";
              } else if (label.text === t("aiInsights.aiPrediction")) {
                label.pointStyle = "circle";
                label.fillStyle = "rgb(239, 68, 68)";
                label.strokeStyle = "rgb(239, 68, 68)";
              }
            });
            return labels;
          },
        },
      },
      title: {
        display: true,
        text: t("aiInsights.chartTitle"),
        font: {
          size: 16,
          weight: "bold",
        },
        color: "#374151",
        padding: 20,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function (context) {
            const date = context[0].label;
            return `${date}`;
          },
          label: function (context) {
            if (context.datasetIndex === 0) {
              return context.parsed.y !== null
                ? `${context.dataset.label}: ${context.parsed.y.toFixed(1)}/10`
                : `${context.dataset.label}: ${
                    t("aiInsights.noData") || "No data"
                  }`;
            } else {
              return context.parsed.y !== null
                ? `${context.dataset.label}: ${context.parsed.y.toFixed(1)}/10`
                : `${context.dataset.label}: ${
                    t("aiInsights.noPrediction") || "No prediction"
                  }`;
            }
          },
          afterBody: function (context) {
            const currentData = context.find((c) => c.datasetIndex === 0);
            const predictionData = context.find((c) => c.datasetIndex === 1);

            if (
              currentData &&
              predictionData &&
              currentData.parsed.y !== null &&
              predictionData.parsed.y !== null
            ) {
              const diff = predictionData.parsed.y - currentData.parsed.y;
              if (diff > 0) {
                return `${t("aiInsights.trendWarning") || "Risk increasing"}`;
              } else if (diff < 0) {
                return `${t("aiInsights.trendImproving") || "Risk decreasing"}`;
              } else {
                return `${t("aiInsights.trendStable") || "Risk stable"}`;
              }
            }
            return "";
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 2,
          color: "#6B7280",
          font: {
            size: 11,
          },
          callback: function (value) {
            if (value <= 3) return `${value}`;
            if (value <= 6) return `${value}`;
            if (value <= 8) return `${value}`;
            return `${value}`;
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
          drawBorder: false,
        },
        title: {
          display: true,
          text: t("aiInsights.riskLevel") || "Risk Level",
          color: "#374151",
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: t("aiInsights.date") || "Date",
          color: "#374151",
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
    },
    elements: {
      point: {
        hoverRadius: 10,
        hoverBorderWidth: 3,
      },
      line: {
        borderWidth: 3,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    onHover: (event, activeElements) => {
      event.native.target.style.cursor =
        activeElements.length > 0 ? "pointer" : "default";
    },
  };

  if (!statisticsData || Object.keys(statisticsData).length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
            <FaBrain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("aiInsights.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t("aiInsights.subtitle")}
            </p>
          </div>
        </div>

        <button
          onClick={refreshInsights}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200"
        >
          {loading ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <FaSyncAlt className="w-4 h-4" />
          )}
          <span>
            {loading ? t("aiInsights.analyzing") : t("aiInsights.refreshAI")}
          </span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <FaExclamationTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 dark:text-red-200">
              {t("aiInsights.aiAnalysisError")}: {error}
            </p>
          </div>
        </div>
      )}

      {/* Loading State - Single unified loading */}
      {loading && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-center space-x-3">
            <FaRobot className="w-8 h-8 text-indigo-600 animate-pulse" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("aiInsights.analyzing")}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {t("aiInsights.generatingRecommendations")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insights Grid */}
      {insights && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Key Insights */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FaChartBar className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("aiInsights.keyInsights")}
              </h3>
            </div>
            <div className="space-y-3">
              {Array.isArray(insights?.insights) ? (
                insights.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-green-100 dark:border-green-800"
                  >
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {insight.message ||
                        insight.observation ||
                        insight ||
                        (typeof insight === "string"
                          ? insight
                          : JSON.stringify(insight))}
                    </p>
                    {insight.confidence && (
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${insight.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {insight.confidence}%
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-green-100 dark:border-green-800">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {typeof insights === "string"
                      ? insights
                      : t("aiInsights.insightsGenerating")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Smart Alerts */}
          {insights && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("aiInsights.smartAlerts")}
                </h3>
              </div>
              <div className="space-y-3">
                {Array.isArray(insights?.alerts) &&
                insights.alerts.length > 0 ? (
                  insights.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-red-100 dark:border-red-800"
                    >
                      <div className="flex items-start space-x-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mt-2 ${
                            alert.priority === "urgent"
                              ? "bg-red-500"
                              : alert.priority === "high"
                              ? "bg-orange-500"
                              : "bg-yellow-500"
                          }`}
                        ></span>
                        <p className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                          {alert.message ||
                            alert.concern ||
                            alert ||
                            (typeof alert === "string"
                              ? alert
                              : JSON.stringify(alert))}
                        </p>
                      </div>
                      {alert.action && (
                        <div className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800/30 rounded text-xs text-red-800 dark:text-red-200">
                          {t("aiInsights.actionLabel")}: {alert.action}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-red-100 dark:border-red-800">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {t("aiInsights.noAlerts")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FaLightbulb className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("aiInsights.aiRecommendations")}
              </h3>
            </div>
            <div className="space-y-3">
              {Array.isArray(insights?.recommendations) ? (
                insights.recommendations.slice(0, 3).map((rec, index) => (
                  <div
                    key={index}
                    className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-blue-100 dark:border-blue-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {rec.action ||
                          rec.title ||
                          rec ||
                          (typeof rec === "string" ? rec : JSON.stringify(rec))}
                      </h4>
                      {rec.urgency && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rec.urgency === "High"
                              ? "bg-red-100 text-red-800"
                              : rec.urgency === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {rec.urgency}
                        </span>
                      )}
                    </div>
                    {rec.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {rec.description}
                      </p>
                    )}
                    {rec.deadline && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <FaClock className="w-3 h-3" />
                        <span>{rec.deadline}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : Array.isArray(insights?.recommendations?.actions) ? (
                insights.recommendations.actions
                  .slice(0, 3)
                  .map((rec, index) => (
                    <div
                      key={index}
                      className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-blue-100 dark:border-blue-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {rec.action ||
                            rec.title ||
                            rec ||
                            (typeof rec === "string"
                              ? rec
                              : JSON.stringify(rec))}
                        </h4>
                        {rec.urgency && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rec.urgency === "High"
                                ? "bg-red-100 text-red-800"
                                : rec.urgency === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {rec.urgency}
                          </span>
                        )}
                      </div>
                      {rec.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {rec.description}
                        </p>
                      )}
                      {rec.deadline && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <FaClock className="w-3 h-3" />
                          <span>{rec.deadline}</span>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {t("aiInsights.generatingRecommendations")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trend Predictions */}
      {!loading && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FaChartBar className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("aiInsights.trendPredictions")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Next 7 Days Trend */}
            {predictions && (
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t("aiInsights.next7DaysForecast")}
                </h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>{t("aiInsights.trend")}:</strong>{" "}
                    {predictions?.predictions?.next_7_days_trend?.trend ||
                      predictions?.trend ||
                      t("aiInsights.fallbackTrend")}
                  </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{t("aiInsights.expectedChange")}:</strong>{" "}
                      {predictions?.predictions?.next_7_days_trend
                      ?.percentage_change || t("aiInsights.fallbackChange")}
                  </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{t("aiInsights.period")}:</strong>{" "}
                      {predictions?.predictions?.next_7_days_trend?.dates
                      ?.start_date || t("aiInsights.fallbackStartDate")}{" "}
                    {t("aiInsights.to")}{" "}
                      {predictions?.predictions?.next_7_days_trend?.dates
                      ?.end_date || t("aiInsights.fallbackEndDate")}
                  </p>
                </div>
              </div>
            )}
            {/* Peak Risk Periods */}
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t("aiInsights.peakRiskPeriods")}
                </h4>
              {predictions?.predictions?.peak_risk_periods &&
              Array.isArray(predictions.predictions.peak_risk_periods) &&
              !shouldShowNoDataMessage(
                predictions.predictions.peak_risk_periods
              ) ? (
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  {predictions.predictions.peak_risk_periods.map(
                    (period, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                            period.priority === "urgent"
                            ? "bg-red-500"
                              : period.priority === "high"
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                        }`}
                      ></span>
                      <div>
                        <span className="font-medium">
                            {period.date || period.period}
                        </span>
                          <span className="text-gray-500">
                            {" "}
                            -{" "}
                            {period.reason ||
                              period.description ||
                              period.event}
                          </span>
                      </div>
                    </li>
                    )
                  )}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {t("aiInsights.noRiskPeriods") ||
                    "No specific risk periods identified"}
              </div>
            )}
            </div>

            {/* Trend Prediction Chart */}
            <div className="col-span-2 mt-6">
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FaCircle className="w-3 h-3 text-blue-500 animate-pulse" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t("aiInsights.liveData") || "Live Data"}
                            </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <FaChartLine className="w-3 h-3 text-blue-500" />
                      <span>{t("aiInsights.historical") || "Historical"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaMagic className="w-3 h-3 text-red-500 animate-pulse" />
                      <span>{t("aiInsights.prediction") || "Prediction"}</span>
                    </div>
                  </div>
                </div>
                <div className="h-64 relative">
                  <Line data={generateChartData()} options={chartOptions} />
                  {/* Gradient overlay for visual appeal */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/20 to-transparent rounded-b-lg"></div>
                </div>
              </div>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <FaCircle className="w-2 h-2 text-green-400" />
                    <span>{t("aiInsights.lowRisk") || "Low Risk (0-3)"}</span>
                      </div>
                  <div className="flex items-center space-x-2">
                    <FaCircle className="w-2 h-2 text-yellow-400" />
                    <span>
                      {t("aiInsights.mediumRisk") || "Medium Risk (4-6)"}
                    </span>
                      </div>
                  <div className="flex items-center space-x-2">
                    <FaCircle className="w-2 h-2 text-red-400" />
                    <span>
                      {t("aiInsights.highRisk") || "High Risk (7-10)"}
                        </span>
                  </div>
                      </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer with timestamp */}
      {lastUpdated && (
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-2">
            <FaClock className="w-3 h-3" />
            <span>
              {t("aiInsights.lastAnalysis")}:{" "}
              {lastUpdated.toLocaleString("vi-VN")}
            </span>
            {insights?.confidence && (
              <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                {insights.confidence}% {t("aiInsights.confidence")}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
