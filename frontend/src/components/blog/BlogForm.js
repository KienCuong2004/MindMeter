import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Save as SaveIcon,
  Publish as PublishIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  Preview as PreviewIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const ImageUploadArea = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(3),
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.3s ease",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + "10",
  },
}));

const TagInput = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    padding: theme.spacing(1),
  },
}));

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
    category: "",
    tags: [],
    status: "draft",
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

    const submitData = {
      ...formData,
      status,
    };

    console.log("Submitting data:", submitData);
    onSubmit(submitData);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Title */}
        <Grid size={12}>
          <TextField
            fullWidth
            label={t("blog.createPostForm.form.title")}
            placeholder={t("blog.createPostForm.form.titlePlaceholder")}
            value={formData.title}
            onChange={handleInputChange("title")}
            variant="outlined"
            required
            error={!!validationErrors.title}
            helperText={validationErrors.title}
          />
        </Grid>

        {/* Category */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel>{t("blog.createPostForm.form.category")}</InputLabel>
            <Select
              value={formData.category}
              onChange={handleInputChange("category")}
              label={t("blog.createPostForm.form.category")}
            >
              {categories.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Tags */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <TagInput
              fullWidth
              label={t("blog.createPostForm.form.tags")}
              placeholder={t("blog.createPostForm.form.tagsPlaceholder")}
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyPress={handleTagInputKeyPress}
              variant="outlined"
              onBlur={addTag}
            />
            <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag(tag)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Featured Image */}
        <Grid size={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t("blog.createPostForm.form.featuredImage")}
          </Typography>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
            id="featured-image-upload"
          />
          <label htmlFor="featured-image-upload">
            <ImageUploadArea>
              <ImageIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {formData.featuredImage
                  ? typeof formData.featuredImage === "string"
                    ? formData.featuredImage
                    : formData.featuredImage.name
                  : t("blog.createPostForm.form.featuredImagePlaceholder")}
              </Typography>
            </ImageUploadArea>
          </label>
          {validationErrors.featuredImage && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {validationErrors.featuredImage}
            </Alert>
          )}
        </Grid>

        {/* Excerpt */}
        <Grid size={12}>
          <TextField
            fullWidth
            label={t("blog.createPostForm.form.excerpt")}
            placeholder={t("blog.createPostForm.form.excerptPlaceholder")}
            value={formData.excerpt}
            onChange={handleInputChange("excerpt")}
            variant="outlined"
            multiline
            rows={3}
          />
        </Grid>

        {/* Content */}
        <Grid size={12}>
          <TextField
            fullWidth
            label={t("blog.createPostForm.form.content")}
            placeholder={t("blog.createPostForm.form.contentPlaceholder")}
            value={formData.content}
            onChange={handleInputChange("content")}
            variant="outlined"
            multiline
            rows={12}
            required
            error={!!validationErrors.content}
            helperText={validationErrors.content}
          />
        </Grid>

        {/* Action Buttons */}
        <Grid size={12}>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={onCancel}
              disabled={loading}
            >
              {t("blog.createPostForm.form.cancel")}
            </Button>

            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => handleSubmit("draft")}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                t("blog.createPostForm.form.draft")
              )}
            </Button>

            <Button
              variant="contained"
              startIcon={<PublishIcon />}
              onClick={() => handleSubmit("published")}
              disabled={loading}
              color="primary"
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                t("blog.createPostForm.form.publish")
              )}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlogForm;
