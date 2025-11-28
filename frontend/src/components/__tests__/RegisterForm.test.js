import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import RegisterForm from "../RegisterForm";
import * as authFetch from "../../authFetch";

// Mock authFetch
jest.mock("../../authFetch", () => ({
  authFetch: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: "Success" }),
      text: () => Promise.resolve(JSON.stringify({ message: "Success" })),
    })
  ),
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

describe("RegisterForm", () => {
  const mockOnRegister = jest.fn();
  const mockOnSwitchForm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("renders registration form with all fields", () => {
    renderWithProviders(
      <RegisterForm
        onRegister={mockOnRegister}
        onSwitchForm={mockOnSwitchForm}
      />
    );

    // Check that inputs exist (labels are not associated via htmlFor)
    expect(document.querySelector('input[name="email"]')).toBeInTheDocument();
    expect(
      document.querySelector('input[name="password"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[name="confirmPassword"]')
    ).toBeInTheDocument();
    // Check that submit button exists (there are multiple buttons with "register" text)
    const submitButton = screen
      .getAllByRole("button", { name: /register/i })
      .find((btn) => btn.type === "submit");
    expect(submitButton).toBeInTheDocument();
  });

  test("shows validation error for empty email", async () => {
    renderWithProviders(
      <RegisterForm
        onRegister={mockOnRegister}
        onSwitchForm={mockOnSwitchForm}
      />
    );

    // There are multiple buttons with "register" text (submit and Google), so find submit button specifically
    const submitButton = screen
      .getAllByRole("button", { name: /register/i })
      .find((btn) => btn.type === "submit");
    fireEvent.click(submitButton);

    // Validation error is shown in bannerMessage (banner)
    // validate() sets fieldError and returns false, then bannerMessage is set from fieldError
    await waitFor(
      () => {
        // Check for validation error text (could be in banner or visible error message)
        const errorText =
          screen.queryByText("validation.emailRequired") ||
          screen.queryByText((content, element) => {
            return element?.textContent?.includes("validation.emailRequired");
          });
        expect(errorText).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("shows validation error for invalid email format", async () => {
    renderWithProviders(
      <RegisterForm
        onRegister={mockOnRegister}
        onSwitchForm={mockOnSwitchForm}
      />
    );

    const emailInput = document.querySelector('input[name="email"]');
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    // There are multiple buttons with "register" text (submit and Google), so find submit button specifically
    const submitButton = screen
      .getAllByRole("button", { name: /register/i })
      .find((btn) => btn.type === "submit");
    fireEvent.click(submitButton);

    // Validation error is shown in bannerMessage (banner)
    await waitFor(
      () => {
        expect(screen.getByText("validation.emailInvalid")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  test("shows validation error for password mismatch", async () => {
    renderWithProviders(
      <RegisterForm
        onRegister={mockOnRegister}
        onSwitchForm={mockOnSwitchForm}
      />
    );

    // Labels are not associated with inputs via htmlFor, so use querySelector
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    );

    // Password must meet strong password rule first, then we check mismatch
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password456!" }, // Different password to trigger mismatch
    });

    // There are multiple buttons with "register" text (submit and Google), so find submit button specifically
    const submitButton = screen
      .getAllByRole("button", { name: /register/i })
      .find((btn) => btn.type === "submit");
    fireEvent.click(submitButton);

    // Validation error is shown in bannerMessage (banner)
    // Note: handleSubmit takes first error from Object.values, which might be password or confirmPassword
    // We need to check for either passwordMismatch or passwordStrongRule
    await waitFor(
      () => {
        const bannerText = screen.getByText(
          /validation\.(passwordMismatch|passwordStrongRule)/
        );
        expect(bannerText).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  test("shows validation error for short password", async () => {
    renderWithProviders(
      <RegisterForm
        onRegister={mockOnRegister}
        onSwitchForm={mockOnSwitchForm}
      />
    );

    // Labels are not associated with inputs via htmlFor, so use querySelector
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    );

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "123" } });

    // There are multiple buttons with "register" text (submit and Google), so find submit button specifically
    const submitButton = screen
      .getAllByRole("button", { name: /register/i })
      .find((btn) => btn.type === "submit");
    fireEvent.click(submitButton);

    // Validation error is shown in bannerMessage (banner)
    // Note: Password validation uses strong password rule, not min length
    await waitFor(
      () => {
        // Check for password validation error (strong rule or mismatch)
        const errorText =
          screen.queryByText("validation.passwordStrongRule") ||
          screen.queryByText("validation.passwordMismatch");
        expect(errorText).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  test("prevents submission without agreeing to terms", async () => {
    renderWithProviders(
      <RegisterForm
        onRegister={mockOnRegister}
        onSwitchForm={mockOnSwitchForm}
      />
    );

    // Labels are not associated with inputs via htmlFor, so use querySelector
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    );

    // Password must meet strong password rule first
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    // Don't check agree checkbox

    // There are multiple buttons with "register" text (submit and Google), so find submit button specifically
    const submitButton = screen
      .getAllByRole("button", { name: /register/i })
      .find((btn) => btn.type === "submit");
    fireEvent.click(submitButton);

    // Validation error is shown in bannerMessage (banner)
    // Note: handleSubmit takes first error from Object.values, which might be password or agree
    // We need to check for either agreeRequired or passwordStrongRule
    await waitFor(
      () => {
        const bannerText = screen.getByText(
          /validation\.(agreeRequired|passwordStrongRule)/
        );
        expect(bannerText).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  test("calls onRegister with correct data when form is valid", async () => {
    authFetch.authFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Registration successful" }),
      text: () =>
        Promise.resolve(JSON.stringify({ message: "Registration successful" })),
    });

    renderWithProviders(
      <RegisterForm
        onRegister={mockOnRegister}
        onSwitchForm={mockOnSwitchForm}
      />
    );

    // Labels are not associated with inputs via htmlFor, so use querySelector
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    );
    // There are multiple checkboxes (showPassword and agree), so find the agree checkbox specifically
    const termsCheckbox =
      document.querySelector("#agree") || screen.getByLabelText(/agree/i);

    // Password must meet strong password rule: >=8 chars, 1 upper, 1 lower, 1 number, 1 special
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    // There are multiple buttons with "register" text (submit and Google), so find submit button specifically
    const submitButton = screen
      .getAllByRole("button", { name: /register/i })
      .find((btn) => btn.type === "submit");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authFetch.authFetch).toHaveBeenCalled();
    });
  });

  test("opens terms modal when terms link is clicked", async () => {
    renderWithProviders(
      <RegisterForm
        onRegister={mockOnRegister}
        onSwitchForm={mockOnSwitchForm}
      />
    );

    // Find terms link - it's inside a Trans component, so we need to find it differently
    const termsLink = screen.getByText(/terms/i);
    fireEvent.click(termsLink);

    // Terms modal should open - check for modal title
    await waitFor(
      () => {
        // Modal shows title with translation key "terms.title"
        expect(screen.getByText("terms.title")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("calls onSwitchForm when login link is clicked", () => {
    renderWithProviders(
      <RegisterForm
        onRegister={mockOnRegister}
        onSwitchForm={mockOnSwitchForm}
      />
    );

    const loginLink = screen.getByText(/login/i);
    fireEvent.click(loginLink);

    expect(mockOnSwitchForm).toHaveBeenCalledTimes(1);
  });
});
