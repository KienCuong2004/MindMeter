import axios from "axios";
import logger from "../utils/logger";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

class SuccessStoryService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/success-stories`,
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
          logger.warn("Rate limit exceeded, retrying after delay...");
        }
        return Promise.reject(error);
      }
    );
  }

  async getStories(params = {}) {
    try {
      const response = await this.api.get("", { params });
      return response.data;
    } catch (error) {
      logger.error("Error fetching success stories:", error);
      throw error;
    }
  }

  async getStoryById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching success story:", error);
      throw error;
    }
  }

  async createStory(storyData) {
    try {
      const response = await this.api.post("/", storyData);
      return response.data;
    } catch (error) {
      logger.error("Error creating success story:", error);
      throw error;
    }
  }

  async toggleLikeStory(storyId) {
    try {
      await this.api.post(`/${storyId}/like`);
    } catch (error) {
      logger.error("Error toggling like:", error);
      throw error;
    }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new SuccessStoryService();
