package com.shop.backend.repository;

import com.shop.backend.model.DepressionTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DepressionTestResultRepository extends JpaRepository<DepressionTestResult, Long> {
    List<DepressionTestResult> findByUserIdOrderByTestedAtDesc(Long userId);
    List<DepressionTestResult> findBySeverityLevel(DepressionTestResult.SeverityLevel severityLevel);
    List<DepressionTestResult> findAllByOrderByTestedAtDesc();
    long countBySeverityLevel(DepressionTestResult.SeverityLevel severityLevel);
    List<DepressionTestResult> findTop10ByOrderByTestedAtDesc();

    // Đếm tổng số test theo ngày
    @Query("SELECT DATE(t.testedAt) as date, COUNT(t) as count FROM DepressionTestResult t WHERE t.testedAt >= :from AND t.testedAt <= :to GROUP BY DATE(t.testedAt) ORDER BY date")
    List<Object[]> countTestsByDateRange(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    // Đếm số test severe theo ngày
    @Query("SELECT DATE(t.testedAt) as date, COUNT(t) as count FROM DepressionTestResult t WHERE t.testedAt >= :from AND t.testedAt <= :to AND t.severityLevel = 'SEVERE' GROUP BY DATE(t.testedAt) ORDER BY date")
    List<Object[]> countSevereTestsByDateRange(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);
} 