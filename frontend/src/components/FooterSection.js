import React from "react";
import { FaBrain } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function FooterSection() {
  const { t } = useTranslation();
  return (
    <footer className="w-full bg-blue-800 dark:bg-[#232a36] text-white dark:text-gray-100 pt-10 pb-4 px-2 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        {/* Logo & Slogan */}
        <div className="flex-1 flex flex-col items-center md:items-start mb-8 md:mb-0">
          {/* Brain icon + MindMeter */}
          <div className="mb-2 flex items-center">
            <FaBrain className="w-8 h-8 text-indigo-400 dark:text-indigo-300 mr-2" />
            <span className="font-bold text-2xl align-middle">MindMeter</span>
          </div>
          <div className="text-sm opacity-90 max-w-xs text-center md:text-left">
            {t("footer.slogan")}
          </div>
        </div>
        {/* 2 cột ngang hàng trên mobile: Thông tin chung & Liên kết khác */}
        <div className="flex flex-row gap-12 items-start justify-center w-full md:w-auto mb-8 md:mb-0">
          {/* Thông tin chung */}
          <div className="flex-1 min-w-[150px] mb-8 md:mb-0">
            <div className="font-bold text-lg mb-2 whitespace-nowrap">
              {t("footer.generalInfo")}
            </div>
            <ul className="space-y-1 text-sm opacity-90">
              <li>
                <Link
                  to="/user-guide"
                  className="flex items-center hover:text-yellow-300 dark:hover:text-yellow-300 transition"
                >
                  <span className="text-green-400 dark:text-green-300 mr-1">
                    &#8250;
                  </span>{" "}
                  {t("footer.userGuide")}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="flex items-center hover:text-yellow-300 dark:hover:text-yellow-300 transition"
                >
                  <span className="text-green-400 dark:text-green-300 mr-1">
                    &#8250;
                  </span>{" "}
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-use"
                  className="flex items-center hover:text-yellow-300 dark:hover:text-yellow-300 transition"
                >
                  <span className="text-green-400 dark:text-green-300 mr-1">
                    &#8250;
                  </span>{" "}
                  {t("footer.termsOfUse")}
                </Link>
              </li>
              <li>
                <Link
                  to="/disclaimer"
                  className="flex items-center hover:text-yellow-300 dark:hover:text-yellow-300 transition"
                >
                  <span className="text-green-400 dark:text-green-300 mr-1">
                    &#8250;
                  </span>{" "}
                  {t("footer.disclaimer")}
                </Link>
              </li>
            </ul>
          </div>
          {/* Liên kết khác */}
          <div className="flex-1 min-w-[150px] mb-8 md:mb-0">
            <div className="font-bold text-lg mb-2 whitespace-nowrap">
              {t("footer.otherLinks")}
            </div>
            <ul className="space-y-1 text-sm opacity-90">
              <li>
                <Link
                  to="/home"
                  className="flex items-center hover:text-yellow-300 dark:hover:text-yellow-300 transition"
                >
                  <span className="text-green-400 dark:text-green-300 mr-1">
                    &#8250;
                  </span>{" "}
                  {t("footer.home")}
                </Link>
              </li>
              <li>
                <Link
                  to="introduce"
                  className="flex items-center hover:text-yellow-300 dark:hover:text-yellow-300 transition"
                >
                  <span className="text-green-400 dark:text-green-300 mr-1">
                    &#8250;
                  </span>{" "}
                  {t("footer.introduce")}
                </Link>
              </li>
              <li>
                <Link
                  to="/home#test-section"
                  className="flex items-center hover:text-yellow-300 dark:hover:text-yellow-300 transition"
                >
                  <span className="text-green-400 dark:text-green-300 mr-1">
                    &#8250;
                  </span>{" "}
                  {t("footer.tests")}
                </Link>
              </li>
              <li>
                <Link
                  to="/consult-therapy"
                  className="flex items-center hover:text-yellow-300 dark:hover:text-yellow-300 transition"
                >
                  <span className="text-green-400 dark:text-green-300 mr-1">
                    &#8250;
                  </span>{" "}
                  {t("footer.therapy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        {/* Liên hệ */}
        <div className="flex-1 min-w-[200px] flex flex-col items-center md:items-start">
          <div className="font-bold text-lg mb-2">{t("footer.contact")}</div>
          <div className="text-sm opacity-90 mb-2 text-center md:text-left">
            {t("footer.contactDesc")}
          </div>
          <ul className="text-sm opacity-90">
            <li>
              {t("footer.emailLabel")}{" "}
              <a
                href="mailto:mindmeter.app@gmail.com"
                className="underline hover:text-yellow-300 dark:hover:text-yellow-300"
              >
                mindmeter.app@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      {/* Border top */}
      <div className="border-t border-white/30 dark:border-gray-600 my-6"></div>
      {/* Copyright */}
      <div className="max-w-7xl mx-auto text-xs opacity-80 text-center">
        © {new Date().getFullYear()} MindMeter. {t("footer.copyrightRights")}
      </div>
    </footer>
  );
}
