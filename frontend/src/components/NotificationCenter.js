import React, { useState, useEffect } from "react";
import {
  FaBell,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import websocketService from "../services/websocketService";

const NotificationCenter = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isOpen || !user) return;

    // Connect to WebSocket
    websocketService.connect();

    // Subscribe to notifications
    const notificationSubscription = websocketService.subscribe(
      "/topic/notifications",
      (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    );

    // Subscribe to severe alerts
    const severeAlertSubscription = websocketService.subscribe(
      "/topic/severe-alerts",
      (alert) => {
        setNotifications((prev) => [alert, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show browser notification for severe alerts
        if (Notification.permission === "granted") {
          new Notification(alert.title, {
            body: alert.message,
            icon: "/favicon.ico",
            tag: "severe-alert",
          });
        }
      }
    );

    // Subscribe to appointments
    const appointmentSubscription = websocketService.subscribe(
      "/topic/appointments",
      (appointment) => {
        setNotifications((prev) => [appointment, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    );

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      if (notificationSubscription) notificationSubscription.unsubscribe();
      if (severeAlertSubscription) severeAlertSubscription.unsubscribe();
      if (appointmentSubscription) appointmentSubscription.unsubscribe();
    };
  }, [isOpen, user]);

  const markAsRead = (index) => {
    setNotifications((prev) =>
      prev.map((notif, i) => (i === index ? { ...notif, read: true } : notif))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type, severity) => {
    switch (type) {
      case "SEVERE_ALERT":
        return <FaExclamationTriangle className="text-red-500" />;
      case "TEST_RESULT":
        if (severity === "SEVERE")
          return <FaExclamationTriangle className="text-red-500" />;
        if (severity === "MODERATE")
          return <FaInfoCircle className="text-yellow-500" />;
        return <FaCheckCircle className="text-green-500" />;
      case "APPOINTMENT":
        return <FaClock className="text-blue-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type, severity) => {
    switch (type) {
      case "SEVERE_ALERT":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "TEST_RESULT":
        if (severity === "SEVERE")
          return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
        if (severity === "MODERATE")
          return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "APPOINTMENT":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      default:
        return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Vừa xong";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FaBell className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("notifications.title")}
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              {t("notifications.markAllRead")}
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {t("notifications.clearAll")}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <FaBell className="text-4xl mb-2" />
              <p>{t("notifications.noNotifications")}</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    notification.read ? "opacity-60" : "opacity-100"
                  } ${getNotificationBgColor(
                    notification.type,
                    notification.severity
                  )}`}
                  onClick={() => markAsRead(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(
                        notification.type,
                        notification.severity
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`text-sm font-medium ${
                            notification.read
                              ? "text-gray-500 dark:text-gray-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p
                        className={`text-sm mt-1 ${
                          notification.read
                            ? "text-gray-400 dark:text-gray-500"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {notification.message}
                      </p>
                      {notification.severity && (
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                            notification.severity === "SEVERE"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : notification.severity === "MODERATE"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {notification.severity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
