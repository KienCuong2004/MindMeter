import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaShieldAlt,
  FaBan,
  FaCheck,
  FaExclamationTriangle,
  FaTrash,
  FaPlus,
  FaEye,
} from "react-icons/fa";

const IpFilteringDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [blacklistedIps, setBlacklistedIps] = useState([]);
  const [whitelistedIps, setWhitelistedIps] = useState([]);
  const [suspiciousIps, setSuspiciousIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newIp, setNewIp] = useState("");
  const [ipType, setIpType] = useState("blacklist");
  const [testIp, setTestIp] = useState("");
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, blacklistRes, whitelistRes, suspiciousRes] =
        await Promise.all([
          fetch("/api/admin/security/ip-filtering/stats"),
          fetch("/api/admin/security/ip-filtering/blacklist"),
          fetch("/api/admin/security/ip-filtering/whitelist"),
          fetch("/api/admin/security/ip-filtering/suspicious"),
        ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (blacklistRes.ok) setBlacklistedIps(await blacklistRes.json());
      if (whitelistRes.ok) setWhitelistedIps(await whitelistRes.json());
      if (suspiciousRes.ok)
        setSuspiciousIps(Object.keys(await suspiciousRes.json()));
    } catch (error) {
      console.error("Error fetching IP filtering data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addIpToList = async () => {
    if (!newIp.trim()) return;

    try {
      const endpoint = ipType === "blacklist" ? "blacklist" : "whitelist";
      const response = await fetch(
        `/api/admin/security/ip-filtering/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip: newIp.trim() }),
        }
      );

      if (response.ok) {
        setNewIp("");
        fetchData();
      }
    } catch (error) {
      console.error("Error adding IP:", error);
    }
  };

  const removeFromBlacklist = async (ip) => {
    try {
      const response = await fetch(
        `/api/admin/security/ip-filtering/blacklist/${ip}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error removing IP:", error);
    }
  };

  const markSuspicious = async (ip) => {
    try {
      const response = await fetch(
        "/api/admin/security/ip-filtering/suspicious",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip }),
        }
      );

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error marking IP as suspicious:", error);
    }
  };

  const testIpAddress = async () => {
    if (!testIp.trim()) return;

    try {
      const response = await fetch("/api/admin/security/ip-filtering/test-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: testIp.trim() }),
      });

      if (response.ok) {
        setTestResult(await response.json());
      }
    } catch (error) {
      console.error("Error testing IP:", error);
    }
  };

  const clearAllLists = async () => {
    if (!window.confirm("Are you sure you want to clear all IP lists?")) return;

    try {
      const response = await fetch(
        "/api/admin/security/ip-filtering/clear-all",
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error clearing lists:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <FaShieldAlt className="inline-block mr-3 text-blue-600" />
          IP Filtering Dashboard
        </h1>
        <p className="text-gray-600">
          Manage IP addresses and security filtering rules
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center">
              <FaBan className="text-red-500 text-2xl mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Blacklisted IPs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.blacklistedCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center">
              <FaCheck className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Whitelisted IPs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.whitelistedCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-yellow-500 text-2xl mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Suspicious IPs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.suspiciousCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center">
              <FaShieldAlt className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.enabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add IP Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Add IP Address</h2>
        <div className="flex gap-4 mb-4">
          <select
            value={ipType}
            onChange={(e) => setIpType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="blacklist">Blacklist</option>
            <option value="whitelist">Whitelist</option>
          </select>
          <input
            type="text"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            placeholder="Enter IP address (e.g., 192.168.1.1)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addIpToList}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            <FaPlus className="inline-block mr-2" />
            Add
          </button>
        </div>
      </div>

      {/* Test IP Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Test IP Address</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={testIp}
            onChange={(e) => setTestIp(e.target.value)}
            placeholder="Enter IP address to test"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={testIpAddress}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500"
          >
            <FaEye className="inline-block mr-2" />
            Test
          </button>
        </div>
        {testResult && (
          <div
            className={`p-4 rounded-md ${
              testResult.isBlocked
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            <strong>Result:</strong> {testResult.reason}
          </div>
        )}
      </div>

      {/* IP Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blacklisted IPs */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaBan className="text-red-500 mr-2" />
            Blacklisted IPs ({blacklistedIps.length})
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {blacklistedIps.map((ip, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-red-50 rounded"
              >
                <span className="font-mono text-sm">{ip}</span>
                <button
                  onClick={() => removeFromBlacklist(ip)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            {blacklistedIps.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No blacklisted IPs
              </p>
            )}
          </div>
        </div>

        {/* Whitelisted IPs */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaCheck className="text-green-500 mr-2" />
            Whitelisted IPs ({whitelistedIps.length})
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {whitelistedIps.map((ip, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-green-50 rounded"
              >
                <span className="font-mono text-sm">{ip}</span>
                <button
                  onClick={() => markSuspicious(ip)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <FaExclamationTriangle />
                </button>
              </div>
            ))}
            {whitelistedIps.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No whitelisted IPs
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Suspicious IPs */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaExclamationTriangle className="text-yellow-500 mr-2" />
          Suspicious IPs ({suspiciousIps.length})
        </h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {suspiciousIps.map((ip, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-yellow-50 rounded"
            >
              <span className="font-mono text-sm">{ip}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => markSuspicious(ip)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaBan />
                </button>
              </div>
            </div>
          ))}
          {suspiciousIps.length === 0 && (
            <p className="text-gray-500 text-center py-4">No suspicious IPs</p>
          )}
        </div>
      </div>

      {/* Clear All Button */}
      <div className="mt-8 text-center">
        <button
          onClick={clearAllLists}
          className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500"
        >
          <FaTrash className="inline-block mr-2" />
          Clear All Lists
        </button>
      </div>
    </div>
  );
};

export default IpFilteringDashboard;
