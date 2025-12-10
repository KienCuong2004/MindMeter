import { authFetch } from "../authFetch";
import websocketService from "./websocketService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

class MessagingService {
  /**
   * Send a message
   */
  static async sendMessage(receiverId, message, messageType = "GENERAL") {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/messaging/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId,
          message,
          messageType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      return await response.json();
    } catch (error) {
      console.error("Send message error:", error);
      throw error;
    }
  }

  /**
   * Get conversation between current user and another user
   */
  static async getConversation(otherUserId) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/messaging/conversation/${otherUserId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get conversation");
      }

      return await response.json();
    } catch (error) {
      console.error("Get conversation error:", error);
      throw error;
    }
  }

  /**
   * Get all conversations for current user
   */
  static async getConversations() {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/messaging/conversations`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get conversations");
      }

      return await response.json();
    } catch (error) {
      console.error("Get conversations error:", error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/messaging/message/${messageId}/read`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark as read");
      }

      return true;
    } catch (error) {
      console.error("Mark as read error:", error);
      throw error;
    }
  }

  /**
   * Mark conversation as read
   */
  static async markConversationAsRead(otherUserId) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/messaging/conversation/${otherUserId}/read`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark conversation as read");
      }

      return true;
    } catch (error) {
      console.error("Mark conversation as read error:", error);
      throw error;
    }
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount() {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/messaging/unread/count`
      );

      // Handle rate limit gracefully - return 0 instead of throwing
      if (response.status === 429) {
        return 0;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get unread count");
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      // Only log if not a rate limit error
      if (error.message && !error.message.includes("Rate limit")) {
        console.error("Get unread count error:", error);
      }
      return 0;
    }
  }

  /**
   * Subscribe to real-time messages via WebSocket
   */
  static subscribeToMessages(callback) {
    return websocketService.subscribe("/queue/messages", callback);
  }

  /**
   * Subscribe to message sent confirmation
   */
  static subscribeToMessageSent(callback) {
    return websocketService.subscribe("/queue/message-sent", callback);
  }

  /**
   * Subscribe to message read notifications
   */
  static subscribeToMessageRead(callback) {
    return websocketService.subscribe("/queue/message-read", callback);
  }
}

export default MessagingService;
