import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import blogService from "../../services/blogService";
import logger from "../../utils/logger";

const BlogForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  error = "",
  success = "",
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: null,
    categoryIds: [], // Changed to array of category IDs
    tagIds: [], // Changed to array of tag IDs
    status: "pending", // Always create posts as pending for admin approval
  });

  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // Load categories and tags from API
  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      try {
        setLoadingCategories(true);
        setLoadingTags(true);

        const [categoriesData, tagsData] = await Promise.all([
          blogService.getAllCategories(),
          blogService.getAllTags(),
        ]);

        setAvailableCategories(
          Array.isArray(categoriesData) ? categoriesData : []
        );
        setAvailableTags(Array.isArray(tagsData) ? tagsData : []);
      } catch (error) {
        logger.error("Error loading categories and tags:", error);
      } finally {
        setLoadingCategories(false);
        setLoadingTags(false);
      }
    };

    loadCategoriesAndTags();
  }, []);

  useEffect(() => {
    if (initialData) {
      // Extract category and tag IDs from initial data
      const categoryIds = initialData.categories
        ? initialData.categories.map((cat) =>
            typeof cat === "object" ? cat.id : cat
          )
        : [];
      const tagIds = initialData.tags
        ? initialData.tags.map((tag) =>
            typeof tag === "object" ? tag.id : tag
          )
        : [];

      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        excerpt: initialData.excerpt || "",
        featuredImage: initialData.featuredImage || null,
        categoryIds: categoryIds,
        tagIds: tagIds,
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

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

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

  // Reset preview when formData.featuredImage changes (e.g., when editing)
  useEffect(() => {
    if (formData.featuredImage && typeof formData.featuredImage === "string") {
      // If it's a URL string (from existing post), use it as preview
      setImagePreview(formData.featuredImage);
    } else if (!formData.featuredImage) {
      // If no image, clear preview
      setImagePreview(null);
    }
  }, [formData.featuredImage]);

  const removeTag = (tagIdToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.filter((tagId) => tagId !== tagIdToRemove),
    }));
  };

  const handleCategoryChange = (event) => {
    const categoryId = event.target.value;
    if (categoryId) {
      // Allow multiple categories
      if (!formData.categoryIds.includes(Number(categoryId))) {
        setFormData((prev) => ({
          ...prev,
          categoryIds: [...prev.categoryIds, Number(categoryId)],
        }));
      }
      // Reset select
      event.target.value = "";
    }
  };

  const removeCategory = (categoryIdToRemove) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.filter((id) => id !== categoryIdToRemove),
    }));
  };

  const handleTagChange = (event) => {
    const tagId = event.target.value;
    if (tagId) {
      // Allow multiple tags
      if (!formData.tagIds.includes(Number(tagId))) {
        setFormData((prev) => ({
          ...prev,
          tagIds: [...prev.tagIds, Number(tagId)],
        }));
      }
      // Reset select
      event.target.value = "";
    }
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
    const isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      logger.debug("Validation errors:", errors);
    }

    return isValid;
  };

  const handleSubmit = async (status) => {
    logger.debug("BlogForm handleSubmit called with status:", status);
    logger.debug("Form data:", formData);

    if (!validateForm()) {
      logger.debug("Form validation failed");
      return;
    }

    // Always submit as "pending" for admin approval
    const submitData = {
      ...formData,
      status: "pending",
      categoryIds: formData.categoryIds, // Send category IDs
      tagIds: formData.tagIds, // Send tag IDs
    };

    logger.debug("Submitting data:", submitData);
    try {
      await onSubmit(submitData);
    } catch (error) {
      logger.error("Error in handleSubmit:", error);
      // Error is handled by parent component (CreatePostPage)
    }
  };

  const getSelectedCategories = () => {
    return formData.categoryIds
      .map((id) => availableCategories.find((cat) => cat.id === id))
      .filter(Boolean);
  };

  const getSelectedTags = () => {
    return formData.tagIds
      .map((id) => availableTags.find((tag) => tag.id === id))
      .filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
          {error}
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

        {/* Categories */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("blog.createPostForm.form.category")}
          </label>
          <select
            onChange={handleCategoryChange}
            disabled={loadingCategories}
            className="w-full px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
          >
            <option value="">
              {loadingCategories
                ? t("common.loading")
                : t("blog.createPostForm.form.selectCategory")}
            </option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex flex-wrap gap-2">
            {getSelectedCategories().map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${category.color || "#10B981"}20`,
                  color: category.color || "#10B981",
                  border: `1px solid ${category.color || "#10B981"}`,
                }}
              >
                {category.name}
                <button
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  className="ml-2 hover:opacity-75"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("blog.createPostForm.form.tags")}
          </label>
          <select
            onChange={handleTagChange}
            disabled={loadingTags}
            className="w-full px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
          >
            <option value="">
              {loadingTags
                ? t("common.loading")
                : t("blog.createPostForm.form.selectTag") || "Chọn thẻ"}
            </option>
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          {/* Selected tags */}
          <div className="mt-2 flex flex-wrap gap-2">
            {getSelectedTags().map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${tag.color || "#3B82F6"}20`,
                  color: tag.color || "#3B82F6",
                  border: `1px solid ${tag.color || "#3B82F6"}`,
                }}
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => removeTag(tag.id)}
                  className="ml-2 hover:opacity-75"
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
            {imagePreview ||
            (formData.featuredImage &&
              typeof formData.featuredImage === "string") ? (
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden group">
                <img
                  src={imagePreview || formData.featuredImage}
                  alt="Preview"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                  <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-center">
                    <svg
                      className="mx-auto h-8 w-8 mb-2"
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
                    <p className="text-sm">
                      {t("blog.createPostForm.form.changeImage") ||
                        "Click để thay đổi ảnh"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
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
                  {t("blog.createPostForm.form.featuredImagePlaceholder")}
                </p>
              </div>
            )}
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
