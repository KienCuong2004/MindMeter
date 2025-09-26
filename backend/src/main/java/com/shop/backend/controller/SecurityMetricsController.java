package com.shop.backend.controller;

import com.shop.backend.service.SecurityMetricsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin/security/metrics")
public class SecurityMetricsController {

    @Autowired
    private SecurityMetricsService securityMetricsService;

    /**
     * Get real-time security metrics
     */
    @GetMapping("/realtime")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getRealTimeMetrics() {
        Map<String, Object> metrics = securityMetricsService.getRealTimeMetrics();
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get historical metrics for charts
     */
    @GetMapping("/historical")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getHistoricalMetrics() {
        Map<String, Object> historicalData = Map.of(
            "data", securityMetricsService.getHistoricalMetrics(),
            "timestamp", java.time.LocalDateTime.now()
        );
        return ResponseEntity.ok(historicalData);
    }

    /**
     * Get security alerts
     */
    @GetMapping("/alerts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSecurityAlerts() {
        Map<String, Object> response = Map.of(
            "alerts", securityMetricsService.getSecurityAlerts(),
            "timestamp", java.time.LocalDateTime.now()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get comprehensive security dashboard data
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Map<String, Object> dashboardData = Map.of(
            "realtime", securityMetricsService.getRealTimeMetrics(),
            "historical", securityMetricsService.getHistoricalMetrics(),
            "alerts", securityMetricsService.getSecurityAlerts(),
            "timestamp", java.time.LocalDateTime.now()
        );
        return ResponseEntity.ok(dashboardData);
    }

    /**
     * Public endpoint for basic system status (e.g., for health checks or external monitoring)
     */
    @GetMapping("/public/status")
    public ResponseEntity<Map<String, Object>> getPublicStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "active");
        status.put("ipFilteringEnabled", securityMetricsService.isIpFilteringEnabled());
        status.put("monitoringActive", true); // Always true if service is running
        status.put("lastUpdate", System.currentTimeMillis());
        status.put("message", "Security monitoring is active");
        return ResponseEntity.ok(status);
    }

    /**
     * Cleanup old metrics data
     */
    @PostMapping("/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> cleanupOldData() {
        securityMetricsService.cleanupOldData();
        Map<String, Object> response = Map.of(
            "message", "Old data cleaned up successfully",
            "timestamp", java.time.LocalDateTime.now()
        );
        return ResponseEntity.ok(response);
    }
}
