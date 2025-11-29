import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FaBrain } from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { authFetch } from "../authFetch";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";

export default function AdviceSentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Khởi tạo user từ token
  const [user] = useState(() => {
    let userObj = {
      firstName: "",
      lastName: "",
      avatarUrl: null,
      email: "",
      role: "",
      plan: "FREE",
      phone: "",
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

  const handleLogoutLocal = () => handleLogout(navigate);

  useEffect(() => {
    document.title = "Lời khuyên đã gửi | MindMeter";
    const fetchMessages = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await authFetch("/api/expert/messages/sent");
        if (!res.ok)
          throw new Error("Không thể tải dữ liệu lời khuyên đã gửi!");
        const data = await res.json();
        setMessages(data);
      } catch (e) {
        setError(e.message || "Lỗi không xác định!");
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText={
          <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 dark:from-indigo-300 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent tracking-wide">
            {t("adviceSentTitle") || "Danh sách lời khuyên đã gửi"}
          </span>
        }
        user={user}
        theme={theme}
        setTheme={toggleTheme}
        onProfile={() => navigate("/expert/profile")}
        onLogout={handleLogoutLocal}
      />

      {/* Main Content */}
      <div className="flex-grow flex flex-col py-10 overflow-x-hidden pt-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-300 mb-4">
              {t("adviceSentTitle") || "Danh sách lời khuyên đã gửi"}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t("common.studentAdviceFeature")}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-300 text-lg">
                  {t("common.loadingData")}
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 dark:text-red-300 text-lg">
                  {error}
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-300 text-lg">
                  {t("adviceSentPlaceholder") ||
                    t("common.studentAdviceFeature")}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-blue-700 dark:text-blue-200 font-bold text-sm uppercase tracking-wider">
                        {t("common.content")}
                      </th>
                      <th className="px-4 py-3 text-blue-700 dark:text-blue-200 font-bold text-sm uppercase tracking-wider">
                        {t("common.receiver")}
                      </th>
                      <th className="px-4 py-3 text-blue-700 dark:text-blue-200 font-bold text-sm uppercase tracking-wider">
                        {t("common.sentTime")}
                      </th>
                      <th className="px-4 py-3 text-blue-700 dark:text-blue-200 font-bold text-sm uppercase tracking-wider">
                        {t("common.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {messages.map((msg) => (
                      <tr
                        key={msg.id}
                        className="hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-4 break-words max-w-xs">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {msg.message}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {msg.receiverId || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {msg.sentAt
                              ? new Date(msg.sentAt).toLocaleString()
                              : "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {msg.isRead ? (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {t("common.read")}
                            </span>
                          ) : (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              {t("common.unread")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
