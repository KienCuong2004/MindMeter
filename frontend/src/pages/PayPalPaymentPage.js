import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaPaypal,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { getCurrentUser } from "../services/anonymousService";
import axios from "axios";

const PayPalPaymentPage = () => {
  const { t } = useTranslation("payment");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();

  const [loading, setLoading] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasExecutedPayment, setHasExecutedPayment] = useState(false);

  const planFromUrl = searchParams.get("plan") || "plus";
  // For display: prioritize planFromUrl if it's a valid plan being purchased
  // Only fall back to user.plan if planFromUrl is not available
  const displayPlan =
    planFromUrl !== "plus" ? planFromUrl : user?.plan || "plus";
  const plan = planFromUrl; // Still use planFromUrl for payment creation

  // For display purposes, use the displayPlan
  const amount = displayPlan === "PRO" || displayPlan === "pro" ? 9.99 : 3.99;
  const planName =
    displayPlan === "PRO" || displayPlan === "pro" ? "Pro" : "Plus";

  // Debug logs
  console.log("PayPalPaymentPage - planFromUrl:", planFromUrl);
  console.log("PayPalPaymentPage - user?.plan:", user?.plan);
  console.log("PayPalPaymentPage - displayPlan:", displayPlan);
  console.log("PayPalPaymentPage - amount:", amount);
  console.log("PayPalPaymentPage - planName:", planName);

  const createPayment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Creating PayPal payment for plan:", plan);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/payment/create-payment",
        { plan },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("PayPal payment creation response:", response.data);

      if (response.data.url) {
        setApprovalUrl(response.data.url);
        console.log("Redirecting to PayPal:", response.data.url);

        // Redirect to PayPal
        window.location.href = response.data.url;
      } else {
        console.error("No approval URL received:", response.data);
        setError(t("createErrorMessage"));
      }
    } catch (err) {
      console.error("Error creating PayPal payment:", err);
      setError(err.response?.data?.error || t("createErrorMessage"));
    } finally {
      setLoading(false);
    }
  }, [plan, t, navigate]); // Added navigate to dependencies

  const executePayment = useCallback(
    async (paymentId, payerId) => {
      setLoading(true);
      setError(null);

      try {
        console.log("Executing PayPal payment:", { paymentId, payerId });
        const token = localStorage.getItem("token");
        const response = await axios.post(
          "/api/payment/execute-payment",
          { paymentId, payerId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("PayPal payment execution response:", response.data);

        if (response.data.success) {
          setSuccess(true);
          console.log("Payment successful, refreshing user token...");
          // Refresh user token to get updated plan
          await refreshUserToken();

          // Redirect to success page after 3 seconds
          setTimeout(() => {
            navigate("/pricing?success=true");
          }, 3000);
        } else {
          console.error("Payment execution failed:", response.data);
          setError(t("errorMessage"));
        }
      } catch (err) {
        console.error("Error executing PayPal payment:", err);
        setError(err.response?.data?.error || t("errorMessage"));
      } finally {
        setLoading(false);
      }
    },
    [navigate, t] // Removed plan dependency since we use user.plan for display
  );

  const refreshUserToken = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/payment/refresh-token",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.token && response.data.user) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error("Error refreshing token:", err);
    }
  };

  const handleCancel = () => {
    navigate("/pricing?canceled=true");
  };

  useEffect(() => {
    console.log("PayPalPaymentPage useEffect - user:", user);
    console.log(
      "PayPalPaymentPage useEffect - searchParams:",
      Object.fromEntries(searchParams.entries())
    );

    if (!user) {
      console.log("No user found, redirecting to login");
      navigate("/login");
      return;
    }

    // Check if returning from PayPal
    const paymentId = searchParams.get("paymentId");
    const payerId = searchParams.get("PayerID");

    console.log("PayPal return parameters:", { paymentId, payerId });

    if (paymentId && payerId && !hasExecutedPayment) {
      console.log("Returning from PayPal, executing payment...");
      setHasExecutedPayment(true); // Set flag to true to prevent re-execution
      executePayment(paymentId, payerId);
    } else if (!paymentId && !payerId) {
      // Only create payment if no params are present
      console.log("Creating new PayPal payment...");
      createPayment();
    }
  }, [user, navigate, createPayment, executePayment, hasExecutedPayment]); // Added hasExecutedPayment to dependencies

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-white text-3xl" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t("successTitle")}
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t("successMessage")}
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-center mb-4">
              <FaPaypal className="text-blue-500 text-2xl mr-3" />
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                PayPal
              </span>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${amount}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                {planName} Plan
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            {t("redirectingToPayPal")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaExclamationCircle className="text-white text-3xl" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t("errorTitle")}
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate("/payment/paypal?plan=" + plan)}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              {t("tryAgain")}
            </button>

            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          {loading ? (
            <FaSpinner className="text-white text-3xl animate-spin" />
          ) : (
            <FaPaypal className="text-white text-3xl" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {loading ? t("processingPayment") : t("redirectingToPayPal")}
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {loading
            ? "Vui lòng chờ..."
            : "Bạn sẽ được chuyển hướng đến PayPal..."}
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center justify-center mb-4">
            <FaPaypal className="text-blue-500 text-2xl mr-3" />
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              PayPal
            </span>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${amount}
            </p>
            <p className="text-gray-600 dark:text-gray-300">{planName} Plan</p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && !approvalUrl && (
          <button
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Hủy
          </button>
        )}
      </div>
    </div>
  );
};

export default PayPalPaymentPage;
