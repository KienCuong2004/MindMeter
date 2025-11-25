import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import blogService from "../../services/blogService";
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
  OutlinedInput,
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

const CreatePost = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: null,
    categoryIds: [],
    tagIds: [],
    status: "draft",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

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
        console.error("Error loading categories and tags:", error);
      } finally {
        setLoadingCategories(false);
        setLoadingTags(false);
      }
    };

    loadCategoriesAndTags();
  }, []);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => {
      if (field === "categoryIds") {
        // Handle single category selection
        return {
          ...prev,
          categoryIds: value ? [value] : [],
        };
      } else if (field === "tagIds") {
        // Handle multiple tag selection - value is already an array from Select
        return {
          ...prev,
          tagIds: Array.isArray(value) ? value : [],
        };
      }
      return {
      ...prev,
        [field]: value,
      };
    });
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
    setSuccess("");

    try {
      // Always set status to "pending" for admin approval
      // Users can't directly publish posts
      const submitData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || "",
        featuredImage: formData.featuredImage,
        categoryIds: formData.categoryIds || [],
        tagIds: formData.tagIds || [],
        status: "pending", // Always pending for admin approval
        isFeatured: false,
        images: [],
      };

      const createdPost = await blogService.createPost(submitData);

      setSuccess(
        t("blog.createPost.success.submitted") ||
          "Bài viết đã được gửi và đang chờ phê duyệt!"
      );

      // Redirect after success
      setTimeout(() => {
        navigate("/blog");
      }, 2000);
    } catch (err) {
      console.error("Error creating post:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        t("blog.createPost.error.saveFailed") ||
        "Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại.";
      setError(errorMessage);
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
                value={formData.categoryIds[0] || ""}
                onChange={handleInputChange("categoryIds")}
                label={t("blog.createPost.form.category")}
                disabled={loadingCategories}
              >
                {availableCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Tags */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{t("blog.createPost.form.tags")}</InputLabel>
              <Select
                multiple
                value={formData.tagIds || []}
                onChange={handleInputChange("tagIds")}
                label={t("blog.createPost.form.tags")}
                disabled={loadingTags}
                input={<OutlinedInput label={t("blog.createPost.form.tags")} />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((tagId) => {
                      const tag = availableTags.find((t) => t.id === tagId);
                      return tag ? (
                  <Chip
                          key={tagId}
                          label={tag.name}
                          size="small"
                    color="primary"
                    variant="outlined"
                  />
                      ) : null;
                    })}
              </Box>
                )}
              >
                {availableTags.map((tag) => (
                  <MenuItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                onClick={() => handleSave("pending")}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  t("blog.createPost.form.saveDraft") ||
                  t("blog.createPost.form.draft")
                )}
              </Button>

              <Button
                variant="contained"
                startIcon={<PublishIcon />}
                onClick={() => handleSave("pending")}
                disabled={loading}
                color="primary"
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  t("blog.createPost.form.submit") ||
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
