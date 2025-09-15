import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { authFetch } from "../authFetch";

export default function TestDetailModal({
  open,
  onClose,
  initialTest,
  adminMode,
}) {
  const { t, i18n } = useTranslation();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [error, setError] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [searchName, setSearchName] = useState("");

  // Ref cho từng item
  const itemRefs = useRef({});

  useEffect(() => {
    if (open) {
      setLoading(true);
      const url = adminMode
        ? "/api/admin/test-results"
        : "/api/expert/test-results";
      authFetch(url)
        .then((res) => res.json())
        .then((data) => (Array.isArray(data) ? setTests(data) : setTests([])))
        .catch(() => setTests([]))
        .finally(() => setLoading(false));
    }
  }, [open, t, adminMode]);

  // Xử lý phím ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll khi modal mở
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore body scroll khi modal đóng
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && initialTest && initialTest.id) {
      setSelectedTest(initialTest);
      setLoadingAnswers(true);
      const url = adminMode
        ? `/api/admin/test-results/${initialTest.id}/answers`
        : `/api/expert/test-results/${initialTest.id}/answers`;
      authFetch(url)
        .then((res) => res.json())
        .then(setAnswers)
        .catch(() => setError(t("loadTestDetailError")))
        .finally(() => setLoadingAnswers(false));
    }
  }, [open, initialTest, t, adminMode]);

  // Scroll vào mục được chọn khi selectedTest thay đổi
  useEffect(() => {
    if (selectedTest && itemRefs.current[selectedTest.id]) {
      itemRefs.current[selectedTest.id].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedTest]);

  const handleSelectTest = (test) => {
    setSelectedTest(test);
    setLoadingAnswers(true);
    const url = adminMode
      ? `/api/admin/test-results/${test.id}/answers`
      : `/api/expert/test-results/${test.id}/answers`;
    authFetch(url)
      .then((res) => res.json())
      .then(setAnswers)
      .catch(() => setError(t("loadTestDetailError")))
      .finally(() => setLoadingAnswers(false));
  };

  // Hàm normalize bỏ dấu, chuyển thường, loại ký tự đặc biệt
  function normalize(str) {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9\s]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Hàm kiểm tra fuzzy match
  function fuzzyMatch(text, search) {
    if (!search) return true;
    text = normalize(text);
    search = normalize(search);
    if (text.includes(search)) return true;
    // Fuzzy: tất cả ký tự search xuất hiện theo thứ tự trong text
    let i = 0;
    for (let c of search) {
      i = text.indexOf(c, i);
      if (i === -1) return false;
      i++;
    }
    return true;
  }

  // Hàm highlight phần khớp
  function highlightMatch(text, search) {
    if (!search) return text;
    const normText = normalize(text);
    const normSearch = normalize(search);
    const idx = normText.indexOf(normSearch);
    if (idx === -1) return text;
    // Tìm vị trí thật trong text gốc
    let realIdx = 0,
      count = 0;
    for (let i = 0; i < text.length; i++) {
      if (normalize(text[i])) {
        if (count === idx) {
          realIdx = i;
          break;
        }
        count++;
      }
    }
    return (
      <>
        {text.slice(0, realIdx)}
        <span className="bg-yellow-200 dark:bg-yellow-600 text-black dark:text-white rounded px-1">
          {text.slice(realIdx, realIdx + search.length)}
        </span>
        {text.slice(realIdx + search.length)}
      </>
    );
  }

  const handleOverlayClick = (e) => {
    // Chỉ đóng modal khi click vào overlay (không phải modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Hàm format tên theo ngôn ngữ
  function formatStudentName(studentName) {
    if (!studentName) return "";

    // Debug: log ra để xem cấu trúc tên

    // Tách firstName và lastName từ studentName (format: "firstName lastName")
    const nameParts = studentName.trim().split(" ");

    if (nameParts.length < 2) return studentName;

    // Logic mới: với tên "Kiên Cường Trần"
    // firstName = "Kiên Cường" (tên đệm + tên chính)
    // lastName = "Trần" (họ)
    let firstName, lastName;

    if (nameParts.length === 3) {
      // Trường hợp 3 từ: "Kiên Cường Trần"
      firstName = nameParts[0] + " " + nameParts[1]; // "Kiên Cường"
      lastName = nameParts[2]; // "Trần"
    } else if (nameParts.length === 2) {
      // Trường hợp 2 từ: "Kiên Trần"
      firstName = nameParts[0]; // "Kiên"
      lastName = nameParts[1]; // "Trần"
    } else {
      // Trường hợp khác
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(" ");
    }

    // Tiếng Việt: họ trước, tên sau (Trần Kiên Cường)
    // Tiếng Anh: tên trước, họ sau (Kien Cuong Tran)
    if (i18n.language === "en") {
      // Tiếng Anh: bỏ dấu và giữ format firstName lastName
      const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      };
      const result = `${removeAccents(firstName)} ${removeAccents(lastName)}`;

      return result;
    } else {
      // Tiếng Việt: đảo ngược thứ tự (lastName firstName)
      // Ví dụ: "Kiên Cường Trần" -> "Trần Kiên Cường"
      const result = `${lastName} ${firstName}`;

      return result;
    }
  }

  // Hàm lấy text đáp án dựa trên test type và giá trị
  function getAnswerText(answerValue, testType) {
    // Xác định test type cơ bản (bỏ suffix -EN)
    const baseTestType = testType?.replace("-EN", "") || "";

    // Mapping đáp án cho từng test type - Admin thấy theo ngôn ngữ họ đang dùng
    const answerMappings = {
      "DASS-21": {
        vi: {
          0: "Không đúng với tôi chút nào cả",
          1: "Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng",
          2: "Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng",
          3: "Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng",
        },
        en: {
          0: "Not at all",
          1: "Somewhat, or occasionally",
          2: "Mostly, or most of the time",
          3: "Completely, or almost always",
        },
      },
      "DASS-42": {
        vi: {
          0: "Không đúng với tôi chút nào cả",
          1: "Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng",
          2: "Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng",
          3: "Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng",
        },
        en: {
          0: "Not at all",
          1: "Somewhat, or occasionally",
          2: "Mostly, or most of the time",
          3: "Completely, or almost always",
        },
      },
      BDI: {
        vi: {
          0: "Không có",
          1: "Nhẹ",
          2: "Vừa phải",
          3: "Nặng",
          4: "Rất nặng",
        },
        en: {
          0: "None",
          1: "Mild",
          2: "Moderate",
          3: "Severe",
          4: "Very severe",
        },
      },
      EPDS: {
        vi: {
          0: "Không có",
          1: "Đôi khi",
          2: "Phần lớn thời gian",
          3: "Hầu hết hoặc tất cả thời gian",
        },
        en: {
          0: "Not at all",
          1: "Sometimes",
          2: "Most of the time",
          3: "Almost always",
        },
      },
      RADS: {
        vi: {
          0: "Hầu như không",
          1: "Thỉnh thoảng",
          2: "Phần lớn thời gian",
          3: "Hầu hết hoặc tất cả thời gian",
        },
        en: {
          0: "Hardly ever",
          1: "Sometimes",
          2: "Most of the time",
          3: "Almost always",
        },
      },
      SAS: {
        vi: {
          0: "Không có",
          1: "Đôi khi",
          2: "Phần lớn thời gian",
          3: "Hầu hết hoặc tất cả thời gian",
        },
        en: {
          0: "Not at all",
          1: "Sometimes",
          2: "Most of the time",
          3: "Almost always",
        },
      },
    };

    // Lấy mapping cho test type cụ thể
    const mapping = answerMappings[baseTestType];
    if (mapping) {
      // Chọn ngôn ngữ dựa trên ngôn ngữ admin đang dùng
      const language = i18n.language === "en" ? "en" : "vi";
      const languageMapping = mapping[language];

      if (languageMapping && languageMapping[answerValue] !== undefined) {
        return languageMapping[answerValue];
      }
    }

    // Fallback: trả về giá trị số nếu không có mapping
    return answerValue?.toString() || "N/A";
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative">
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 pt-4 pb-4 border-b dark:border-gray-700 shadow-sm px-6 rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-300 flex-1 text-center">
              {t("surveyDetailTitle")}
            </h2>
            <button
              className="text-gray-500 hover:text-red-500 text-2xl ml-4"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm w-full max-w-xl">
              <FunnelIcon className="w-5 h-5 text-blue-500 dark:text-blue-300 mr-1" />
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-100 whitespace-nowrap">
                {t("filterByLevel")}:
              </label>
              <select
                className="border-none outline-none rounded-full px-3 py-1 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 transition"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
              >
                <option value="ALL">{t("allLevels")}</option>
                <option value="minimal">{t("minimal")}</option>
                <option value="mild">{t("mild")}</option>
                <option value="moderate">{t("moderate")}</option>
                <option value="severe">{t("severe")}</option>
              </select>
              <input
                type="text"
                className="ml-4 border-none outline-none rounded-full px-3 py-1 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 transition w-64 max-w-full"
                placeholder={t("searchByName")}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Danh sách bài test - hiển thị cho cả admin và expert */}
            <div className="md:w-1/3 w-full border-r dark:border-gray-700 pr-2 overflow-y-auto max-h-[60vh]">
              <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-100">
                {t("surveyList")}
              </h3>
              {Array.isArray(tests) && tests.length > 0 ? (
                <ul className="space-y-2">
                  {tests
                    .filter(
                      (test) =>
                        filterLevel === "ALL" ||
                        test.severityLevel?.toLowerCase() === filterLevel
                    )
                    .filter((test) => fuzzyMatch(test.studentName, searchName))
                    .map((test) => (
                      <li
                        key={test.id}
                        ref={(el) => (itemRefs.current[test.id] = el)}
                        className={`p-2 rounded cursor-pointer transition font-medium ${
                          selectedTest && selectedTest.id === test.id
                            ? "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-100"
                        }`}
                        onClick={() => handleSelectTest(test)}
                      >
                        <div>
                          {highlightMatch(
                            formatStudentName(test.studentName),
                            searchName
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                          {t("score")}: {test.totalScore} | {t("level")}:{" "}
                          {t(test.severityLevel?.toLowerCase())}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-400">
                          {t("testedAt")}:{" "}
                          {test.testedAt?.replace("T", " ").slice(0, 16)}
                        </div>
                      </li>
                    ))}
                </ul>
              ) : loading ? null : (
                <div className="text-gray-400 text-center">
                  {t("noSurveyData")}
                </div>
              )}
            </div>
            {/* Chi tiết bài test */}
            <div className="md:w-2/3 w-full pl-2">
              {selectedTest ? (
                <>
                  <div className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-100">
                    {formatStudentName(selectedTest.studentName)} - {t("score")}
                    : {selectedTest.totalScore} - {t("level")}:{" "}
                    {t(selectedTest.severityLevel?.toLowerCase())}
                  </div>
                  <div className="mb-2 text-sm text-gray-500 dark:text-gray-300">
                    {t("testedAt")}:{" "}
                    {selectedTest.testedAt?.replace("T", " ").slice(0, 16)}
                  </div>
                  {loadingAnswers ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      {/* Loading Spinner */}
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div
                          className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"
                          style={{ animationDelay: "-0.5s" }}
                        ></div>
                      </div>

                      {/* Loading Text */}
                      <div className="mt-4 text-center">
                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                          {t("loading")}
                        </p>
                      </div>

                      {/* Loading Dots Animation */}
                      <div className="flex space-x-1 mt-3">
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {(Array.isArray(answers) ? answers : []).map(
                        (ans, idx) => (
                          <li
                            key={ans.questionId}
                            className="p-3 rounded bg-gray-100 dark:bg-gray-800"
                          >
                            <div className="font-medium text-gray-700 dark:text-gray-100 mb-1">
                              {t("question") + " " + (idx + 1)}:{" "}
                              {/* Admin thấy câu hỏi theo ngôn ngữ họ đang dùng */}
                              {i18n.language === "en"
                                ? ans.questionTextEn || ans.questionText
                                : ans.questionTextVi || ans.questionText}
                            </div>
                            <div className="text-sm mt-2 text-gray-400 dark:text-gray-300">
                              <span className="font-semibold text-gray-500 dark:text-gray-200">
                                {t("answer")}:{" "}
                              </span>
                              <span className="text-blue-500 font-bold">
                                {getAnswerText(
                                  ans.answerValue,
                                  selectedTest?.testType
                                )}
                              </span>
                            </div>
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-center">
                  {t("selectSurveyToView")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
