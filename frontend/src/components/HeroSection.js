import React, { useState, useRef, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";

function smoothScrollTo(targetY, duration = 1200) {
  const startY = window.pageYOffset;
  const diff = targetY - startY;
  let start;
  function step(timestamp) {
    if (!start) start = timestamp;
    const time = timestamp - start;
    const percent = Math.min(time / duration, 1);
    window.scrollTo(0, startY + diff * percent);
    if (time < duration) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

export default function HeroSection({ user, onLogout }) {
  const { t } = useTranslation();
  // Carousel state
  const images = [
    "/src/assets/images/hinh-tram-cam.png",
    "/src/assets/images/hinh-tram-cam-2.png",
    "/src/assets/images/hinh-tram-cam-3.png",
    "/src/assets/images/hinh-tram-cam-4.png",
    "/src/assets/images/hinh-tram-cam-5.png",
  ];
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Auto slide
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 7000);
    return () => clearTimeout(timeoutRef.current);
  }, [current]);

  // Handle swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 50) {
        // swipe left
        setCurrent((prev) => (prev + 1) % images.length);
      } else if (diff < -50) {
        // swipe right
        setCurrent((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="w-full pt-32 pb-16 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-500 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8 font-sans">
        <div className="flex-1 text-white max-w-xl z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-5 leading-tight font-sans">
            {t("depressionTest.introTitle")}
          </h1>
          <div className="h-1 w-16 bg-white mb-5" />
          <p className="text-base mb-3 opacity-90 leading-relaxed font-normal">
            <Trans i18nKey="depressionTest.introDesc1">
              <b />
            </Trans>
          </p>
          <p className="text-base mb-7 opacity-90 leading-relaxed font-normal">
            {t("depressionTest.introDesc2")}
          </p>
          <button
            className="bg-white text-blue-700 font-bold px-8 py-3 rounded-full hover:bg-blue-100 transition text-base"
            onClick={() => {
              const el = document.getElementById("test-list-section");
              if (el) {
                const top =
                  el.getBoundingClientRect().top + window.pageYOffset - 24;
                smoothScrollTo(top, 1200);
              }
            }}
          >
            {t("depressionTest.startBtn")}
          </button>
        </div>
        {/* Carousel ảnh */}
        <div
          className="flex-1 flex flex-col items-center justify-center relative h-full select-none"
          style={{ maxWidth: 480, maxHeight: 380 }}
        >
          <div
            className="w-full flex justify-center items-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[current]}
              alt={`MindMeter Hero ${current + 1}`}
              className="w-[420px] h-[340px] md:w-[480px] md:h-[380px] object-contain md:object-cover select-none rounded-2xl shadow-lg"
              draggable={false}
            />
          </div>
          {/* Dots dưới ảnh, luôn hiển thị rõ ràng */}
          <div className="flex justify-center gap-2 mt-4 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx === current ? "bg-white" : "bg-white/40"
                }`}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
