import { authFetch } from "../authFetch";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

class PushNotificationService {
  /**
   * Request notification permission
   */
  static async requestPermission() {
    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications");
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      throw new Error("Notification permission denied");
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  /**
   * Register push notification subscription
   */
  static async registerSubscription(subscription) {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/push-notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to register subscription");
      }

      return await response.json();
    } catch (error) {
      console.error("Register push subscription error:", error);
      throw error;
    }
  }

  /**
   * Unregister push notification subscription
   */
  static async unregisterSubscription() {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/push-notifications/unsubscribe`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unregister subscription");
      }

      return await response.json();
    } catch (error) {
      console.error("Unregister push subscription error:", error);
      throw error;
    }
  }

  /**
   * Check if service worker is supported
   */
  static isServiceWorkerSupported() {
    return "serviceWorker" in navigator;
  }

  /**
   * Register service worker
   */
  static async registerServiceWorker() {
    if (!this.isServiceWorkerSupported()) {
      throw new Error("Service workers are not supported");
    }

    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  }

  /**
   * Get push subscription from service worker
   */
  static async getPushSubscription() {
    if (!this.isServiceWorkerSupported()) {
      throw new Error("Service workers are not supported");
    }

    const registration = await navigator.serviceWorker.ready;
    
    if (!registration.pushManager) {
      throw new Error("Push messaging is not supported");
    }

    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ""
        ),
      });
    }

    return subscription;
  }

  /**
   * Convert VAPID key from base64 URL to Uint8Array
   */
  static urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Show browser notification
   */
  static showNotification(title, options = {}) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        ...options,
      });
    }
  }
}

export default PushNotificationService;

