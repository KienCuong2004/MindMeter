import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import OtpResetPasswordForm from "../components/OtpResetPasswordForm";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 3) {
      navigate("/login");
    }
  }, [step, navigate]);

  useEffect(() => {
    document.title = "Quên mật khẩu | MindMeter";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      {step === 1 && (
        <ForgotPasswordForm
          onSent={(email) => {
            setEmail(email);
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <OtpResetPasswordForm email={email} onSuccess={() => setStep(3)} />
      )}
    </div>
  );
}
