import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Container, Paper, Typography, Box, IconButton } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import BlogForm from "../components/blog/BlogForm";
import blogService from "../services/blogService";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
}));

const CreatePostPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError("");
      console.log("Creating post:", formData);

      // Call API to create post
      const response = await blogService.createPost(formData);
      console.log("Post created successfully:", response);

      setSuccess(t("blog.createPostForm.success.published"));

      // Redirect to blog page after successful creation
      setTimeout(() => {
        navigate("/blog");
      }, 2000);
    } catch (error) {
      console.error("Error creating post:", error);
      setError(t("blog.createPostForm.error.publishFailed"));
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
          {t("blog.createPostForm.title")}
        </Typography>
      </Box>

      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        {t("blog.createPostForm.subtitle")}
      </Typography>

      <StyledPaper>
        <BlogForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          error={error}
          success={success}
        />
      </StyledPaper>
    </Container>
  );
};

export default CreatePostPage;
