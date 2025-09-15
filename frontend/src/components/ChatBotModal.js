import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
import {
  FaRobot,
  FaUser,
  FaPaperPlane,
  FaTrash,
  FaEllipsisV,
  FaDownload,
  FaRegLightbulb,
  FaRegCommentDots,
  FaRegQuestionCircle,
  FaEye,
  FaEyeSlash,
  FaRegSmile,
  FaCalendarAlt,
  FaCheckCircle,
  FaIdCard,
  FaCalendar,
  FaUserMd,
  FaLaptop,
  FaClock,
  FaGift,
} from "react-icons/fa";
import { ThemeContext } from "../App";
import { useTranslation } from "react-i18next";
import { authFetch } from "../authFetch";
import AppointmentBookingModal from "./AppointmentBookingModal";
import NotificationModal from "./NotificationModal";
import AppointmentHistoryService from "../services/appointmentHistoryService";
import AnalyticsService from "../services/analyticsService";
import { cleanupAnonymousChatHistory } from "../utils/cleanupStorage";
import { sanitizeHtmlSafe } from "../utils/sanitizeHtml";

// Tạo key duy nhất cho mỗi user
const getChatHistoryKey = (user) => {
  if (user && user.email && !user.anonymous) {
    return `mindmeter_chat_history_${user.email}`;
  }
  // Không lưu chat history cho anonymous user
  return null;
};

// TypewriterMessage: Hiển thị từng ký tự một cho tin nhắn bot
function TypewriterMessage({ text, speed = 30, onDone }) {
  const safeText = typeof text === "string" ? text : "";
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const scrollRef = useRef();

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    let cancelled = false;
    function type() {
      if (cancelled) return;
      if (i < safeText.length) {
        setDisplayed(safeText.slice(0, i + 1));
        i++;
        setTimeout(type, speed);
      } else {
        setDone(true);
        if (onDone) onDone();
      }
    }
    type();
    return () => {
      cancelled = true;
    };
  }, [safeText, speed, onDone]);

  // Hiệu ứng nhấp nháy con trỏ
  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => {
      setShowCursor((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, [done]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayed]);

  return (
    <span ref={scrollRef}>
      {displayed}
      {!done && <span style={{ opacity: showCursor ? 1 : 0 }}>|</span>}
    </span>
  );
}

