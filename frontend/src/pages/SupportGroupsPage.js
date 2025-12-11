import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaPlus, FaUserPlus, FaUserMinus } from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import supportGroupService from "../services/supportGroupService";
import { useTheme } from "../hooks/useTheme";
import { jwtDecode } from "jwt-decode";
import { getCurrentUser, getCurrentToken } from "../services/anonymousService";

const SupportGroupsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [groups, setGroups] = useState([]);
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
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await supportGroupService.getGroups({
        page: 0,
        size: 20,
      });
      setGroups(response.content || []);
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await supportGroupService.joinGroup(groupId);
      loadGroups();
    } catch (err) {
      // Handle error
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await supportGroupService.leaveGroup(groupId);
      loadGroups();
    } catch (err) {
      // Handle error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
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

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t("supportGroups.title")}
          </h1>
          {user && (
            <button
              onClick={() => navigate("/support-groups/create")}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              {t("supportGroups.createGroup")}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/support-groups/${group.id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={group.creatorAvatar || "/default-avatar.png"}
                    alt={group.creatorName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("supportGroups.createdBy")} {group.creatorName}
                    </p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {group.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {group.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {group.memberCount} / {group.maxMembers}{" "}
                    {t("supportGroups.members")}
                  </div>
                  {group.isMember ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveGroup(group.id);
                      }}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <FaUserMinus />
                      {t("supportGroups.leave")}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinGroup(group.id);
                      }}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <FaUserPlus />
                      {t("supportGroups.join")}
                    </button>
                  )}
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

export default SupportGroupsPage;
