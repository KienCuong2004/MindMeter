import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import ForgotPasswordForm from "../ForgotPasswordForm";
import * as authFetch from "../../authFetch";

// Mock authFetch
jest.mock("../../authFetch", () => ({
  authFetch: jest.fn(),
}));

// Mock useTheme hook
jest.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light" }),
}));

// Mock useTranslation hook
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
}));

const renderWithProviders = (component) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("ForgotPasswordForm", () => {
  const mockOnSent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    authFetch.authFetch.mockClear();
  });

  test("renders forgot password form", () => {
    renderWithProviders(<ForgotPasswordForm onSent={mockOnSent} />);

    expect(screen.getByText("forgot.title")).toBeInTheDocument();
    // Input uses conditional placeholder, so use id or label instead
    const emailInput = document.querySelector("#forgot-email");
    expect(emailInput).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /forgot.sendOtp/i })
    ).toBeInTheDocument();
  });

  test("displays initial email when provided", () => {
    renderWithProviders(
      <ForgotPasswordForm initialEmail="test@example.com" onSent={mockOnSent} />
    );

    const emailInput = document.querySelector("#forgot-email");
    expect(emailInput.value).toBe("test@example.com");
  });

  test("updates email when initialEmail prop changes", async () => {
    const { rerender } = renderWithProviders(
      <ForgotPasswordForm initialEmail="old@example.com" onSent={mockOnSent} />
    );

    const emailInput = document.querySelector("#forgot-email");
    expect(emailInput.value).toBe("old@example.com");

    rerender(
      <I18nextProvider i18n={i18n}>
        <ForgotPasswordForm
          initialEmail="new@example.com"
          onSent={mockOnSent}
        />
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(emailInput.value).toBe("new@example.com");
    });
  });

  test("shows validation error for empty email", async () => {
    // Mock authFetch to return error for empty email
    authFetch.authFetch.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("Email is required"),
    });

    renderWithProviders(<ForgotPasswordForm onSent={mockOnSent} />);

    const emailInput = document.querySelector("#forgot-email");
    const submitButton = screen.getByRole("button", {
      name: /forgot.sendOtp/i,
    });

    // Submit with empty email - form will submit but API should return error
    fireEvent.click(submitButton);

    // Wait for API call and error message
    await waitFor(() => {
      expect(authFetch.authFetch).toHaveBeenCalled();
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
  });

  test("sends OTP request successfully", async () => {
    authFetch.authFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("OTP sent successfully"),
    });

    renderWithProviders(<ForgotPasswordForm onSent={mockOnSent} />);

    const emailInput = document.querySelector("#forgot-email");
    const submitButton = screen.getByRole("button", {
      name: /forgot.sendOtp/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authFetch.authFetch).toHaveBeenCalledWith(
        "/api/auth/forgot-password/request-otp",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        })
      );
    });

    await waitFor(
      () => {
        expect(mockOnSent).toHaveBeenCalledWith("test@example.com");
      },
      { timeout: 2000 }
    );
  });

  test("displays error message on API failure", async () => {
    authFetch.authFetch.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("Email not found"),
    });

    renderWithProviders(<ForgotPasswordForm onSent={mockOnSent} />);

    const emailInput = document.querySelector("#forgot-email");
    const submitButton = screen.getByRole("button", {
      name: /forgot.sendOtp/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email not found")).toBeInTheDocument();
    });

    expect(mockOnSent).not.toHaveBeenCalled();
  });

  test("shows loading state during submission", async () => {
    authFetch.authFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              text: () => Promise.resolve("OTP sent successfully"),
            });
          }, 100);
        })
    );

    renderWithProviders(<ForgotPasswordForm onSent={mockOnSent} />);

    const emailInput = document.querySelector("#forgot-email");
    const submitButton = screen.getByRole("button", {
      name: /forgot.sendOtp/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  test("displays success message on successful submission", async () => {
    authFetch.authFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("OTP sent successfully"),
    });

    renderWithProviders(<ForgotPasswordForm onSent={mockOnSent} />);

    const emailInput = document.querySelector("#forgot-email");
    const submitButton = screen.getByRole("button", {
      name: /forgot.sendOtp/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("forgot.success")).toBeInTheDocument();
    });
  });
});
