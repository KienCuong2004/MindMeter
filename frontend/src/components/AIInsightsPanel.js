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
} from "react-icons/fa";
import {
  generateStatisticsInsights,
  generateTrendPrediction,
  generateActionRecommendations,
} from "../services/aiStatisticsService";

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

      {/* Loading State */}
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
                      : "AI insights are being generated..."}
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
                          Action: {alert.action}
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
      {insights && !loading && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FaChartBar className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("aiInsights.trendPredictions")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Next 7 Days Trend */}
            {predictions?.predictions?.next_7_days_trend ||
            predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe ||
            predictions?.danhGiaTamLy?.duDoan?.xuHuongTuanKe ||
            predictions?.danh_gia_tinh_trang_tam_than?.du_bao
              ?.xu_huong_tuan_toi ||
            predictions?.danh_gia_tinh_trang_tam_than?.du_doan
              ?.xu_huong_tuan_toi ||
            predictions?.danh_gia_tinh_trang_tam_ly?.du_bao
              ?.xu_huong_tuan_toi ||
            predictions?.danh_gia_tinh_trang_tam_than?.du_doan
              ?.xu_huong_tuan_toi ? (
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t("aiInsights.next7DaysForecast")}
                </h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>{t("aiInsights.trend")}:</strong>{" "}
                    {predictions?.predictions?.next_7_days_trend?.trend ||
                      predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                        ?.xuHuong ||
                      predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                        ?.xuHuongTuanKe?.xuHuong ||
                      predictions?.danhGiaTamLy?.duDoan?.xuHuongTuanKe
                        ?.xuHuong ||
                      predictions?.danh_gia_tinh_trang_tam_than?.du_bao
                        ?.xu_huong_tuan_toi?.xu_huong ||
                      predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                        ?.xu_huong_tuan_toi?.xu_huong ||
                      predictions?.danh_gia_tinh_trang_tam_ly?.du_bao
                        ?.xu_huong_tuan_toi?.xu_huong ||
                      predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                        ?.xu_huong_tuan_toi?.xu_huong}
                  </p>
                  {(predictions?.predictions?.next_7_days_trend
                    ?.percentage_change ||
                    predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe?.thayDoi ||
                    predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                      ?.xuHuongTuanKe?.thayDoi ||
                    predictions?.danhGiaTamLy?.duDoan?.xuHuongTuanKe?.thayDoi ||
                    predictions?.danh_gia_tinh_trang_tam_than?.du_bao
                      ?.xu_huong_tuan_toi?.thay_doi ||
                    predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                      ?.xu_huong_tuan_toi?.thay_doi ||
                    predictions?.danh_gia_tinh_trang_tam_ly?.du_bao
                      ?.xu_huong_tuan_toi?.thay_doi ||
                    predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                      ?.xu_huong_tuan_toi?.thay_doi) && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{t("aiInsights.expectedChange")}:</strong>{" "}
                      {predictions?.predictions?.next_7_days_trend
                        ?.percentage_change ||
                        predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                          ?.thayDoi ||
                        predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                          ?.xuHuongTuanKe?.thayDoi ||
                        predictions?.danhGiaTamLy?.duDoan?.xuHuongTuanKe
                          ?.thayDoi ||
                        predictions?.danh_gia_tinh_trang_tam_than?.du_bao
                          ?.xu_huong_tuan_toi?.thay_doi ||
                        predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                          ?.xu_huong_tuan_toi?.thay_doi ||
                        predictions?.danh_gia_tinh_trang_tam_ly?.du_bao
                          ?.xu_huong_tuan_toi?.thay_doi ||
                        predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                          ?.xu_huong_tuan_toi?.thay_doi}
                      {!predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                        ?.thayDoi &&
                        !predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                          ?.xuHuongTuanKe?.thayDoi &&
                        "%"}
                    </p>
                  )}
                  {(predictions?.predictions?.next_7_days_trend?.dates ||
                    predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                      ?.ngayBatDau ||
                    predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                      ?.xuHuongTuanKe?.ngayBatDau ||
                    predictions?.danhGiaTamLy?.duDoan?.xuHuongTuanKe
                      ?.ngayBatDau ||
                    predictions?.danh_gia_tinh_trang_tam_than?.du_bao
                      ?.xu_huong_tuan_toi?.ngay_bat_dau ||
                    predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                      ?.xu_huong_tuan_toi?.ngay_bat_dau ||
                    predictions?.danh_gia_tinh_trang_tam_ly?.du_bao
                      ?.xu_huong_tuan_toi?.ngay_bat_dau ||
                    predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                      ?.xu_huong_tuan_toi?.ngay_bat_dau) && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{t("aiInsights.period")}:</strong>{" "}
                      {predictions?.predictions?.next_7_days_trend?.dates
                        ?.start_date ||
                        predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                          ?.ngayBatDau ||
                        predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                          ?.xuHuongTuanKe?.ngayBatDau ||
                        predictions?.danhGiaTamLy?.duDoan?.xuHuongTuanKe
                          ?.ngayBatDau ||
                        predictions?.danh_gia_tinh_trang_tam_than?.du_bao
                          ?.xu_huong_tuan_toi?.ngay_bat_dau ||
                        predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                          ?.xu_huong_tuan_toi?.ngay_bat_dau ||
                        predictions?.danh_gia_tinh_trang_tam_ly?.du_bao
                          ?.xu_huong_tuan_toi?.ngay_bat_dau ||
                        predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                          ?.xu_huong_tuan_toi?.ngay_bat_dau}{" "}
                      đến{" "}
                      {predictions?.predictions?.next_7_days_trend?.dates
                        ?.end_date ||
                        predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                          ?.ngayKetThuc ||
                        predictions?.danhGiaTamLy?.duBao?.xuHuongTuanKe
                          ?.xuHuongTuanKe?.ngayKetThuc ||
                        predictions?.danhGiaTamLy?.duDoan?.xuHuongTuanKe
                          ?.ngayKetThuc ||
                        predictions?.danh_gia_tinh_trang_tam_than?.du_bao
                          ?.xu_huong_tuan_toi?.ngay_ket_thuc ||
                        predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                          ?.xu_huong_tuan_toi?.ngay_ket_thuc ||
                        predictions?.danh_gia_tinh_trang_tam_ly?.du_bao
                          ?.xu_huong_tuan_toi?.ngay_ket_thuc ||
                        predictions?.danh_gia_tinh_trang_tam_than?.du_doan
                          ?.xu_huong_tuan_toi?.ngay_ket_thuc}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
            {/* Peak Risk Periods */}
            {((predictions?.predictions?.peak_risk_periods &&
              predictions.predictions.peak_risk_periods.length > 0) ||
              (predictions?.danhGiaTamLy?.duBao?.thoiDiemRuiRoCaoNhat &&
                predictions.danhGiaTamLy.duBao.thoiDiemRuiRoCaoNhat.length >
                  0) ||
              (predictions?.danhGiaTamLy?.duDoan?.thoiGianRuiRoCaoNhat &&
                predictions.danhGiaTamLy.duDoan.thoiGianRuiRoCaoNhat.length >
                  0)) && (
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t("aiInsights.peakRiskPeriods")}
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  {(
                    predictions?.predictions?.peak_risk_periods ||
                    predictions?.danhGiaTamLy?.duBao?.thoiDiemRuiRoCaoNhat ||
                    predictions?.danhGiaTamLy?.duDoan?.thoiGianRuiRoCaoNhat ||
                    []
                  ).map((risk, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                          risk.risk_level === "high" || risk.mucDo === "Cao"
                            ? "bg-red-500"
                            : risk.risk_level === "medium" ||
                              risk.mucDo === "Trung bình"
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                        }`}
                      ></span>
                      <div>
                        <span className="font-medium">
                          {risk.date || risk.ngay}
                        </span>
                        {(risk.reason || risk.lyDo || risk.moTa) && (
                          <span className="text-gray-500">
                            {" "}
                            - {risk.reason || risk.lyDo || risk.moTa}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Expected Case Distribution */}
            {(predictions?.predictions?.expected_case_distribution ||
              predictions?.danhGiaTamLy?.duBao?.phanBoTruongHopDuKien ||
              predictions?.danhGiaTamLy?.duDoan?.phanBoTruongHopDuKien) && (
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t("aiInsights.expectedCaseDistribution")}
                </h4>
                <div className="space-y-1">
                  {(predictions?.predictions?.expected_case_distribution
                    ?.total_cases ||
                    predictions?.danhGiaTamLy?.duBao?.phanBoTruongHopDuKien
                      ?.soLuong ||
                    predictions?.danhGiaTamLy?.duDoan?.phanBoTruongHopDuKien
                      ?.soLuong) && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{t("aiInsights.totalCases")}:</strong>{" "}
                      {predictions?.predictions?.expected_case_distribution
                        ?.total_cases ||
                        predictions?.danhGiaTamLy?.duBao?.phanBoTruongHopDuKien
                          ?.soLuong ||
                        predictions?.danhGiaTamLy?.duDoan?.phanBoTruongHopDuKien
                          ?.soLuong}
                    </p>
                  )}
                  {(predictions?.predictions?.expected_case_distribution
                    ?.distribution ||
                    predictions?.danhGiaTamLy?.duBao?.phanBoTruongHopDuKien
                      ?.phanBo ||
                    predictions?.danhGiaTamLy?.duDoan?.phanBoTruongHopDuKien
                      ?.phanBo) && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{t("aiInsights.distribution")}:</strong>
                      <ul className="ml-4 mt-1 space-y-1">
                        {Object.entries(
                          predictions?.predictions?.expected_case_distribution
                            ?.distribution ||
                            predictions?.danhGiaTamLy?.duBao
                              ?.phanBoTruongHopDuKien?.phanBo ||
                            predictions?.danhGiaTamLy?.duDoan
                              ?.phanBoTruongHopDuKien?.phanBo ||
                            {}
                        ).map(([key, value]) => (
                          <li key={key} className="flex justify-between">
                            <span className="capitalize">
                              {key.replace("_", " ")}:
                            </span>
                            <span className="font-medium">{value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Intervention Strategies */}
            {((predictions?.recommendations?.intervention_strategies &&
              predictions.recommendations.intervention_strategies.length > 0) ||
              (predictions?.danhGiaTamLy?.duBao?.chiSoCanhBaoSom?.chiSo &&
                Object.keys(
                  predictions.danhGiaTamLy.duBao.chiSoCanhBaoSom.chiSo
                ).length > 0) ||
              (predictions?.danhGiaTamLy?.duDoan?.chiSoCanhBaoSom?.dauHieu &&
                predictions.danhGiaTamLy.duDoan.chiSoCanhBaoSom.dauHieu.length >
                  0)) && (
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t("aiInsights.recommendedInterventions")}
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  {(
                    predictions?.recommendations?.intervention_strategies || []
                  ).map((strategy, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <div>
                        <span className="font-medium">{strategy.strategy}</span>
                        {strategy.details && (
                          <p className="text-gray-500 text-xs mt-1">
                            {strategy.details}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                  {(
                    predictions?.danhGiaTamLy?.duBao?.chiSoCanhBaoSom?.chiSo &&
                    Object.entries(
                      predictions.danhGiaTamLy.duBao.chiSoCanhBaoSom.chiSo
                    )
                  ).map(([key, value], index) => (
                    <li
                      key={`chiSo-${index}`}
                      className="flex items-start space-x-2"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <div>
                        <span className="font-medium">{value.moTa || key}</span>
                        {value.giaTri && (
                          <p className="text-gray-500 text-xs mt-1">
                            Giá trị: {value.giaTri}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                  {(
                    predictions?.danhGiaTamLy?.duDoan?.chiSoCanhBaoSom
                      ?.dauHieu || []
                  ).map((dauHieu, index) => (
                    <li
                      key={`dauHieu-${index}`}
                      className="flex items-start space-x-2"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <div>
                        <span className="font-medium">
                          {typeof dauHieu === "string"
                            ? dauHieu
                            : dauHieu.moTa || dauHieu.chiSo}
                        </span>
                        {dauHieu.tyLe && (
                          <p className="text-gray-500 text-xs mt-1">
                            Tỷ lệ: {dauHieu.tyLe}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            ) : (
            <div className="col-span-2 bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
              <p className="text-sm text-gray-800 dark:text-gray-200 text-center">
                {t("aiInsights.generatingTrends")}
              </p>
            </div>
            )
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
