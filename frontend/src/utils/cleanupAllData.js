// Script để dọn dẹp tất cả dữ liệu cũ trong localStorage

/**
 * Dọn dẹp tất cả dữ liệu chat history cũ và không hợp lệ
 */
export const cleanupAllChatData = () => {
  const keys = Object.keys(localStorage);
  let cleanedCount = 0;
  const cleanedKeys = [];

  keys.forEach((key) => {
    // Xóa tất cả dữ liệu chat history
    if (key.startsWith("mindmeter_chat_history")) {
      localStorage.removeItem(key);
      cleanedCount++;
      cleanedKeys.push(key);
    }

    // Xóa key null hoặc undefined
    if (key === "null" || key === "undefined") {
      localStorage.removeItem(key);
      cleanedCount++;
      cleanedKeys.push(key);
    }

    // Xóa dữ liệu chatbot usage cũ
    if (key.startsWith("mindmeter_chatbot_usage")) {
      localStorage.removeItem(key);
      cleanedCount++;
      cleanedKeys.push(key);
    }
  });

  // Cleaned up entries
  return { cleanedCount, cleanedKeys };
};

/**
 * Chỉ giữ lại dữ liệu cần thiết
 */
export const keepOnlyEssentialData = () => {
  const essentialKeys = ["i18nextLng", "mindmeter_theme", "token", "user"];

  const keys = Object.keys(localStorage);
  let removedCount = 0;
  const removedKeys = [];

  keys.forEach((key) => {
    if (!essentialKeys.includes(key)) {
      localStorage.removeItem(key);
      removedCount++;
      removedKeys.push(key);
    }
  });

  // Removed non-essential entries
  return { removedCount, removedKeys };
};

/**
 * Dọn dẹp hoàn toàn và chỉ giữ dữ liệu cần thiết
 */
export const fullCleanup = () => {
  // Starting full cleanup

  const chatResult = cleanupAllChatData();
  const essentialResult = keepOnlyEssentialData();

  // Cleanup completed

  return {
    totalCleaned: chatResult.cleanedCount + essentialResult.removedCount,
    chatCleaned: chatResult.cleanedCount,
    essentialRemoved: essentialResult.removedCount,
  };
};

// Tự động chạy cleanup khi import
if (typeof window !== "undefined") {
  // Chỉ chạy trong browser
  setTimeout(() => {
    fullCleanup();
  }, 1000); // Delay 1 giây để tránh conflict
}
