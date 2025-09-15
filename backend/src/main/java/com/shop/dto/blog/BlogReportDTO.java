package com.shop.dto.blog;

import com.shop.backend.model.BlogReport;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogReportDTO {
    
    private Long id;
    private Long postId;
    private String postTitle;
    private Long userId;
    private String userName;
    private BlogReport.ReportReason reason;
    private String description;
    private BlogReport.ReportStatus status;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
