package com.shop.backend.service;

import com.shop.backend.dto.analytics.*;
import com.shop.backend.model.DepressionTestResult;
import com.shop.backend.repository.DepressionTestResultRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class AnalyticsService {

    @Autowired
    private DepressionTestResultRepository testResultRepository;

    /**
     * Lấy xu hướng sức khỏe tâm thần theo thời gian cho một user
     */
    public List<MentalHealthTrendDTO> getMentalHealthTrends(Long userId, Integer days) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days != null ? days : 365);
        
        List<DepressionTestResult> results = testResultRepository
            .findByUserIdOrderByTestedAtDesc(userId)
            .stream()
            .filter(r -> r.getTestedAt() != null && r.getTestedAt().isAfter(fromDate))
            .sorted(Comparator.comparing(DepressionTestResult::getTestedAt))
            .collect(Collectors.toList());

        return results.stream()
            .map(result -> new MentalHealthTrendDTO(
                result.getTestedAt(),
                result.getTotalScore(),
                result.getSeverityLevel().name(),
                result.getTestType() != null ? result.getTestType() : "UNKNOWN",
                result.getDiagnosis()
            ))
            .collect(Collectors.toList());
    }

    /**
     * So sánh kết quả test theo thời gian
     */
    public List<TestComparisonDTO> compareTestResults(Long userId) {
        List<DepressionTestResult> results = testResultRepository
            .findByUserIdOrderByTestedAtDesc(userId);

        List<TestComparisonDTO> comparisons = new ArrayList<>();
        
        for (int i = 0; i < results.size(); i++) {
            DepressionTestResult current = results.get(i);
            TestComparisonDTO dto = new TestComparisonDTO();
            
            dto.setTestId(current.getId());
            dto.setTestedAt(current.getTestedAt());
            dto.setTotalScore(current.getTotalScore());
            dto.setSeverityLevel(current.getSeverityLevel().name());
            dto.setTestType(current.getTestType() != null ? current.getTestType() : "UNKNOWN");
            dto.setDiagnosis(current.getDiagnosis());
            dto.setRecommendation(current.getRecommendation());

            // So sánh với test trước đó
            if (i < results.size() - 1) {
                DepressionTestResult previous = results.get(i + 1);
                int scoreChange = current.getTotalScore() - previous.getTotalScore();
                dto.setScoreChange(scoreChange);
                
                if (previous.getTotalScore() > 0) {
                    double percentageChange = ((double) scoreChange / previous.getTotalScore()) * 100;
                    dto.setPercentageChange(percentageChange);
                } else {
                    dto.setPercentageChange(0.0);
                }
            } else {
                dto.setScoreChange(0);
                dto.setPercentageChange(0.0);
            }

            comparisons.add(dto);
        }

        return comparisons;
    }

    /**
     * Lấy dữ liệu cho biểu đồ tiến độ cá nhân
     */
    public ProgressChartDTO getProgressChart(Long userId, Integer days) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days != null ? days : 90);
        
        List<DepressionTestResult> results = testResultRepository
            .findByUserIdOrderByTestedAtDesc(userId)
            .stream()
            .filter(r -> r.getTestedAt() != null && r.getTestedAt().isAfter(fromDate))
            .sorted(Comparator.comparing(DepressionTestResult::getTestedAt))
            .collect(Collectors.toList());

        ProgressChartDTO chart = new ProgressChartDTO();
        
        // Labels (dates)
        List<String> labels = results.stream()
            .map(r -> r.getTestedAt().toLocalDate().toString())
            .collect(Collectors.toList());
        chart.setLabels(labels);

        // Scores
        List<Integer> scores = results.stream()
            .map(DepressionTestResult::getTotalScore)
            .collect(Collectors.toList());
        chart.setScores(scores);

        // Severity distribution over time
        Map<String, List<Integer>> severityDistribution = new LinkedHashMap<>();
        severityDistribution.put("MINIMAL", new ArrayList<>());
        severityDistribution.put("MILD", new ArrayList<>());
        severityDistribution.put("MODERATE", new ArrayList<>());
        severityDistribution.put("SEVERE", new ArrayList<>());

        for (DepressionTestResult result : results) {
            String severity = result.getSeverityLevel().name();
            severityDistribution.forEach((key, value) -> {
                value.add(key.equals(severity) ? 1 : 0);
            });
        }
        chart.setSeverityDistribution(severityDistribution);

        // Test type counts
        Map<String, Integer> testTypeCounts = results.stream()
            .collect(Collectors.groupingBy(
                r -> r.getTestType() != null ? r.getTestType() : "UNKNOWN",
                Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
            ));
        chart.setTestTypeCounts(testTypeCounts);

        // Average score
        double avgScore = scores.stream()
            .mapToInt(Integer::intValue)
            .average()
            .orElse(0.0);
        chart.setAverageScore(avgScore);

        chart.setTotalTests(results.size());

        // Determine trend
        if (scores.size() >= 2) {
            int firstHalf = scores.subList(0, scores.size() / 2).stream()
                .mapToInt(Integer::intValue)
                .sum();
            int secondHalf = scores.subList(scores.size() / 2, scores.size()).stream()
                .mapToInt(Integer::intValue)
                .sum();
            
            double firstAvg = (double) firstHalf / (scores.size() / 2);
            double secondAvg = (double) secondHalf / (scores.size() - scores.size() / 2);
            
            if (secondAvg < firstAvg * 0.9) {
                chart.setTrend("improving"); // Lower score is better for mental health
            } else if (secondAvg > firstAvg * 1.1) {
                chart.setTrend("declining");
            } else {
                chart.setTrend("stable");
            }
        } else {
            chart.setTrend("stable");
        }

        return chart;
    }

    /**
     * Lấy tổng quan analytics cho user
     */
    public AnalyticsSummaryDTO getAnalyticsSummary(Long userId) {
        List<DepressionTestResult> allResults = testResultRepository
            .findByUserIdOrderByTestedAtDesc(userId);

        if (allResults.isEmpty()) {
            return new AnalyticsSummaryDTO();
        }

        AnalyticsSummaryDTO summary = new AnalyticsSummaryDTO();
        
        summary.setTotalTests(allResults.size());
        
        // Average score
        double avgScore = allResults.stream()
            .mapToInt(DepressionTestResult::getTotalScore)
            .average()
            .orElse(0.0);
        summary.setAverageScore((int) avgScore);

        // Current severity (from most recent test)
        DepressionTestResult latest = allResults.get(0);
        summary.setCurrentSeverityLevel(latest.getSeverityLevel().name());
        summary.setLastTestDate(latest.getTestedAt());

        // First test date
        DepressionTestResult first = allResults.get(allResults.size() - 1);
        summary.setFirstTestDate(first.getTestedAt());

        // Severity distribution
        Map<String, Integer> severityDist = allResults.stream()
            .collect(Collectors.groupingBy(
                r -> r.getSeverityLevel().name(),
                Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
            ));
        summary.setSeverityDistribution(severityDist);

        // Test type distribution
        Map<String, Integer> testTypeDist = allResults.stream()
            .collect(Collectors.groupingBy(
                r -> r.getTestType() != null ? r.getTestType() : "UNKNOWN",
                Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
            ));
        summary.setTestTypeDistribution(testTypeDist);

        // Tests this month
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long testsThisMonth = allResults.stream()
            .filter(r -> r.getTestedAt() != null && r.getTestedAt().isAfter(startOfMonth))
            .count();
        summary.setTestsThisMonth((int) testsThisMonth);

        // Tests last month
        LocalDateTime startOfLastMonth = startOfMonth.minusMonths(1);
        long testsLastMonth = allResults.stream()
            .filter(r -> r.getTestedAt() != null && 
                r.getTestedAt().isAfter(startOfLastMonth) && 
                r.getTestedAt().isBefore(startOfMonth))
            .count();
        summary.setTestsLastMonth((int) testsLastMonth);

        // Improvement rate
        if (allResults.size() >= 2) {
            DepressionTestResult oldest = allResults.get(allResults.size() - 1);
            DepressionTestResult newest = allResults.get(0);
            
            if (oldest.getTotalScore() > 0) {
                double improvement = ((double) (oldest.getTotalScore() - newest.getTotalScore()) / oldest.getTotalScore()) * 100;
                summary.setImprovementRate(improvement);
            } else {
                summary.setImprovementRate(0.0);
            }
        } else {
            summary.setImprovementRate(0.0);
        }

        // Recent trends (last 10 tests)
        List<MentalHealthTrendDTO> recentTrends = allResults.stream()
            .limit(10)
            .map(r -> new MentalHealthTrendDTO(
                r.getTestedAt(),
                r.getTotalScore(),
                r.getSeverityLevel().name(),
                r.getTestType() != null ? r.getTestType() : "UNKNOWN",
                r.getDiagnosis()
            ))
            .collect(Collectors.toList());
        summary.setRecentTrends(recentTrends);

        return summary;
    }
}

