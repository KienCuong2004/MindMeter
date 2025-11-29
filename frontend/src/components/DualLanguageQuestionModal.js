import React from "react";
import { useTranslation } from "react-i18next";

const DualLanguageQuestionModal = ({
  showModal,
  onClose,
  modalQuestion,
  setModalQuestion,
  onSave,
  isEdit = false,
}) => {
  const { t } = useTranslation();

  // State để kiểm soát form validation
  const [formErrors, setFormErrors] = React.useState({});

  // Function để validate form
  const validateForm = () => {
    const errors = {};

    // Validate question type
    if (!modalQuestion.category?.trim()) {
      errors.category = t("questionTypeRequired");
    }

    // Validate question text
    if (!modalQuestion.questionTextVi?.trim()) {
      errors.questionTextVi = t("questionTextViRequired");
    }
    if (!modalQuestion.questionTextEn?.trim()) {
      errors.questionTextEn = t("questionTextEnRequired");
    }

    // Validate options
    if (
      !modalQuestion.optionsVi?.length ||
      modalQuestion.optionsVi.some((opt) => !opt.optionText?.trim())
    ) {
      errors.optionsVi = t("optionsViRequired");
    }
    if (
      !modalQuestion.optionsEn?.length ||
      modalQuestion.optionsEn.some((opt) => !opt.optionText?.trim())
    ) {
      errors.optionsEn = t("optionsEnRequired");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Function để kiểm tra form có đầy đủ thông tin không
  const isFormComplete = () => {
    return (
      modalQuestion.category?.trim() &&
      modalQuestion.questionTextVi?.trim() &&
      modalQuestion.questionTextEn?.trim() &&
      modalQuestion.optionsVi?.length > 0 &&
      modalQuestion.optionsVi.every((opt) => opt.optionText?.trim()) &&
      modalQuestion.optionsEn?.length > 0 &&
      modalQuestion.optionsEn.every((opt) => opt.optionText?.trim())
    );
  };

  // Cleanup form errors khi modal đóng
  React.useEffect(() => {
    if (!showModal) {
      setFormErrors({});
    }
  }, [showModal]);

  // Handle Escape key để đóng modal
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && showModal) {
        handleClose();
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showModal]);

  if (!showModal) return null;

  const handleSave = () => {
    if (validateForm()) {
      onSave();
    }
  };

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Modal close button clicked
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? t("editQuestion") : t("addQuestion")}
          </h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Question Type Selection */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <label className="text-gray-700 dark:text-gray-200 text-sm font-medium whitespace-nowrap">
              {t("questionType")}:
            </label>
            <div className="relative flex-1 max-w-[200px]">
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 text-sm bg-white dark:bg-gray-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-lg appearance-none cursor-pointer"
                value={modalQuestion.category || ""}
                onChange={(e) => {
                  setModalQuestion({
                    ...modalQuestion,
                    category: e.target.value,
                  });
                }}
                required
              >
                <option value="">{t("selectQuestionType")}</option>
                <option value="DASS-21">DASS-21</option>
                <option value="DASS-42">DASS-42</option>
                <option value="BDI">BDI</option>
                <option value="RADS">RADS</option>
                <option value="EPDS">EPDS</option>
                <option value="SAS">SAS</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
          {formErrors.category && (
            <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
          )}
        </div>

        {/* Dual Language Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column - Vietnamese Form */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("vietnamese")}
                </h3>

                {/* Question Content */}
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
                    {t("questionContent")}
                  </label>
                  <textarea
                    className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 w-full focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-sm dark:bg-gray-800 dark:text-white"
                    rows={4}
                    value={modalQuestion.questionTextVi || ""}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setModalQuestion({
                        ...modalQuestion,
                        questionTextVi: newValue,
                        questionText: newValue, // Sync main field
                      });
                    }}
                    placeholder={t("enterQuestionContentVi")}
                    required
                  />
                  {formErrors.questionTextVi && (
                    <p className="text-red-500 text-sm mt-1">
                      {t("questionTextViRequired")}
                    </p>
                  )}
                </div>

                {/* Question Options */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-3">
                    {t("questionOptions")}
                  </label>
                  <div className="space-y-3">
                    {modalQuestion.optionsVi?.map((option, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <div className="flex-1">
                          <input
                            type="text"
                            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 w-full focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-sm dark:bg-gray-800 dark:text-white"
                            placeholder={`${t("optionNumber", {
                              number: index + 1,
                            })}`}
                            value={option.optionText}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              const newOptions = [...modalQuestion.optionsVi];
                              newOptions[index].optionText = newValue;

                              // Sync với main options
                              const mainOptions = [...modalQuestion.options];
                              if (mainOptions[index]) {
                                mainOptions[index].optionText = newValue;
                              }

                              setModalQuestion({
                                ...modalQuestion,
                                optionsVi: newOptions,
                                options: mainOptions,
                              });
                            }}
                          />
                        </div>
                        <div className="w-16">
                          <input
                            type="number"
                            className="border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-2 w-full focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-sm dark:bg-gray-800 dark:text-white"
                            placeholder={t("score")}
                            value={option.optionValue}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              const newOptions = [...modalQuestion.optionsVi];
                              newOptions[index].optionValue = value;

                              // Sync values across all option arrays
                              const mainOptions = [...modalQuestion.options];
                              const enOptions = [...modalQuestion.optionsEn];
                              if (mainOptions[index])
                                mainOptions[index].optionValue = value;
                              if (enOptions[index])
                                enOptions[index].optionValue = value;
                              setModalQuestion({
                                ...modalQuestion,
                                optionsVi: newOptions,
                                options: mainOptions,
                                optionsEn: enOptions,
                              });
                            }}
                          />
                        </div>
                        {modalQuestion.optionsVi.length > 2 && (
                          <button
                            type="button"
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                            onClick={() => {
                              const newOptionsVi =
                                modalQuestion.optionsVi.filter(
                                  (_, i) => i !== index
                                );
                              const newOptionsEn =
                                modalQuestion.optionsEn.filter(
                                  (_, i) => i !== index
                                );
                              const newMainOptions =
                                modalQuestion.options.filter(
                                  (_, i) => i !== index
                                );
                              setModalQuestion({
                                ...modalQuestion,
                                optionsVi: newOptionsVi.map((opt, idx) => ({
                                  ...opt,
                                  order: idx + 1,
                                })),
                                optionsEn: newOptionsEn.map((opt, idx) => ({
                                  ...opt,
                                  order: idx + 1,
                                })),
                                options: newMainOptions.map((opt, idx) => ({
                                  ...opt,
                                  order: idx + 1,
                                })),
                              });
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Option Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newOption = {
                        optionText: "",
                        optionValue: modalQuestion.optionsVi.length,
                        order: modalQuestion.optionsVi.length + 1,
                      };

                      setModalQuestion({
                        ...modalQuestion,
                        optionsVi: [...modalQuestion.optionsVi, newOption],
                        optionsEn: [...modalQuestion.optionsEn, newOption],
                        options: [...modalQuestion.options, newOption],
                      });
                    }}
                    className="mt-3 w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-green-400 hover:text-green-500 dark:hover:border-green-500 dark:hover:text-green-400 transition-colors"
                  >
                    + {t("addOption")}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - English Form */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("english")}
                </h3>

                {/* Question Content */}
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
                    {t("questionContent")}
                  </label>
                  <textarea
                    className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-sm dark:bg-gray-800 dark:text-white"
                    rows={4}
                    value={modalQuestion.questionTextEn || ""}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setModalQuestion({
                        ...modalQuestion,
                        questionTextEn: newValue,
                      });
                    }}
                    placeholder={t("enterQuestionContentEn")}
                    required
                  />
                  {formErrors.questionTextEn && (
                    <p className="text-red-500 text-sm mt-1">
                      {t("questionTextEnRequired")}
                    </p>
                  )}
                </div>

                {/* Question Options */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-3">
                    {t("questionOptions")}
                  </label>
                  <div className="space-y-3">
                    {modalQuestion.optionsEn?.map((option, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <div className="flex-1">
                          <input
                            type="text"
                            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-sm dark:bg-gray-800 dark:text-white"
                            placeholder={`${t("optionNumber", {
                              number: index + 1,
                            })}`}
                            value={option.optionText}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              const newOptions = [...modalQuestion.optionsEn];
                              newOptions[index].optionText = newValue;

                              // Sync với main options
                              const mainOptions = [...modalQuestion.options];
                              if (mainOptions[index]) {
                                mainOptions[index].optionText = newValue;
                              }

                              setModalQuestion({
                                ...modalQuestion,
                                optionsEn: newOptions,
                                options: mainOptions,
                              });
                            }}
                          />
                        </div>
                        <div className="w-16">
                          <input
                            type="number"
                            className="border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-2 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors text-sm dark:bg-gray-800 dark:text-white"
                            placeholder={t("score")}
                            value={option.optionValue}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              const newOptions = [...modalQuestion.optionsEn];
                              newOptions[index].optionValue = value;

                              // Sync values across all option arrays
                              const mainOptions = [...modalQuestion.options];
                              const viOptions = [...modalQuestion.optionsVi];
                              if (mainOptions[index])
                                mainOptions[index].optionValue = value;
                              if (viOptions[index])
                                viOptions[index].optionValue = value;
                              setModalQuestion({
                                ...modalQuestion,
                                optionsEn: newOptions,
                                options: mainOptions,
                                optionsVi: viOptions,
                              });
                            }}
                          />
                        </div>
                        {modalQuestion.optionsEn.length > 2 && (
                          <button
                            type="button"
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                            onClick={() => {
                              const newOptionsEn =
                                modalQuestion.optionsEn.filter(
                                  (_, i) => i !== index
                                );
                              const newOptionsVi =
                                modalQuestion.optionsVi.filter(
                                  (_, i) => i !== index
                                );
                              const newMainOptions =
                                modalQuestion.options.filter(
                                  (_, i) => i !== index
                                );
                              setModalQuestion({
                                ...modalQuestion,
                                optionsEn: newOptionsEn.map((opt, idx) => ({
                                  ...opt,
                                  order: idx + 1,
                                })),
                                optionsVi: newOptionsVi.map((opt, idx) => ({
                                  ...opt,
                                  order: idx + 1,
                                })),
                                options: newMainOptions.map((opt, idx) => ({
                                  ...opt,
                                  order: idx + 1,
                                })),
                              });
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Option Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newOption = {
                        optionText: "",
                        optionValue: modalQuestion.optionsEn.length,
                        order: modalQuestion.optionsEn.length + 1,
                      };

                      setModalQuestion({
                        ...modalQuestion,
                        optionsVi: [...modalQuestion.optionsVi, newOption],
                        optionsEn: [...modalQuestion.optionsEn, newOption],
                        options: [...modalQuestion.options, newOption],
                      });
                    }}
                    className="mt-3 w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    + {t("addOption")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          {/* Form Status Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-3 h-3 rounded-full ${
                isFormComplete()
                  ? "bg-green-500 animate-pulse"
                  : "bg-yellow-500"
              }`}
            ></div>
            <span
              className={`${
                isFormComplete()
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {isFormComplete() ? t("formComplete") : t("formIncomplete")}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormComplete()}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                isFormComplete()
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg cursor-pointer"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
              }`}
            >
              {isEdit ? t("update") : t("addNew")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualLanguageQuestionModal;
