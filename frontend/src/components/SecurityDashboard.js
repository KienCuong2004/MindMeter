import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaChartLine,
  FaGlobe,
  FaBan,
  FaEye,
  FaClock,
  FaServer,
  FaUsers,
  FaNetworkWired,
} from "react-icons/fa";

const SecurityDashboard = () => {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/security/metrics/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch security metrics");
      }

      const data = await response.json();
      setMetrics(data.realtime);
      setHistoricalData(data.historical);
      setAlerts(data.alerts);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching security metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-600 bg-red-100";
      case "WARNING":
        return "text-yellow-600 bg-yellow-100";
      case "INFO":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-2" />
          <span className="text-red-700">
            {t("error")}: {error}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaShieldAlt className="text-blue-600 text-2xl" />
          <h1 className="text-2xl font-bold text-gray-900">
            {t("securityDashboard")}
          </h1>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <FaClock className="text-xs" />
          <span>
            {t("lastUpdate")}: {lastUpdate?.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Requests */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("totalRequests")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(metrics?.totalRequests)}
              </p>
            </div>
            <FaServer className="text-blue-500 text-2xl" />
          </div>
        </div>

        {/* Blocked Requests */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("blockedRequests")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(metrics?.totalBlocked)}
              </p>
            </div>
            <FaBan className="text-red-500 text-2xl" />
          </div>
        </div>

        {/* Rate Limited */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("rateLimited")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(metrics?.totalRateLimited)}
              </p>
            </div>
            <FaExclamationTriangle className="text-yellow-500 text-2xl" />
          </div>
        </div>

        {/* Suspicious IPs */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("suspiciousIps")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(metrics?.totalSuspiciousIps)}
              </p>
            </div>
            <FaNetworkWired className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaExclamationTriangle className="text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("securityAlerts")}
            </h2>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alert.type}</p>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <span className="text-xs">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Blocked IPs */}
      {metrics?.topBlockedIps && metrics.topBlockedIps.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaGlobe className="text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("topBlockedIps")}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("ipAddress")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("reason")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("count")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.topBlockedIps.map((ip, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {ip.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ip.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ip.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Endpoints */}
      {metrics?.topEndpoints && metrics.topEndpoints.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaChartLine className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("topEndpoints")}
            </h2>
          </div>
          <div className="space-y-3">
            {metrics.topEndpoints.map((endpoint, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono text-gray-600">
                    {endpoint.endpoint}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(endpoint.count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FaEye className="text-green-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            {t("systemStatus")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">{t("ipFiltering")}</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                metrics?.ipFilteringEnabled
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {metrics?.ipFilteringEnabled ? t("enabled") : t("disabled")}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">{t("monitoring")}</span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {t("active")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