const ChatBotModal = ({ open, onClose, user }) => {
  const { t, i18n } = useTranslation();

  const [messages, setMessages] = useState(() => {
    const chatHistoryKey = getChatHistoryKey(user);
    if (!chatHistoryKey) {
      // Không lưu chat history cho anonymous user
      return [];
    }
    const saved = localStorage.getItem(chatHistoryKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        // Error parsing localStorage messages
      }
    }
    // CHỈ hiển thị tin nhắn chào mừng, KHÔNG gợi ý gì thêm
    const initialMessages = [
      {
        sender: "bot",
        text: t("chatbot.welcome"),
      },
    ];
    return initialMessages;
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [availableExperts, setAvailableExperts] = useState([]);
  const [expertsFetched, setExpertsFetched] = useState(false);
  const [expertSuggestionShown, setExpertSuggestionShown] = useState(false);
  const fetchAttempted = useRef(false); // Tránh gọi API nhiều lần
  const [conversationId] = useState(() =>
    AppointmentHistoryService.generateConversationId()
  );
  const [sessionId] = useState(() => AnalyticsService.generateSessionId());
  const [chatContext, setChatContext] = useState({
    conversationId: null,
    messageCount: 0,
    userIntent: "general",
    suggestedBy: "chatbot",
    keywords: [],
  });
  const [responseStartTime, setResponseStartTime] = useState(null);
  const messagesEndRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBotAvatar, setShowBotAvatar] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const { theme, setTheme } = useContext(ThemeContext) || {
    theme: "light",
    setTheme: () => {},
  };
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [botMessageDone, setBotMessageDone] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showAllExperts, setShowAllExperts] = useState(false);
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Fetch danh sách chuyên gia có sẵn
  const fetchAvailableExperts = useCallback(async () => {
    if (expertsFetched) {
      return; // Tránh gọi API nhiều lần
    }

    try {
      setExpertsFetched(true);
      const response = await authFetch(
        "/api/expert-schedules/available-experts"
      );
      if (response && response.ok) {
        const experts = await response.json();
        setAvailableExperts(experts);
      } else {
        setExpertsFetched(false); // Reset để có thể thử lại
      }
    } catch (error) {
      setExpertsFetched(false); // Reset nếu lỗi để có thể thử lại
    }
  }, [expertsFetched]);

  // Fetch danh sách chuyên gia khi mở modal - chỉ chạy một lần
  useEffect(() => {
    if (open && !fetchAttempted.current) {
      fetchAttempted.current = true;
      // Thêm delay nhỏ để tránh gọi API ngay lập tức
      const timer = setTimeout(() => {
        fetchAvailableExperts();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [open, fetchAvailableExperts]);

  // Gợi ý chuyên gia khi có danh sách experts - chỉ chạy một lần
  useEffect(() => {
    if (
      open &&
      availableExperts.length > 0 &&
      !expertSuggestionShown &&
      !messages.some((msg) => msg.showAppointmentButton)
    ) {
      const timer = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: t("chatbot.expertSuggestion"),
            showAppointmentButton: true,
          },
        ]);
        setExpertSuggestionShown(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [open, availableExperts.length, expertSuggestionShown, t, messages]);

  // Gợi ý đặt lịch dựa trên thời gian chat - CHỈ gọi khi cần thiết
  const suggestAppointmentBasedOnTime = () => {
    // Nếu user chat quá 5 tin nhắn mà chưa được gợi ý đặt lịch
    const userMessages = messages.filter((msg) => msg.sender === "user");
    const hasAppointmentSuggestion = messages.some(
      (msg) => msg.showAppointmentButton
    );

    // Kiểm tra xem user có ý định đặt lịch không
    const hasAppointmentIntent = messages.some(
      (msg) =>
        msg.sender === "user" &&
        appointmentKeywords.some((keyword) =>
          msg.text.toLowerCase().includes(keyword)
        )
    );

    // CHỈ gợi ý khi thực sự cần thiết và chưa có gợi ý nào
    if (
      userMessages.length >= 5 &&
      !hasAppointmentSuggestion &&
      !hasAppointmentIntent
    ) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: t("longChatSuggestion"),
            showAppointmentButton: true,
          },
        ]);
      }, 3000);
    }
  };

  // Xử lý đặt lịch tự động
  const handleAutoBooking = async (autoBookingMatch) => {
    try {
      const [, expertName, date, time, duration] = autoBookingMatch;

      // Hiển thị tin nhắn đang xử lý
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: t("processingAutoBooking"),
          showLoading: true,
        },
      ]);

      const requestData = {
        expertName: expertName.trim(),
        date: date.trim(),
        time: time.trim(),
        durationMinutes: parseInt(duration),
        consultationType: "ONLINE",
        notes: "",
        meetingLocation: "",
      };

      const response = await authFetch("/api/auto-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Xóa tin nhắn loading và tắt loading state
      setMessages((prev) => prev.filter((msg) => !msg.showLoading));
      setLoading(false);

      if (result.success) {
        // Format date và time một cách an toàn
        let formattedDate = "N/A";
        let formattedTime = "N/A";

        // Sử dụng trực tiếp appointmentTime từ response
        if (result.appointmentTime) {
          formattedTime = result.appointmentTime;
        }

        try {
          if (result.appointmentDate) {
            // Thử parse với nhiều format khác nhau
            let dateObj = null;

            if (
              typeof result.appointmentDate === "string" &&
              result.appointmentDate.includes("T")
            ) {
              // Sử dụng cách parse đơn giản và đáng tin cậy hơn
              try {
                // Thử parse trực tiếp trước
                dateObj = new Date(result.appointmentDate);

                // Nếu thất bại, thử parse từng phần
                if (isNaN(dateObj.getTime())) {
                  const [datePart, timePart] =
                    result.appointmentDate.split("T");
                  const [year, month, day] = datePart.split("-").map(Number);
                  const [hour, minute, second] = timePart
                    .split(":")
                    .map(Number);

                  // Tạo Date object với local timezone
                  dateObj = new Date(
                    year,
                    month - 1,
                    day,
                    hour,
                    minute,
                    second || 0
                  );
                }
              } catch (parseError) {
                // Fallback: sử dụng giá trị gốc
                dateObj = null;
              }
            }
            // Format 2: Date string (2025-08-19)
            else if (
              typeof result.appointmentDate === "string" &&
              result.appointmentDate.includes("-")
            ) {
              const [year, month, day] = result.appointmentDate
                .split("-")
                .map(Number);
              dateObj = new Date(year, month - 1, day);
            }
            // Format 3: Timestamp
            else if (typeof result.appointmentDate === "number") {
              dateObj = new Date(result.appointmentDate);
            }
            // Format 4: Date object
            else if (result.appointmentDate instanceof Date) {
              dateObj = result.appointmentDate;
            }

            if (dateObj && !isNaN(dateObj.getTime())) {
              // Format date và time với timezone local
              formattedDate = dateObj.toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              });
              // Không ghi đè formattedTime vì đã set từ appointmentTime
            } else {
              // Fallback: sử dụng giá trị gốc nếu có
              if (typeof result.appointmentDate === "string") {
                // Thử parse đơn giản hơn
                try {
                  const simpleDate = new Date(result.appointmentDate);
                  if (!isNaN(simpleDate.getTime())) {
                    formattedDate = simpleDate.toLocaleDateString("vi-VN");
                    // Không ghi đè formattedTime vì đã set từ appointmentTime
                  } else {
                    // Nếu vẫn thất bại, format từ string gốc
                    if (result.appointmentDate.includes("T")) {
                      const [datePart, timePart] =
                        result.appointmentDate.split("T");
                      const [year, month, day] = datePart.split("-");
                      const [hour, minute] = timePart.split(":");

                      formattedDate = `${day}/${month}/${year}`;
                      // Không ghi đè formattedTime vì đã set từ appointmentTime
                    } else {
                      // Sử dụng giá trị gốc
                      formattedDate = result.appointmentDate;
                      formattedTime = result.appointmentTime || "N/A";
                    }
                  }
                } catch (fallbackError) {
                  // Fallback parsing failed
                  // Format từ string gốc
                  if (result.appointmentDate.includes("T")) {
                    const [datePart, timePart] =
                      result.appointmentDate.split("T");
                    const [year, month, day] = datePart.split("-");
                    const [hour, minute] = timePart.split(":");

                    formattedDate = `${day}/${month}/${year}`;
                    // Không ghi đè formattedTime vì đã set từ appointmentTime
                  } else {
                    formattedDate = result.appointmentDate;
                    formattedTime = result.appointmentTime || "N/A";
                  }
                }
              }
            }
          }
        } catch (error) {
          // Error formatting date
          // Fallback: sử dụng giá trị gốc
          formattedDate = result.appointmentDate || "N/A";
          formattedTime = result.appointmentTime || "N/A";
        }

        const appointmentMessage = {
          id: `appointment_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`, // ID duy nhất tuyệt đối
          sender: "bot",
          text: "", // Không hiển thị text này vì sẽ hiển thị appointment details
          showAppointmentDetails: true,
          appointmentDetails: {
            appointmentId: result.appointmentId,
            expertName: result.expertName,
            appointmentDate: formattedDate,
            appointmentTime: formattedTime,
            status: result.status,
            consultationType: result.consultationType,
            notes: result.notes,
          },
        };

        // Cập nhật messages state - CHỈ GỌI MỘT LẦN và xóa duplicate messages
        setMessages((prevMessages) => {
          // Xóa duplicate messages với cùng ID
          const uniqueMessages = prevMessages.filter((msg, index, arr) => {
            if (msg.id) {
              const firstIndex = arr.findIndex((m) => m.id === msg.id);
              return firstIndex === index; // Chỉ giữ lại message đầu tiên với mỗi ID
            }
            return true; // Giữ lại messages không có ID
          });

          const newMessages = [...uniqueMessages, appointmentMessage];
          return newMessages;
        });

        // Force re-render để đảm bảo UI hiển thị dữ liệu mới
        setTimeout(() => {
          setMessages((current) => [...current]);
        }, 100);
      } else {
        // Hiển thị tin nhắn lỗi và nút đặt lịch thủ công
        let errorMessage = result.message;
        if (!errorMessage || errorMessage.trim() === "") {
          errorMessage = t("appointment.autoBookingError");
        }

        // Tạo tin nhắn lỗi với thông tin chi tiết
        const errorText = `${t(
          "appointment.autoBookingError"
        )}: ${errorMessage}\n\n${t("appointment.autoBookingErrorDesc")}`;

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: errorText,
            showAppointmentButton: true, // Hiển thị tin nhắn lỗi và nút đặt lịch thủ công khi auto-booking thất bại
          },
        ]);
      }
    } catch (error) {
      // Error in auto booking

      // Xóa tin nhắn loading và tắt loading state
      setMessages((prev) => prev.filter((msg) => !msg.showLoading));
      setLoading(false);

      // Hiển thị tin nhắn lỗi và nút đặt lịch thủ công
      let errorMessage = t("chatbot.networkError");

      if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 400) {
        errorMessage = t("chatbot.invalidAppointmentInfo");
      } else if (error.status === 500) {
        errorMessage = t("chatbot.serverError");
      }

      const errorText = `${t(
        "appointment.autoBookingError"
      )}: ${errorMessage}\n\n${t("appointment.autoBookingErrorDesc")}`;

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errorText,
          showAppointmentButton: true, // Hiển thị nút đặt lịch thủ công khi có lỗi
        },
      ]);
    }
  };

  // Thêm hàm xoá lịch sử chat
  const clearHistory = () => {
    const chatHistoryKey = getChatHistoryKey(user);
    if (chatHistoryKey) {
      localStorage.removeItem(chatHistoryKey);
    }

    // Xóa lịch sử chat cũ (để tránh conflict)
    localStorage.removeItem("mindmeter_chat_history");

    setMessages([
      {
        sender: "bot",
        text: t("chatbot.welcome"),
      },
    ]);
  };

  // Download chat history as txt or json
  const downloadHistory = (type = "txt") => {
    let content = "";
    if (type === "json") {
      content = JSON.stringify(messages, null, 2);
    } else {
      content = messages
        .map(
          (m) =>
            `${m.sender === "user" ? t("chatbot.you") : t("chatbot.bot")}: ${
              m.text
            }`
        )
        .join("\n");
    }
    const blob = new Blob([content], {
      type: type === "json" ? "application/json" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindmeter_chat_history.${type}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    setShowMenu(false);
  };

  // Feedback modal submit (dummy)
  const [feedback, setFeedback] = useState("");

  // Xử lý khi chatbot gợi ý đặt lịch hẹn
  const handleAppointmentSuggestion = (expertId, expertName) => {
    setSelectedExpert({ id: expertId, name: expertName });
    setShowAppointmentModal(true);
  };

  // Kiểm tra xem user đã cung cấp đủ thông tin để đặt lịch tự động chưa
  const checkIfUserHasEnoughInfo = (userInput) => {
    if (!userInput) return false;

    const lowerInput = userInput.toLowerCase();

    // Kiểm tra có tên chuyên gia không
    const hasExpertName = availableExperts.some((expert) => {
      const fullName = `${expert.firstName} ${expert.lastName}`.toLowerCase();
      return (
        lowerInput.includes(expert.firstName.toLowerCase()) ||
        lowerInput.includes(expert.lastName.toLowerCase()) ||
        lowerInput.includes(fullName)
      );
    });

    // Kiểm tra có ngày không
    const hasDate =
      lowerInput.includes(t("chatbot.time.today")) ||
      lowerInput.includes(t("chatbot.time.tomorrow")) ||
      lowerInput.includes(t("chatbot.time.dayAfterTomorrow")) ||
      lowerInput.includes(t("chatbot.time.dayOfWeek")) ||
      lowerInput.includes(t("chatbot.time.thisWeek")) ||
      lowerInput.includes(t("chatbot.time.nextWeek")) ||
      /\d{1,2}\/\d{1,2}\/\d{4}/.test(userInput) ||
      /\d{1,2}-\d{1,2}-\d{4}/.test(userInput);

    // Kiểm tra có giờ không
    const hasTime =
      lowerInput.includes("h") ||
      lowerInput.includes(":") ||
      /\d{1,2}h/.test(userInput) ||
      /\d{1,2}:\d{2}/.test(userInput);

    // Trả về true nếu có đủ cả 3 thông tin
    return hasExpertName && hasDate && hasTime;
  };

  // Định nghĩa appointmentKeywords để sử dụng trong các hàm khác
  const appointmentKeywords = [
    // Tiếng Việt
    t("chatbot.keywords.appointment"),
    t("chatbot.keywords.consultExpert"),
    t("chatbot.keywords.psychologist"),
    t("chatbot.keywords.consultation"),
    t("chatbot.keywords.expert"),
    t("chatbot.keywords.psychology"),
    t("chatbot.keywords.needConsultation"),
    t("chatbot.keywords.wantToTalk"),
    t("chatbot.keywords.deepSupport"),
    t("chatbot.keywords.meetExpert"),
    t("chatbot.keywords.directConsultation"),
    t("chatbot.keywords.makeAppointment"),
    t("chatbot.keywords.needHelp"),
    // Tiếng Anh
    "appointment",
    "consultation",
    "psychologist",
    "therapist",
    "counseling",
    "mental health",
    "need help",
    "talk to someone",
    "professional help",
    "expert advice",
    "book appointment",
  ];

  // Phân tích vấn đề của user để gợi ý chuyên gia phù hợp
  const analyzeUserIssue = (messages) => {
    const recentMessages = messages.slice(-5); // Lấy 5 tin nhắn gần nhất
    const userText = recentMessages
      .filter((msg) => msg.sender === "user")
      .map((msg) => msg.text.toLowerCase())
      .join(" ");

    const issues = {
      depression: [
        t("chatbot.emotions.sad"),
        t("chatbot.emotions.depressed"),
        t("chatbot.emotions.hopeless"),
        t("chatbot.emotions.noInterest"),
        t("chatbot.emotions.depression"),
        t("chatbot.emotions.sadness"),
      ],
      anxiety: [
        t("chatbot.emotions.anxiety"),
        t("chatbot.emotions.stress"),
        "stress",
        t("chatbot.emotions.nervous"),
        t("chatbot.emotions.restless"),
        t("chatbot.emotions.worry"),
      ],
      sleep: Array.isArray(t("chatbot.emotions.sleep"))
        ? t("chatbot.emotions.sleep")
        : [t("chatbot.emotions.sleep")],
      relationship: Array.isArray(t("chatbot.emotions.relationships"))
        ? t("chatbot.emotions.relationships")
        : [t("chatbot.emotions.relationships")],
      academic: Array.isArray(t("chatbot.emotions.academic"))
        ? t("chatbot.emotions.academic")
        : [t("chatbot.emotions.academic")],
      general: Array.isArray(t("chatbot.emotions.general"))
        ? t("chatbot.emotions.general")
        : [t("chatbot.emotions.general")],
    };

    for (const [issueType, keywords] of Object.entries(issues)) {
      if (keywords.some((keyword) => userText.includes(keyword))) {
        return issueType;
      }
    }
    return "general";
  };

  // Gợi ý chuyên gia phù hợp dựa trên vấn đề
  const getRecommendedExperts = (issueType) => {
    if (!availableExperts.length) return [];

    // Sắp xếp chuyên gia theo mức độ phù hợp
    const scoredExperts = availableExperts.map((expert) => {
      let score = 0;

      // Chuyên gia có thể có chuyên môn phù hợp (dựa trên tên hoặc mô tả)
      const expertName = (
        expert.firstName +
        " " +
        expert.lastName
      ).toLowerCase();

      switch (issueType) {
        case "depression":
          if (
            expertName.includes(t("chatbot.expertise.depression")) ||
            expertName.includes("depression")
          )
            score += 3;
          break;
        case "anxiety":
          if (
            expertName.includes(t("chatbot.expertise.anxiety")) ||
            expertName.includes("anxiety") ||
            expertName.includes("stress")
          )
            score += 3;
          break;
        case "sleep":
          if (
            expertName.includes(t("chatbot.expertise.sleep")) ||
            expertName.includes("sleep")
          )
            score += 2;
          break;
        case "relationship":
          if (
            expertName.includes(t("chatbot.expertise.relationships")) ||
            expertName.includes("relationship")
          )
            score += 2;
          break;
        case "academic":
          if (
            expertName.includes(t("chatbot.expertise.academic")) ||
            expertName.includes("academic")
          )
            score += 2;
          break;
        default:
          // Không có điểm bonus cho các loại vấn đề khác
          break;
      }

      // Ưu tiên chuyên gia có kinh nghiệm (có thể thêm logic này sau)
      score += 1;

      return { ...expert, score };
    });

    // Sắp xếp theo điểm số và trả về top 3
    return scoredExperts.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  const handleFeedbackSubmit = async () => {
    try {
      setFeedbackLoading(true);
      await authFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, email: user?.email || "" }),
      });
      setShowFeedback(false);
      setFeedback("");
      setShowThankYou(true);
    } catch (e) {
      setNotificationModal({
        isOpen: true,
        type: "error",
        title: t("common.error"),
        message: t("sendFeedbackFailed"),
        onConfirm: null,
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Giới hạn lượt dùng chatbot mỗi ngày
  const MAX_FREE_CHATBOT_USES_PER_DAY = 5;
  const getChatbotUsageKey = (user) => {
    if (user && user.email) {
      return `mindmeter_chatbot_usage_${user.email}`;
    }
    return "mindmeter_chatbot_usage_anonymous";
  };

  // Kiểm tra quyền gói dịch vụ
  const userPlan = user && user.plan ? user.plan.toUpperCase() : "FREE";
  const isUnlimited = userPlan === "PLUS" || userPlan === "PRO";

  function getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  function getChatbotUsage() {
    const usageKey = getChatbotUsageKey(user);
    const raw = localStorage.getItem(usageKey);
    if (!raw) return { date: getTodayKey(), count: 0 };
    try {
      const data = JSON.parse(raw);
      if (data.date !== getTodayKey()) return { date: getTodayKey(), count: 0 };
      return data;
    } catch {
      return { date: getTodayKey(), count: 0 };
    }
  }

  function setChatbotUsage(count) {
    const usageKey = getChatbotUsageKey(user);
    localStorage.setItem(
      usageKey,
      JSON.stringify({ date: getTodayKey(), count })
    );
  }

  // Migrate lịch sử chat cũ sang mới khi component mount
  useEffect(() => {
    // Xóa dữ liệu chat history cũ của anonymous user
    cleanupAnonymousChatHistory();

    // Xóa key null nếu có
    if (localStorage.getItem("null")) {
      localStorage.removeItem("null");
      // Removed null key from localStorage
    }

    const chatHistoryKey = getChatHistoryKey(user);
    if (!chatHistoryKey) {
      return; // Không migrate cho anonymous user
    }
    const oldHistoryKey = "mindmeter_chat_history";

    // Kiểm tra xem có lịch sử chat cũ không
    const oldHistory = localStorage.getItem(oldHistoryKey);
    if (oldHistory && !localStorage.getItem(chatHistoryKey)) {
      try {
        // Migrate lịch sử cũ sang key mới
        localStorage.setItem(chatHistoryKey, oldHistory);
        localStorage.removeItem(oldHistoryKey);
      } catch (error) {}
    }
  }, [user]);

  // Load chat history khi mở modal
  useEffect(() => {
    if (open) {
      setInput("");
      setExpertSuggestionShown(false); // Reset khi mở modal
      fetchAttempted.current = false; // Reset fetch attempt

      // Khởi tạo chat context
      setChatContext({
        conversationId: conversationId,
        messageCount: 0,
        userIntent: "general",
        suggestedBy: "chatbot",
        keywords: [],
      });

      const chatHistoryKey = getChatHistoryKey(user);
      if (chatHistoryKey) {
        const saved = localStorage.getItem(chatHistoryKey);
        if (saved) {
          try {
            const savedMessages = JSON.parse(saved);
            setMessages(savedMessages);
            setChatContext((prev) => ({
              ...prev,
              messageCount: savedMessages.length,
            }));
          } catch {}
        }
      }
    }
  }, [open, user, conversationId]);

  // Set botMessageDone khi có tin nhắn bot cuối cùng và không loading
  useEffect(() => {
    if (open && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender === "bot" && !loading) {
        setBotMessageDone(true);
      }
    }
  }, [open, messages, loading]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // Lưu lịch sử chat mỗi khi messages thay đổi
    const chatHistoryKey = getChatHistoryKey(user);
    if (chatHistoryKey) {
      localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Reset botMessageDone khi có tin nhắn bot mới
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === "bot" && loading) {
      setBotMessageDone(false);
    }
  }, [messages, loading]);

  // Đồng bộ tất cả tin nhắn bot với ngôn ngữ hiện tại
  useEffect(() => {
    if (messages.length > 0) {
      const updatedMessages = messages.map((msg) => {
        if (msg.sender === "bot") {
          // Đồng bộ welcome message
          if (
            msg.text === t("chatbot.welcome") ||
            msg.text.includes("Xin chào") ||
            msg.text.includes("Hello")
          ) {
            return { ...msg, text: t("chatbot.welcome") };
          }
          // Đồng bộ expert suggestion message
          if (
            msg.text === t("chatbot.expertSuggestion") ||
            msg.text.includes("Tôi thấy bạn có thể cần tư vấn") ||
            msg.text.includes("I see you might need expert consultation")
          ) {
            return { ...msg, text: t("chatbot.expertSuggestion") };
          }
          // Đồng bộ test result suggestion message
          if (
            msg.text === t("testResultSuggestion") ||
            msg.text.includes("Dựa trên kết quả bài test") ||
            msg.text.includes("Based on the recent test results")
          ) {
            return { ...msg, text: t("testResultSuggestion") };
          }
          // Đồng bộ long chat suggestion message
          if (
            msg.text === t("longChatSuggestion") ||
            msg.text.includes("Tôi thấy chúng ta đã trao đổi") ||
            msg.text.includes("I think we have talked a lot")
          ) {
            return { ...msg, text: t("longChatSuggestion") };
          }
        }
        return msg;
      });

      // Chỉ cập nhật nếu có thay đổi
      if (JSON.stringify(updatedMessages) !== JSON.stringify(messages)) {
        setMessages(updatedMessages);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Nếu không phải gói Plus/Pro thì kiểm tra giới hạn
    if (!isUnlimited) {
      const usage = getChatbotUsage();
      if (usage.count >= MAX_FREE_CHATBOT_USES_PER_DAY) {
        setShowLimitModal(true);
        return;
      }
      setChatbotUsage(usage.count + 1);
    }

    // Phân tích intent của user
    const intentAnalysis = AppointmentHistoryService.analyzeUserIntent(
      input.trim()
    );

    // Cập nhật chat context
    setChatContext((prev) => ({
      ...prev,
      messageCount: prev.messageCount + 1,
      userIntent: intentAnalysis.intent,
      keywords: [...new Set([...prev.keywords, ...intentAnalysis.keywords])],
    }));

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setBotMessageDone(false); // Reset trạng thái khi gửi tin nhắn mới
    setResponseStartTime(Date.now()); // Bắt đầu đo thời gian phản hồi

    try {
      const token = localStorage.getItem("token");

      const res = await authFetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMsg.text }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      // Kiểm tra xem có phải yêu cầu đặt lịch tự động không
      const autoBookingMatch = data.reply.match(
        /AUTO_BOOK:(.+?)\|(.+?)\|(.+?)\|(\d+)/
      );

      if (autoBookingMatch) {
        // Xử lý đặt lịch tự động - KHÔNG hiển thị tin nhắn AUTO_BOOK
        handleAutoBooking(autoBookingMatch);
        return;
      }

      // Kiểm tra xem user có ý định đặt lịch không (ngay cả khi AI không trả về AUTO_BOOK)
      const hasAppointmentIntent =
        checkIfUserHasEnoughInfo(input) ||
        appointmentKeywords.some((keyword) =>
          input.toLowerCase().includes(keyword)
        );

      if (hasAppointmentIntent) {
        // Thử đặt lịch tự động nếu có đủ thông tin
        if (checkIfUserHasEnoughInfo(input)) {
          // Tạo format AUTO_BOOK giả để sử dụng hàm handleAutoBooking
          const expertMatch = input.match(
            /(?:với|với chuyên gia|chuyên gia)\s+([^,\s]+(?:\s+[^,\s]+)*)/i
          );
          const dateMatch = input.match(
            /(?:vào|ngày|lúc)\s+([^,\s]+(?:\s+[^,\s]+)*)/i
          );
          const timeMatch = input.match(
            /(?:giờ|thời gian|lúc)\s*(\d{1,2})(?::(\d{2}))?h?/i
          );
          const durationMatch = input.match(
            /(?:thời lượng|khoảng|khoảng)\s*(\d+)\s*(?:phút|phút)/i
          );

          if (expertMatch && dateMatch && timeMatch) {
            const expertName = expertMatch[1].trim();
            const date = dateMatch[1].trim();
            // Format thời gian đúng định dạng HH:mm
            const hour = timeMatch[1].padStart(2, "0");
            const minute = timeMatch[2] ? timeMatch[2] : "00";
            const time = `${hour}:${minute}`;
            const duration = durationMatch ? parseInt(durationMatch[1]) : 30;

            // Tạo format AUTO_BOOK giả để sử dụng hàm handleAutoBooking
            const autoBookingMatch = [null, expertName, date, time, duration];
            handleAutoBooking(autoBookingMatch);
            return;
          }
        }

        // Nếu không thể đặt lịch tự động, gợi ý chuyên gia
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: t("appointmentSuggestion"),
              showAppointmentButton: true,
            },
          ]);
        }, 1000);
      }

      // Nếu không phải auto-booking, hiển thị tin nhắn bình thường
      const botMessage = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);

      // Kiểm tra xem tin nhắn có gợi ý đặt lịch hẹn không - cải tiến logic nhận diện
      const replyText = data.reply.toLowerCase();

      const hasReplyAppointmentIntent =
        appointmentKeywords.some((keyword) => replyText.includes(keyword)) ||
        replyText.includes("appointment_suggestion");

      if (hasReplyAppointmentIntent) {
        // Kiểm tra xem user đã cung cấp đủ thông tin để đặt lịch tự động chưa
        const hasEnoughInfo = checkIfUserHasEnoughInfo(input);

        if (hasEnoughInfo) {
          // User đã cung cấp đủ thông tin, không cần hiển thị nút đặt lịch thủ công
          // AI sẽ tự động trả về format AUTO_BOOK
        } else {
          // User chưa cung cấp đủ thông tin, hiển thị nút đặt lịch thủ công
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: t("appointmentSuggestion"),
                showAppointmentButton: true,
              },
            ]);
          }, 1500);
        }
      } else {
        // Kiểm tra xem có cần gợi ý đặt lịch dựa trên nội dung tin nhắn không
        const userMessage = input.toLowerCase();
        const urgentKeywords = [
          t("chatbot.suicidal.hopeless"),
          t("chatbot.suicidal.wantToDie"),
          t("chatbot.suicidal.dontWantToLive"),
          t("chatbot.suicidal.tooSad"),
          t("chatbot.suicidal.stress"),
          "stress",
          t("chatbot.suicidal.worry"),
          t("chatbot.suicidal.insomnia"),
          t("chatbot.suicidal.tired"),
          "hopeless",
          "want to die",
          "don't want to live",
          "so sad",
          "stressed",
          "anxious",
          "can't sleep",
          "tired",
        ];

        const hasUrgentIssue = urgentKeywords.some((keyword) =>
          userMessage.includes(keyword)
        );

        if (hasUrgentIssue) {
          // Chỉ gợi ý đặt lịch nếu user chưa có ý định đặt lịch
          const hasAppointmentIntent = messages.some(
            (msg) =>
              msg.sender === "user" &&
              appointmentKeywords.some((keyword) =>
                msg.text.toLowerCase().includes(keyword)
              )
          );

          if (!hasAppointmentIntent) {
            setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                {
                  sender: "bot",
                  text: t("urgentIssueSuggestion"),
                  showAppointmentButton: true,
                },
              ]);
            }, 2000);
          }
        }

        // Gợi ý đặt lịch dựa trên thời gian chat (CHỈ khi thực sự cần thiết)
        // Chỉ gợi ý khi user đã chat ít nhất 5 tin nhắn và chưa có ý định đặt lịch
        const userMessages = messages.filter((msg) => msg.sender === "user");
        const hasAppointmentIntent = appointmentKeywords.some((keyword) =>
          input.toLowerCase().includes(keyword)
        );

        if (userMessages.length >= 5 && !hasAppointmentIntent) {
          suggestAppointmentBasedOnTime();
        }
      }
    } catch (e) {
      // Error in send message

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: t("chatbot.errorMessage") },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Kiểm tra xem user có quyền sử dụng chatbot không
  if (!user || user.anonymous) {
    return null; // Không hiển thị chatbot cho user chưa đăng nhập
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black bg-opacity-30 dark:bg-opacity-50"
      onClick={onClose} // Click outside để đóng modal
    >
      <div
        className="w-full max-w-xl m-4 bg-white/80 dark:bg-gray-900/80 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-[70vh] backdrop-blur-xl"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
        onClick={(e) => e.stopPropagation()} // Ngăn event bubbling khi click vào nội dung modal
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-t-3xl relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center border-4 border-white/60 shadow-lg">
              <img
                src="/src/assets/images/Chatbot.png"
                alt="MindMeter AI Assistant"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-wide">
                {t("chatbot.title")}
              </div>
              <div className="text-xs text-indigo-100 font-medium">
                {t("chatbot.subtitle")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-indigo-100 hover:text-white text-2xl font-bold p-2 rounded-full hover:bg-indigo-400 transition shadow-md"
              title={t("close")}
            >
              ×
            </button>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gradient-to-br from-white/80 via-indigo-50/80 to-purple-50/80 dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80 rounded-b-3xl custom-scrollbar">
          {messages.map((msg, idx) => {
            // Áp dụng typewriter cho mọi tin nhắn bot mới nhất (kể cả tin nhắn đầu tiên)
            const isLastBotMsg =
              msg.sender === "bot" && idx === messages.length - 1 && !loading;
            return (
              <div
                key={msg.id || idx}
                className={`flex items-end ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                {msg.sender === "bot" && (
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow mr-2 overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center relative">
                    <img
                      src="/src/assets/images/Chatbot.png"
                      alt="Chatbot"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <FaRobot
                      className="text-xl text-white absolute inset-0 m-auto"
                      style={{ display: "none" }}
                    />
                  </div>
                )}

                <div
                  className={`px-5 py-3 rounded-2xl max-w-[75%] text-base whitespace-pre-line shadow-md transition-all duration-200 ${
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-br-md"
                      : "bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 rounded-bl-md"
                  }`}
                  style={{ boxShadow: "0 2px 8px 0 rgba(31, 38, 135, 0.10)" }}
                >
                  {msg.sender === "bot" && (
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      {t("chatbot.name")}
                    </div>
                  )}
                  {msg.sender === "user" && (
                    <div className="text-xs font-semibold text-blue-200 mb-2 text-right">
                      {user
                        ? user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email
                        : t("chatbot.user")}
                    </div>
                  )}
                  {/* Luôn hiển thị appointment details nếu có, không phụ thuộc vào isLastBotMsg */}
                  {msg.showAppointmentDetails && msg.appointmentDetails && (
                    <div className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 border-2 border-green-200 dark:border-green-700 rounded-2xl shadow-lg">
                      {/* Header thành công */}
                      <div className="text-center mb-6">
                        <div className="flex justify-center mb-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <FaCheckCircle className="text-white text-3xl" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                          <FaGift className="inline-block w-6 h-6 mr-2 text-green-600" />
                          {t("appointment.success")}
                        </h3>
                        <p className="text-green-600 dark:text-green-300 text-sm">
                          {t("appointment.confirmed")}
                        </p>
                      </div>

                      {/* Thông tin lịch hẹn */}
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 mb-6 backdrop-blur-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <FaUserMd className="text-white text-lg" />
                            </div>
                            <div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {t("appointment.expert")}
                              </div>
                              <div className="font-semibold text-blue-800 dark:text-blue-200">
                                {msg.appointmentDetails.expertName}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                              <FaCalendar className="text-white text-lg" />
                            </div>
                            <div>
                              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                {t("appointment.date")}
                              </div>
                              <div className="font-semibold text-purple-800 dark:text-purple-200">
                                {msg.appointmentDetails.appointmentDate}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                              <FaClock className="text-white text-lg" />
                            </div>
                            <div>
                              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                {t("appointment.time")}
                              </div>
                              <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                                {msg.appointmentDetails.appointmentTime}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                              <FaLaptop className="text-white text-lg" />
                            </div>
                            <div>
                              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                {t("appointment.type")}
                              </div>
                              <div className="font-semibold text-orange-800 dark:text-orange-200">
                                {msg.appointmentDetails.consultationType ===
                                "ONLINE"
                                  ? t("appointment.online")
                                  : msg.appointmentDetails.consultationType ===
                                    "OFFLINE"
                                  ? t("appointment.offline")
                                  : msg.appointmentDetails.consultationType ===
                                    "PHONE"
                                  ? t("appointment.phone")
                                  : msg.appointmentDetails.consultationType}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Thông tin bổ sung */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <FaIdCard className="text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                ID: {msg.appointmentDetails.appointmentId}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  msg.appointmentDetails.status === "PENDING"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                              ></div>
                              <span className="text-gray-600 dark:text-gray-400">
                                {msg.appointmentDetails.status === "PENDING"
                                  ? t("appointment.statusPending")
                                  : msg.appointmentDetails.status ===
                                    "CONFIRMED"
                                  ? t("appointment.statusConfirmed")
                                  : msg.appointmentDetails.status ===
                                    "CANCELLED"
                                  ? t("appointment.statusCancelled")
                                  : msg.appointmentDetails.status ===
                                    "COMPLETED"
                                  ? t("appointment.statusCompleted")
                                  : msg.appointmentDetails.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Nút hành động */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            onClose(); // Đóng chatbot modal
                            window.location.href = "/appointments"; // Chuyển đến trang lịch hẹn
                          }}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <FaCalendarAlt className="text-lg" />
                          <span>{t("appointment.viewAppointments")}</span>
                        </button>

                        <button
                          onClick={() => {
                            // Tiếp tục chat
                            setInput(t("chatbot.thankYou"));
                          }}
                          className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <FaRegCommentDots className="text-lg" />
                          <span>{t("appointment.continueChat")}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Logic hiển thị tin nhắn */}
                  {isLastBotMsg && !botMessageDone ? (
                    <TypewriterMessage
                      text={msg.text || ""}
                      speed={30}
                      onDone={() => setBotMessageDone(true)}
                    />
                  ) : (
                    <>
                      {/* Hiển thị tin nhắn thông thường */}
                      {msg.text}
                      {msg.showAppointmentButton &&
                        availableExperts.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {t("selectExpertForAppointment")}
                            </div>

                            {/* Hiển thị chuyên gia được gợi ý thông minh cho tin nhắn cuối cùng */}
                            {isLastBotMsg
                              ? (() => {
                                  const issueType = analyzeUserIssue(messages);
                                  const recommendedExperts =
                                    getRecommendedExperts(issueType);

                                  return recommendedExperts.map(
                                    (expert, index) => (
                                      <button
                                        key={expert.id}
                                        onClick={() =>
                                          handleAppointmentSuggestion(
                                            expert.id,
                                            expert.firstName +
                                              " " +
                                              expert.lastName
                                          )
                                        }
                                        className={`w-full text-left p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 transition-all duration-200 text-sm shadow-sm hover:shadow-md ${
                                          index === 0
                                            ? "ring-2 ring-blue-300 dark:ring-blue-600"
                                            : ""
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <FaCalendarAlt className="text-blue-600" />
                                            <span className="font-medium text-blue-800 dark:text-blue-200">
                                              {expert.firstName}{" "}
                                              {expert.lastName}
                                            </span>
                                            {index === 0 && (
                                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                                                {t("recommended")}
                                              </span>
                                            )}
                                          </div>
                                          {expert.score > 1 && (
                                            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                              {expert.score} điểm
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                          {t("psychologist")} •{" "}
                                          {t("availableNow")}
                                        </div>
                                      </button>
                                    )
                                  );
                                })()
                              : // Hiển thị chuyên gia đơn giản cho tin nhắn cũ
                                availableExperts.slice(0, 3).map((expert) => (
                                  <button
                                    key={expert.id}
                                    onClick={() =>
                                      handleAppointmentSuggestion(
                                        expert.id,
                                        expert.firstName + " " + expert.lastName
                                      )
                                    }
                                    className="w-full text-left p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <FaCalendarAlt className="text-blue-600" />
                                      <span className="font-medium text-blue-800 dark:text-blue-200">
                                        {expert.firstName} {expert.lastName}
                                      </span>
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      {t("psychologist")}
                                    </div>
                                  </button>
                                ))}

                            {/* Nút xem tất cả chuyên gia chỉ hiển thị cho tin nhắn cuối cùng */}
                            {isLastBotMsg && (
                              <button
                                onClick={() => setShowAllExperts(true)}
                                className="w-full text-center p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-400"
                              >
                                {t("viewAllExperts")} ({availableExperts.length}
                                )
                              </button>
                            )}
                          </div>
                        )}
                    </>
                  )}
                </div>
                {msg.sender === "user" && (
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow ml-2 overflow-hidden">
                    {user && user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
                        <FaUser className="text-xl text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="flex items-end justify-start animate-fade-in">
              <div className="w-9 h-9 rounded-full border-2 border-white shadow mr-2 overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center relative">
                <img
                  src="/src/assets/images/Chatbot.png"
                  alt="Chatbot"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <FaRobot
                  className="text-xl text-white absolute inset-0 m-auto"
                  style={{ display: "none" }}
                />
              </div>
              <div className="px-5 py-3 rounded-2xl max-w-[75%] text-base bg-white/90 dark:bg-gray-800/90 text-gray-400 italic shadow-md rounded-bl-md">
                {t("responding")}
              </div>
            </div>
          )}

          {/* Hiển thị tin nhắn loading cho đặt lịch tự động */}
          {messages.map(
            (msg, idx) =>
              msg.showLoading && (
                <div
                  key={`loading-${idx}`}
                  className="flex items-end justify-start animate-fade-in"
                >
                  <div className="w-9 h-9 rounded-full border-2 border-white shadow mr-2 overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center relative">
                    <img
                      src="/src/assets/images/Chatbot.png"
                      alt="Chatbot"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <FaRobot
                      className="text-xl text-white absolute inset-0 m-auto"
                      style={{ display: "none" }}
                    />
                  </div>
                  <div className="px-5 py-3 rounded-2xl max-w-[75%] text-base bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 shadow-md rounded-bl-md">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span>{msg.text}</span>
                    </div>
                  </div>
                </div>
              )
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 rounded-b-3xl">
          <div className="flex items-center gap-3">
            {/* Menu button moved here */}
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="text-gray-400 hover:text-blue-500 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-gray-800 transition shadow-md"
                title={t("options")}
              >
                <FaEllipsisV />
              </button>
              {showMenu && (
                <div className="absolute left-0 bottom-12 w-60 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-fade-in py-2">
                  <button
                    onClick={() => downloadHistory("txt")}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition"
                  >
                    <FaDownload className="text-blue-500" />
                    {t("chatbot.downloadTxt")}
                  </button>
                  <button
                    onClick={() => downloadHistory("json")}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition"
                  >
                    <FaDownload className="text-green-500" />
                    {t("chatbot.downloadJson")}
                  </button>
                  <button
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark");
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition"
                  >
                    <FaRegLightbulb className="text-yellow-400" />
                    {t("chatbot.toggleTheme")}
                  </button>
                  <button
                    onClick={() => {
                      setShowFeedback(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition"
                  >
                    <FaRegCommentDots className="text-pink-500" />
                    {t("chatbot.feedback")}
                  </button>
                  <button
                    onClick={() => {
                      setShowGuide(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition"
                  >
                    <FaRegQuestionCircle className="text-indigo-500" />
                    {t("chatbot.guide")}
                  </button>
                  <button
                    onClick={() => {
                      setShowBotAvatar((v) => !v);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition"
                  >
                    {showBotAvatar ? (
                      <FaEyeSlash className="text-gray-500" />
                    ) : (
                      <FaEye className="text-gray-500" />
                    )}
                    {showBotAvatar
                      ? t("chatbot.hideAvatar")
                      : t("chatbot.showAvatar")}
                  </button>
                  <button
                    onClick={() => {
                      clearHistory();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-xl transition"
                  >
                    <FaTrash className="text-red-500" />
                    {t("chatbot.clearHistory")}
                  </button>
                </div>
              )}
            </div>
            <textarea
              className="flex-1 resize-none rounded-3xl border-2 border-gray-200 dark:border-gray-600 px-5 py-3 text-base bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-lg transition-all duration-200 scrollbar-hide backdrop-blur-sm"
              rows={1}
              placeholder={t("chatbot.inputPlaceholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                minHeight: 48,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-br from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white p-4 rounded-3xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center text-2xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transform hover:scale-105 disabled:hover:scale-100 disabled:transform-none disabled:hover:from-blue-500 disabled:hover:to-indigo-500"
              title={t("send")}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-200 flex items-center gap-2">
                <FaRegCommentDots /> {t("chatbot.feedback")}
              </div>
              <button
                onClick={() => setShowFeedback(false)}
                className="text-gray-400 hover:text-red-500 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              rows={4}
              placeholder={t("chatbot.feedbackInputPlaceholder")}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button
              onClick={handleFeedbackSubmit}
              disabled={!feedback.trim() || feedbackLoading}
              className="bg-gradient-to-br from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2 rounded-full font-semibold disabled:opacity-50"
            >
              {feedbackLoading ? t("sending") : t("chatbot.feedbackSubmit")}
            </button>
          </div>
        </div>
      )}
      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-xs text-center animate-fade-in">
            <div className="text-2xl font-bold text-blue-600 mb-2 flex items-center justify-center gap-2">
              <FaRegSmile className="inline text-3xl" />
              {t("chatbot.thankYou")}
            </div>
            <div className="text-gray-700 dark:text-gray-200 mb-4">
              {t("chatbot.thankYouMessage")}
            </div>
            <button
              onClick={() => setShowThankYou(false)}
              className="bg-gradient-to-br from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2 rounded-full font-semibold"
            >
              {t("chatbot.thankYouClose")}
            </button>
          </div>
        </div>
      )}
      {/* AI Assistant User Guide Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            e.stopPropagation();
            setShowGuide(false);
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg animate-fade-in"
            onClick={(e) => e.stopPropagation()} // Ngăn event bubbling
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-200 flex items-center gap-2">
                <FaRegQuestionCircle className="text-xl" /> {t("guide.title")}
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-gray-400 hover:text-red-500 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {t("guide.sections", { returnObjects: true }).map(
                (section, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-indigo-500 pl-3"
                  >
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                      {section.title}
                    </h3>
                    <ul className="space-y-1">
                      {section.content.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="text-gray-700 dark:text-gray-200 text-xs leading-relaxed flex items-start"
                        >
                          <span className="text-indigo-500 mr-2 flex-shrink-0">
                            •
                          </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtmlSafe(item),
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}

              <div className="text-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                  {t("guide.footer")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Thêm modal khi hết lượt */}
      {showLimitModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40"
          onClick={() => setShowLimitModal(false)} // Click outside để đóng modal
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in text-center"
            onClick={(e) => e.stopPropagation()} // Ngăn event bubbling
          >
            <div className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
              {t("chatbot.limitTitle")}
            </div>
            <div className="text-gray-700 dark:text-gray-200 mb-6">
              {t("chatbot.limitDesc")}
            </div>
            <button
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow"
              onClick={() => {
                setShowLimitModal(false);
                window.location.href = "/pricing";
              }}
            >
              {t("chatbot.limitBtn")}
            </button>
          </div>
        </div>
      )}

      {/* All Experts Modal */}
      {showAllExperts && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            // Chỉ đóng modal experts, không ảnh hưởng đến chatbot
            e.stopPropagation();
            setShowAllExperts(false);
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // Ngăn event bubbling
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("allAvailableExperts")}
              </h3>
              <button
                onClick={() => setShowAllExperts(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableExperts.map((expert) => (
                <button
                  key={expert.id}
                  onClick={() => {
                    handleAppointmentSuggestion(
                      expert.id,
                      expert.firstName + " " + expert.lastName
                    );
                    setShowAllExperts(false);
                  }}
                  className="w-full text-left p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700 rounded-lg hover:from-gray-100 hover:to-blue-100 dark:hover:from-gray-700 dark:hover:to-blue-900/40 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    {expert.avatarUrl ? (
                      <img
                        src={expert.avatarUrl}
                        alt={`${expert.firstName} ${expert.lastName}`}
                        className="w-12 h-12 rounded-full border-2 border-blue-400 shadow-md object-cover"
                        onError={(e) => {
                          // Fallback to default icon if image fails to load
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center ${
                        expert.avatarUrl ? "hidden" : ""
                      }`}
                    >
                      <FaUser className="text-white text-lg" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {expert.firstName} {expert.lastName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("psychologist")}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaCalendarAlt className="text-blue-500" />
                      <span>{t("availableForConsultation")}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaRegLightbulb className="text-yellow-500" />
                      <span>{t("specializedInMentalHealth")}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Appointment Booking Modal */}
      {showAppointmentModal && selectedExpert && (
        <AppointmentBookingModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedExpert(null);
          }}
          expertId={selectedExpert.id}
          expertName={selectedExpert.name}
          onAppointmentCreated={() => {
            // Chỉ đóng modal, không chuyển hướng ngay lập tức
            // Modal thành công sẽ tự xử lý việc chuyển hướng
            setShowAppointmentModal(false);
            setSelectedExpert(null);
          }}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={() =>
          setNotificationModal((prev) => ({ ...prev, isOpen: false }))
        }
        type={notificationModal.type}
        title={notificationModal.title}
        message={notificationModal.message}
        onConfirm={notificationModal.onConfirm}
      />
    </div>
  );
};

export default ChatBotModal;
