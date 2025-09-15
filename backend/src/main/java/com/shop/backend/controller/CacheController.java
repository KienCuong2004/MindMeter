package com.shop.backend.controller;

import com.shop.backend.service.CacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for Cache Management and Monitoring
 * 
 * Provides endpoints for:
 * - Cache statistics and monitoring
 * - Cache health checks
 * - Cache management operations
 * - Performance metrics
 */
@RestController
@RequestMapping("/api/cache")
public class CacheController {

    @Autowired
    private CacheService cacheService;

    /**
     * Get comprehensive cache statistics
     * Accessible by ADMIN users only
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCacheStatistics() {
        try {
            Map<String, Object> stats = cacheService.getCacheStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get cache statistics");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get cache health status
     * Accessible by ADMIN users only
     */
    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCacheHealth() {
        try {
            Map<String, Object> health = cacheService.getCacheHealth();
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get cache health");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get cache performance metrics
     * Accessible by ADMIN users only
     */
    @GetMapping("/performance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCachePerformance() {
        try {
            Map<String, Object> performance = cacheService.getCachePerformance();
            return ResponseEntity.ok(performance);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get cache performance");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get list of available caches
     * Accessible by ADMIN and EXPERT users
     */
    @GetMapping("/list")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    public ResponseEntity<Map<String, Object>> getCacheList() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("caches", cacheService.getCacheNames());
            response.put("totalCaches", cacheService.getCacheNames().size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get cache list");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Clear specific cache
     * Accessible by ADMIN users only
     */
    @DeleteMapping("/{cacheName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> clearCache(@PathVariable String cacheName) {
        try {
            boolean cleared = cacheService.clearCache(cacheName);
            Map<String, Object> response = new HashMap<>();
            
            if (cleared) {
                response.put("message", "Cache '" + cacheName + "' cleared successfully");
                response.put("cacheName", cacheName);
                response.put("status", "CLEARED");
                return ResponseEntity.ok(response);
            } else {
                response.put("message", "Cache '" + cacheName + "' not found or could not be cleared");
                response.put("cacheName", cacheName);
                response.put("status", "NOT_FOUND");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to clear cache");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Clear all caches
     * Accessible by ADMIN users only
     */
    @DeleteMapping("/clear-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> clearAllCaches() {
        try {
            cacheService.clearAllCaches();
            Map<String, Object> response = new HashMap<>();
            response.put("message", "All caches cleared successfully");
            response.put("status", "ALL_CLEARED");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to clear all caches");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get cache size for specific cache
     * Accessible by ADMIN users only
     */
    @GetMapping("/{cacheName}/size")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCacheSize(@PathVariable String cacheName) {
        try {
            long size = cacheService.getCacheSize(cacheName);
            Map<String, Object> response = new HashMap<>();
            response.put("cacheName", cacheName);
            
            if (size >= 0) {
                response.put("size", size);
                response.put("status", "AVAILABLE");
            } else {
                response.put("size", "N/A");
                response.put("status", "NOT_AVAILABLE");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get cache size");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Warm up cache with frequently accessed data
     * Accessible by ADMIN users only
     */
    @PostMapping("/warm-up")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> warmUpCache() {
        try {
            cacheService.warmUpCache();
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cache warm-up initiated successfully");
            response.put("status", "WARM_UP_INITIATED");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to warm up cache");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get cache dashboard data
     * Accessible by ADMIN users only
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCacheDashboard() {
        try {
            Map<String, Object> dashboard = new HashMap<>();
            
            // Basic cache information
            dashboard.put("cacheList", cacheService.getCacheNames());
            dashboard.put("totalCaches", cacheService.getCacheNames().size());
            
            // Statistics
            dashboard.put("statistics", cacheService.getCacheStatistics());
            
            // Health status
            dashboard.put("health", cacheService.getCacheHealth());
            
            // Performance metrics
            dashboard.put("performance", cacheService.getCachePerformance());
            
            // Timestamp
            dashboard.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get cache dashboard");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
