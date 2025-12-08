import axios from "axios";
import logger from "../utils/logger";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

class PeerMatchingService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/peer-matching`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  async getUserMatches(userId, status = null, params = {}) {
    try {
      const queryParams = { ...params };
      if (status) queryParams.status = status;
      const response = await this.api.get(`/users/${userId}/matches`, { params: queryParams });
      return response.data;
    } catch (error) {
      logger.error("Error fetching user matches:", error);
      throw error;
    }
  }

  async getActiveMatches(userId) {
    try {
      const response = await this.api.get(`/users/${userId}/matches/active`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching active matches:", error);
      throw error;
    }
  }

  async getPendingMatches(userId) {
    try {
      const response = await this.api.get(`/users/${userId}/matches/pending`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching pending matches:", error);
      throw error;
    }
  }

  async getPreferences(userId) {
    try {
      const response = await this.api.get(`/users/${userId}/preferences`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching preferences:", error);
      throw error;
    }
  }

  async savePreferences(userId, preferences) {
    try {
      const response = await this.api.put(`/users/${userId}/preferences`, preferences);
      return response.data;
    } catch (error) {
      logger.error("Error saving preferences:", error);
      throw error;
    }
  }

  async createMatch(user1Id, user2Id, matchType = "MANUAL") {
    try {
      const response = await this.api.post("/matches", null, {
        params: { user1Id, user2Id, matchType },
      });
      return response.data;
    } catch (error) {
      logger.error("Error creating match:", error);
      throw error;
    }
  }

  async acceptMatch(matchId) {
    try {
      const response = await this.api.post(`/matches/${matchId}/accept`);
      return response.data;
    } catch (error) {
      logger.error("Error accepting match:", error);
      throw error;
    }
  }

  async rejectMatch(matchId) {
    try {
      const response = await this.api.post(`/matches/${matchId}/reject`);
      return response.data;
    } catch (error) {
      logger.error("Error rejecting match:", error);
      throw error;
    }
  }

  async endMatch(matchId) {
    try {
      const response = await this.api.post(`/matches/${matchId}/end`);
      return response.data;
    } catch (error) {
      logger.error("Error ending match:", error);
      throw error;
    }
  }

  async findPotentialMatches(userId) {
    try {
      const response = await this.api.get(`/users/${userId}/potential-matches`);
      return response.data;
    } catch (error) {
      logger.error("Error finding potential matches:", error);
      throw error;
    }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new PeerMatchingService();

