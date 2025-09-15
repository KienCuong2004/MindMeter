
package com.shop.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * HikariCP Configuration for MindMeter Database Connection Pooling
 * 
 * This configuration provides:
 * - Optimized connection pool settings
 * - Connection leak detection
 * - Performance monitoring
 * - Health checks
 * - Custom pool naming
 */
@Configuration
public class HikariCPConfig {

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.hikari.maximum-pool-size:20}")
    private int maximumPoolSize;

    @Value("${spring.datasource.hikari.minimum-idle:5}")
    private int minimumIdle;

    @Value("${spring.datasource.hikari.connection-timeout:30000}")
    private long connectionTimeout;

    @Value("${spring.datasource.hikari.idle-timeout:600000}")
    private long idleTimeout;

    @Value("${spring.datasource.hikari.max-lifetime:1800000}")
    private long maxLifetime;

    @Value("${spring.datasource.hikari.leak-detection-threshold:60000}")
    private long leakDetectionThreshold;

    @Value("${spring.datasource.hikari.validation-timeout:5000}")
    private long validationTimeout;

    @Value("${spring.datasource.hikari.initialization-fail-timeout:1}")
    private long initializationFailTimeout;

    /**
     * Primary DataSource with HikariCP configuration
     */
    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        
        // Basic connection settings
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        
        // Pool sizing
        config.setMaximumPoolSize(maximumPoolSize);
        config.setMinimumIdle(minimumIdle);
        
        // Connection lifecycle
        config.setConnectionTimeout(connectionTimeout);
        config.setIdleTimeout(idleTimeout);
        config.setMaxLifetime(maxLifetime);
        
        // Connection validation
        config.setConnectionTestQuery("SELECT 1");
        config.setValidationTimeout(validationTimeout);
        config.setInitializationFailTimeout(initializationFailTimeout);
        
        // Leak detection
        config.setLeakDetectionThreshold(leakDetectionThreshold);
        
        // Performance optimizations
        config.setAutoCommit(true);
        config.setPoolName("MindMeterHikariCP");
        
        // MySQL-specific optimizations
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        config.addDataSourceProperty("useServerPrepStmts", "true");
        config.addDataSourceProperty("useLocalSessionState", "true");
        config.addDataSourceProperty("rewriteBatchedStatements", "true");
        config.addDataSourceProperty("cacheResultSetMetadata", "true");
        config.addDataSourceProperty("cacheServerConfiguration", "true");
        config.addDataSourceProperty("elideSetAutoCommits", "true");
        config.addDataSourceProperty("maintainTimeStats", "false");
        
        // Connection pool monitoring
        config.setMetricRegistry(null); // Will be set by Spring Boot
        config.setHealthCheckRegistry(null); // Will be set by Spring Boot
        
        // Additional optimizations
        config.setRegisterMbeans(true);
        config.setAllowPoolSuspension(false);
        config.setReadOnly(false);
        
        return new HikariDataSource(config);
    }

    /**
     * Custom HikariCP configuration for development environment
     */
    @Bean
    @ConditionalOnProperty(name = "spring.profiles.active", havingValue = "dev")
    public DataSource devDataSource() {
        HikariConfig config = new HikariConfig();
        
        // Development-specific settings
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        
        // Smaller pool for development
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        
        // Faster timeouts for development
        config.setConnectionTimeout(10000);
        config.setIdleTimeout(300000);
        config.setMaxLifetime(900000);
        
        // Basic validation
        config.setConnectionTestQuery("SELECT 1");
        config.setValidationTimeout(3000);
        
        // Development pool name
        config.setPoolName("MindMeterHikariCP-Dev");
        
        // Enable leak detection in development
        config.setLeakDetectionThreshold(30000);
        
        return new HikariDataSource(config);
    }

    /**
     * Custom HikariCP configuration for production environment
     */
    @Bean
    @ConditionalOnProperty(name = "spring.profiles.active", havingValue = "prod")
    public DataSource prodDataSource() {
        HikariConfig config = new HikariConfig();
        
        // Production connection settings
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        
        // Larger pool for production
        config.setMaximumPoolSize(50);
        config.setMinimumIdle(10);
        
        // Conservative timeouts for production
        config.setConnectionTimeout(60000);
        config.setIdleTimeout(1200000);
        config.setMaxLifetime(3600000);
        
        // Robust validation
        config.setConnectionTestQuery("SELECT 1");
        config.setValidationTimeout(10000);
        
        // Production pool name
        config.setPoolName("MindMeterHikariCP-Prod");
        
        // Disable leak detection in production (performance impact)
        config.setLeakDetectionThreshold(0);
        
        // Production optimizations
        config.setAutoCommit(true);
        config.setRegisterMbeans(true);
        
        return new HikariDataSource(config);
    }
}
