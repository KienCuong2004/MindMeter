import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme as useCustomTheme } from "../hooks/useTheme";
import { jwtDecode } from "jwt-decode";
import BlogForm from "../components/blog/BlogForm";
import blogService from "../services/blogService";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { FaBrain } from "react-icons/fa";
import logger from "../utils/logger";

const EditPostPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme: themeMode, setTheme } = useCustomTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState("");
  const [postData, setPostData] = useState(null);

  // Decode user from JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
        // Check if user is STUDENT only
        if (decoded.role !== "STUDENT") {
          // User doesn't have permission, redirect to blog page
          navigate("/blog");
          return;
        }
      } catch (error) {
        logger.error("Error decoding token:", error);
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
    } else {
      // No token, redirect to login
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Load post data
  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        setError(
          t("blog.createPostForm.error.postNotFound") || "Post not found"
        );
        setLoadingPost(false);
        return;
      }

      try {
        setLoadingPost(true);
        setError("");
        const post = await blogService.getPostById(id);

        // Check if user is the author (only STUDENT can edit their own posts)
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = jwtDecode(token);
          if (post.authorEmail !== decoded.sub) {
            setError(
              t("blog.createPostForm.error.unauthorized") ||
                "You are not authorized to edit this post"
            );
            setLoadingPost(false);
            setTimeout(() => navigate("/blog"), 2000);
            return;
          }
        }

        setPostData(post);
      } catch (error) {
        logger.error("Error loading post:", error);
        setError(
          error.response?.data?.message ||
            error.message ||
            t("blog.createPostForm.error.loadFailed") ||
            "Failed to load post"
        );
      } finally {
        setLoadingPost(false);
      }
    };

    loadPost();
  }, [id, navigate, t]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError("");
      logger.debug("EditPostPage - Updating post:", formData);

      // Call API to update post
      const response = await blogService.updatePost(id, formData);
      logger.debug("EditPostPage - Post updated successfully:", response);

      // Redirect immediately to blog page with success message in state
      const successMessage =
        t("blog.createPostForm.success.updated") ||
        "Post updated successfully!";
      navigate("/blog", {
        state: { successMessage },
      });
    } catch (error) {
      logger.error("EditPostPage - Error updating post:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("blog.createPostForm.error.updateFailed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/blog");
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <DashboardHeader
          logoIcon={
            <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
          }
          logoText="Edit Post"
          user={user}
          theme={themeMode}
          setTheme={setTheme}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {t("blog.loading") || "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <DashboardHeader
          logoIcon={
            <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
          }
          logoText="Edit Post"
          user={user}
          theme={themeMode}
          setTheme={setTheme}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error ||
                t("blog.createPostForm.error.postNotFound") ||
                "Post not found"}
            </p>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t("common.back") || "Back to Blog"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <DashboardHeader
        logoIcon={
          <FaBrain className="w-8 h-8 text-indigo-500 dark:text-indigo-300 animate-pulse-slow" />
        }
        logoText="Edit Post"
        user={user}
        theme={themeMode}
        setTheme={setTheme}
        onLogout={handleLogout}
      />

      <div className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <button
                onClick={handleCancel}
                className="mr-4 p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
                {t("blog.createPostForm.editTitle") || "Chỉnh sửa Bài Viết"}
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t("blog.createPostForm.editSubtitle") ||
                "Cập nhật thông tin bài viết của bạn"}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <BlogForm
              initialData={postData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default EditPostPage;
