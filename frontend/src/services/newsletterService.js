import { authFetch } from "../authFetch";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

class NewsletterService {
  /**
   * Subscribe to newsletter
   */
  static async subscribe(email, firstName = "", lastName = "") {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/newsletter/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to subscribe");
      }

      return await response.json();
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from newsletter
   */
  static async unsubscribe(email) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unsubscribe");
      }

      return await response.json();
    } catch (error) {
      console.error("Newsletter unsubscription error:", error);
      throw error;
    }
  }

  /**
   * Verify subscription token
   */
  static async verify(token) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/newsletter/verify?token=${encodeURIComponent(
          token
        )}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Verification failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Newsletter verification error:", error);
      throw error;
    }
  }
}

export default NewsletterService;
