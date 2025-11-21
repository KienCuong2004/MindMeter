package com.shop.backend.repository;

import com.shop.backend.model.BlogReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogReportRepository extends JpaRepository<BlogReport, Long> {
    
    // Find reports by status
    Page<BlogReport> findByStatusOrderByCreatedAtDesc(BlogReport.ReportStatus status, Pageable pageable);
    
    // Find all reports ordered by createdAt
    Page<BlogReport> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    // Find reports by post
    List<BlogReport> findByPostIdOrderByCreatedAtDesc(Long postId);
    
    // Find reports by user
    Page<BlogReport> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // Count reports by status
    long countByStatus(BlogReport.ReportStatus status);
    
    // Count reports by post
    long countByPostId(Long postId);
    
    // Count reports by user
    long countByUserId(Long userId);
    
    // Check if user reported post
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    
    // Find reports by reason
    @Query("SELECT br FROM BlogReport br WHERE br.reason = :reason ORDER BY br.createdAt DESC")
    List<BlogReport> findByReasonOrderByCreatedAtDesc(@Param("reason") BlogReport.ReportReason reason);
    
    // Find pending reports count (duplicate method removed)
}
