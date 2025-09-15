// Utility functions for cleaning up localStorage

/**
 * Xóa tất cả dữ liệu chat history của anonymous user
 */
export const cleanupAnonymousChatHistory = () => {
  const keys = Object.keys(localStorage);
  let cleanedCount = 0;

  keys.forEach((key) => {
    if (
      key.startsWith("mindmeter_chat_history_") &&
      key.includes("anonymous")
    ) {
      localStorage.removeItem(key);
      cleanedCount++;
    }
  });

  // Cleaned up anonymous chat history entries
  return cleanedCount;
};

/**
 * Xóa tất cả dữ liệu chat history cũ (không có email)
 */
export const cleanupOldChatHistory = () => {
  const keys = Object.keys(localStorage);
  let cleanedCount = 0;

  keys.forEach((key) => {
    if (
      key === "mindmeter_chat_history" ||
      (key.startsWith("mindmeter_chat_history_") && !key.includes("@"))
    ) {
      localStorage.removeItem(key);
      cleanedCount++;
    }
  });

  // Cleaned up old chat history entries
  return cleanedCount;
};

/**
 * Xóa tất cả dữ liệu chat history không hợp lệ
 */
export const cleanupInvalidChatHistory = () => {
  const keys = Object.keys(localStorage);
  let cleanedCount = 0;

  keys.forEach((key) => {
    if (key.startsWith("mindmeter_chat_history_")) {
      // Kiểm tra xem key có chứa email hợp lệ không
      const emailPart = key.replace("mindmeter_chat_history_", "");
      if (!emailPart.includes("@") || emailPart.includes("anonymous")) {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    }
  });

  // Cleaned up invalid chat history entries
  return cleanedCount;
};

/**
 * Xóa tất cả dữ liệu chat history
 */
export const cleanupAllChatHistory = () => {
  const keys = Object.keys(localStorage);
  let cleanedCount = 0;

  keys.forEach((key) => {
    if (key.startsWith("mindmeter_chat_history")) {
      localStorage.removeItem(key);
      cleanedCount++;
    }
  });

  // Cleaned up total chat history entries
  return cleanedCount;
};
