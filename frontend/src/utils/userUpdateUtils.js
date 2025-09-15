/**
 * Utility function để cập nhật user data đồng nhất cho tất cả các trang
 * @param {Function} setUser - React state setter cho user
 * @param {Object} updatedData - Dữ liệu mới cần cập nhật
 * @param {Function} updateUserAvatar - Callback để cập nhật avatar ở header (nếu có)
 */
export const updateUserData = (
  setUser,
  updatedData,
  updateUserAvatar = null
) => {
  // Cập nhật user state
  setUser((prev) => {
    const updatedUser = {
      ...prev,
      ...updatedData,
    };

    // Cập nhật localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser));

    return updatedUser;
  });

  // Cập nhật avatar ở header nếu có
  if (updateUserAvatar && updatedData.avatarUrl) {
    updateUserAvatar(updatedData.avatarUrl);
  }
};

/**
 * Utility function để cập nhật user data sau khi upload avatar
 * @param {Function} setUser - React state setter cho user
 * @param {string} avatarUrl - URL avatar mới
 * @param {Function} updateUserAvatar - Callback để cập nhật avatar ở header (nếu có)
 */
export const updateUserAvatarData = (
  setUser,
  avatarUrl,
  updateUserAvatar = null
) => {
  // Cập nhật user state với avatar mới
  setUser((prev) => {
    const updatedUser = {
      ...prev,
      avatar: avatarUrl,
      avatarUrl: avatarUrl,
      avatarTimestamp: Date.now(), // Thêm timestamp để force refresh
    };

    // Cập nhật localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser));

    return updatedUser;
  });

  // Cập nhật avatar ở header nếu có
  if (updateUserAvatar) {
    updateUserAvatar(avatarUrl);
  }

  // Force refresh header avatar bằng cách cập nhật localStorage timestamp
  // Điều này sẽ trigger useEffect trong DashboardHeader
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  currentUser.avatarTimestamp = Date.now();
  localStorage.setItem("user", JSON.stringify(currentUser));

  // Dispatch custom event để notify các component khác
  window.dispatchEvent(
    new CustomEvent("avatarUpdated", {
      detail: {
        avatarUrl,
        timestamp: Date.now(),
        userId: currentUser.id || currentUser.email || "unknown",
      },
    })
  );

  // Avatar update event dispatched
};

/**
 * Utility function để cập nhật user data sau khi cập nhật profile
 * @param {Function} setUser - React state setter cho user
 * @param {Object} profileData - Dữ liệu profile mới từ backend
 * @param {Object} formData - Dữ liệu form hiện tại
 * @param {Function} updateUserAvatar - Callback để cập nhật avatar ở header (nếu có)
 */
export const updateUserProfileData = (
  setUser,
  profileData,
  formData,
  updateUserAvatar = null
) => {
  // Cập nhật user state với thông tin profile mới
  setUser((prev) => {
    const updatedUser = {
      ...prev,
      firstName: profileData.firstName || formData.firstName,
      lastName: profileData.lastName || formData.lastName,
      phone: profileData.phone || formData.phone,
      avatar: profileData.avatarUrl || prev.avatar,
      avatarUrl: profileData.avatarUrl || prev.avatarUrl,
    };

    // Cập nhật localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser));

    return updatedUser;
  });

  // Cập nhật avatar ở header nếu có
  if (updateUserAvatar && profileData.avatarUrl) {
    updateUserAvatar(profileData.avatarUrl);
  }
};

/**
 * Utility function để cập nhật token nếu backend trả về token mới
 * @param {string} newToken - Token mới từ backend
 */
export const updateToken = (newToken) => {
  if (newToken) {
    localStorage.setItem("token", newToken);
  }
};

/**
 * Utility function để cập nhật user data và token sau khi cập nhật profile
 * @param {Function} setUser - React state setter cho user
 * @param {Object} profileData - Dữ liệu profile mới từ backend
 * @param {Object} formData - Dữ liệu form hiện tại
 * @param {Function} updateUserAvatar - Callback để cập nhật avatar ở header (nếu có)
 */
export const updateUserAndToken = (
  setUser,
  profileData,
  formData,
  updateUserAvatar = null
) => {
  // Cập nhật user state với thông tin profile mới
  setUser((prev) => {
    const updatedUser = {
      ...prev,
      firstName: profileData.firstName || formData.firstName,
      lastName: profileData.lastName || formData.lastName,
      phone: profileData.phone || formData.phone,
      avatar: profileData.avatarUrl || prev.avatar,
      avatarUrl: profileData.avatarUrl || prev.avatarUrl,
      avatarTimestamp: profileData.avatarUrl
        ? Date.now()
        : prev.avatarTimestamp, // Cập nhật timestamp nếu có avatar mới
    };

    // Cập nhật localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser));

    return updatedUser;
  });

  // Cập nhật avatar ở header nếu có
  if (updateUserAvatar && profileData.avatarUrl) {
    updateUserAvatar(profileData.avatarUrl);
  }

  // Force refresh header avatar nếu có avatar mới
  if (profileData.avatarUrl) {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    currentUser.avatarTimestamp = Date.now();
    localStorage.setItem("user", JSON.stringify(currentUser));

    // Dispatch custom event để notify các component khác
    window.dispatchEvent(
      new CustomEvent("avatarUpdated", {
        detail: {
          avatarUrl: profileData.avatarUrl,
          timestamp: Date.now(),
          userId: currentUser.id || currentUser.email || "unknown",
        },
      })
    );

    // Profile update avatar event dispatched
  }
};
