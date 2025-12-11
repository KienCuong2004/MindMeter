import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";
import { FaHeart, FaEye, FaShare, FaLock, FaArrowLeft } from "react-icons/fa";
import successStoryService from "../services/successStoryService";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import logger from "../utils/logger";

const SuccessStoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const storedUser = localStorage.getItem("user");
        let userData = {};
        if (storedUser && storedUser !== "undefined") {
          userData = JSON.parse(storedUser);
        }
        setUser({
          email: decoded.sub,
          id: decoded.id || decoded.userId || userData.id,
          role: decoded.role,
        });
      } catch (e) {
        // Handle error
      }
    }
    loadStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadStory = async () => {
    try {
      setLoading(true);
      const storyData = await successStoryService.getStoryById(id);
      setStory(storyData);
    } catch (err) {
      setError(err.message || t("successStories.errorLoadingStory"));
      logger.error("Error loading story:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await successStoryService.toggleLikeStory(id);
      loadStory();
    } catch (err) {
      logger.error("Error toggling like:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200">
              {error || t("successStories.storyNotFound")}
            </p>
            <button
              onClick={() => navigate("/success-stories")}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              {t("successStories.backToStories")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <DashboardHeader
        logoIcon={<FaHeart />}
        logoText={t("successStories.title")}
        user={user}
        theme={theme}
        setTheme={setTheme}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/home");
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <button
          onClick={() => navigate("/success-stories")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 mb-6"
        >
          <FaArrowLeft />
          {t("successStories.backToStories")}
        </button>

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {story.isAnonymous ? (
              <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <FaLock className="text-gray-600 dark:text-gray-300" />
              </div>
            ) : (
              <img
                src={story.authorAvatar || "/default-avatar.png"}
                alt={story.authorName}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {story.isAnonymous
                  ? t("successStories.anonymous")
                  : story.authorName}
              </p>
              {story.publishedAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(story.publishedAt)}
                </p>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {story.title}
          </h1>

          <div className="mb-4">
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm">
              {t(`successStories.category.${story.category}`)}
            </span>
            {story.tags && (
              <div className="mt-2 flex flex-wrap gap-2">
                {story.tags.split(",").map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {story.content}
            </p>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 ${
                story.isLiked
                  ? "text-red-500"
                  : "text-gray-600 dark:text-gray-400"
              } hover:text-red-500`}
            >
              <FaHeart />
              <span>{story.likeCount || 0}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FaEye />
              <span>{story.viewCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FaShare />
              <span>{story.shareCount || 0}</span>
            </div>
          </div>
        </article>
      </div>

      <FooterSection />
    </div>
  );
};

export default SuccessStoryDetailPage;
