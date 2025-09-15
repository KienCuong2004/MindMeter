package com.shop.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * Cache Service for MindMeter Application
 * 
 * Provides:
 * - Cache management operations
 * - Cache statistics and monitoring
 * - Cache eviction strategies
 * - Cache health checks
 */
@Service
public class CacheService {

    @Autowired
    private CacheManager cacheManager;

    /**
     * Get cache statistics for monitoring
     */
    public Map<String, Object> getCacheStatistics() {
        Map<String, Object> stats = new HashMap<>();
        Collection<String> cacheNames = cacheManager.getCacheNames();
        
        for (String cacheName : cacheNames) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                Map<String, Object> cacheStats = new HashMap<>();
                cacheStats.put("name", cacheName);
                cacheStats.put("nativeCache", cache.getNativeCache().getClass().getSimpleName());
                
                // Get Caffeine-specific statistics if available
                if (cache.getNativeCache() instanceof com.github.benmanes.caffeine.cache.Cache) {
                    @SuppressWarnings("unchecked")
                    com.github.benmanes.caffeine.cache.Cache<Object, Object> caffeineCache = 
                        (com.github.benmanes.caffeine.cache.Cache<Object, Object>) cache.getNativeCache();
                    
                    com.github.benmanes.caffeine.cache.stats.CacheStats caffeineStats = caffeineCache.stats();
                    cacheStats.put("hitCount", caffeineStats.hitCount());
                    cacheStats.put("missCount", caffeineStats.missCount());
                    cacheStats.put("hitRate", caffeineStats.hitRate());
                    cacheStats.put("evictionCount", caffeineStats.evictionCount());
                    cacheStats.put("averageLoadPenalty", caffeineStats.averageLoadPenalty());
                }
                
                stats.put(cacheName, cacheStats);
            }
        }
        
        return stats;
    }

    /**
     * Clear specific cache
     */
    public boolean clearCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
            return true;
        }
        return false;
    }

    /**
     * Clear all caches
     */
    public void clearAllCaches() {
        Collection<String> cacheNames = cacheManager.getCacheNames();
        for (String cacheName : cacheNames) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        }
    }

    /**
     * Get cache names
     */
    public Collection<String> getCacheNames() {
        return cacheManager.getCacheNames();
    }

    /**
     * Check if cache exists
     */
    public boolean cacheExists(String cacheName) {
        return cacheManager.getCache(cacheName) != null;
    }

    /**
     * Get cache size (approximate for Caffeine)
     */
    public long getCacheSize(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null && cache.getNativeCache() instanceof com.github.benmanes.caffeine.cache.Cache) {
            @SuppressWarnings("unchecked")
            com.github.benmanes.caffeine.cache.Cache<Object, Object> caffeineCache = 
                (com.github.benmanes.caffeine.cache.Cache<Object, Object>) cache.getNativeCache();
            return caffeineCache.estimatedSize();
        }
        return -1; // Not available
    }

    /**
     * Get cache health status
     */
    public Map<String, Object> getCacheHealth() {
        Map<String, Object> health = new HashMap<>();
        Collection<String> cacheNames = cacheManager.getCacheNames();
        
        boolean allHealthy = true;
        Map<String, Object> cacheHealth = new HashMap<>();
        
        for (String cacheName : cacheNames) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                Map<String, Object> status = new HashMap<>();
                status.put("available", true);
                status.put("size", getCacheSize(cacheName));
                
                if (cache.getNativeCache() instanceof com.github.benmanes.caffeine.cache.Cache) {
                    @SuppressWarnings("unchecked")
                    com.github.benmanes.caffeine.cache.Cache<Object, Object> caffeineCache = 
                        (com.github.benmanes.caffeine.cache.Cache<Object, Object>) cache.getNativeCache();
                    
                    com.github.benmanes.caffeine.cache.stats.CacheStats stats = caffeineCache.stats();
                    status.put("hitRate", stats.hitRate());
                    status.put("evictionCount", stats.evictionCount());
                    
                    // Consider cache healthy if hit rate > 50% and not too many evictions
                    boolean healthy = stats.hitRate() > 0.5 && stats.evictionCount() < 1000;
                    status.put("healthy", healthy);
                    
                    if (!healthy) {
                        allHealthy = false;
                    }
                } else {
                    status.put("healthy", true);
                }
                
                cacheHealth.put(cacheName, status);
            } else {
                cacheHealth.put(cacheName, Map.of("available", false, "healthy", false));
                allHealthy = false;
            }
        }
        
        health.put("overall", allHealthy ? "HEALTHY" : "WARNING");
        health.put("caches", cacheHealth);
        health.put("totalCaches", cacheNames.size());
        
        return health;
    }

    /**
     * Warm up cache with frequently accessed data
     */
    public void warmUpCache() {
        // This method can be called during application startup
        // to pre-populate cache with commonly accessed data
        
        // Example: Warm up test questions cache
        // depressionTestService.getActiveQuestions();
        
        // Example: Warm up system statistics
        // adminService.getSystemStatistics();
    }

    /**
     * Get cache performance metrics
     */
    public Map<String, Object> getCachePerformance() {
        Map<String, Object> performance = new HashMap<>();
        Collection<String> cacheNames = cacheManager.getCacheNames();
        
        long totalHits = 0;
        long totalMisses = 0;
        long totalEvictions = 0;
        
        for (String cacheName : cacheNames) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null && cache.getNativeCache() instanceof com.github.benmanes.caffeine.cache.Cache) {
                @SuppressWarnings("unchecked")
                com.github.benmanes.caffeine.cache.Cache<Object, Object> caffeineCache = 
                    (com.github.benmanes.caffeine.cache.Cache<Object, Object>) cache.getNativeCache();
                
                com.github.benmanes.caffeine.cache.stats.CacheStats stats = caffeineCache.stats();
                totalHits += stats.hitCount();
                totalMisses += stats.missCount();
                totalEvictions += stats.evictionCount();
            }
        }
        
        long totalRequests = totalHits + totalMisses;
        double overallHitRate = totalRequests > 0 ? (double) totalHits / totalRequests : 0.0;
        
        performance.put("totalHits", totalHits);
        performance.put("totalMisses", totalMisses);
        performance.put("totalRequests", totalRequests);
        performance.put("overallHitRate", String.format("%.2f%%", overallHitRate * 100));
        performance.put("totalEvictions", totalEvictions);
        performance.put("cacheCount", cacheNames.size());
        
        return performance;
    }
}
