import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useTheme as useCustomTheme } from "../hooks/useTheme";
import { jwtDecode } from "jwt-decode";
import BlogForm from "../components/blog/BlogForm";
import blogService from "../services/blogService";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";

const CreatePostPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { theme: themeMode, setTheme } = useCustomTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Decode user from JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError("");
      console.log("Creating post:", formData);

      // Call API to create post
      const response = await blogService.createPost(formData);
      console.log("Post created successfully:", response);

      setSuccess(t("blog.createPostForm.success.pending"));

      // Redirect to blog page after successful creation
      setTimeout(() => {
        navigate("/blog");
      }, 2000);
    } catch (error) {
      console.error("Error creating post:", error);
      setError(t("blog.createPostForm.error.publishFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/blog");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-blue-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <DashboardHeader
        logoIcon="✍️"
        logoText="Create Post"
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
                {t("blog.createPostForm.title")}
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t("blog.createPostForm.subtitle")}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <BlogForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              error={error}
              success={success}
            />
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default CreatePostPage;
