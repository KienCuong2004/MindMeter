import { useEffect, useRef, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslation } from "react-i18next";
// Removed unused React Icons imports

const HomePageTour = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const driverRef = useRef(null);

  // Removed unused renderIcon function

  // Function to create title with icon (using HTML string)
  const createTitleWithIcon = (iconName, title) => {
    const iconMap = {
      home: '<i class="fas fa-home" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      clipboard:
        '<i class="fas fa-clipboard-list" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      brain:
        '<i class="fas fa-brain" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      heart:
        '<i class="fas fa-heart" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      comments:
        '<i class="fas fa-comments" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      user: '<i class="fas fa-user" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      bars: '<i class="fas fa-bars" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      rocket:
        '<i class="fas fa-rocket" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      graduation:
        '<i class="fas fa-graduation-cap" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      stethoscope:
        '<i class="fas fa-stethoscope" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      robot:
        '<i class="fas fa-robot" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      userMd:
        '<i class="fas fa-user-md" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
      chart:
        '<i class="fas fa-chart-line" style="display: inline-block; margin-right: 8px; color: white; font-size: 20px; flex-shrink: 0; vertical-align: middle;"></i>',
    };
    const icon = iconMap[iconName] || "";
    return `${icon}${title}`;
  };

  const startTour = useCallback(() => {
    // Add custom styles for Driver.js elements
    const style = document.createElement("style");
    style.setAttribute("data-tour-styles", "true");
    style.textContent = `
      /* Import Font Awesome for icons */
      @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
      
      /* Header */
      .driver-popover-header {
        background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.92) 100%) !important;
        border-bottom: 1px solid rgba(229, 231, 235, 1) !important; /* gray-200 */
        border-radius: 16px 16px 0 0 !important;
        padding: 32px 48px 28px 48px !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important;
        position: relative !important;
        min-height: 120px !important;
      }
      .dark .driver-popover-header {
        background: linear-gradient(135deg, rgba(31,41,55,0.98) 0%, rgba(31,41,55,0.95) 100%) !important; /* gray-800 */
        border-bottom: 1px solid rgba(55, 65, 81, 1) !important; /* gray-700 */
      }
      
      .driver-popover-title {
        color: #111827 !important; /* gray-900 */
        font-size: 22px !important;
        font-weight: 800 !important;
        margin: 0 !important;
        line-height: 1.4 !important;
        text-align: center !important;
        letter-spacing: 0.5px !important;
        width: 100% !important;
      }
      .dark .driver-popover-title { color: #e5e7eb !important; } /* gray-200 */
      
      
      .driver-popover-title i {
        flex-shrink: 0 !important;
        margin-right: 12px !important;
        font-size: 24px !important;
        color: #60a5fa !important;
        vertical-align: middle !important;
      }
      
      
      .driver-popover-description {
        color: #374151 !important; /* gray-700 */
        font-size: 16px !important;
        line-height: 1.8 !important;
        margin: 20px 0 0 !important;
        padding: 0 !important;
        word-wrap: break-word !important;
        hyphens: auto !important;
        font-weight: 600 !important;
        letter-spacing: 0.3px !important;
        text-align: center !important;
        width: 100% !important;
      }
      .dark .driver-popover-description { color: #d1d5db !important; } /* gray-300 */
      
      .driver-popover-body {
        padding: 32px 48px !important;
        background: rgba(255,255,255,0.96) !important;
      }
      .dark .driver-popover-body { background: rgba(17,24,39,0.98) !important; } /* gray-900 */
      
      .driver-popover-footer {
        background: rgba(255,255,255,0.95) !important;
        border-top: 1px solid rgba(229, 231, 235, 1) !important;
        border-radius: 0 0 16px 16px !important;
        padding: 24px 48px 28px !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 32px !important;
        box-shadow: inset 0 1px 0 rgba(0,0,0,0.03) !important;
        flex-wrap: nowrap !important;
      }
      .dark .driver-popover-footer {
        background: rgba(31,41,55,0.98) !important; /* gray-800 */
        border-top-color: rgba(55,65,81,1) !important; /* gray-700 */
      }
      
      .driver-popover-progress-text {
        color: #1f2937 !important; /* gray-800 */
        font-size: 13px !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
      }
      .dark .driver-popover-progress-text { color: #e5e7eb !important; }
      
      /* Buttons */
      .driver-popover .driver-popover-btn,
      .driver-popover-btn,
      .driver-popover .driver-popover-next-btn,
      .driver-popover-next-btn,
      .driver-popover .driver-popover-prev-btn,
      .driver-popover-prev-btn,
      .driver-popover .driver-popover-done-btn,
      .driver-popover-done-btn {
        background: #ffffff !important;
        border: 1px solid #e5e7eb !important; /* gray-200 */
        color: #374151 !important; /* gray-700 */
        font-weight: 700 !important;
        font-size: 14px !important;
        padding: 10px 20px !important;
        border-radius: 10px !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        text-transform: none !important;
        letter-spacing: 0.5px !important;
        min-width: 120px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        margin: 0 8px !important;
        text-decoration: none !important;
        white-space: nowrap !important;
        outline: none !important;
      }
      
      .driver-popover .driver-popover-btn:hover,
      .driver-popover-btn:hover,
      .driver-popover .driver-popover-next-btn:hover,
      .driver-popover-next-btn:hover,
      .driver-popover .driver-popover-prev-btn:hover,
      .driver-popover-prev-btn:hover,
      .driver-popover .driver-popover-done-btn:hover,
      .driver-popover-done-btn:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%) !important;
        border-color: rgba(255, 255, 255, 0.5) !important;
        transform: translateY(-2px) scale(1.02) !important;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2) !important;
        text-decoration: none !important;
      }
      
      .driver-popover .driver-popover-btn:active,
      .driver-popover-btn:active,
      .driver-popover .driver-popover-next-btn:active,
      .driver-popover-next-btn:active,
      .driver-popover .driver-popover-prev-btn:active,
      .driver-popover-prev-btn:active,
      .driver-popover .driver-popover-done-btn:active,
      .driver-popover-done-btn:active {
        transform: translateY(0) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Next/Done button styling with modern gradient */
      .driver-popover .driver-popover-next-btn,
      .driver-popover-next-btn,
      .driver-popover .driver-popover-done-btn,
      .driver-popover-done-btn {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
        border: 1px solid rgba(59, 130, 246, 0.5) !important;
        color: white !important;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(59, 130, 246, 0.2) !important;
      }
      
      .driver-popover .driver-popover-next-btn:hover,
      .driver-popover-next-btn:hover,
      .driver-popover .driver-popover-done-btn:hover,
      .driver-popover-done-btn:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
        border-color: rgba(37, 99, 235, 0.7) !important;
        transform: translateY(-2px) scale(1.05) !important;
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6), 0 4px 8px rgba(59, 130, 246, 0.3) !important;
      }
      
      
      /* Previous button styling */
      .driver-popover .driver-popover-prev-btn,
      .driver-popover-prev-btn {
        background: #6b7280 !important; /* gray-500 */
        border: 1px solid #6b7280 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3) !important;
      }
      
      .driver-popover .driver-popover-prev-btn:hover,
      .driver-popover-prev-btn:hover {
        background: linear-gradient(135deg, #4b5563 0%, #374151 100%) !important;
        border-color: rgba(75, 85, 99, 0.7) !important;
        transform: translateY(-2px) scale(1.02) !important;
        box-shadow: 0 8px 25px rgba(107, 114, 128, 0.6), 0 4px 8px rgba(107, 114, 128, 0.3) !important;
      }
      
      /* Additional specificity to override Driver.js defaults */
      .driver-popover .driver-popover-footer .driver-popover-btn,
      .driver-popover-footer .driver-popover-btn,
      .driver-popover .driver-popover-footer .driver-popover-next-btn,
      .driver-popover-footer .driver-popover-next-btn,
      .driver-popover .driver-popover-footer .driver-popover-prev-btn,
      .driver-popover-footer .driver-popover-prev-btn,
      .driver-popover .driver-popover-footer .driver-popover-done-btn,
      .driver-popover-footer .driver-popover-done-btn {
        background: #ffffff !important;
        border: 2px solid #e5e7eb !important;
        color: #374151 !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        padding: 10px 20px !important;
        border-radius: 8px !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        text-transform: none !important;
        letter-spacing: 0.3px !important;
        min-width: 120px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        margin: 0 6px !important;
        text-decoration: none !important;
        outline: none !important;
        white-space: nowrap !important;
      }
      
      .driver-popover .driver-popover-footer .driver-popover-next-btn,
      .driver-popover-footer .driver-popover-next-btn,
      .driver-popover .driver-popover-footer .driver-popover-done-btn,
      .driver-popover-footer .driver-popover-done-btn {
        background: #3b82f6 !important;
        border-color: #3b82f6 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
      }
      
      .driver-popover .driver-popover-footer .driver-popover-prev-btn,
      .driver-popover-footer .driver-popover-prev-btn {
        background: #6b7280 !important;
        border-color: #6b7280 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3) !important;
      }
      
      
      /* Focus state for accessibility */
      .driver-popover-btn:focus {
        outline: none !important;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.5) !important;
      }
      
      /* Disabled state */
      .driver-popover-btn:disabled {
        opacity: 0.6 !important;
        cursor: not-allowed !important;
        transform: none !important;
      }
      
      .driver-popover-btn:disabled:hover {
        transform: none !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Arrow styling */
      .driver-popover-arrow {
        border-color: transparent !important;
      }
      
      .driver-popover-arrow::before {
        border-color: transparent !important;
      }
      
      /* Highlighted element */
      .driver-highlighted-element {
        border: 3px solid #3b82f6 !important; /* blue-500 */
        border-radius: 16px !important;
        box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.25), 0 0 24px rgba(59, 130, 246, 0.35) !important;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        animation: highlightPulse 2s ease-in-out infinite !important;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%) !important;
        backdrop-filter: blur(2px) !important;
      }
      
      @keyframes highlightPulse {
        0%, 100% { 
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.25), 0 0 24px rgba(59, 130, 246, 0.35);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.35), 0 0 28px rgba(59, 130, 246, 0.45);
          transform: scale(1.02);
        }
      }
      
      /* Enhanced mobile responsiveness */
      @media (max-width: 768px) {
        .driver-popover { max-width: 95vw !important; min-width: 340px !important; margin: 0 12px !important; border-radius: 16px !important; }
        
        .driver-popover-header { padding: 28px 36px 24px 36px !important; border-radius: 16px 16px 0 0 !important; min-height: 110px !important; }
        
        .driver-popover-body { padding: 28px 36px !important; }
        
        .driver-popover-title { font-size: 20px !important; white-space: normal !important; flex-wrap: wrap !important; line-height: 1.3 !important; }
        
        .driver-popover-title i {
          font-size: 22px !important;
          margin-right: 8px !important;
        }
        
        .driver-popover-description {
          font-size: 15px !important;
          line-height: 1.7 !important;
          margin-top: 16px !important;
        }
        
        .driver-popover-footer { flex-direction: row !important; gap: 20px !important; padding: 24px 36px 28px !important; border-radius: 0 0 16px 16px !important; justify-content: center !important; align-items: center !important; flex-wrap: nowrap !important; }
        
        .driver-popover-btn { width: auto !important; min-width: 120px !important; padding: 12px 20px !important; border-radius: 10px !important; font-size: 15px !important; letter-spacing: 0.5px !important; font-weight: 700 !important; margin: 6px 0 !important; white-space: nowrap !important; }
      }
    `;
    document.head.appendChild(style);

    // Destroy existing driver instance if any
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous"],
      progressText: `${t("tour.progress")} {{current}} ${t(
        "tour.of"
      )} {{total}}`,
      nextBtnText: t("tour.next"),
      prevBtnText: t("tour.previous"),
      doneBtnText: t("tour.done"),
      allowClose: false,
      keyboardControl: true,
      disableActiveInteraction: false,
      // Neutral panel that adapts to theme; overlay is subtle
      popoverClass:
        "!bg-white/95 dark:!bg-gray-900/95 !border !border-gray-200 dark:!border-gray-700 !rounded-2xl !shadow-2xl !p-0 !max-w-lg !min-w-[480px] !font-sans",
      overlayClass: "!bg-black/40",
      // Animation settings
      animate: true,
      // Custom padding
      padding: 10,
      steps: [
        {
          element: "#hero-section",
          popover: {
            title: createTitleWithIcon("rocket", t("tour.steps.hero.title")),
            description: t("tour.steps.hero.description"),
            side: "bottom",
            align: "start",
            showButtons: ["next"],
          },
        },
        {
          element: "#test-section",
          popover: {
            title: createTitleWithIcon(
              "clipboard",
              t("tour.steps.tests.title")
            ),
            description: t("tour.steps.tests.description"),
            side: "top",
            align: "start",
            showButtons: ["next", "previous"],
          },
        },
        {
          element: "#dass-21-test",
          popover: {
            title: createTitleWithIcon("brain", t("tour.steps.dass21.title")),
            description: t("tour.steps.dass21.description"),
            side: "right",
            align: "start",
            showButtons: ["next", "previous"],
          },
        },
        {
          element: "#bdi-test",
          popover: {
            title: createTitleWithIcon("heart", t("tour.steps.bdi.title")),
            description: t("tour.steps.bdi.description"),
            side: "left",
            align: "start",
            showButtons: ["next", "previous"],
          },
        },
        {
          element: "#chatbot-button",
          popover: {
            title: createTitleWithIcon("robot", t("tour.steps.chatbot.title")),
            description: t("tour.steps.chatbot.description"),
            side: "left",
            align: "start",
            showButtons: ["next", "previous"],
          },
          onHighlightStarted: () => {
            // Scroll to chatbot button if it exists
            const chatbotBtn = document.getElementById("chatbot-button");
            if (chatbotBtn) {
              chatbotBtn.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          },
        },
        {
          element: "#user-menu",
          popover: {
            title: createTitleWithIcon("user", t("tour.steps.profile.title")),
            description: t("tour.steps.profile.description"),
            side: "left",
            align: "start",
            showButtons: ["next", "previous"],
          },
        },
        {
          element: "#navigation-menu",
          popover: {
            title: createTitleWithIcon(
              "bars",
              t("tour.steps.navigation.title")
            ),
            description: t("tour.steps.navigation.description"),
            side: "bottom",
            align: "start",
            showButtons: ["next", "previous"],
            nextBtnText: t("tour.done"),
            onNext: () => {
              if (onClose) {
                onClose();
              }
            },
          },
        },
      ],
      onDestroyed: () => {
        if (onClose) {
          onClose();
        }
      },
    });

    driverRef.current = driverObj;
    driverObj.drive();

    // Function to apply button styles
    const applyButtonStyles = () => {
      // Target all possible button selectors
      const buttonSelectors = [
        ".driver-popover-btn",
        ".driver-popover-next-btn",
        ".driver-popover-prev-btn",
        ".driver-popover-done-btn",
      ];

      buttonSelectors.forEach((selector) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((btn) => {
          // Apply base styles directly to each button
          btn.style.background = "#ffffff";
          btn.style.border = "2px solid #e5e7eb";
          btn.style.color = "#374151";
          btn.style.fontWeight = "600";
          btn.style.fontSize = "14px";
          btn.style.padding = "10px 20px";
          btn.style.borderRadius = "8px";
          btn.style.transition = "all 0.2s ease";
          btn.style.cursor = "pointer";
          btn.style.textTransform = "none";
          btn.style.letterSpacing = "0.3px";
          btn.style.minWidth = "90px";
          btn.style.display = "inline-flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.gap = "6px";
          btn.style.fontFamily =
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          btn.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
          btn.style.margin = "0 6px";
          btn.style.textDecoration = "none";
          btn.style.outline = "none";
          btn.style.borderColor = "#e5e7eb";

          // Apply specific styles based on class name
          if (
            btn.classList.contains("driver-popover-next-btn") ||
            btn.classList.contains("driver-popover-done-btn")
          ) {
            btn.style.background = "#3b82f6";
            btn.style.borderColor = "#3b82f6";
            btn.style.color = "white";
            btn.style.boxShadow = "0 2px 4px rgba(59, 130, 246, 0.3)";
          } else if (btn.classList.contains("driver-popover-prev-btn")) {
            btn.style.background = "#6b7280";
            btn.style.borderColor = "#6b7280";
            btn.style.color = "white";
            btn.style.boxShadow = "0 2px 4px rgba(107, 114, 128, 0.3)";
          }
        });
      });
    };

    // Force apply button styles after tour starts
    setTimeout(applyButtonStyles, 100);

    // Set up observer to apply styles on each step change
    const observer = new MutationObserver(() => {
      applyButtonStyles();
    });

    // Observe changes to the popover
    const popover = document.querySelector(".driver-popover");
    if (popover) {
      observer.observe(popover, { childList: true, subtree: true });
    }
  }, [t, onClose]);

  useEffect(() => {
    if (isOpen) {
      startTour();
    }
  }, [isOpen, startTour]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
      // Remove custom styles
      const existingStyle = document.querySelector("style[data-tour-styles]");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default HomePageTour;
