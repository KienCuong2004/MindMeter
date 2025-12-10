import axios from "axios";
import logger from "../utils/logger";
import { retryWithBackoff } from "../utils/retryWithBackoff";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

class SupportGroupService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/support-groups`,
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
        } else if (error.response?.status === 429) {
          logger.warn("Rate limit exceeded");
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper method to wrap API calls with retry logic
  async _requestWithRetry(requestFn) {
    return retryWithBackoff(requestFn, {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
    });
  }

  async getGroups(params = {}) {
    try {
      const response = await this.api.get("", { params });
      return response.data;
    } catch (error) {
      logger.error("Error fetching support groups:", error);
      throw error;
    }
  }

  async getGroupById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching support group:", error);
      throw error;
    }
  }

  async getUserGroups(userId, params = {}) {
    try {
      const response = await this.api.get(`/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      logger.error("Error fetching user groups:", error);
      throw error;
    }
  }

  async createGroup(groupData) {
    try {
      const response = await this.api.post("/", groupData);
      return response.data;
    } catch (error) {
      logger.error("Error creating support group:", error);
      throw error;
    }
  }

  async updateGroup(id, groupData) {
    try {
      const response = await this.api.put(`/${id}`, groupData);
      return response.data;
    } catch (error) {
      logger.error("Error updating support group:", error);
      throw error;
    }
  }

  async deleteGroup(id) {
    try {
      await this.api.delete(`/${id}`);
    } catch (error) {
      logger.error("Error deleting support group:", error);
      throw error;
    }
  }

  async joinGroup(id) {
    try {
      await this.api.post(`/${id}/join`);
    } catch (error) {
      logger.error("Error joining group:", error);
      throw error;
    }
  }

  async leaveGroup(id) {
    try {
      await this.api.post(`/${id}/leave`);
    } catch (error) {
      logger.error("Error leaving group:", error);
      throw error;
    }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new SupportGroupService();
