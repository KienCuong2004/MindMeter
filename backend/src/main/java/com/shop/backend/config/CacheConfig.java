package com.shop.backend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.cache.interceptor.SimpleKeyGenerator;

/**
 * Cache configuration for improving API response times
 * Uses in-memory caching for frequently accessed data
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Configure cache manager with predefined cache names
     */
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // Define cache names for different data types
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "blogPosts",           // Blog posts cache
            "blogCategories",      // Blog categories cache  
            "blogTags",           // Blog tags cache
            "blogComments",       // Blog comments cache
            "userProfiles",       // User profiles cache
            "statistics",         // Statistics cache
            "questions",          // Depression questions cache
            "announcements",      // System announcements cache
            "expertSchedules"     // Expert schedules cache
        ));
        
        // Allow dynamic cache creation
        cacheManager.setAllowNullValues(false);
        
        return cacheManager;
    }

    /**
     * Custom key generator for cache keys
     */
    @Bean("customKeyGenerator")
    public KeyGenerator keyGenerator() {
        return new SimpleKeyGenerator();
    }
}