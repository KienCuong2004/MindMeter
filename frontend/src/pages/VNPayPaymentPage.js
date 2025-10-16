import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getCurrentUser } from "../services/anonymousService";

const VNPayPaymentPage = () => {
  const { t } = useTranslation("payment");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  // Get plan from URL parameters
  const planFromUrl = searchParams.get("plan") || "plus";
  const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
  const vnp_TxnRef = searchParams.get("vnp_TxnRef");
  const success = searchParams.get("success");

  // For display: prioritize planFromUrl if it's a valid plan being purchased
  const displayPlan =
    planFromUrl !== "plus" ? planFromUrl : user?.plan || "plus";
  const plan = planFromUrl;

  // For display purposes, use the plan parameter
  const amount = plan === "pro" ? "9.99" : "3.99";
  const planName = plan === "pro" ? "Pro" : "Plus";

  // Debug logs
  console.log("VNPayPaymentPage - planFromUrl:", planFromUrl);
  console.log("VNPayPaymentPage - user?.plan:", user?.plan);
  console.log("VNPayPaymentPage - displayPlan:", displayPlan);
  console.log("VNPayPaymentPage - plan:", plan);
  console.log("VNPayPaymentPage - amount:", amount);
  console.log("VNPayPaymentPage - planName:", planName);
  console.log("VNPayPaymentPage - vnp_ResponseCode:", vnp_ResponseCode);
  console.log("VNPayPaymentPage - vnp_TxnRef:", vnp_TxnRef);
  console.log("VNPayPaymentPage - success:", success);

  // Check if returning from VNPay (has response code)
  const isReturningFromVNPay = vnp_ResponseCode !== null;
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasCreatedPayment, setHasCreatedPayment] = useState(false);
  const [hasProcessedReturn, setHasProcessedReturn] = useState(false);

  // Create payment function
  const createPayment = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!user && !token) {
      console.log("No user and no token found, redirecting to login");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Creating VNPay payment for plan:", plan);

      const response = await axios.post(
        "/api/payment/vnpay/create-payment",
        {
          plan: plan,
          amount: amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("VNPay payment URL created:", response.data);

      if (response.data.paymentUrl) {
        console.log("Redirecting to VNPay with payment URL");

        // Redirect to VNPay
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      console.error("Error creating VNPay payment:", error);
      setError(error.response?.data?.error || t("failedToCreatePayment"));
    } finally {
      setLoading(false);
    }
  }, [user, navigate, plan, amount, t]);

  // Process return from VNPay
  const processReturn = useCallback(async () => {
    if (!isReturningFromVNPay) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Processing VNPay return...");

      // Get all URL parameters
      const params = new URLSearchParams(window.location.search);
      const paramObject = {};
      for (const [key, value] of params) {
        paramObject[key] = value;
      }

      // Try to get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found for VNPay return processing");
        setError("Authentication required for payment processing");
        return;
      }

      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get("/api/payment/vnpay/return", {
        params: paramObject,
        headers: headers,
      });

      console.log("VNPay return processed:", response.data);
      setPaymentResult(response.data);

      if (response.data.success) {
        // Payment successful - redirect to success page
        setTimeout(() => {
          navigate("/pricing?success=true&plan=" + (plan || "plus"));
        }, 3000);
      }
    } catch (error) {
      console.error("Error processing VNPay return:", error);
      setError(t("failedToProcessPayment"));
    } finally {
      setLoading(false);
    }
  }, [isReturningFromVNPay, navigate, plan, t]);

  // Main useEffect
  useEffect(() => {
    console.log("=== VNPayPaymentPage useEffect START ===");
    console.log("VNPayPaymentPage useEffect - user:", user);
    console.log(
      "VNPayPaymentPage useEffect - isReturningFromVNPay:",
      isReturningFromVNPay
    );
    console.log("VNPayPaymentPage useEffect - hasInitialized:", hasInitialized);
    console.log(
      "VNPayPaymentPage useEffect - hasCreatedPayment:",
      hasCreatedPayment
    );
    console.log(
      "VNPayPaymentPage useEffect - hasProcessedReturn:",
      hasProcessedReturn
    );

    // Check if user is authenticated
    const token = localStorage.getItem("token");
    const userFromStorage = localStorage.getItem("user");

    console.log("Token exists:", !!token);
    console.log("User exists:", !!user);
    console.log("User from localStorage exists:", !!userFromStorage);
    console.log("Full localStorage keys:", Object.keys(localStorage));

    if (!user && !token) {
      console.log("No user and no token found, redirecting to login");
      navigate("/login");
      return;
    }

    // If returning from VNPay, always process regardless of user state
    if (isReturningFromVNPay) {
      console.log(
        "Returning from VNPay, processing return regardless of user state"
      );
      // Don't redirect to login, process the return
    } else if (!user) {
      console.log("No user found for new payment, redirecting to login");
      navigate("/login");
      return;
    }

    // Prevent multiple initialization calls
    if (hasInitialized) {
      console.log("Already initialized, skipping...");
      return;
    }

    setHasInitialized(true);

    if (isReturningFromVNPay) {
      if (hasProcessedReturn) {
        console.log("Already processed return, skipping...");
        return;
      }
      console.log("Returning from VNPay, processing result...");
      setHasProcessedReturn(true);
      processReturn();
    } else {
      // Create new payment - check if we have user or token
      if (!user && !token) {
        console.log(
          "No user and no token for new payment creation, skipping..."
        );
        return;
      }

      if (hasCreatedPayment) {
        console.log("Already created payment, skipping...");
        return;
      }
      console.log("Creating new VNPay payment...");
      setHasCreatedPayment(true);
      createPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    navigate,
    isReturningFromVNPay,
    hasInitialized,
    hasCreatedPayment,
    hasProcessedReturn,
  ]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {isReturningFromVNPay
              ? t("processingPaymentResult")
              : t("redirectingToVNPay")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {isReturningFromVNPay
              ? t("verifyingPayment")
              : t("redirectingMessage")}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
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
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Payment Error
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/pricing")}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Pricing
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment result state
  if (paymentResult) {
    const isSuccess = paymentResult.success;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isSuccess
                ? "bg-green-100 dark:bg-green-900"
                : "bg-red-100 dark:bg-red-900"
            }`}
          >
            {isSuccess ? (
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
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
            )}
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {isSuccess ? t("paymentSuccessful") : t("paymentFailed")}
          </h2>

          <div className="text-left bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Plan:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {planName} Plan
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Amount:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Transaction ID:
                </span>
                <span className="font-medium text-gray-900 dark:text-white text-xs">
                  {vnp_TxnRef}
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {isSuccess ? t("paymentSuccessMessage") : t("paymentErrorMessage")}
          </p>

          <button
            onClick={() => navigate("/pricing")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isSuccess ? t("continue") : t("backToPricing")}
          </button>
        </div>
      </div>
    );
  }

  // Default state (should not reach here due to loading states)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Preparing payment...
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please wait while we prepare your payment.
        </p>
      </div>
    </div>
  );
};

export default VNPayPaymentPage;
