import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import logger from "../utils/logger";

// Get API URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.connected || this.stompClient?.connected) return;

    // Sử dụng Client class thay vì Stomp.over()
    // Sử dụng API_BASE_URL để kết nối đến backend
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
      // Debug logging disabled
      },
      onConnect: (frame) => {
        this.connected = true;
        this.reconnectAttempts = 0;

        // Re-subscribe to all previous subscriptions
        this.subscriptions.forEach((callback, topic) => {
          this.subscribe(topic, callback);
        });

        // Notify connection listeners
        this.onConnectionChange?.(true);
      },
      onStompError: (frame) => {
        logger.error("WebSocket STOMP error:", frame);
        this.connected = false;
        this.onConnectionChange?.(false);
        this.handleReconnect();
      },
      onWebSocketClose: (event) => {
        logger.warn("WebSocket closed:", event);
        this.connected = false;
        this.onConnectionChange?.(false);
        if (!event.wasClean) {
          this.handleReconnect();
        }
      },
      onWebSocketError: (error) => {
        logger.error("WebSocket connection error:", error);
        this.connected = false;
        this.onConnectionChange?.(false);
        this.handleReconnect();
      },
    });

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
        this.connected = false;
        this.onConnectionChange?.(false);
    }
  }

  subscribe(topic, callback) {
    if (!this.connected || !this.stompClient?.connected) {
      // Store subscription for later when connected
      this.subscriptions.set(topic, callback);
      return null;
    }

    try {
    const subscription = this.stompClient.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        logger.error("Error parsing WebSocket message:", error);
      }
    });

    // Store subscription for reconnection
    this.subscriptions.set(topic, callback);
    return subscription;
    } catch (error) {
      logger.error("Error subscribing to topic:", error);
      // Store subscription for later retry
      this.subscriptions.set(topic, callback);
      return null;
    }
  }

  unsubscribe(topic) {
    this.subscriptions.delete(topic);
    // Note: STOMP doesn't provide easy way to unsubscribe by topic
    // This is a limitation we'll work with
  }

  send(destination, message) {
    if (this.connected && this.stompClient?.connected) {
      try {
        this.stompClient.publish({
          destination: destination,
          body: JSON.stringify(message),
        });
      } catch (error) {
        logger.error("Error sending WebSocket message:", error);
      }
    } else {
      logger.warn("WebSocket not connected. Cannot send message.");
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      logger.error(
        "Max reconnection attempts reached. Please refresh the page."
      );
    }
  }

  setConnectionChangeCallback(callback) {
    this.onConnectionChange = callback;
  }

  isConnected() {
    return this.connected && this.stompClient?.connected;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
