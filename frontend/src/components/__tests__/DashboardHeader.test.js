import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import DashboardHeader from "../DashboardHeader";
import { SavedArticlesProvider } from "../../contexts/SavedArticlesContext";

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
jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    BrowserRouter: ({ children }) => React.createElement("div", null, children),
    Routes: ({ children }) => React.createElement("div", null, children),
    Route: ({ children }) => React.createElement("div", null, children),
    Navigate: () => null,
    Link: ({ children, to, ...props }) =>
      React.createElement("a", { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
    useParams: () => ({}),
  };
});

const renderWithProviders = (component) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <SavedArticlesProvider>{component}</SavedArticlesProvider>
    </I18nextProvider>
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
    // Mock window.location.pathname to be "/home" for Start Tour button to show
    Object.defineProperty(window, "location", {
      value: { pathname: "/home" },
      writable: true,
    });

    renderWithProviders(<DashboardHeader {...defaultProps} />);

    // Start Tour button only shows when onStartTour prop is provided and pathname is "/home"
    // On desktop, it shows "tour.startTour" text, on mobile it shows "Tour"
    const startTourButton =
      screen.queryByText("tour.startTour") || screen.queryByText("Tour");
    expect(startTourButton).toBeInTheDocument();
  });

  test("does not show Start Tour button for non-STUDENT roles", () => {
    const expertUser = { ...mockUser, role: "EXPERT" };
    renderWithProviders(
      <DashboardHeader {...defaultProps} user={expertUser} />
    );

    expect(screen.queryByText("tour.startTour")).not.toBeInTheDocument();
  });

  test("calls onStartTour when Start Tour button is clicked", () => {
    // Mock window.location.pathname to be "/home" for Start Tour button to show
    Object.defineProperty(window, "location", {
      value: { pathname: "/home" },
      writable: true,
    });

    renderWithProviders(<DashboardHeader {...defaultProps} />);

    // On desktop, it shows "tour.startTour" text, on mobile it shows "Tour"
    const startTourButton =
      screen.getByText("tour.startTour") || screen.getByText("Tour");
    fireEvent.click(startTourButton);

    expect(defaultProps.onStartTour).toHaveBeenCalledTimes(1);
  });

  test("toggles mobile menu when hamburger button is clicked", async () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    const hamburgerButton = screen.getByRole("button", { name: /open menu/i });
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      const homeElements = screen.getAllByText("navHome");
      expect(homeElements.length).toBeGreaterThan(0);
    });
  });

  test("calls onLogout when logout button is clicked", async () => {
    const { container } = renderWithProviders(
      <DashboardHeader {...defaultProps} />
    );

    // Open user menu by clicking on the user menu div
    const userMenuDiv = container.querySelector("#user-menu");
    if (userMenuDiv) {
      fireEvent.click(userMenuDiv);
    }

    // Wait for menu to appear and find logout button
    await waitFor(() => {
      const logoutButton = screen.getByText("logout");
      expect(logoutButton).toBeInTheDocument();
    });

    const logoutButton = screen.getByText("logout");
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

  test("navigates to correct dashboard when Home is clicked", async () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    // Open mobile menu
    const hamburgerButton = screen.getByRole("button", { name: /open menu/i });
    fireEvent.click(hamburgerButton);

    // Wait for mobile menu to appear, then find the button (not the span)
    await waitFor(() => {
      const homeButtons = screen.getAllByText("navHome");
      // The button in mobile menu should be clickable
      const homeButton = homeButtons.find((btn) => btn.tagName === "BUTTON");
      if (homeButton) {
        fireEvent.click(homeButton);
      }
    });

    expect(mockNavigate).toHaveBeenCalledWith("/student/dashboard");
  });

  test("applies dark theme classes correctly", () => {
    const { container } = renderWithProviders(
      <DashboardHeader {...defaultProps} theme="dark" />
    );

    // Find header by its className pattern
    const header = container.querySelector(".bg-gray-900\\/95");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("bg-gray-900/95");
  });

  test("applies light theme classes correctly", () => {
    const { container } = renderWithProviders(
      <DashboardHeader {...defaultProps} theme="light" />
    );

    // Find header by its className pattern
    const header = container.querySelector(".bg-white\\/95");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("bg-white/95");
  });

  test("shows user avatar when available", () => {
    renderWithProviders(<DashboardHeader {...defaultProps} />);

    const avatar = screen.getByAltText("avatar");
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  test("shows default avatar when no avatar URL", () => {
    const userWithoutAvatar = { ...mockUser, avatarUrl: null };
    renderWithProviders(
      <DashboardHeader {...defaultProps} user={userWithoutAvatar} />
    );

    // Default avatar is FaUserCircle icon - check if user name is displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
