package com.shop.dto.blog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogStatsDTO {
    
    private Long totalPosts;
    private Long publishedPosts;
    private Long pendingPosts;
    private Long draftPosts;
    private Long totalComments;
    private Long pendingComments;
    private Long totalLikes;
    private Long totalShares;
    private Long totalViews;
    private Long totalReports;
    private Long pendingReports;
    private Long totalCategories;
    private Long totalTags;
    
    // Recent activity
    private Long postsThisWeek;
    private Long commentsThisWeek;
    private Long viewsThisWeek;
    
    // Popular content
    private String mostPopularPost;
    private String mostActiveAuthor;
    private String mostUsedCategory;
    private String mostUsedTag;
}
