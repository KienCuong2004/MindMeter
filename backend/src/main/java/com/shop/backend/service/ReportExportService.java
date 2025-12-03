package com.shop.backend.service;

import com.shop.backend.dto.analytics.AnalyticsSummaryDTO;
import com.shop.backend.model.DepressionTestResult;
import com.shop.backend.repository.DepressionTestResultRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ReportExportService {

    @Autowired
    private DepressionTestResultRepository testResultRepository;

    @Autowired
    private AnalyticsService analyticsService;

    /**
     * Tạo PDF report cho test results
     */
    public byte[] generateTestResultPDF(Long userId, Long testResultId) throws IOException {
        DepressionTestResult result = testResultRepository.findById(testResultId)
            .orElseThrow(() -> new RuntimeException("Test result not found"));

        if (!result.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to test result");
        }

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float margin = 50;
                float yPosition = page.getMediaBox().getHeight() - margin;
                float lineHeight = 20;
                float currentY = yPosition;

                // Title
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 20);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("MindMeter - Test Result Report");
                contentStream.endText();
                currentY -= lineHeight * 2;

                // Test Information
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Test Type: " + (result.getTestType() != null ? result.getTestType() : "N/A"));
                contentStream.endText();
                currentY -= lineHeight;

                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Test Date: " + formatDateTime(result.getTestedAt()));
                contentStream.endText();
                currentY -= lineHeight;

                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Total Score: " + result.getTotalScore());
                contentStream.endText();
                currentY -= lineHeight;

                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Severity Level: " + result.getSeverityLevel().name());
                contentStream.endText();
                currentY -= lineHeight * 2;

                // Diagnosis
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Diagnosis:");
                contentStream.endText();
                currentY -= lineHeight;

                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                String[] diagnosisLines = wrapText(result.getDiagnosis(), 80);
                for (String line : diagnosisLines) {
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, currentY);
                    contentStream.showText(line);
                    contentStream.endText();
                    currentY -= lineHeight;
                }
                currentY -= lineHeight;

                // Recommendation
                if (result.getRecommendation() != null && !result.getRecommendation().isEmpty()) {
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, currentY);
                    contentStream.showText("Recommendation:");
                    contentStream.endText();
                    currentY -= lineHeight;

                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    String[] recommendationLines = wrapText(result.getRecommendation(), 80);
                    for (String line : recommendationLines) {
                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin, currentY);
                        contentStream.showText(line);
                        contentStream.endText();
                        currentY -= lineHeight;
                    }
                }

                // Footer
                currentY = margin;
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Generated on: " + formatDateTime(LocalDateTime.now()));
                contentStream.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    /**
     * Tạo PDF report cho analytics summary
     */
    public byte[] generateAnalyticsPDF(Long userId) throws IOException {
        AnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary(userId);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float margin = 50;
                float yPosition = page.getMediaBox().getHeight() - margin;
                float lineHeight = 18;
                float currentY = yPosition;

                // Title
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 20);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("MindMeter - Mental Health Analytics Report");
                contentStream.endText();
                currentY -= lineHeight * 2;

                // Summary Statistics
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Summary Statistics");
                contentStream.endText();
                currentY -= lineHeight * 1.5f;

                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Total Tests: " + summary.getTotalTests());
                contentStream.endText();
                currentY -= lineHeight;

                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Average Score: " + summary.getAverageScore());
                contentStream.endText();
                currentY -= lineHeight;

                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Current Severity: " + summary.getCurrentSeverityLevel());
                contentStream.endText();
                currentY -= lineHeight;

                if (summary.getLastTestDate() != null) {
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, currentY);
                    contentStream.showText("Last Test: " + formatDateTime(summary.getLastTestDate()));
                    contentStream.endText();
                    currentY -= lineHeight;
                }

                if (summary.getImprovementRate() != null) {
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, currentY);
                    contentStream.showText("Improvement Rate: " + String.format("%.2f", summary.getImprovementRate()) + "%");
                    contentStream.endText();
                    currentY -= lineHeight;
                }

                currentY -= lineHeight;

                // Severity Distribution
                if (summary.getSeverityDistribution() != null && !summary.getSeverityDistribution().isEmpty()) {
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, currentY);
                    contentStream.showText("Severity Distribution");
                    contentStream.endText();
                    currentY -= lineHeight * 1.5f;

                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    for (Map.Entry<String, Integer> entry : summary.getSeverityDistribution().entrySet()) {
                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin, currentY);
                        contentStream.showText(entry.getKey() + ": " + entry.getValue());
                        contentStream.endText();
                        currentY -= lineHeight;
                    }
                }

                // Footer
                currentY = margin;
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Generated on: " + formatDateTime(LocalDateTime.now()));
                contentStream.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    /**
     * Export test results to CSV
     */
    public byte[] exportToCSV(Long userId) throws IOException {
        List<DepressionTestResult> results = testResultRepository
            .findByUserIdOrderByTestedAtDesc(userId);

        StringBuilder csv = new StringBuilder();
        csv.append("Test ID,Test Date,Test Type,Total Score,Severity Level,Diagnosis,Recommendation\n");

        for (DepressionTestResult result : results) {
            csv.append(result.getId()).append(",");
            csv.append(formatDateTime(result.getTestedAt())).append(",");
            csv.append(result.getTestType() != null ? result.getTestType() : "N/A").append(",");
            csv.append(result.getTotalScore()).append(",");
            csv.append(result.getSeverityLevel().name()).append(",");
            csv.append("\"").append(result.getDiagnosis().replace("\"", "\"\"")).append("\"").append(",");
            csv.append(result.getRecommendation() != null ? 
                "\"" + result.getRecommendation().replace("\"", "\"\"") + "\"" : "").append("\n");
        }

        return csv.toString().getBytes("UTF-8");
    }

    /**
     * Export test results to Excel
     */
    public byte[] exportToExcel(Long userId) throws IOException {
        List<DepressionTestResult> results = testResultRepository
            .findByUserIdOrderByTestedAtDesc(userId);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Test Results");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Test ID", "Test Date", "Test Type", "Total Score", "Severity Level", "Diagnosis", "Recommendation"};
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Create data rows
            int rowNum = 1;
            for (DepressionTestResult result : results) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(result.getId());
                row.createCell(1).setCellValue(formatDateTime(result.getTestedAt()));
                row.createCell(2).setCellValue(result.getTestType() != null ? result.getTestType() : "N/A");
                row.createCell(3).setCellValue(result.getTotalScore());
                row.createCell(4).setCellValue(result.getSeverityLevel().name());
                row.createCell(5).setCellValue(result.getDiagnosis());
                row.createCell(6).setCellValue(result.getRecommendation() != null ? result.getRecommendation() : "");
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    /**
     * Helper method to wrap text
     */
    private String[] wrapText(String text, int maxLength) {
        if (text == null || text.isEmpty()) {
            return new String[]{""};
        }
        List<String> lines = new java.util.ArrayList<>();
        String[] words = text.split(" ");
        StringBuilder currentLine = new StringBuilder();

        for (String word : words) {
            if (currentLine.length() + word.length() + 1 <= maxLength) {
                if (currentLine.length() > 0) {
                    currentLine.append(" ");
                }
                currentLine.append(word);
            } else {
                if (currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder(word);
                } else {
                    lines.add(word);
                }
            }
        }
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
        return lines.toArray(new String[0]);
    }

    /**
     * Helper method to format date time
     */
    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "N/A";
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}

