import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Comment as CommentIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { formatDistanceToNow } from "date-fns";

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
}));

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  height: 200,
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
  },
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  left: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: "bold",
}));

const ContentBox = styled(Box)({
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
});

const ActionsBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "auto",
  paddingTop: theme.spacing(1),
}));

const BlogPost = ({
  post,
  onEdit,
  onDelete,
  onSave,
  onLike,
  isOwner = false,
  isSaved = false,
  isLiked = false,
}) => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isVietnamese = i18n.language === "vi";

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(post);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    onDelete(post.id);
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleSaveToggle = () => {
    onSave(post.id);
  };

  const handleLikeToggle = () => {
    onLike(post.id);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isVietnamese) {
        return formatDistanceToNow(date, {
          addSuffix: true,
          locale: require("date-fns/locale/vi"),
        });
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      <StyledCard>
        {post.featuredImage && (
          <StyledCardMedia image={post.featuredImage} title={post.title}>
            {post.category && (
              <CategoryChip
                label={t(`blog.categories.${post.category}`)}
                size="small"
              />
            )}
          </StyledCardMedia>
        )}

        <ContentBox>
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: "bold",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {post.title}
            </Typography>

            {post.excerpt && (
              <Typography
                variant="body2"
                color="text.secondary"
                paragraph
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {truncateText(post.excerpt)}
              </Typography>
            )}

            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar
                src={post.author?.avatar}
                sx={{ width: 32, height: 32, mr: 1 }}
              >
                {post.author?.name?.charAt(0) || "U"}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {post.author?.name || t("anonymousUser.name")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(post.createdAt)}
                </Typography>
              </Box>
            </Box>

            {post.tags && post.tags.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                {post.tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
                {post.tags.length > 3 && (
                  <Chip
                    label={`+${post.tags.length - 3}`}
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                )}
              </Box>
            )}
          </CardContent>

          <CardActions sx={{ px: 2, pb: 2 }}>
            <ActionsBox>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip
                  title={isLiked ? t("common.unlike") : t("common.like")}
                >
                  <IconButton
                    size="small"
                    onClick={handleLikeToggle}
                    color={isLiked ? "error" : "default"}
                  >
                    {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" color="text.secondary">
                  {post.likes || 0}
                </Typography>

                <Tooltip title={t("blog.comment.title")}>
                  <IconButton size="small">
                    <CommentIcon />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" color="text.secondary">
                  {post.comments || 0}
                </Typography>

                <Tooltip title={t("common.share")}>
                  <IconButton size="small">
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip
                  title={
                    isSaved
                      ? t("blog.savedArticles.unsave")
                      : t("blog.savedArticles.save")
                  }
                >
                  <IconButton
                    size="small"
                    onClick={handleSaveToggle}
                    color={isSaved ? "primary" : "default"}
                  >
                    {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Tooltip>

                {isOwner && (
                  <Tooltip title={t("common.options")}>
                    <IconButton size="small" onClick={handleMenuOpen}>
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </ActionsBox>
          </CardActions>
        </ContentBox>
      </StyledCard>

      {/* Menu for owner actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          {t("common.edit")}
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <DeleteIcon sx={{ mr: 1 }} />
          {t("common.delete")}
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>{t("confirmDelete")}</DialogTitle>
        <DialogContent>
          <Typography>{t("confirmDeleteMessage")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>{t("cancel")}</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BlogPost;
