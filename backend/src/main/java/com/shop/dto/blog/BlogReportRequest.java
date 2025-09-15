package com.shop.dto.blog;

import com.shop.backend.model.BlogReport;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogReportRequest {
    
    private BlogReport.ReportReason reason;
    private String description;
}
