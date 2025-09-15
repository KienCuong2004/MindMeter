import { authFetch } from "../authFetch";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

class BlogService {
  // Blog Posts
  async getAllPosts(page = 0, size = 10) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/blog/posts?page=${page}&size=${size}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }

  async getPostBySlug(slug) {
    const response = await authFetch(`${API_BASE_URL}/api/blog/posts/${slug}`);
    return response.json();
  }

  async getPostById(id) {
    const response = await authFetch(`${API_BASE_URL}/api/blog/posts/id/${id}`);
    return response.json();
  }

  // Public version for unauthenticated users
  async getPostByIdPublic(id) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/blog/posts/id/${id}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching post:", error);
      throw error;
    }
  }

  async searchPosts(keyword, page = 0, size = 10) {
    const response = await authFetch(
      `${API_BASE_URL}/api/blog/posts/search?keyword=${keyword}&page=${page}&size=${size}`
    );
    return response.json();
  }

  async getPostsByCategory(categoryId, page = 0, size = 10) {
    const response = await authFetch(
      `${API_BASE_URL}/api/blog/posts/category/${categoryId}?page=${page}&size=${size}`
    );
    return response.json();
  }

  async getPostsByTag(tagId, page = 0, size = 10) {
    const response = await authFetch(
      `${API_BASE_URL}/api/blog/posts/tag/${tagId}?page=${page}&size=${size}`
    );
    return response.json();
  }

  async createPost(postData) {
    const response = await authFetch(`${API_BASE_URL}/api/blog/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    return response.json();
  }

  async updatePost(id, postData) {
    const response = await authFetch(`${API_BASE_URL}/api/blog/posts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    return response.json();
  }

  async deletePost(id) {
    const response = await authFetch(`${API_BASE_URL}/api/blog/posts/${id}`, {
      method: "DELETE",
    });
    return response.json();
  }

  // Likes
  async toggleLike(postId) {
    const response = await authFetch(
      `${API_BASE_URL}/api/blog/posts/${postId}/like`,
      {
        method: "POST",
      }
    );
    return response.json();
  }

  async isLiked(postId) {
    const response = await authFetch(
      `${API_BASE_URL}/api/blog/posts/${postId}/like`
    );
    return response.json();
  }

  // Comments
  async createComment(postId, commentData) {
    const response = await authFetch(
      `${API_BASE_URL}/api/blog/posts/${postId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commentData),
      }
    );
    return response.json();
  }

  async getComments(postId, page = 0, size = 10) {
    const response = await authFetch(
      `${API_BASE_URL}/api/blog/posts/${postId}/comments?page=${page}&size=${size}`
    );
    return response.json();
  }

  // Shares
  async createShare(postId, shareData) {
    const response = await authFetch(
      `${API_BASE_URL}/api/blog/posts/${postId}/share`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shareData),
      }
    );
    return response.json();
  }

  // Bookmarks
  async toggleBookmark(postId) {
    const response = await authFetch(
      `${API_BASE_URL}/api/blog/posts/${postId}/bookmark`,
      {
        method: "POST",
      }
    );
    return response.json();
  }

  // Views
  async recordView(postId) {
    const response = await authFetch(
      `${API_BASE_URL}/api/blog/posts/${postId}/view/simple`,
      {
        method: "POST",
      }
    );
    return response.json();
  }

  // Categories
  async getAllCategories() {
    const response = await authFetch(`${API_BASE_URL}/api/blog/categories`);
    return response.json();
  }

  // Tags
  async getAllTags() {
    const response = await authFetch(`${API_BASE_URL}/api/blog/tags`);
    return response.json();
  }

  // Admin APIs
  async getPendingPosts(page = 0, size = 10) {
    const response = await authFetch(
      `${API_BASE_URL}/api/admin/blog/posts/pending?page=${page}&size=${size}`
    );
    return response.json();
  }

  async approvePost(id) {
    const response = await authFetch(
      `${API_BASE_URL}/api/admin/blog/posts/${id}/approve`
    );
    return response.json();
  }

  async rejectPost(id, reason) {
    const response = await authFetch(
      `${API_BASE_URL}/api/admin/blog/posts/${id}/reject?reason=${reason}`
    );
    return response.json();
  }

  async publishPost(id) {
    const response = await authFetch(
      `${API_BASE_URL}/api/admin/blog/posts/${id}/publish`
    );
    return response.json();
  }

  async unpublishPost(id) {
    const response = await authFetch(
      `${API_BASE_URL}/api/admin/blog/posts/${id}/unpublish`
    );
    return response.json();
  }

  async getPendingComments(page = 0, size = 10) {
    const response = await authFetch(
      `${API_BASE_URL}/api/admin/blog/comments/pending?page=${page}&size=${size}`
    );
    return response.json();
  }

  async approveComment(id) {
    const response = await authFetch(
      `${API_BASE_URL}/api/admin/blog/comments/${id}/approve`
    );
    return response.json();
  }

  async rejectComment(id, reason) {
    const response = await authFetch(
      `${API_BASE_URL}/api/admin/blog/comments/${id}/reject?reason=${reason}`
    );
    return response.json();
  }

  async getBlogStats() {
    const response = await authFetch(`${API_BASE_URL}/api/admin/blog/stats`);
    return response.json();
  }
}

const blogService = new BlogService();
export default blogService;
