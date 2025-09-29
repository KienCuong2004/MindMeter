import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080/api";

class BlogService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/blog`,
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
        }
        return Promise.reject(error);
      }
    );
  }

  // Get all blog posts with pagination and filters
  async getPosts(params = {}) {
    try {
      const response = await this.api.get("/posts", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      throw error;
    }
  }

  // Alias for getPosts to maintain compatibility
  async getAllPosts(page = 0, size = 10) {
    return this.getPosts({ page, size });
  }

  // Get all categories
  async getAllCategories() {
    try {
      const response = await this.api.get("/categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  // Get all tags
  async getAllTags() {
    try {
      const response = await this.api.get("/tags");
      return response.data;
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
  }

  // Search posts with pagination
  async searchPosts(query, page = 0, size = 10) {
    try {
      const response = await this.api.get("/search", {
        params: { q: query, page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching posts:", error);
      throw error;
    }
  }

  // Get posts by category with pagination
  async getPostsByCategory(categoryId, page = 0, size = 10) {
    try {
      const response = await this.api.get(`/categories/${categoryId}/posts`, {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching posts by category:", error);
      throw error;
    }
  }

  // Get posts by tag with pagination
  async getPostsByTag(tagId, page = 0, size = 10) {
    try {
      const response = await this.api.get(`/tags/${tagId}/posts`, {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching posts by tag:", error);
      throw error;
    }
  }

  // Create share record
  async createShare(postId, shareData) {
    try {
      const response = await this.api.post(
        `/posts/${postId}/shares`,
        shareData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating share:", error);
      throw error;
    }
  }

  // Get a single blog post by ID
  async getPost(id) {
    try {
      const response = await this.api.get(`/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching blog post:", error);
      throw error;
    }
  }

  // Create a new blog post
  async createPost(postData) {
    try {
      const formData = new FormData();

      // Append text fields
      formData.append("title", postData.title);
      formData.append("content", postData.content);
      formData.append("excerpt", postData.excerpt || "");
      formData.append("category", postData.category);
      formData.append("status", postData.status);
      formData.append("tags", JSON.stringify(postData.tags));

      // Append image file if exists
      if (postData.featuredImage && postData.featuredImage instanceof File) {
        formData.append("featuredImage", postData.featuredImage);
      }

      const response = await this.api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error creating blog post:", error);
      throw error;
    }
  }

  // Update an existing blog post
  async updatePost(id, postData) {
    try {
      const formData = new FormData();

      // Append text fields
      formData.append("title", postData.title);
      formData.append("content", postData.content);
      formData.append("excerpt", postData.excerpt || "");
      formData.append("category", postData.category);
      formData.append("status", postData.status);
      formData.append("tags", JSON.stringify(postData.tags));

      // Append image file if exists and is a new file
      if (postData.featuredImage && postData.featuredImage instanceof File) {
        formData.append("featuredImage", postData.featuredImage);
      }

      const response = await this.api.put(`/posts/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error updating blog post:", error);
      throw error;
    }
  }

  // Delete a blog post
  async deletePost(id) {
    try {
      const response = await this.api.delete(`/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting blog post:", error);
      throw error;
    }
  }

  // Get user's saved posts
  async getSavedPosts(params = {}) {
    try {
      const response = await this.api.get("/saved", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      throw error;
    }
  }

  // Save/unsave a post
  async toggleSavePost(postId) {
    try {
      const response = await this.api.post(`/posts/${postId}/save`);
      return response.data;
    } catch (error) {
      console.error("Error toggling save post:", error);
      throw error;
    }
  }

  // Like/unlike a post
  async toggleLikePost(postId) {
    try {
      const response = await this.api.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error("Error toggling like post:", error);
      throw error;
    }
  }

  // Get post comments
  async getPostComments(postId, params = {}) {
    try {
      const response = await this.api.get(`/posts/${postId}/comments`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching post comments:", error);
      throw error;
    }
  }

  // Add a comment to a post
  async addComment(postId, commentData) {
    try {
      const response = await this.api.post(
        `/posts/${postId}/comments`,
        commentData
      );
      return response.data;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  // Get categories
  async getCategories() {
    try {
      const response = await this.api.get("/categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  // Get popular tags
  async getPopularTags(limit = 20) {
    try {
      const response = await this.api.get("/tags/popular", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching popular tags:", error);
      throw error;
    }
  }

  // Get user's posts (for authenticated users)
  async getUserPosts(userId = null, params = {}) {
    try {
      const url = userId ? `/users/${userId}/posts` : "/my-posts";
      const response = await this.api.get(url, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching user posts:", error);
      throw error;
    }
  }

  // Admin methods
  async updatePostStatus(postId, status, rejectionReason = null) {
    try {
      const data = { status };
      if (rejectionReason) {
        data.rejectionReason = rejectionReason;
      }
      const response = await this.api.put(`/posts/${postId}/status`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating post status:", error);
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      const response = await this.api.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }
}

export default new BlogService();
