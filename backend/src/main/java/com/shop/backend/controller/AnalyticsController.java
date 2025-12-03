package com.shop.backend.controller;

import com.shop.backend.dto.analytics.*;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.service.AnalyticsService;
import com.shop.backend.service.ReportExportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private ReportExportService reportExportService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Lấy xu hướng sức khỏe tâm thần theo thời gian
     * GET /api/analytics/trends?days=365
     */
    @GetMapping("/trends")
    public ResponseEntity<List<MentalHealthTrendDTO>> getMentalHealthTrends(
            @RequestParam(value = "days", defaultValue = "365") Integer days,
            Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            List<MentalHealthTrendDTO> trends = analyticsService.getMentalHealthTrends(userId, days);
            return ResponseEntity.ok(trends);
        } catch (Exception e) {
            log.error("Error getting mental health trends", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * So sánh kết quả test theo thời gian
     * GET /api/analytics/compare
     */
    @GetMapping("/compare")
    public ResponseEntity<List<TestComparisonDTO>> compareTestResults(Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            List<TestComparisonDTO> comparisons = analyticsService.compareTestResults(userId);
            return ResponseEntity.ok(comparisons);
        } catch (Exception e) {
            log.error("Error comparing test results", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy dữ liệu cho biểu đồ tiến độ cá nhân
     * GET /api/analytics/progress?days=90
     */
    @GetMapping("/progress")
    public ResponseEntity<ProgressChartDTO> getProgressChart(
            @RequestParam(value = "days", defaultValue = "90") Integer days,
            Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            ProgressChartDTO chart = analyticsService.getProgressChart(userId, days);
            return ResponseEntity.ok(chart);
        } catch (Exception e) {
            log.error("Error getting progress chart", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy tổng quan analytics
     * GET /api/analytics/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryDTO> getAnalyticsSummary(Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            AnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary(userId);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("Error getting analytics summary", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Export test result to PDF
     * GET /api/analytics/export/pdf/test/{testResultId}
     */
    @GetMapping("/export/pdf/test/{testResultId}")
    public ResponseEntity<byte[]> exportTestResultPDF(
            @PathVariable Long testResultId,
            Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            byte[] pdfBytes = reportExportService.generateTestResultPDF(userId, testResultId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "test-result-" + testResultId + ".pdf");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
        } catch (Exception e) {
            log.error("Error exporting test result PDF", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Export analytics summary to PDF
     * GET /api/analytics/export/pdf/summary
     */
    @GetMapping("/export/pdf/summary")
    public ResponseEntity<byte[]> exportAnalyticsPDF(Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            byte[] pdfBytes = reportExportService.generateAnalyticsPDF(userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "analytics-summary.pdf");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
        } catch (Exception e) {
            log.error("Error exporting analytics PDF", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Export test results to CSV
     * GET /api/analytics/export/csv
     */
    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportToCSV(Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            byte[] csvBytes = reportExportService.exportToCSV(userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDispositionFormData("attachment", "test-results.csv");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(csvBytes);
        } catch (Exception e) {
            log.error("Error exporting to CSV", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Export test results to Excel
     * GET /api/analytics/export/excel
     */
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportToExcel(Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            byte[] excelBytes = reportExportService.exportToExcel(userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "test-results.xlsx");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(excelBytes);
        } catch (Exception e) {
            log.error("Error exporting to Excel", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Helper method để lấy userId từ authentication
     */
    private Long getUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"))
            .getId();
    }
}

