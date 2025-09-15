import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AboutSection() {
  const { t } = useTranslation();
  return (
    <React.Fragment>
      <div className="w-full bg-white p-8 md:p-12 my-1 md:my-12 dark:bg-gray-900">
        <section className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 flex flex-col justify-center max-w-2xl md:pr-8 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("aboutSection.whyTitle")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("aboutSection.whyP1")}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("aboutSection.whyP2")}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("aboutSection.whyP3")}
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="/src/assets/images/Cau_hoi_thuong_gap.png"
              alt={t("aboutSection.imgAlt1")}
              className="w-96 h-96 object-contain rounded-2xl"
            />
          </div>
        </section>
        <section className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 flex justify-center">
            <img
              src="/src/assets/images/Hinh_tram_cam.png"
              alt={t("aboutSection.imgAlt2")}
              className="w-[420px] h-[420px] object-contain"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center max-w-2xl md:pl-8 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("aboutSection.trustTitle")}
              <br />
              {t("aboutSection.trustTitle2")}
            </h2>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {t("aboutSection.trustP1")}
            </p>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {t("aboutSection.trustP2")}
            </p>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {t("aboutSection.trustP3")}
            </p>
            <div>
              <Link
                to="/introduce"
                className="inline-block px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-full shadow transition"
              >
                {t("aboutSection.introBtn")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </React.Fragment>
  );
}
