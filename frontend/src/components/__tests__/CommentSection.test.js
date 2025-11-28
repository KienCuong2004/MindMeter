import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import CommentSection from "../CommentSection";
import * as blogService from "../../services/blogService";

// Mock date-fns/locale - removed, using setupTests.js mock instead

// Mock blogService
jest.mock("../../services/blogService", () => {
  const mockBlogService = {
    getComments: jest.fn(),
    createComment: jest.fn(),
    editComment: jest.fn(),
    deleteComment: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockBlogService,
    ...mockBlogService,
  };
});

// Mock useTranslation
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

describe("CommentSection", () => {
  const mockPostId = 1;
  const mockUser = {
    id: 1,
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "STUDENT",
  };

  const mockComments = [
    {
      id: 1,
      content: "Great post!",
      author: { id: 1, firstName: "John", lastName: "Doe" },
      createdAt: "2024-01-01T00:00:00Z",
    },
  ];

  const mockCanDeleteComment = (comment) => {
    return comment.author.id === mockUser.id;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock getComments to return paginated response
    const blogServiceModule = require("../../services/blogService");
    const service = blogServiceModule.default || blogServiceModule;
    service.getComments.mockResolvedValue({
      content: mockComments,
      last: true,
      totalElements: mockComments.length,
    });
  });

  test("renders comment section", async () => {
    renderWithProviders(
      <CommentSection
        postId={mockPostId}
        currentUser={mockUser}
        canDeleteComment={mockCanDeleteComment}
      />
    );

    const blogServiceModule = require("../../services/blogService");
    const service = blogServiceModule.default || blogServiceModule;
    await waitFor(() => {
      expect(service.getComments).toHaveBeenCalledWith(mockPostId, 0, 10);
    });
  });

  test("displays comments", async () => {
    const blogServiceModule = require("../../services/blogService");
    const service = blogServiceModule.default || blogServiceModule;
    service.getComments.mockResolvedValue({
      content: mockComments,
      last: true,
    });

    renderWithProviders(
      <CommentSection
        postId={mockPostId}
        currentUser={mockUser}
        canDeleteComment={mockCanDeleteComment}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Great post!")).toBeInTheDocument();
    });
  });

  test("allows user to add a comment", async () => {
    const blogServiceModule = require("../../services/blogService");
    const service = blogServiceModule.default || blogServiceModule;
    service.createComment.mockResolvedValue({
      id: 2,
      content: "New comment",
      author: mockUser,
    });

    renderWithProviders(
      <CommentSection
        postId={mockPostId}
        currentUser={mockUser}
        canDeleteComment={mockCanDeleteComment}
      />
    );

    // Wait for component to load
    await waitFor(() => {
      expect(service.getComments).toHaveBeenCalled();
    });

    const commentInput = screen.getByPlaceholderText(
      /blog.comment.placeholder/i
    );
    fireEvent.change(commentInput, { target: { value: "New comment" } });

    const submitButton = screen.getByRole("button", {
      name: /blog.comment.submit/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(service.createComment).toHaveBeenCalledWith(mockPostId, {
        content: "New comment",
        parentId: null,
      });
    });
  });

  test("allows user to edit their own comment", async () => {
    const blogServiceModule = require("../../services/blogService");
    const service = blogServiceModule.default || blogServiceModule;
    const userComment = {
      id: 1,
      content: "My comment",
      author: { id: 1, firstName: "John", lastName: "Doe" },
      createdAt: "2024-01-01T00:00:00Z",
    };

    service.getComments.mockResolvedValue({
      content: [userComment],
      last: true,
    });
    service.editComment.mockResolvedValue({
      ...userComment,
      content: "Updated comment",
    });

    renderWithProviders(
      <CommentSection
        postId={mockPostId}
        currentUser={mockUser}
        canDeleteComment={mockCanDeleteComment}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("My comment")).toBeInTheDocument();
    });

    // Menu button (ellipsis) only appears if canDeleteComment returns true
    // Find menu button by looking for button with hover:bg-gray-100 className
    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons.find((btn) => {
      // Menu button has className "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
      return (
        btn.className &&
        (btn.className.includes("hover:bg-gray-100") ||
          btn.className.includes("hover:bg-gray-700"))
      );
    });

    // If not found, try finding by SVG inside button with p-1 className
    const menuButtonAlt = menuButtons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && btn.className && btn.className.includes("p-1");
    });

    const finalMenuButton = menuButton || menuButtonAlt;
    expect(finalMenuButton).toBeDefined();
    expect(finalMenuButton).toBeInTheDocument();
    fireEvent.click(finalMenuButton);

    // Wait for dropdown menu to appear
    await waitFor(() => {
      expect(screen.getByText("blog.comment.edit")).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", {
      name: /blog.comment.edit/i,
    });
    fireEvent.click(editButton);

    const editInput = screen.getByDisplayValue("My comment");
    fireEvent.change(editInput, { target: { value: "Updated comment" } });

    // Save button text is "common.save", not "blog.comment.save"
    const saveButton = screen.getByRole("button", {
      name: /common.save/i,
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(service.editComment).toHaveBeenCalledWith(1, "Updated comment");
    });
  });

  test("allows user to delete their own comment", async () => {
    const blogServiceModule = require("../../services/blogService");
    const service = blogServiceModule.default || blogServiceModule;
    const userComment = {
      id: 1,
      content: "My comment",
      author: { id: 1, firstName: "John", lastName: "Doe" },
      createdAt: "2024-01-01T00:00:00Z",
    };

    service.getComments.mockResolvedValue({
      content: [userComment],
      last: true,
    });
    service.deleteComment.mockResolvedValue({});

    renderWithProviders(
      <CommentSection
        postId={mockPostId}
        currentUser={mockUser}
        canDeleteComment={mockCanDeleteComment}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("My comment")).toBeInTheDocument();
    });

    // Menu button (ellipsis) only appears if canDeleteComment returns true
    // Find menu button by looking for button with hover:bg-gray-100 className
    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons.find((btn) => {
      // Menu button has className "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
      return (
        btn.className &&
        (btn.className.includes("hover:bg-gray-100") ||
          btn.className.includes("hover:bg-gray-700"))
      );
    });

    // If not found, try finding by SVG inside button with p-1 className
    const menuButtonAlt = menuButtons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && btn.className && btn.className.includes("p-1");
    });

    const finalMenuButton = menuButton || menuButtonAlt;
    expect(finalMenuButton).toBeDefined();
    expect(finalMenuButton).toBeInTheDocument();
    fireEvent.click(finalMenuButton);

    // Wait for dropdown menu to appear
    await waitFor(() => {
      expect(screen.getByText("blog.comment.delete")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", {
      name: /blog.comment.delete/i,
    });
    fireEvent.click(deleteButton);

    // handleDelete sets showDeleteModal to true, need to confirm in modal
    // Wait for delete confirmation modal to appear
    await waitFor(() => {
      expect(
        screen.getByText("blog.post.comment.deleteConfirm")
      ).toBeInTheDocument();
    });

    // Click confirm delete button in modal
    const confirmDeleteButton = screen.getByRole("button", {
      name: /common.delete/i,
    });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(service.deleteComment).toHaveBeenCalledWith(1);
    });
  });
});
