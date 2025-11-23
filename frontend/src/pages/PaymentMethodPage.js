import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPaypal, FaCreditCard, FaWallet, FaMobileAlt } from "react-icons/fa";
import { getCurrentUser } from "../services/anonymousService";

const PaymentMethodPage = () => {
  const { t } = useTranslation("payment");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const [selectedMethod, setSelectedMethod] = useState("paypal");

  const plan = searchParams.get("plan") || "plus";

  // Debug logs
  console.log("PaymentMethodPage - plan:", plan);
  console.log("PaymentMethodPage - user:", user);
  console.log(
    "PaymentMethodPage - searchParams:",
    Object.fromEntries(searchParams.entries())
  );
  console.log("PaymentMethodPage - current URL:", window.location.href);
  console.log("PaymentMethodPage - component mounted successfully");

  // Safe translation with fallbacks
  const getTranslation = (key, fallback) => {
    try {
      return t(key) || fallback;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return fallback;
    }
  };

  const paymentMethods = [
    {
      id: "paypal",
      name: getTranslation("paypal", "PayPal"),
      description: getTranslation(
        "paypalDescription",
        "Pay securely with your PayPal account."
      ),
      icon: FaPaypal,
      available: true,
      color: "bg-blue-500",
      textColor: "text-white",
    },
    {
      id: "vnpay",
      name: "VNPay",
      description: getTranslation(
        "vnpayDescription",
        "Pay securely with VNPay - Vietnam's leading payment gateway."
      ),
      icon: FaWallet,
      available: true,
      color: "bg-red-500",
      textColor: "text-white",
    },
    {
      id: "momo",
      name: "MoMo",
      description: getTranslation(
        "momoDescription",
        "Pay with MoMo (unavailable)."
      ),
      icon: FaMobileAlt,
      available: false,
      color: "bg-gray-300",
      textColor: "text-gray-600",
    },
    {
      id: "zalopay",
      name: "ZaloPay",
      description: getTranslation(
        "zalopayDescription",
        "Pay with ZaloPay (unavailable)."
      ),
      icon: FaCreditCard,
      available: false,
      color: "bg-gray-300",
      textColor: "text-gray-600",
    },
  ];

  const handleMethodSelect = (methodId) => {
    if (paymentMethods.find((m) => m.id === methodId)?.available) {
      setSelectedMethod(methodId);
    }
  };

  const handleContinue = () => {
    const method = paymentMethods.find((m) => m.id === selectedMethod);
    if (method && method.available) {
      // Navigate to payment page with selected method and plan
      navigate(`/payment/${selectedMethod}?plan=${plan}`);
    }
  };

  const handleBack = () => {
    navigate("/pricing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {getTranslation("selectMethodTitle", "Select Payment Method")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {(() => {
              const result = t("selectMethodDescription", {
                plan: plan.toUpperCase(),
              });
              console.log("Translation result:", result, "Plan:", plan);
              return result;
            })()}
          </p>
        </div>

        {/* Payment Methods Grid */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentMethods.map((method) => {
              const IconComponent = method.icon;
              const isSelected = selectedMethod === method.id;
              const isAvailable = method.available;

              return (
                <div
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className={`
                    relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300
                    ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg transform scale-105"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                    }
                    ${
                      !isAvailable
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-md"
                    }
                  `}
                >
                  {/* Coming Soon Badge */}
                  {!isAvailable && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {getTranslation("unavailable", "Unavailable")}
                      </span>
                    </div>
                  )}

                  {/* Method Icon */}
                  <div
                    className={`
                    w-16 h-16 rounded-full flex items-center justify-center mb-4
                    ${isAvailable ? method.color : "bg-gray-300"}
                  `}
                  >
                    <IconComponent className={`text-2xl ${method.textColor}`} />
                  </div>

                  {/* Method Name */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {method.name}
                  </h3>

                  {/* Method Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {method.description}
                  </p>

                  {/* Selection Indicator */}
                  {isSelected && isAvailable && (
                    <div className="absolute top-4 left-4">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {tCommon("back", "Back")}
          </button>

          <button
            onClick={handleContinue}
            disabled={
              !paymentMethods.find((m) => m.id === selectedMethod)?.available
            }
            className={`
              flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-200
              ${
                paymentMethods.find((m) => m.id === selectedMethod)?.available
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {tCommon("continue", "Continue")}
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="max-w-md mx-auto mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {getTranslation("currentUser", "Current User")}
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodPage;
