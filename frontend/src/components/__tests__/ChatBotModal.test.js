import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import ChatBotModal from "../ChatBotModal";

// Mock useTranslation hook
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
}));

// Mock axios
jest.mock("axios", () => ({
  post: jest.fn(() => Promise.resolve({ data: { response: "Mock response" } })),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

const renderWithProviders = (component) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("ChatBotModal", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "STUDENT",
  };

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test("renders modal when open is true", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    expect(screen.getByText("chatbot.title")).toBeInTheDocument();
    expect(screen.getByText("chatbot.welcome")).toBeInTheDocument();
  });

  test("does not render modal when open is false", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} open={false} />);

    expect(screen.queryByText("chatbot.title")).not.toBeInTheDocument();
  });

  test("calls onClose when close button is clicked", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test("allows user to type in input field", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("chatbot.inputPlaceholder");
    fireEvent.change(input, { target: { value: "Hello, how are you?" } });

    expect(input.value).toBe("Hello, how are you?");
  });

  test("sends message when send button is clicked", async () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("chatbot.inputPlaceholder");
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  test("sends message when Enter key is pressed", async () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("chatbot.inputPlaceholder");

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  test("shows loading state when sending message", async () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("chatbot.inputPlaceholder");
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(sendButton);

    expect(screen.getByText("chatbot.sending")).toBeInTheDocument();
  });

  test("disables send button when input is empty", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  test("enables send button when input has text", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("chatbot.inputPlaceholder");
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Hello" } });

    expect(sendButton).not.toBeDisabled();
  });

  test("shows menu when three dots button is clicked", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(menuButton);

    expect(screen.getByText("chatbot.downloadTxt")).toBeInTheDocument();
    expect(screen.getByText("chatbot.feedback")).toBeInTheDocument();
    expect(screen.getByText("chatbot.guide")).toBeInTheDocument();
  });

  test("shows feedback modal when feedback is clicked", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(menuButton);

    const feedbackButton = screen.getByText("chatbot.feedback");
    fireEvent.click(feedbackButton);

    expect(
      screen.getByText("chatbot.feedbackInputPlaceholder")
    ).toBeInTheDocument();
  });

  test("shows guide modal when guide is clicked", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(menuButton);

    const guideButton = screen.getByText("chatbot.guide");
    fireEvent.click(guideButton);

    expect(screen.getByText("chatbot.guideStep1")).toBeInTheDocument();
  });

  test("toggles bot avatar visibility", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(menuButton);

    const toggleAvatarButton = screen.getByText("chatbot.hideAvatar");
    fireEvent.click(toggleAvatarButton);

    expect(screen.getByText("chatbot.showAvatar")).toBeInTheDocument();
  });

  test("clears chat history when clear button is clicked", () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(menuButton);

    const clearButton = screen.getByText("chatbot.clearHistory");
    fireEvent.click(clearButton);

    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  test("shows expert suggestion for anonymous users", () => {
    const anonymousUser = { ...mockUser, role: "ANONYMOUS" };
    renderWithProviders(
      <ChatBotModal {...defaultProps} user={anonymousUser} />
    );

    expect(screen.getByText("chatbot.expertSuggestion")).toBeInTheDocument();
  });

  test("handles network error gracefully", async () => {
    const axios = require("axios");
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("chatbot.inputPlaceholder");
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("chatbot.networkError")).toBeInTheDocument();
    });
  });
});
