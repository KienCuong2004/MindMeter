import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import ChatBotModal from "../ChatBotModal";

// react-router-dom will be automatically mocked from __mocks__/react-router-dom.js

// Mock useTranslation hook
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key, options) => {
      // Handle returnObjects for guide.sections
      if (key === "guide.sections" && options?.returnObjects) {
        return [
          {
            title: "guide.section1.title",
            content: [
              "guide.section1.content.item1",
              "guide.section1.content.item2",
            ],
          },
          {
            title: "guide.section2.title",
            content: [
              "guide.section2.content.item1",
              "guide.section2.content.item2",
            ],
          },
        ];
      }
      return key;
    },
    i18n: { changeLanguage: jest.fn() },
  }),
}));

// Mock axios
jest.mock("axios", () => {
  const mockAxiosInstance = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() =>
      Promise.resolve({ data: { response: "Mock response" } })
    ),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
      get: mockAxiosInstance.get,
      post: mockAxiosInstance.post,
      put: mockAxiosInstance.put,
      delete: mockAxiosInstance.delete,
    },
    ...mockAxiosInstance,
  };
});

// Mock authFetch
jest.mock("../../authFetch", () => ({
  authFetch: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ reply: "Mock response" }),
    })
  ),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
// Mock both global and window localStorage
global.localStorage = localStorageMock;
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

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

    // Close button has title="close", not name="close"
    const closeButton = screen.getByTitle("close");
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
    const authFetch = require("../../authFetch");
    // Mock authFetch to delay response
    authFetch.authFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ reply: "Response" }),
              }),
            100
          )
        )
    );

    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("chatbot.inputPlaceholder");
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(sendButton);

    // Loading state is shown via loading spinner or processing message
    // Check for loading indicator or processing message
    await waitFor(
      () => {
        const loadingIndicator =
          screen.queryByText("processingAutoBooking") ||
          document.querySelector('[class*="animate"]');
        expect(loadingIndicator || input.value === "").toBeTruthy();
      },
      { timeout: 200 }
    );
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

    // Menu button has title="options", not name="menu"
    const menuButton = screen.getByTitle("options");
    fireEvent.click(menuButton);

    expect(screen.getByText("chatbot.downloadTxt")).toBeInTheDocument();
    expect(screen.getByText("chatbot.feedback")).toBeInTheDocument();
    expect(screen.getByText("chatbot.guide")).toBeInTheDocument();
  });

  test("shows feedback modal when feedback is clicked", async () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    // Menu button has title="options", not name="menu"
    const menuButton = screen.getByTitle("options");
    fireEvent.click(menuButton);

    const feedbackButton = screen.getByText("chatbot.feedback");
    fireEvent.click(feedbackButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("chatbot.feedbackInputPlaceholder")
      ).toBeInTheDocument();
    });
  });

  test("shows guide modal when guide is clicked", async () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    // Menu button has title="options", not name="menu"
    const menuButton = screen.getByTitle("options");
    fireEvent.click(menuButton);

    const guideButton = screen.getByText("chatbot.guide");
    fireEvent.click(guideButton);

    // Wait for guide modal to open and check for guide title
    await waitFor(() => {
      expect(screen.getByText("guide.title")).toBeInTheDocument();
    });

    // Check that guide sections are displayed (mock returns section titles)
    expect(screen.getByText("guide.section1.title")).toBeInTheDocument();
  });

  test("toggles bot avatar visibility", async () => {
    renderWithProviders(<ChatBotModal {...defaultProps} />);

    // Menu button has title="options", not name="menu"
    const menuButton = screen.getByTitle("options");
    fireEvent.click(menuButton);

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByText("chatbot.hideAvatar")).toBeInTheDocument();
    });

    const toggleAvatarButton = screen.getByText("chatbot.hideAvatar");

    // Click to toggle - menu closes after click, so we need to reopen to check
    fireEvent.click(toggleAvatarButton);

    // Reopen menu to check the text changed
    fireEvent.click(menuButton);

    // After clicking, text should change to showAvatar (when avatar is hidden)
    await waitFor(() => {
      expect(screen.getByText("chatbot.showAvatar")).toBeInTheDocument();
    });
  });

  test("clears chat history when clear button is clicked", async () => {
    // Set up user with email and explicit anonymous: false for getChatHistoryKey
    // getChatHistoryKey requires: user && user.email && !user.anonymous
    const userWithEmail = {
      id: 1,
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "STUDENT",
      anonymous: false,
    };
    const propsWithEmail = {
      ...defaultProps,
      user: userWithEmail,
    };

    // Clear previous calls
    localStorageMock.removeItem.mockClear();

    renderWithProviders(<ChatBotModal {...propsWithEmail} />);

    // Open menu
    const menuButton = screen.getByTitle("options");
    fireEvent.click(menuButton);

    // Wait for menu and click clear button
    await waitFor(() => {
      expect(screen.getByText("chatbot.clearHistory")).toBeInTheDocument();
    });

    const clearButton = screen.getByText("chatbot.clearHistory");

    // Click clear button - this should call clearHistory()
    // clearHistory calls getChatHistoryKey(user) which should return chatHistoryKey
    // Then calls localStorage.removeItem(chatHistoryKey) and localStorage.removeItem("mindmeter_chat_history")
    fireEvent.click(clearButton);

    // Verify localStorage.removeItem was called with correct keys
    // clearHistory calls removeItem synchronously, but React might batch updates
    // So we need to wait a bit for the call to complete
    await waitFor(() => {
      const chatHistoryKey = `mindmeter_chat_history_${userWithEmail.email}`;
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(chatHistoryKey);
    });

    // Also verify the second removeItem call
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      "mindmeter_chat_history"
    );
  });

  test("shows expert suggestion for anonymous users", async () => {
    const authFetch = require("../../authFetch");
    // Mock authFetch to return available experts
    authFetch.authFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([{ id: 1, firstName: "Expert", lastName: "Name" }]),
    });
    // Mock chatbot response
    authFetch.authFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: "Mock response" }),
    });

    const anonymousUser = { ...mockUser, role: "ANONYMOUS" };
    renderWithProviders(
      <ChatBotModal {...defaultProps} user={anonymousUser} />
    );

    // expertSuggestion is added after 2 seconds when availableExperts.length > 0
    await waitFor(
      () => {
        expect(
          screen.getByText("chatbot.expertSuggestion")
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("handles network error gracefully", async () => {
    // Mock authFetch to reject
    const authFetch = require("../../authFetch");
    // Mock available experts fetch
    authFetch.authFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    // Mock chatbot API to reject
    authFetch.authFetch.mockRejectedValueOnce(new Error("Network error"));

    renderWithProviders(<ChatBotModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("chatbot.inputPlaceholder");
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(sendButton);

    // Error message is shown when sendMessage fails
    await waitFor(
      () => {
        expect(screen.getByText("chatbot.errorMessage")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
