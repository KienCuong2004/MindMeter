import axios from "axios";
import logger from "../utils/logger";
import { retryWithBackoff } from "../utils/retryWithBackoff";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

class ForumService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/forum`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle common errors
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

  // Get all forum posts
  async getPosts(params = {}) {
    try {
      const response = await this.api.get("/posts", { params });
      return response.data;
    } catch (error) {
      logger.error("Error fetching forum posts:", error);
      throw error;
    }
  }

  // Get post by ID
  async getPostById(id) {
    try {
      const response = await this.api.get(`/posts/${id}`);
      return response.data;
    } catch (error) {
      logger.error("Error fetching forum post:", error);
      throw error;
    }
  }

  // Create new post
  async createPost(postData) {
    try {
      const response = await this.api.post("/posts", postData);
      return response.data;
    } catch (error) {
      logger.error("Error creating forum post:", error);
      throw error;
    }
  }

  // Update post
  async updatePost(id, postData) {
    try {
      const response = await this.api.put(`/posts/${id}`, postData);
      return response.data;
    } catch (error) {
      logger.error("Error updating forum post:", error);
      throw error;
    }
  }

  // Delete post
  async deletePost(id) {
    try {
      await this.api.delete(`/posts/${id}`);
    } catch (error) {
      logger.error("Error deleting forum post:", error);
      throw error;
    }
  }

  // Toggle like post
  async toggleLikePost(postId) {
    try {
      await this.api.post(`/posts/${postId}/like`);
    } catch (error) {
      logger.error("Error toggling like:", error);
      throw error;
    }
  }

  // Get comments for a post
  async getComments(postId, params = {}) {
    try {
      return await this._requestWithRetry(async () => {
        const response = await this.api.get(`/posts/${postId}/comments`, {
          params,
        });
        return response.data;
      });
    } catch (error) {
      // Only log if not a rate limit error (rate limit errors are expected and handled)
      if (error.response?.status !== 429) {
        logger.error("Error fetching comments:", error);
      }
      throw error;
    }
  }

  // Create comment
  async createComment(postId, commentData) {
    try {
      const response = await this.api.post(
        `/posts/${postId}/comments`,
        commentData
      );
      return response.data;
    } catch (error) {
      logger.error("Error creating comment:", error);
      throw error;
    }
  }

  // Toggle like comment
  async toggleLikeComment(commentId) {
    try {
      await this.api.post(`/comments/${commentId}/like`);
    } catch (error) {
      logger.error("Error toggling comment like:", error);
      throw error;
    }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new ForumService();
