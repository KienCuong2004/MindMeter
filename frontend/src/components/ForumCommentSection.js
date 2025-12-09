import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaHeart, FaReply, FaLock } from "react-icons/fa";
import forumService from "../services/forumService";
import logger from "../utils/logger";

const ForumCommentSection = ({ postId, currentUser }) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await forumService.getComments(postId, {
        page: 0,
        size: 50,
      });
      setComments(response.content || []);
    } catch (err) {
      setError(err.message);
      logger.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      setIsSubmitting(true);
      await forumService.createComment(postId, {
        content: newComment,
        parentId: replyingTo,
        isAnonymous: isAnonymous,
      });
      setNewComment("");
      setReplyingTo(null);
      setIsAnonymous(false);
      loadComments();
    } catch (err) {
      setError(err.message || t("forum.commentError"));
      logger.error("Error creating comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId) => {
    if (!currentUser) return;
    try {
      await forumService.toggleLikeComment(commentId);
      loadComments();
    } catch (err) {
      logger.error("Error toggling like:", err);
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

  const findCommentById = (comments, id) => {
    for (const comment of comments) {
      if (comment.id === id) {
        return comment;
      }
      if (comment.replies && comment.replies.length > 0) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const renderComment = (comment, depth = 0) => {
    const isReplyingToThis = replyingTo === comment.id;
    const replyingToComment = replyingTo
      ? findCommentById(comments, replyingTo)
      : null;
    const replyingToUserName = replyingToComment
      ? replyingToComment.isAnonymous
        ? t("forum.anonymous")
        : replyingToComment.userName
      : "";

    return (
      <div key={comment.id} className={`mb-4 ${depth > 0 ? "ml-8" : ""}`}>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-2">
            {comment.isAnonymous ? (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <FaLock className="text-gray-600 dark:text-gray-300 text-xs" />
              </div>
            ) : (
              <img
                src={comment.userAvatar || "/default-avatar.png"}
                alt={comment.userName}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {comment.isAnonymous
                    ? t("forum.anonymous")
                    : comment.userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(comment.createdAt)}
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {comment.content}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => handleLike(comment.id)}
                  className={`flex items-center gap-1 text-sm ${
                    comment.isLiked
                      ? "text-red-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <FaHeart />
                  <span>{comment.likeCount || 0}</span>
                </button>
                {depth < 2 && currentUser && (
                  <button
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment.id ? null : comment.id
                      )
                    }
                    className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                  >
                    <FaReply />
                    {t("forum.reply")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reply form hiển thị dưới comment được reply */}
        {isReplyingToThis && currentUser && (
          <form
            onSubmit={handleSubmit}
            className="mt-3 ml-4 bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
          >
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {t("forum.replyingTo")} {replyingToUserName}
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setNewComment("");
                }}
                className="ml-2 text-blue-600 hover:text-blue-700"
              >
                {t("forum.cancel")}
              </button>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("forum.writeComment")}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              required
              autoFocus
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded"
                />
                {t("forum.postAsAnonymous")}
              </label>
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t("forum.posting") : t("forum.postComment")}
              </button>
            </div>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {t("forum.comments")} ({comments.length})
      </h3>

      {/* Form comment mới chỉ hiển thị khi không đang reply comment nào */}
      {currentUser && !replyingTo && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("forum.writeComment")}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            required
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded"
              />
              {t("forum.postAsAnonymous")}
            </label>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("forum.posting") : t("forum.postComment")}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          {t("forum.noComments")}
        </p>
      ) : (
        <div>{comments.map((comment) => renderComment(comment))}</div>
      )}
    </div>
  );
};

export default ForumCommentSection;
