import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaEye, FaLock, FaPlus } from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import successStoryService from "../services/successStoryService";
import { useTheme } from "../hooks/useTheme";
import { jwtDecode } from "jwt-decode";
import { getCurrentUser, getCurrentToken } from "../services/anonymousService";

const SuccessStoriesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentToken = getCurrentToken();

    if (currentUser) {
      setUser({
        ...currentUser,
        id: currentUser.id || currentUser.userId,
      });
    } else if (currentToken) {
      try {
        const decoded = jwtDecode(currentToken);
        const storedUser = localStorage.getItem("user");
        let userData = {};
        if (storedUser && storedUser !== "undefined") {
          userData = JSON.parse(storedUser);
        }
        setUser({
          email: decoded.sub || decoded.email || "",
          id: decoded.id || decoded.userId || userData.id,
          role: decoded.role,
          firstName: decoded.firstName || userData.firstName || "",
          lastName: decoded.lastName || userData.lastName || "",
          avatarUrl:
            decoded.avatarUrl || userData.avatarUrl || userData.avatar || null,
          avatarTimestamp: userData.avatarTimestamp || null,
          plan: decoded.plan || userData.plan || "FREE",
          phone: decoded.phone || userData.phone || "",
          anonymous: decoded.anonymous || userData.anonymous || false,
        });
      } catch (e) {
        // Handle error
      }
    }
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const response = await successStoryService.getStories({
        page: 0,
        size: 20,
      });
      setStories(response.content || []);
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (storyId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await successStoryService.toggleLikeStory(storyId);
      setStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? {
                ...story,
                isLiked: !story.isLiked,
                likeCount: story.isLiked
                  ? story.likeCount - 1
                  : story.likeCount + 1,
              }
            : story
        )
      );
    } catch (err) {
      // Handle error
    }
  };

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

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t("successStories.title")}
          </h1>
          {user && (
            <button
              onClick={() => navigate("/success-stories/create")}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              {t("successStories.shareStory")}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/success-stories/${story.id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  {story.isAnonymous ? (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <FaLock className="text-gray-600 dark:text-gray-300" />
                    </div>
                  ) : (
                    <img
                      src={story.authorAvatar || "/default-avatar.png"}
                      alt={story.authorName}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {story.isAnonymous
                        ? t("successStories.anonymous")
                        : story.authorName}
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {story.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {story.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(story.id);
                      }}
                      className={`flex items-center gap-2 hover:text-red-500 ${
                        story.isLiked ? "text-red-500" : ""
                      }`}
                    >
                      <FaHeart />
                      <span>{story.likeCount || 0}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <FaEye />
                      <span>{story.viewCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FooterSection />
    </div>
  );
};

export default SuccessStoriesPage;
