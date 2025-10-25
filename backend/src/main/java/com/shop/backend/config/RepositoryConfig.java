package com.shop.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;

/**
 * Repository Configuration
 * 
 * This configuration class resolves the conflict between JPA and Redis repositories
 * by explicitly defining which repositories belong to which data store.
 */
@Configuration
@EnableJpaRepositories(
    basePackages = "com.shop.backend.repository",
    excludeFilters = @org.springframework.context.annotation.ComponentScan.Filter(
        type = org.springframework.context.annotation.FilterType.REGEX,
        pattern = ".*RedisRepository"
    )
)
@EnableRedisRepositories(
    basePackages = "com.shop.backend.repository.redis",
    considerNestedRepositories = true
)
public class RepositoryConfig {
    
    // This configuration ensures that:
    // 1. All repositories in com.shop.backend.repository are treated as JPA repositories
    // 2. Only repositories in com.shop.backend.repository.redis are treated as Redis repositories
    // 3. Spring Data will not try to auto-detect repository types
    
}
