package com.shop.backend.controller;

import com.shop.backend.service.ConnectionPoolMonitorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for HikariCP Connection Pool monitoring and management
 * 
 * Provides endpoints for:
 * - Connection pool status
 * - Performance metrics
 * - Health checks
 * - Pool scaling recommendations
 */
@RestController
@RequestMapping("/api/connection-pool")
public class ConnectionPoolController {

    @Autowired
    private ConnectionPoolMonitorService monitorService;

    /**
     * Get comprehensive connection pool status
     * Accessible by ADMIN users only
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getConnectionPoolStatus() {
        try {
            Map<String, Object> status = monitorService.getConnectionPoolStatus();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get connection pool status");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get connection pool performance summary
     * Accessible by ADMIN and EXPERT users
     */
    @GetMapping("/performance")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    public ResponseEntity<Map<String, String>> getPerformanceSummary() {
        try {
            Map<String, String> summary = monitorService.getPerformanceSummary();
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to get performance summary");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get detailed connection pool metrics
     * Accessible by ADMIN users only
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDetailedMetrics() {
        try {
            Map<String, Object> metrics = monitorService.getDetailedMetrics();
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get detailed metrics");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Check if connection pool is healthy
     * Accessible by all authenticated users
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkPoolHealth() {
        try {
            boolean isHealthy = monitorService.isPoolHealthy();
            Map<String, Object> health = new HashMap<>();
            health.put("healthy", isHealthy);
            health.put("timestamp", System.currentTimeMillis());
            health.put("status", isHealthy ? "OK" : "WARNING");
            
            if (isHealthy) {
                return ResponseEntity.ok(health);
            } else {
                return ResponseEntity.status(503).body(health);
            }
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("healthy", false);
            error.put("error", "Failed to check pool health");
            error.put("message", e.getMessage());
            error.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Check if connection pool needs scaling
     * Accessible by ADMIN users only
     */
    @GetMapping("/scaling-check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> checkPoolScaling() {
        try {
            boolean needsScaling = monitorService.needsPoolScaling();
            Map<String, Object> scaling = new HashMap<>();
            scaling.put("needsScaling", needsScaling);
            scaling.put("timestamp", System.currentTimeMillis());
            scaling.put("recommendation", needsScaling ? 
                "Consider increasing maximum pool size or optimizing queries" : 
                "Pool size is adequate for current load");
            
            return ResponseEntity.ok(scaling);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to check pool scaling");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get connection pool dashboard data
     * Accessible by ADMIN users only
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        try {
            Map<String, Object> dashboard = new HashMap<>();
            
            // Basic status
            dashboard.put("status", monitorService.getConnectionPoolStatus());
            
            // Performance summary
            dashboard.put("performance", monitorService.getPerformanceSummary());
            
            // Health check
            dashboard.put("health", monitorService.isPoolHealthy());
            
            // Scaling recommendation
            dashboard.put("scaling", monitorService.needsPoolScaling());
            
            // Timestamp
            dashboard.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get dashboard data");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
