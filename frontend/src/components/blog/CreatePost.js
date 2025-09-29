import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
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
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
}));

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

const CreatePost = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError("");
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError(t("blog.createPost.validation.invalidImageFormat"));
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t("blog.createPost.validation.imageTooLarge"));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        featuredImage: file,
      }));
      setError("");
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
    if (!formData.title.trim()) {
      setError(t("blog.createPost.validation.titleRequired"));
      return false;
    }

    if (formData.title.length < 10) {
      setError(t("blog.createPost.validation.titleMinLength"));
      return false;
    }

    if (!formData.content.trim()) {
      setError(t("blog.createPost.validation.contentRequired"));
      return false;
    }

    if (formData.content.length < 100) {
      setError(t("blog.createPost.validation.contentMinLength"));
      return false;
    }

    return true;
  };

  const handleSave = async (status) => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const submitData = {
        ...formData,
        status,
      };

      // TODO: Implement API call to save post
      console.log("Saving post:", submitData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess(
        status === "published"
          ? t("blog.createPost.success.published")
          : t("blog.createPost.success.saved")
      );

      // Redirect after success
      setTimeout(() => {
        navigate("/blog");
      }, 2000);
    } catch (err) {
      setError(
        status === "published"
          ? t("blog.createPost.error.publishFailed")
          : t("blog.createPost.error.saveFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/blog");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {t("blog.createPost.title")}
        </Typography>
      </Box>

      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        {t("blog.createPost.subtitle")}
      </Typography>

      <StyledPaper>
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
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t("blog.createPost.form.title")}
              placeholder={t("blog.createPost.form.titlePlaceholder")}
              value={formData.title}
              onChange={handleInputChange("title")}
              variant="outlined"
              required
            />
          </Grid>

          {/* Category */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{t("blog.createPost.form.category")}</InputLabel>
              <Select
                value={formData.category}
                onChange={handleInputChange("category")}
                label={t("blog.createPost.form.category")}
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
          <Grid item xs={12} md={6}>
            <Box>
              <TagInput
                fullWidth
                label={t("blog.createPost.form.tags")}
                placeholder={t("blog.createPost.form.tagsPlaceholder")}
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
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("blog.createPost.form.featuredImage")}
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
                    ? formData.featuredImage.name
                    : t("blog.createPost.form.featuredImagePlaceholder")}
                </Typography>
              </ImageUploadArea>
            </label>
          </Grid>

          {/* Excerpt */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t("blog.createPost.form.excerpt")}
              placeholder={t("blog.createPost.form.excerptPlaceholder")}
              value={formData.excerpt}
              onChange={handleInputChange("excerpt")}
              variant="outlined"
              multiline
              rows={3}
            />
          </Grid>

          {/* Content */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t("blog.createPost.form.content")}
              placeholder={t("blog.createPost.form.contentPlaceholder")}
              value={formData.content}
              onChange={handleInputChange("content")}
              variant="outlined"
              multiline
              rows={12}
              required
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={loading}
              >
                {t("blog.createPost.form.cancel")}
              </Button>

              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => handleSave("draft")}
                disabled={loading}
              >
                {loading && formData.status === "draft" ? (
                  <CircularProgress size={20} />
                ) : (
                  t("blog.createPost.form.draft")
                )}
              </Button>

              <Button
                variant="contained"
                startIcon={<PublishIcon />}
                onClick={() => handleSave("published")}
                disabled={loading}
                color="primary"
              >
                {loading && formData.status === "published" ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  t("blog.createPost.form.publish")
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </StyledPaper>
    </Container>
  );
};

export default CreatePost;
