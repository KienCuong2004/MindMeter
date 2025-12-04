import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";
import { FaComments, FaUser, FaBrain } from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import MessagingComponent from "../components/MessagingComponent";
import MessagingService from "../services/messagingService";
import { useTheme } from "../hooks/useTheme";
import { handleLogout } from "../utils/logoutUtils";

const MessagingPage = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Get user data from localStorage if available
        const storedUser = localStorage.getItem("user");
        let userData = decoded;

        if (storedUser && storedUser !== "undefined") {
          try {
            const parsedUser = JSON.parse(storedUser);
            userData = { ...decoded, ...parsedUser };
          } catch (e) {
            // Use decoded if parsing fails
          }
        }

        setUser(userData);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await MessagingService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await MessagingService.getConversations();
      setConversations(data || []);
      // Also refresh unread count when refreshing conversations
      loadUnreadCount();
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [loadUnreadCount]);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();

    // Refresh unread count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadConversations, loadUnreadCount]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadUnreadCount(); // Refresh unread count
    // Prevent page scroll when selecting conversation
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300" />
        }
        logoText="MindMeter"
        user={user}
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
        messagingUnreadCount={unreadCount}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaComments />
                    {t("messaging.conversations")}
                  </h2>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8 px-4">
                    <FaComments className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>{t("messaging.noConversations")}</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.otherUserId}
                      onClick={() => handleSelectConversation(conv)}
                      type="button"
                      className={`w-full px-4 py-3 text-left border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                        selectedConversation?.otherUserId === conv.otherUserId
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                          {conv.otherUserAvatarUrl ? (
                            <>
                              <img
                                src={
                                  conv.otherUserAvatarUrl.startsWith("http")
                                    ? conv.otherUserAvatarUrl
                                    : `${
                                        process.env.REACT_APP_API_URL ||
                                        "http://localhost:8080"
                                      }${
                                        conv.otherUserAvatarUrl.startsWith("/")
                                          ? conv.otherUserAvatarUrl
                                          : `/${conv.otherUserAvatarUrl}`
                                      }`
                                }
                                alt={conv.otherUserName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div
                                className="w-full h-full bg-indigo-500 flex items-center justify-center"
                                style={{ display: "none" }}
                              >
                                <FaUser className="text-white" />
                              </div>
                            </>
                          ) : (
                            <FaUser className="text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {conv.otherUserName}
                            </h3>
                            {conv.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {conv.lastMessage}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {conv.lastMessageTime
                              ? new Date(conv.lastMessageTime).toLocaleString()
                              : ""}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <MessagingComponent
                  otherUserId={selectedConversation.otherUserId}
                  otherUserName={selectedConversation.otherUserName}
                  otherUserAvatarUrl={selectedConversation.otherUserAvatarUrl}
                  onConversationRead={loadConversations}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <FaComments className="text-6xl mx-auto mb-4 opacity-50" />
                    <p className="text-lg">
                      {t("messaging.selectConversation")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default MessagingPage;
