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
      
      /* Override Driver.js internal styles with Tailwind */
      .driver-popover-header {
        background: rgba(255, 255, 255, 0.1) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 20px 20px 0 0 !important;
        padding: 24px 28px 20px !important;
      }
      
      .driver-popover-title {
        color: white !important;
        font-size: 20px !important;
        font-weight: 700 !important;
        margin: 0 !important;
        line-height: 1.3 !important;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
        display: flex !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        overflow: hidden !important;
        white-space: nowrap !important;
        text-overflow: ellipsis !important;
      }
      
      .driver-popover-title i {
        flex-shrink: 0 !important;
        margin-right: 8px !important;
        font-size: 20px !important;
        color: white !important;
        vertical-align: middle !important;
      }
      
      .driver-popover-description {
        color: rgba(255, 255, 255, 0.95) !important;
        font-size: 15px !important;
        line-height: 1.7 !important;
        margin: 16px 0 0 !important;
        padding: 0 !important;
        word-wrap: break-word !important;
        hyphens: auto !important;
      }
      
      .driver-popover-body {
        padding: 24px 28px !important;
      }
      
      .driver-popover-footer {
        background: rgba(255, 255, 255, 0.1) !important;
        border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 0 0 20px 20px !important;
        padding: 20px 28px 24px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        gap: 12px !important;
      }
      
      .driver-popover-progress-text {
        color: rgba(255, 255, 255, 0.8) !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
      }
      
      /* Button base styles - Clean and modern with maximum specificity */
      .driver-popover .driver-popover-btn,
      .driver-popover-btn,
      .driver-popover .driver-popover-next-btn,
      .driver-popover-next-btn,
      .driver-popover .driver-popover-prev-btn,
      .driver-popover-prev-btn,
      .driver-popover .driver-popover-close-btn,
      .driver-popover-close-btn,
      .driver-popover .driver-popover-done-btn,
      .driver-popover-done-btn {
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
        min-width: 90px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        margin: 0 6px !important;
        text-decoration: none !important;
        outline: none !important;
      }
      
      .driver-popover .driver-popover-btn:hover,
      .driver-popover-btn:hover,
      .driver-popover .driver-popover-next-btn:hover,
      .driver-popover-next-btn:hover,
      .driver-popover .driver-popover-prev-btn:hover,
      .driver-popover-prev-btn:hover,
      .driver-popover .driver-popover-close-btn:hover,
      .driver-popover-close-btn:hover,
      .driver-popover .driver-popover-done-btn:hover,
      .driver-popover-done-btn:hover {
        background: #f9fafb !important;
        border-color: #d1d5db !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
        text-decoration: none !important;
      }
      
      .driver-popover .driver-popover-btn:active,
      .driver-popover-btn:active,
      .driver-popover .driver-popover-next-btn:active,
      .driver-popover-next-btn:active,
      .driver-popover .driver-popover-prev-btn:active,
      .driver-popover-prev-btn:active,
      .driver-popover .driver-popover-close-btn:active,
      .driver-popover-close-btn:active,
      .driver-popover .driver-popover-done-btn:active,
      .driver-popover-done-btn:active {
        transform: translateY(0) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Next button styling with maximum specificity */
      .driver-popover .driver-popover-next-btn,
      .driver-popover-next-btn,
      .driver-popover .driver-popover-done-btn,
      .driver-popover-done-btn {
        background: #3b82f6 !important;
        border-color: #3b82f6 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
      }
      
      .driver-popover .driver-popover-next-btn:hover,
      .driver-popover-next-btn:hover,
      .driver-popover .driver-popover-done-btn:hover,
      .driver-popover-done-btn:hover {
        background: #2563eb !important;
        border-color: #2563eb !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4) !important;
      }
      
      /* Close button styling with maximum specificity */
      .driver-popover .driver-popover-close-btn,
      .driver-popover-close-btn {
        background: #ef4444 !important;
        border-color: #ef4444 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3) !important;
        padding: 4px 8px !important;
        min-width: 32px !important;
        font-size: 18px !important;
        font-weight: bold !important;
        border-radius: 6px !important;
        margin-top: 4px !important;
        height: 32px !important;
        width: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .driver-popover .driver-popover-close-btn:hover,
      .driver-popover-close-btn:hover {
        background: #dc2626 !important;
        border-color: #dc2626 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4) !important;
      }
      
      /* Previous button styling with maximum specificity */
      .driver-popover .driver-popover-prev-btn,
      .driver-popover-prev-btn {
        background: #6b7280 !important;
        border-color: #6b7280 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3) !important;
      }
      
      .driver-popover .driver-popover-prev-btn:hover,
      .driver-popover-prev-btn:hover {
        background: #4b5563 !important;
        border-color: #4b5563 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(107, 114, 128, 0.4) !important;
      }
      
      /* Additional specificity to override Driver.js defaults */
      .driver-popover .driver-popover-footer .driver-popover-btn,
      .driver-popover-footer .driver-popover-btn,
      .driver-popover .driver-popover-footer .driver-popover-next-btn,
      .driver-popover-footer .driver-popover-next-btn,
      .driver-popover .driver-popover-footer .driver-popover-prev-btn,
      .driver-popover-footer .driver-popover-prev-btn,
      .driver-popover .driver-popover-footer .driver-popover-close-btn,
      .driver-popover-footer .driver-popover-close-btn,
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
        min-width: 90px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        margin: 0 6px !important;
        text-decoration: none !important;
        outline: none !important;
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
      
      .driver-popover .driver-popover-footer .driver-popover-close-btn,
      .driver-popover-footer .driver-popover-close-btn {
        background: #ef4444 !important;
        border-color: #ef4444 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3) !important;
        padding: 4px 8px !important;
        min-width: 32px !important;
        font-size: 18px !important;
        font-weight: bold !important;
        border-radius: 6px !important;
        margin-top: 4px !important;
        height: 32px !important;
        width: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
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
      
      /* Highlighted element styling */
      .driver-highlighted-element {
        border: 3px solid #667eea !important;
        border-radius: 12px !important;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2) !important;
        transition: all 0.3s ease !important;
      }
      
      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .driver-popover {
          max-width: 95vw !important;
          min-width: 320px !important;
          margin: 0 8px !important;
        }
        
        .driver-popover-header {
          padding: 16px 20px 12px !important;
        }
        
        .driver-popover-body {
          padding: 20px 24px !important;
        }
        
        .driver-popover-title {
          font-size: 18px !important;
          white-space: normal !important;
          flex-wrap: wrap !important;
        }
        
        .driver-popover-title i {
          font-size: 18px !important;
          margin-right: 6px !important;
        }
        
        .driver-popover-description {
          font-size: 14px !important;
          line-height: 1.6 !important;
        }
        
        .driver-popover-footer {
          flex-direction: column !important;
          gap: 8px !important;
          padding: 16px 20px !important;
        }
        
        .driver-popover-btn {
          width: 100% !important;
          min-width: auto !important;
          padding: 12px 20px !important;
          border-radius: 8px !important;
          font-size: 14px !important;
          letter-spacing: 0.3px !important;
          font-weight: 600 !important;
          margin: 4px 0 !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Destroy existing driver instance if any
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      progressText: `${t("tour.progress")} {{current}} ${t(
        "tour.of"
      )} {{total}}`,
      nextBtnText: t("tour.next"),
      prevBtnText: t("tour.previous"),
      doneBtnText: t("tour.done"),
      closeBtnText: t("tour.close"),
      allowClose: true,
      keyboardControl: true,
      disableActiveInteraction: false,
      // Tailwind styling
      popoverClass:
        "!bg-gradient-to-br !from-indigo-500 !to-purple-600 !border-0 !rounded-2xl !shadow-2xl !p-0 !max-w-lg !min-w-[450px] !font-sans !backdrop-blur-sm",
      overlayClass: "!bg-black/60 !backdrop-blur-sm",
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
            showButtons: ["next", "close"],
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
            showButtons: ["next", "previous", "close"],
          },
        },
        {
          element: "#dass-21-test",
          popover: {
            title: createTitleWithIcon("brain", t("tour.steps.dass21.title")),
            description: t("tour.steps.dass21.description"),
            side: "right",
            align: "start",
            showButtons: ["next", "previous", "close"],
          },
        },
        {
          element: "#bdi-test",
          popover: {
            title: createTitleWithIcon("heart", t("tour.steps.bdi.title")),
            description: t("tour.steps.bdi.description"),
            side: "left",
            align: "start",
            showButtons: ["next", "previous", "close"],
          },
        },
        {
          element: "#chatbot-button",
          popover: {
            title: createTitleWithIcon("robot", t("tour.steps.chatbot.title")),
            description: t("tour.steps.chatbot.description"),
            side: "left",
            align: "start",
            showButtons: ["next", "previous", "close"],
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
            showButtons: ["next", "previous", "close"],
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
            showButtons: ["next", "previous", "close"],
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
        ".driver-popover-close-btn",
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
          } else if (btn.classList.contains("driver-popover-close-btn")) {
            btn.style.background = "#ef4444";
            btn.style.borderColor = "#ef4444";
            btn.style.color = "white";
            btn.style.boxShadow = "0 2px 4px rgba(239, 68, 68, 0.3)";
            // Make close button smaller with larger X
            btn.style.padding = "4px 8px";
            btn.style.minWidth = "32px";
            btn.style.fontSize = "18px";
            btn.style.fontWeight = "bold";
            btn.style.borderRadius = "6px";
            btn.style.marginTop = "4px";
            btn.style.height = "32px";
            btn.style.width = "32px";
            btn.style.display = "flex";
            btn.style.alignItems = "center";
            btn.style.justifyContent = "center";
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
