import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaPaperPlane, FaUser, FaCheck, FaCheckDouble } from "react-icons/fa";
import MessagingService from "../services/messagingService";

const MessagingComponent = ({
  otherUserId,
  otherUserName,
  otherUserAvatarUrl,
  onConversationRead,
}) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = (immediate = false) => {
    if (messagesContainerRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          // Scroll to bottom immediately or smoothly
          if (immediate) {
            container.scrollTop = container.scrollHeight;
          } else {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "smooth",
            });
          }
        }
      }, 100);
    }
  };

  const loadConversation = useCallback(async () => {
    if (!otherUserId) return;

    setLoading(true);
    try {
      const conversation = await MessagingService.getConversation(otherUserId);
      setMessages(conversation || []);

      // Mark conversation as read
      if (conversation && conversation.length > 0) {
        await MessagingService.markConversationAsRead(otherUserId);
        // Notify parent to refresh conversation list
        if (onConversationRead) {
          onConversationRead();
        }
      }

      // Scroll to bottom after loading conversation (immediate scroll)
      scrollToBottom(true);
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setLoading(false);
      // Ensure scroll after loading completes
      scrollToBottom(true);
    }
  }, [otherUserId, onConversationRead]);

  // Get current user ID from first message or localStorage
  const getCurrentUserId = () => {
    if (messages.length > 0) {
      // Check if first message senderId or receiverId matches otherUserId
      const firstMessage = messages[0];
      if (firstMessage.senderId === otherUserId) {
        return firstMessage.receiverId;
      } else if (firstMessage.receiverId === otherUserId) {
        return firstMessage.senderId;
      }
    }
    // Fallback: try to get from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return user.id || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const actualCurrentUserId = getCurrentUserId();

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    // Scroll to bottom when messages change (for new messages)
    if (messages.length > 0) {
      scrollToBottom(false); // Smooth scroll for new messages
    }
  }, [messages]);

  // Scroll to bottom when otherUserId changes (when selecting a new conversation)
  useEffect(() => {
    if (otherUserId && !loading) {
      scrollToBottom(true); // Immediate scroll when switching conversations
    }
  }, [otherUserId, loading]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!actualCurrentUserId) return;

    const messageSubscription = MessagingService.subscribeToMessages(
      (message) => {
        if (
          (message.senderId === otherUserId &&
            message.receiverId === actualCurrentUserId) ||
          (message.senderId === actualCurrentUserId &&
            message.receiverId === otherUserId)
        ) {
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((m) => m.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });

          // Mark as read if it's for current user
          if (message.receiverId === actualCurrentUserId) {
            MessagingService.markAsRead(message.id);
          }
        }
      }
    );

    return () => {
      if (messageSubscription) {
        messageSubscription.unsubscribe();
      }
    };
  }, [otherUserId, actualCurrentUserId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId || sending) return;

    setSending(true);
    try {
      const sentMessage = await MessagingService.sendMessage(
        otherUserId,
        newMessage.trim(),
        "GENERAL"
      );

      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert(t("messaging.sendError") || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Format timestamp header (phía trên tin nhắn)
  // - Nếu trong tuần: "Thứ, ngày/tháng/năm" (ví dụ: "T.5, 12/5/2025" hoặc "Thu, 12/5/2025")
  // - Nếu khác tuần: chỉ "ngày/tháng/năm" (ví dụ: "12/5/2025")
  const formatMessageHeaderTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    // Kiểm tra xem có trong tuần này không (từ Chủ nhật đầu tuần)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Chủ nhật đầu tuần
    startOfWeek.setHours(0, 0, 0, 0);

    const isInCurrentWeek = date >= startOfWeek;

    // Format ngày tháng năm
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    if (i18n.language === "vi") {
      if (isInCurrentWeek) {
        // Trong tuần: hiển thị thứ + ngày tháng năm
        const dayOfWeek = date.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
        const dayNames = ["CN", "T.2", "T.3", "T.4", "T.5", "T.6", "T.7"];
        return `${dayNames[dayOfWeek]}, ${dateStr}`;
      } else {
        // Khác tuần: chỉ hiển thị ngày tháng năm
        return dateStr;
      }
    } else {
      if (isInCurrentWeek) {
        // Trong tuần: hiển thị thứ + ngày tháng năm
        const dayOfWeek = date.getDay();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return `${dayNames[dayOfWeek]}, ${dateStr}`;
      } else {
        // Khác tuần: chỉ hiển thị ngày tháng năm
        return dateStr;
      }
    }
  };

  // Format giờ:phút để hiển thị trong message bubble
  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Kiểm tra xem có cần hiển thị timestamp header không
  const shouldShowTimestamp = (currentMessage, previousMessage) => {
    if (!previousMessage) return true; // Hiển thị timestamp cho message đầu tiên

    const currentDate = new Date(currentMessage.sentAt);
    const previousDate = new Date(previousMessage.sentAt);

    // Hiển thị timestamp nếu:
    // 1. Khác ngày
    // 2. Cách nhau hơn 5 phút
    const timeDiff = Math.abs(currentDate - previousDate);
    const fiveMinutes = 5 * 60 * 1000;

    return (
      currentDate.toDateString() !== previousDate.toDateString() ||
      timeDiff > fiveMinutes
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center overflow-hidden relative">
            {otherUserAvatarUrl && otherUserAvatarUrl.trim() !== "" ? (
              <>
                <img
                  src={
                    otherUserAvatarUrl.startsWith("http") ||
                    otherUserAvatarUrl.startsWith("//")
                      ? otherUserAvatarUrl
                      : `${
                          process.env.REACT_APP_API_URL ||
                          "http://localhost:8080"
                        }${
                          otherUserAvatarUrl.startsWith("/")
                            ? otherUserAvatarUrl
                            : `/${otherUserAvatarUrl}`
                        }`
                  }
                  alt={otherUserName || "User"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = "flex";
                    }
                  }}
                />
                <div
                  className="w-full h-full bg-indigo-500 flex items-center justify-center absolute inset-0"
                  style={{ display: "none" }}
                >
                  <FaUser className="text-white text-sm" />
                </div>
              </>
            ) : (
              <FaUser className="text-white text-sm" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {otherUserName || t("messaging.user")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("messaging.online")}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>{t("messaging.noMessages")}</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === actualCurrentUserId;
            // Avatar should always be the sender's avatar (the person who sent this message)
            const avatarUrl = message.senderAvatarUrl;
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showTimestamp = shouldShowTimestamp(message, previousMessage);

            return (
              <div key={message.id} className="space-y-1">
                {/* Timestamp header - hiển thị phía trên message */}
                {showTimestamp && (
                  <div className="flex justify-center my-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                      {formatMessageHeaderTime(message.sentAt)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex items-end gap-2 ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                      {avatarUrl && avatarUrl.trim() !== "" ? (
                        <>
                          <img
                            src={
                              avatarUrl.startsWith("http") ||
                              avatarUrl.startsWith("//")
                                ? avatarUrl
                                : `${
                                    process.env.REACT_APP_API_URL ||
                                    "http://localhost:8080"
                                  }${
                                    avatarUrl.startsWith("/")
                                      ? avatarUrl
                                      : `/${avatarUrl}`
                                  }`
                            }
                            alt={message.senderName || otherUserName || "User"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = "flex";
                              }
                            }}
                          />
                          <div
                            className="w-full h-full bg-indigo-500 flex items-center justify-center absolute inset-0"
                            style={{ display: "none" }}
                          >
                            <FaUser className="text-white text-xs" />
                          </div>
                        </>
                      ) : (
                        <FaUser className="text-white text-xs" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {/* Hiển thị giờ:phút trong message bubble */}
                      <span
                        className={`text-xs ${
                          isOwnMessage
                            ? "text-indigo-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {formatMessageTime(message.sentAt)}
                      </span>
                      {/* Chỉ hiển thị read status cho tin nhắn của mình */}
                      {isOwnMessage && (
                        <span className="text-xs">
                          {message.isRead ? (
                            <FaCheckDouble className="text-indigo-200" />
                          ) : (
                            <FaCheck className="text-indigo-200" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwnMessage && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                      {avatarUrl && avatarUrl.trim() !== "" ? (
                        <>
                          <img
                            src={
                              avatarUrl.startsWith("http") ||
                              avatarUrl.startsWith("//")
                                ? avatarUrl
                                : `${
                                    process.env.REACT_APP_API_URL ||
                                    "http://localhost:8080"
                                  }${
                                    avatarUrl.startsWith("/")
                                      ? avatarUrl
                                      : `/${avatarUrl}`
                                  }`
                            }
                            alt={message.senderName || otherUserName || "User"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = "flex";
                              }
                            }}
                          />
                          <div
                            className="w-full h-full bg-indigo-500 flex items-center justify-center absolute inset-0"
                            style={{ display: "none" }}
                          >
                            <FaUser className="text-white text-xs" />
                          </div>
                        </>
                      ) : (
                        <FaUser className="text-white text-xs" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="px-4 py-3 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t("messaging.typeMessage")}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <FaPaperPlane />
                <span className="hidden sm:inline">{t("messaging.send")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessagingComponent;
