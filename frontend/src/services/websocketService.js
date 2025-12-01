import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import logger from "../utils/logger";

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
    if (this.connected) return;

    const socket = new SockJS("/ws");
    this.stompClient = Stomp.over(socket);

    // Disable debug logs in production
    this.stompClient.debug = (str) => {
      // Debug logging disabled
    };

    this.stompClient.connect(
      {},
      (frame) => {
        this.connected = true;
        this.reconnectAttempts = 0;

        // Re-subscribe to all previous subscriptions
        this.subscriptions.forEach((callback, topic) => {
          this.subscribe(topic, callback);
        });

        // Notify connection listeners
        this.onConnectionChange?.(true);
      },
      (error) => {
        logger.error("WebSocket connection error:", error);
        this.connected = false;
        this.onConnectionChange?.(false);
        this.handleReconnect();
      }
    );
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect(() => {
        this.connected = false;
        this.onConnectionChange?.(false);
      });
    }
  }

  subscribe(topic, callback) {
    if (!this.connected) {
      // Store subscription for later when connected
      this.subscriptions.set(topic, callback);
      return;
    }

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
  }

  unsubscribe(topic) {
    this.subscriptions.delete(topic);
    // Note: STOMP doesn't provide easy way to unsubscribe by topic
    // This is a limitation we'll work with
  }

  send(destination, message) {
    if (this.connected && this.stompClient) {
      this.stompClient.send(destination, {}, JSON.stringify(message));
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
    return this.connected;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
