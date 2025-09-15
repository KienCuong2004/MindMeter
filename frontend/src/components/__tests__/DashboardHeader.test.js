import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import DashboardHeader from "../DashboardHeader";

// Mock useTranslation hook
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>{component}</I18nextProvider>
    </BrowserRouter>
  );
};

describe("DashboardHeader", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "STUDENT",
    avatarUrl: "https://example.com/avatar.jpg",
  };

  const defaultProps = {
    logoIcon: <div data-testid="logo-icon">🧠</div>,
    logoText: "MindMeter",
    user: mockUser,
    theme: "dark",
    setTheme: jest.fn(),
    onNotificationClick: jest.fn(),
    onLogout: jest.fn(),
    onStartTour: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders header with logo and user info", () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    expect(screen.getByText("MindMeter")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByTestId("logo-icon")).toBeInTheDocument();
  });

  test("shows Start Tour button for STUDENT role", () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    expect(screen.getByText("navStartTour")).toBeInTheDocument();
  });

  test("does not show Start Tour button for non-STUDENT roles", () => {
    const expertUser = { ...mockUser, role: "EXPERT" };
    renderWithProviders(
      <DashboardHeader {...defaultProps} user={expertUser} />
    );

    expect(screen.queryByText("navStartTour")).not.toBeInTheDocument();
  });

  test("calls onStartTour when Start Tour button is clicked", () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    const startTourButton = screen.getByText("navStartTour");
    fireEvent.click(startTourButton);

    expect(defaultProps.onStartTour).toHaveBeenCalledTimes(1);
  });

  test("toggles mobile menu when hamburger button is clicked", async () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    const hamburgerButton = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(screen.getByText("navHome")).toBeInTheDocument();
    });
  });

  test("calls onLogout when logout button is clicked", () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    // Open user menu first
    const userMenuButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(userMenuButton);

    const logoutButton = screen.getByText("navLogout");
    fireEvent.click(logoutButton);

    expect(defaultProps.onLogout).toHaveBeenCalledTimes(1);
  });

  test("calls onNotificationClick when notification button is clicked", () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    const notificationButton = screen.getByRole("button", {
      name: /notification/i,
    });
    fireEvent.click(notificationButton);

    expect(defaultProps.onNotificationClick).toHaveBeenCalledTimes(1);
  });

  test("navigates to correct dashboard when Home is clicked", () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    // Open mobile menu
    const hamburgerButton = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(hamburgerButton);

    const homeButton = screen.getByText("navHome");
    fireEvent.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith("/student/dashboard");
  });

  test("applies dark theme classes correctly", () => {
    renderWithProviders(<DashboardHeader {...defaultProps} theme="dark" />);

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("bg-gray-900");
  });

  test("applies light theme classes correctly", () => {
    renderWithProviders(<DashboardHeader {...defaultProps} theme="light" />);

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("bg-white");
  });

  test("shows user avatar when available", () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    const avatar = screen.getByAltText("User avatar");
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  test("shows default avatar when no avatar URL", () => {
    const userWithoutAvatar = { ...mockUser, avatarUrl: null };
    renderWithProviders(
      <DashboardHeader {...defaultProps} user={userWithoutAvatar} />
    );

    const defaultAvatar = screen.getByTestId("default-avatar");
    expect(defaultAvatar).toBeInTheDocument();
  });
});
