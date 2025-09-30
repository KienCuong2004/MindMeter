import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useTheme as useCustomTheme } from "../../hooks/useTheme";

const BlogForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  error = "",
  success = "",
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { theme: themeMode } = useCustomTheme();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: null,
    category: "",
    tags: [],
    status: "pending", // Always create posts as pending for admin approval
  });

  const [tagInput, setTagInput] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const categories = [
    { value: "personalStory", label: t("blog.categories.personalStory") },
    { value: "mentalHealthTips", label: t("blog.categories.mentalHealthTips") },
    { value: "copingStrategies", label: t("blog.categories.copingStrategies") },
    { value: "therapy", label: t("blog.categories.therapy") },
    { value: "lifestyle", label: t("blog.categories.lifestyle") },
    { value: "relationships", label: t("blog.categories.relationships") },
    { value: "workLife", label: t("blog.categories.workLife") },
    { value: "resources", label: t("blog.categories.resources") },
    { value: "community", label: t("blog.categories.community") },
    { value: "research", label: t("blog.categories.research") },
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        excerpt: initialData.excerpt || "",
        featuredImage: initialData.featuredImage || null,
        category: initialData.category || "",
        tags: initialData.tags || [],
        status: initialData.status || "draft",
      });
    }
  }, [initialData]);

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setValidationErrors((prev) => ({
          ...prev,
          featuredImage: t("blog.createPostForm.validation.invalidImageFormat"),
        }));
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          featuredImage: t("blog.createPostForm.validation.imageTooLarge"),
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        featuredImage: file,
      }));

      setValidationErrors((prev) => ({
        ...prev,
        featuredImage: "",
      }));
    }
  };

  const handleTagInputChange = (event) => {
    setTagInput(event.target.value);
  };

  const handleTagInputKeyPress = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = t("blog.createPostForm.validation.titleRequired");
    } else if (formData.title.length < 10) {
      errors.title = t("blog.createPostForm.validation.titleMinLength");
    }

    if (!formData.content.trim()) {
      errors.content = t("blog.createPostForm.validation.contentRequired");
    } else if (formData.content.length < 100) {
      errors.content = t("blog.createPostForm.validation.contentMinLength");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (status) => {
    console.log("BlogForm handleSubmit called with status:", status);
    console.log("Form data:", formData);

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    // Always submit as "pending" for admin approval
    const submitData = {
      ...formData,
      status: "pending",
    };

    console.log("Submitting data:", submitData);
    onSubmit(submitData);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("blog.createPostForm.form.title")} *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={handleInputChange("title")}
            className="w-full px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder={t("blog.createPostForm.form.titlePlaceholder")}
          />
          {validationErrors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.title}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("blog.createPostForm.form.category")}
          </label>
          <select
            value={formData.category}
            onChange={handleInputChange("category")}
            className="w-full px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="">
              {t("blog.createPostForm.form.selectCategory")}
            </option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("blog.createPostForm.form.tags")}
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyPress={handleTagInputKeyPress}
            onBlur={addTag}
            className="w-full px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder={t("blog.createPostForm.form.tagsPlaceholder")}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Featured Image */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("blog.createPostForm.form.featuredImage")}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="featured-image-upload"
          />
          <label htmlFor="featured-image-upload" className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formData.featuredImage
                  ? typeof formData.featuredImage === "string"
                    ? formData.featuredImage
                    : formData.featuredImage.name
                  : t("blog.createPostForm.form.featuredImagePlaceholder")}
              </p>
            </div>
          </label>
          {validationErrors.featuredImage && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.featuredImage}
            </p>
          )}
        </div>

        {/* Excerpt */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("blog.createPostForm.form.excerpt")}
          </label>
          <textarea
            value={formData.excerpt}
            onChange={handleInputChange("excerpt")}
            rows={3}
            className="w-full px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder={t("blog.createPostForm.form.excerptPlaceholder")}
          />
        </div>

        {/* Content */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("blog.createPostForm.form.content")} *
          </label>
          <textarea
            value={formData.content}
            onChange={handleInputChange("content")}
            rows={12}
            className="w-full px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder={t("blog.createPostForm.form.contentPlaceholder")}
          />
          {validationErrors.content && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.content}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-2">
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
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
              {t("blog.createPostForm.form.cancel")}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit("pending")}
              disabled={loading}
              className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
              {t("blog.createPostForm.form.publish")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogForm;
