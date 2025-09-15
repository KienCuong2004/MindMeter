import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function FAQSection() {
  const { t } = useTranslation();

  // Get FAQs data with fallback
  let faqs = [];
  try {
    const faqsData = t("faq.list", { returnObjects: true });
    // Check if faqsData is an array and has content
    if (Array.isArray(faqsData) && faqsData.length > 0) {
      faqs = faqsData;
    } else {
      // Fallback FAQ data if translation is not available
      faqs = [
        {
          q: t("faq.fallback.question1") || "What is MindMeter?",
          a:
            t("faq.fallback.answer1") ||
            "MindMeter is a mental health assessment platform that helps users evaluate their psychological well-being through scientifically validated tests.",
        },
        {
          q: t("faq.fallback.question2") || "How does the testing work?",
          a:
            t("faq.fallback.answer2") ||
            "Our platform offers various psychological assessments including depression screening, anxiety tests, and other mental health evaluations.",
        },
        {
          q: t("faq.fallback.question3") || "Is my data secure?",
          a:
            t("faq.fallback.answer3") ||
            "Yes, we prioritize your privacy and data security. All personal information is encrypted and protected according to strict privacy standards.",
        },
        {
          q: t("faq.fallback.question4") || "Can I get professional help?",
          a:
            t("faq.fallback.answer4") ||
            "Yes, we connect users with qualified mental health professionals for consultations and support when needed.",
        },
      ];
    }
  } catch (error) {
    // Error loading FAQ data
    // Use fallback data if there's an error
    faqs = [
      {
        q: "What is MindMeter?",
        a: "MindMeter is a mental health assessment platform that helps users evaluate their psychological well-being through scientifically validated tests.",
      },
      {
        q: "How does the testing work?",
        a: "Our platform offers various psychological assessments including depression screening, anxiety tests, and other mental health evaluations.",
      },
      {
        q: "Is my data secure?",
        a: "Yes, we prioritize your privacy and data security. All personal information is encrypted and protected according to strict privacy standards.",
      },
      {
        q: "Can I get professional help?",
        a: "Yes, we connect users with qualified mental health professionals for consultations and support when needed.",
      },
    ];
  }

  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-2">
        {t("faq.title")}
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-5xl mx-auto leading-relaxed text-base break-words tracking-normal">
        {t("faq.desc")}
      </p>
      <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
        {/* Left: Illustration */}
        <div className="flex-1 flex justify-center items-center md:justify-start mb-8 md:mb-0 mt-8 md:mt-12">
          <img
            src="/src/assets/images/Cau_hoi_thuong_gap_2.png"
            alt={t("faq.imgAlt")}
            className="w-[500px] h-[500px] md:w-[650px] md:h-[650px] object-contain"
          />
        </div>
        {/* Right: Accordion FAQ */}
        <div className="flex-1 w-full max-w-2xl">
          {faqs && faqs.length > 0 ? (
            faqs.map((faq, idx) => (
              <div key={idx} className="mb-2">
                <button
                  className={`w-full flex justify-between items-center rounded-xl px-6 py-4 text-left text-sm md:text-base font-semibold focus:outline-none transition-all duration-200 border-2 shadow-sm
                    ${
                      openIdx === idx
                        ? "border-blue-700 bg-white text-blue-700 dark:bg-gray-900 dark:text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:border-blue-400 dark:bg-gray-900 dark:text-white"
                    }
                  `}
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                >
                  <span
                    className={`font-bold ${
                      openIdx === idx
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {faq.q}
                  </span>
                  <span
                    className={`ml-4 transition-transform duration-200 flex items-center ${
                      openIdx === idx
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-gray-400 dark:text-gray-300"
                    } ${openIdx === idx ? "rotate-180" : ""}`}
                  >
                    <svg
                      width="28"
                      height="28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                {openIdx === idx && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl px-6 py-5 text-gray-900 dark:text-white text-sm md:text-base border-2 border-blue-100 dark:border-gray-700 shadow-lg mt-2 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t("faq.noData") || "No FAQ data available"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
