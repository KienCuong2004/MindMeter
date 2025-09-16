import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FaHeart,
  FaReply,
  FaUser,
  FaEllipsisH,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import blogService from "../services/blogService";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";

const CommentSection = ({ postId, onCommentCountChange }) => {
  const { t, i18n } = useTranslation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const currentLocale = i18n.language === "vi" ? vi : enUS;

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const commentsData = await blogService.getComments(postId, 0, 10);
      setComments(commentsData.content || []);
      setHasMore(!commentsData.last);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Notify parent component when comment count changes
  useEffect(() => {
    if (onCommentCountChange) {
      onCommentCountChange(comments.length);
    }
  }, [comments.length, onCommentCountChange]);

  const loadMoreComments = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const nextPage = currentPage + 1;
      const commentsData = await blogService.getComments(postId, nextPage, 10);
      setComments((prev) => [...prev, ...(commentsData.content || [])]);
      setCurrentPage(nextPage);
      setHasMore(!commentsData.last);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        content: newComment.trim(),
        parentId: replyingTo,
      };

      const newCommentData = await blogService.createComment(
        postId,
        commentData
      );
      setComments((prev) => [newCommentData, ...prev]);
      setNewComment("");
      setReplyingTo(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    setNewComment("");
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: currentLocale,
    });
  };

  const CommentItem = ({ comment, level = 0 }) => {
    const [isLiked] = useState(comment.isLiked || false);
    const [likeCount] = useState(comment.likeCount || 0);
    const [isLoading, setIsLoading] = useState(false);

    const handleLike = async () => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        // This would need to be implemented in blogService
        // const result = await blogService.toggleCommentLike(comment.id);
        // setIsLiked(result);
        // setLikeCount(prev => result ? prev + 1 : prev - 1);
      } catch (error) {
        console.error("Error toggling comment like:", error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className={`${level > 0 ? "ml-8 mt-4" : ""}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              {comment.userAvatar ? (
                <img
                  src={comment.userAvatar}
                  alt={comment.userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <FaUser className="text-white text-sm" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {comment.userName}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <FaEdit className="text-gray-400 text-xs" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <FaTrash className="text-red-400 text-xs" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <FaEllipsisH className="text-gray-400 text-xs" />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                {comment.content}
              </p>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  disabled={isLoading}
                  className={`flex items-center space-x-1 text-xs transition-colors ${
                    isLiked
                      ? "text-red-500"
                      : "text-gray-500 hover:text-red-500"
                  }`}
                >
                  <FaHeart className={isLiked ? "fill-current" : ""} />
                  <span>{likeCount}</span>
                </button>

                {level === 0 && (
                  <button
                    onClick={() => handleReply(comment.id)}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <FaReply />
                    <span>{t("blog.comment.reply")}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("blog.comment.error.title")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadComments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("blog.comment.error.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      {/* Comment Form */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("blog.comment.title")} ({comments.length})
        </h3>

        <form onSubmit={handleSubmitComment}>
          <div className="space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                replyingTo
                  ? t("blog.comment.replyPlaceholder")
                  : t("blog.comment.placeholder")
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="3"
            />

            {replyingTo && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {t("blog.comment.replyingTo")}{" "}
                  {comments.find((c) => c.id === replyingTo)?.userName}
                </span>
                <button
                  type="button"
                  onClick={handleCancelReply}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  {t("blog.comment.cancel")}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {newComment.length}/1000
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? t("blog.comment.submitting")
                  : t("blog.comment.submit")}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="p-6">
        {loading && comments.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">
              💬
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("blog.comment.empty.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("blog.comment.empty.description")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMoreComments}
                  disabled={loading}
                  className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors disabled:opacity-50"
                >
                  {loading
                    ? t("blog.comment.loading")
                    : t("blog.comment.loadMore")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
