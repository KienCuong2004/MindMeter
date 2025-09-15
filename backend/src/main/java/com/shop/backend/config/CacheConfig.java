package com.shop.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Comprehensive Cache Configuration for MindMeter
 * 
 * Provides multiple caching strategies:
 * - Caffeine (Local in-memory) for high-performance local caching
 * - Redis (Distributed) for shared caching across instances
 * - Cache eviction policies and TTL management
 * - Cache monitoring and metrics
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${cache.enabled:true}")
    private boolean cacheEnabled;

    @Value("${cache.type:local}")
    private String cacheType;

    @Value("${cache.local.max-size:1000}")
    private int localMaxSize;

    @Value("${cache.local.expire-after-write:3600}")
    private int localExpireAfterWrite;

    @Value("${cache.redis.default-ttl:1800}")
    private int redisDefaultTtl;

    /**
     * Primary Cache Manager using Caffeine (Local)
     * Best for single-instance deployments
     */
    @Bean
    @Primary
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        // Configure Caffeine cache builder
        Caffeine<Object, Object> caffeine = Caffeine.newBuilder()
            .maximumSize(localMaxSize)
            .expireAfterWrite(localExpireAfterWrite, TimeUnit.SECONDS)
            .recordStats(); // Enable statistics for monitoring
        
        cacheManager.setCaffeine(caffeine);
        
        // Define specific cache configurations
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "testQuestions",      // Depression test questions
            "userProfiles",       // User profile data
            "systemStats",        // System statistics
            "expertSchedules",    // Expert working schedules
            "recentTestResults",  // Recent test results
            "announcements",      // System announcements
            "appointments",       // Recent appointments
            "testCategories",     // Test question categories
            "expertList",         // Available experts list
            "userCounts"          // User count statistics
        ));
        
        return cacheManager;
    }

    /**
     * Redis Cache Manager for distributed caching
     * Best for multi-instance deployments
     */
    @Bean
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofSeconds(redisDefaultTtl))
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues();
        
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .withCacheConfiguration("testQuestions", 
                config.entryTtl(Duration.ofHours(24))) // Questions cache for 24 hours
            .withCacheConfiguration("userProfiles", 
                config.entryTtl(Duration.ofMinutes(30))) // User profiles for 30 minutes
            .withCacheConfiguration("systemStats", 
                config.entryTtl(Duration.ofMinutes(15))) // Stats for 15 minutes
            .withCacheConfiguration("expertSchedules", 
                config.entryTtl(Duration.ofMinutes(60))) // Schedules for 1 hour
            .withCacheConfiguration("recentTestResults", 
                config.entryTtl(Duration.ofMinutes(10))) // Recent results for 10 minutes
            .withCacheConfiguration("announcements", 
                config.entryTtl(Duration.ofHours(6))) // Announcements for 6 hours
            .withCacheConfiguration("appointments", 
                config.entryTtl(Duration.ofMinutes(5))) // Appointments for 5 minutes
            .withCacheConfiguration("testCategories", 
                config.entryTtl(Duration.ofHours(12))) // Categories for 12 hours
            .withCacheConfiguration("expertList", 
                config.entryTtl(Duration.ofMinutes(45))) // Expert list for 45 minutes
            .withCacheConfiguration("userCounts", 
                config.entryTtl(Duration.ofMinutes(20))) // User counts for 20 minutes
            .build();
    }

    /**
     * Cache Key Generator for consistent key naming
     */
    @Bean
    public org.springframework.cache.interceptor.KeyGenerator cacheKeyGenerator() {
        return (target, method, params) -> {
            StringBuilder key = new StringBuilder();
            key.append(target.getClass().getSimpleName()).append(".");
            key.append(method.getName()).append(".");
            
            for (Object param : params) {
                if (param != null) {
                    key.append(param.toString()).append(".");
                }
            }
            
            return key.toString().replaceAll("\\.$", "");
        };
    }
}
