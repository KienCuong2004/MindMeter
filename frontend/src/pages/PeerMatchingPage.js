import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaUserFriends, FaCheck, FaTimes } from "react-icons/fa";
import DashboardHeader from "../components/DashboardHeader";
import FooterSection from "../components/FooterSection";
import peerMatchingService from "../services/peerMatchingService";
import { useTheme } from "../hooks/useTheme";
import { jwtDecode } from "jwt-decode";
import { getCurrentUser, getCurrentToken } from "../services/anonymousService";

const PeerMatchingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUserAndMatches = async () => {
      try {
        const currentUser = getCurrentUser();
        const currentToken = getCurrentToken();

        let userId = null;
        let userObj = null;

        if (currentUser) {
          userObj = {
            ...currentUser,
            id: currentUser.id || currentUser.userId,
          };
          userId = userObj.id;
        } else if (currentToken) {
          try {
            const decoded = jwtDecode(currentToken);
            const storedUser = localStorage.getItem("user");
            let userData = {};
            if (storedUser && storedUser !== "undefined") {
              userData = JSON.parse(storedUser);
            }
            userId = decoded.id || decoded.userId || userData.id;
            userObj = {
              email: decoded.sub || decoded.email || "",
              id: userId,
              role: decoded.role,
              firstName: decoded.firstName || userData.firstName || "",
              lastName: decoded.lastName || userData.lastName || "",
              avatarUrl:
                decoded.avatarUrl ||
                userData.avatarUrl ||
                userData.avatar ||
                null,
              avatarTimestamp: userData.avatarTimestamp || null,
              plan: decoded.plan || userData.plan || "FREE",
              phone: decoded.phone || userData.phone || "",
              anonymous: decoded.anonymous || userData.anonymous || false,
            };
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Error decoding token:", e);
          }
        }

        if (userObj) {
          setUser(userObj);
        }

        if (userId) {
          // eslint-disable-next-line no-console
          console.log("Loading matches for userId:", userId);
          await loadMatches(userId);
        } else {
          // eslint-disable-next-line no-console
          console.warn("No userId found, cannot load matches");
          setLoading(false);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error in loadUserAndMatches:", error);
        setLoading(false);
      }
    };

    loadUserAndMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMatches = async (userId) => {
    try {
      setLoading(true);
      // eslint-disable-next-line no-console
      console.log("Loading matches for userId:", userId);
      const response = await peerMatchingService.getUserMatches(userId, null, {
        page: 0,
        size: 20,
      });
      // eslint-disable-next-line no-console
      console.log("Matches response:", response);
      setMatches(response.content || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error loading matches:", err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (matchId) => {
    try {
      await peerMatchingService.acceptMatch(matchId);
      if (user?.id) {
        loadMatches(user.id);
      }
    } catch (err) {
      // Handle error
    }
  };

  const handleReject = async (matchId) => {
    try {
      await peerMatchingService.rejectMatch(matchId);
      if (user?.id) {
        loadMatches(user.id);
      }
    } catch (err) {
      // Handle error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader
        logoIcon={<FaUserFriends />}
        logoText={t("peerMatching.title")}
        user={user}
        theme={theme}
        setTheme={setTheme}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/home");
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {t("peerMatching.title")}
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t("peerMatching.noMatches")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => {
              const otherUser =
                match.user1Id === user?.id ? match.user2Name : match.user1Name;
              const otherUserAvatar =
                match.user1Id === user?.id
                  ? match.user2Avatar
                  : match.user1Avatar;

              return (
                <div
                  key={match.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={otherUserAvatar || "/default-avatar.png"}
                      alt={otherUser}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {otherUser}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t(`peerMatching.status.${match.status}`)}
                      </p>
                    </div>
                  </div>

                  {match.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(match.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        <FaCheck />
                        {t("peerMatching.accept")}
                      </button>
                      <button
                        onClick={() => handleReject(match.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        <FaTimes />
                        {t("peerMatching.reject")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FooterSection />
    </div>
  );
};

export default PeerMatchingPage;
