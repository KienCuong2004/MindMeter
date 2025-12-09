import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaComment, FaEye, FaLock } from "react-icons/fa";
import forumService from "../services/forumService";
import { jwtDecode } from "jwt-decode";

const ForumBoard = ({ category = null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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
  }, []);

  useEffect(() => {
    setCurrentPage(0);
    setPosts([]);
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        size: 10,
        sort: "createdAt,desc",
      };
      if (category) {
        params.category = category;
      }
      const response = await forumService.getPosts(params);
      if (currentPage === 0) {
        setPosts(response.content || []);
      } else {
        setPosts((prev) => [...prev, ...(response.content || [])]);
      }
      setHasMore(!response.last);
    } catch (err) {
      setError(err.message || t("forum.errorLoadingPosts"));
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await forumService.toggleLikePost(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likeCount: post.isLiked
                  ? post.likeCount - 1
                  : post.likeCount + 1,
              }
            : post
        )
      );
    } catch (err) {
      // Handle error
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

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate(`/forum/post/${post.id}`)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {post.isAnonymous ? (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <FaLock className="text-gray-600 dark:text-gray-300" />
                </div>
              ) : (
                <img
                  src={post.authorAvatar || "/default-avatar.png"}
                  alt={post.authorName}
                  className="w-10 h-10 rounded-full"
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
            {post.isPinned && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                {t("forum.pinned")}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {post.title}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
            {post.content}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(post.id);
                }}
                className={`flex items-center gap-2 hover:text-red-500 ${
                  post.isLiked ? "text-red-500" : ""
                }`}
              >
                <FaHeart />
                <span>{post.likeCount || 0}</span>
              </button>
              <div className="flex items-center gap-2">
                <FaComment />
                <span>{post.commentCount || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEye />
                <span>{post.viewCount || 0}</span>
              </div>
            </div>
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm">
              {t(`forum.category.${post.category}`)}
            </span>
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={async () => {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            try {
              const params = {
                page: nextPage,
                size: 10,
                sort: "createdAt,desc",
              };
              if (category) {
                params.category = category;
              }
              const response = await forumService.getPosts(params);
              setPosts((prev) => [...prev, ...(response.content || [])]);
              setHasMore(!response.last);
            } catch (err) {
              setError(err.message || t("forum.errorLoadingPosts"));
            }
          }}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t("forum.loadMore")}
        </button>
      )}
    </div>
  );
};

export default ForumBoard;
