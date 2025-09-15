import React from "react";
import { useTranslation } from "react-i18next";
import { FaRobot, FaLock, FaUserPlus } from "react-icons/fa";

const AnonymousChatbotNotice = ({ onUpgrade }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl shadow-2xl max-w-sm border border-blue-400">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FaRobot className="w-5 h-5" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <FaLock className="w-3 h-3" />
              {t("chatbot.anonymousNotice.title", "Chatbot không khả dụng")}
            </h3>
            <p className="text-xs text-blue-100 mb-3 leading-relaxed">
              {t(
                "chatbot.anonymousNotice.description",
                "Đăng ký tài khoản để sử dụng AI Assistant và lưu lịch sử chat."
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onUpgrade}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs py-2 px-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1"
              >
                <FaUserPlus className="w-3 h-3" />
                {t("chatbot.anonymousNotice.upgrade", "Đăng ký ngay")}
              </button>
              <button
                onClick={() => {
                  // Có thể thêm logic đóng notice
                  const notice = document.querySelector(
                    ".fixed.bottom-6.right-6"
                  );
                  if (notice) notice.style.display = "none";
                }}
                className="bg-white/10 hover:bg-white/20 text-white text-xs py-2 px-3 rounded-lg transition-all duration-200"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnonymousChatbotNotice;
