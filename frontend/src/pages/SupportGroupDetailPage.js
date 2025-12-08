import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { jwtDecode } from "jwt-decode";
import {
  FaUsers,
  FaUserPlus,
  FaUserMinus,
  FaEdit,
  FaTrash,
  FaArrowLeft,
} from "react-icons/fa";
import supportGroupService from "../services/supportGroupService";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import { useTheme } from "../hooks/useTheme";
import logger from "../utils/logger";

const SupportGroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const groupData = await supportGroupService.getGroupById(id);
      setGroup(groupData);
    } catch (err) {
      setError(err.message || t("supportGroups.errorLoadingGroup"));
      logger.error("Error loading group:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await supportGroupService.joinGroup(id);
      loadGroup();
    } catch (err) {
      logger.error("Error joining group:", err);
    }
  };

  const handleLeave = async () => {
    try {
      await supportGroupService.leaveGroup(id);
      loadGroup();
    } catch (err) {
      logger.error("Error leaving group:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await supportGroupService.deleteGroup(id);
      navigate("/support-groups");
    } catch (err) {
      logger.error("Error deleting group:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
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

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200">
              {error || t("supportGroups.groupNotFound")}
            </p>
            <button
              onClick={() => navigate("/support-groups")}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              {t("supportGroups.backToGroups")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCreator = user && group.creatorId === user.id;
  const isAdmin = group.memberRole === "ADMIN";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader
        logoIcon={<FaUsers />}
        logoText={t("supportGroups.title")}
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
          onClick={() => navigate("/support-groups")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 mb-6"
        >
          <FaArrowLeft />
          {t("supportGroups.backToGroups")}
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={group.creatorAvatar || "/default-avatar.png"}
                alt={group.creatorName}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {group.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("supportGroups.createdBy")} {group.creatorName} •{" "}
                  {formatDate(group.createdAt)}
                </p>
              </div>
            </div>
            {(isCreator || isAdmin) && (
              <div className="flex gap-2">
                {isCreator && (
                  <>
                    <button
                      onClick={() => navigate(`/support-groups/edit/${id}`)}
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
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mb-4">
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm">
              {t(`supportGroups.category.${group.category}`)}
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-wrap">
            {group.description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-gray-600 dark:text-gray-400">
              <FaUsers className="inline mr-2" />
              {group.memberCount} / {group.maxMembers}{" "}
              {t("supportGroups.members")}
            </div>
            {group.isMember ? (
              <button
                onClick={handleLeave}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                <FaUserMinus />
                {t("supportGroups.leave")}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FaUserPlus />
                {t("supportGroups.join")}
              </button>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t("supportGroups.confirmDelete")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("supportGroups.deleteConfirmMessage")}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("supportGroups.cancel")}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t("supportGroups.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterSection />
    </div>
  );
};

export default SupportGroupDetailPage;
