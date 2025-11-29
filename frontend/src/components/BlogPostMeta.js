import React from "react";
import { Helmet } from "react-helmet-async";

const BlogPostMeta = ({ post }) => {
  if (!post) return null;

  const {
    title,
    excerpt,
    featuredImage,
    authorName,
    publishedAt,
    content,
  } = post;

  // Tạo URL đầy đủ cho blog post
  const postUrl = `${window.location.origin}/blog/post/${post.id}`;

  // Tạo description từ excerpt hoặc content
  const description =
    excerpt ||
    (content ? content.replace(/<[^>]*>/g, "").substring(0, 160) + "..." : "");

  // Tạo image URL đầy đủ
  const imageUrl = featuredImage?.startsWith("http")
    ? featuredImage
    : `${window.location.origin}${featuredImage}`;

  // Tạo structured data cho SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: description,
    image: imageUrl,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "MindMeter",
      logo: {
        "@type": "ImageObject",
        url: `${window.location.origin}/logo192.png`,
      },
    },
    datePublished: publishedAt,
    dateModified: publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title} | MindMeter</title>
      <meta name="description" content={description} />
      <meta name="author" content={authorName} />
      <link rel="canonical" href={postUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={postUrl} />
      <meta property="og:site_name" content="MindMeter" />
      <meta property="og:locale" content="vi_VN" />

      {/* Additional Open Graph tags for better Facebook sharing */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />

      {/* Article specific Open Graph tags */}
      <meta property="article:author" content={authorName} />
      <meta property="article:published_time" content={publishedAt} />
      <meta property="article:modified_time" content={publishedAt} />
      <meta property="article:section" content="Sức khỏe tâm thần" />
      <meta property="article:tag" content="sức khỏe tâm thần, tâm lý, blog" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@mindmeter" />
      <meta name="twitter:creator" content="@mindmeter" />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default BlogPostMeta;
