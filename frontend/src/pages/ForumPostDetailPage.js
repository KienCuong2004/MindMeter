import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";
import {
  FaHeart,
  FaComment,
  FaEye,
  FaLock,
  FaEdit,
  FaTrash,
  FaArrowLeft,
} from "react-icons/fa";
import forumService from "../services/forumService";
import ForumCommentSection from "../components/ForumCommentSection";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import { getCurrentUser, getCurrentToken } from "../services/anonymousService";
import logger from "../utils/logger";

const ForumPostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentToken = getCurrentToken();

    let userObj = null;

    if (currentUser) {
      userObj = {
        ...currentUser,
        id: currentUser.id || currentUser.userId,
      };
    } else if (currentToken) {
      try {
        const decoded = jwtDecode(currentToken);
        const storedUser = localStorage.getItem("user");
        let userData = {};
        if (storedUser && storedUser !== "undefined") {
          userData = JSON.parse(storedUser);
        }
        userObj = {
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
        };
      } catch (e) {
        // Handle error
      }
    }

    if (userObj) {
      setUser(userObj);
    }

    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const postData = await forumService.getPostById(id);
      setPost(postData);
    } catch (err) {
      setError(err.message || t("forum.errorLoadingPost"));
      logger.error("Error loading post:", err);
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
      await forumService.toggleLikePost(id);
      loadPost();
    } catch (err) {
      logger.error("Error toggling like:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await forumService.deletePost(id);
      navigate("/forum");
    } catch (err) {
      logger.error("Error deleting post:", err);
    }
  };

  const formatDate = (dateString) => {
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

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200">
              {error || t("forum.postNotFound")}
            </p>
            <button
              onClick={() => navigate("/forum")}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              {t("forum.backToForum")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAuthor = user && post.authorId === user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader
        logoIcon={<FaComment />}
        logoText={t("forum.title")}
        user={user}
        theme={theme}
        setTheme={setTheme}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/home");
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate("/forum")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 mb-6"
        >
          <FaArrowLeft />
          {t("forum.backToForum")}
        </button>

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {post.isAnonymous ? (
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <FaLock className="text-gray-600 dark:text-gray-300" />
                </div>
              ) : (
                <img
                  src={post.authorAvatar || "/default-avatar.png"}
                  alt={post.authorName}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {post.isAnonymous ? t("forum.anonymous") : post.authorName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </div>
            {isAuthor && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/forum/edit/${id}`)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {post.title}
          </h1>

          <div className="mb-4">
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm">
              {t(`forum.category.${post.category}`)}
            </span>
          </div>

          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 ${
                post.isLiked
                  ? "text-red-500"
                  : "text-gray-600 dark:text-gray-400"
              } hover:text-red-500`}
            >
              <FaHeart />
              <span>{post.likeCount || 0}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FaComment />
              <span>{post.commentCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FaEye />
              <span>{post.viewCount || 0}</span>
            </div>
          </div>
        </article>

        <ForumCommentSection postId={id} currentUser={user} />

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t("forum.confirmDelete")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("forum.deleteConfirmMessage")}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t("forum.cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {t("forum.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <FooterSection />
    </div>
  );
};

export default ForumPostDetailPage;
