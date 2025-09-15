package com.shop.backend.service;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * Service to monitor HikariCP Connection Pool metrics and health
 * 
 * Provides real-time information about:
 * - Active connections
 * - Idle connections
 * - Total connections
 * - Connection wait times
 * - Pool performance metrics
 */
@Service
public class ConnectionPoolMonitorService {

    @Autowired
    private DataSource dataSource;

    /**
     * Get comprehensive connection pool status
     */
    public Map<String, Object> getConnectionPoolStatus() {
        Map<String, Object> status = new HashMap<>();
        
        if (dataSource instanceof HikariDataSource) {
            HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
            HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
            
            if (poolMXBean != null) {
                status.put("poolName", hikariDataSource.getPoolName());
                status.put("activeConnections", poolMXBean.getActiveConnections());
                status.put("idleConnections", poolMXBean.getIdleConnections());
                status.put("totalConnections", poolMXBean.getTotalConnections());
                status.put("threadsAwaitingConnection", poolMXBean.getThreadsAwaitingConnection());
                
                // Pool configuration
                status.put("maximumPoolSize", hikariDataSource.getMaximumPoolSize());
                status.put("minimumIdle", hikariDataSource.getMinimumIdle());
                status.put("connectionTimeout", hikariDataSource.getConnectionTimeout());
                status.put("idleTimeout", hikariDataSource.getIdleTimeout());
                status.put("maxLifetime", hikariDataSource.getMaxLifetime());
                
                // Performance metrics
                status.put("connectionTestQuery", hikariDataSource.getConnectionTestQuery());
                status.put("validationTimeout", hikariDataSource.getValidationTimeout());
                status.put("leakDetectionThreshold", hikariDataSource.getLeakDetectionThreshold());
                
                // Health status
                status.put("isHealthy", isPoolHealthy(poolMXBean));
                status.put("healthMessage", getHealthMessage(poolMXBean));
                
                // Utilization percentage
                double utilization = calculateUtilization(poolMXBean, hikariDataSource);
                status.put("utilizationPercentage", String.format("%.2f%%", utilization));
                
                // Performance indicators
                status.put("performanceStatus", getPerformanceStatus(utilization));
                
            } else {
                status.put("error", "Pool MXBean not available");
            }
        } else {
            status.put("error", "DataSource is not HikariCP");
        }
        
        return status;
    }

    /**
     * Check if connection pool is healthy
     */
    public boolean isPoolHealthy() {
        if (dataSource instanceof HikariDataSource) {
            HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
            HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
            
            if (poolMXBean != null) {
                return isPoolHealthy(poolMXBean);
            }
        }
        return false;
    }

    /**
     * Get connection pool performance summary
     */
    public Map<String, String> getPerformanceSummary() {
        Map<String, String> summary = new HashMap<>();
        
        if (dataSource instanceof HikariDataSource) {
            HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
            HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
            
            if (poolMXBean != null) {
                double utilization = calculateUtilization(poolMXBean, hikariDataSource);
                
                summary.put("poolName", hikariDataSource.getPoolName());
                summary.put("utilization", String.format("%.2f%%", utilization));
                summary.put("status", getPerformanceStatus(utilization));
                summary.put("activeConnections", String.valueOf(poolMXBean.getActiveConnections()));
                summary.put("totalConnections", String.valueOf(poolMXBean.getTotalConnections()));
                summary.put("waitingThreads", String.valueOf(poolMXBean.getThreadsAwaitingConnection()));
            }
        }
        
        return summary;
    }

    /**
     * Get detailed metrics for monitoring
     */
    public Map<String, Object> getDetailedMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        if (dataSource instanceof HikariDataSource) {
            HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
            HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
            
            if (poolMXBean != null) {
                // Connection metrics
                metrics.put("activeConnections", poolMXBean.getActiveConnections());
                metrics.put("idleConnections", poolMXBean.getIdleConnections());
                metrics.put("totalConnections", poolMXBean.getTotalConnections());
                metrics.put("threadsAwaitingConnection", poolMXBean.getThreadsAwaitingConnection());
                
                // Pool configuration
                metrics.put("maximumPoolSize", hikariDataSource.getMaximumPoolSize());
                metrics.put("minimumIdle", hikariDataSource.getMinimumIdle());
                metrics.put("connectionTimeout", hikariDataSource.getConnectionTimeout());
                metrics.put("idleTimeout", hikariDataSource.getIdleTimeout());
                metrics.put("maxLifetime", hikariDataSource.getMaxLifetime());
                
                // Calculated metrics
                double utilization = calculateUtilization(poolMXBean, hikariDataSource);
                metrics.put("utilizationPercentage", utilization);
                metrics.put("availableConnections", hikariDataSource.getMaximumPoolSize() - poolMXBean.getTotalConnections());
                metrics.put("connectionWaitRatio", calculateWaitRatio(poolMXBean));
                
                // Performance indicators
                metrics.put("isOptimal", utilization >= 60 && utilization <= 90);
                metrics.put("needsScaling", utilization > 90);
                metrics.put("underUtilized", utilization < 30);
            }
        }
        
        return metrics;
    }

    /**
     * Check if pool needs scaling
     */
    public boolean needsPoolScaling() {
        if (dataSource instanceof HikariDataSource) {
            HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
            HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
            
            if (poolMXBean != null) {
                double utilization = calculateUtilization(poolMXBean, hikariDataSource);
                return utilization > 90 || poolMXBean.getThreadsAwaitingConnection() > 5;
            }
        }
        return false;
    }

    // Private helper methods
    
    private boolean isPoolHealthy(HikariPoolMXBean poolMXBean) {
        return poolMXBean.getActiveConnections() >= 0 &&
               poolMXBean.getThreadsAwaitingConnection() < 10;
    }
    
    private String getHealthMessage(HikariPoolMXBean poolMXBean) {
        if (poolMXBean.getThreadsAwaitingConnection() > 0) {
            return "WARNING: Threads waiting for connections";
        } else {
            return "HEALTHY: Pool operating normally";
        }
    }
    
    private double calculateUtilization(HikariPoolMXBean poolMXBean, HikariDataSource hikariDataSource) {
        if (hikariDataSource.getMaximumPoolSize() > 0) {
            return (double) poolMXBean.getTotalConnections() / hikariDataSource.getMaximumPoolSize() * 100;
        }
        return 0.0;
    }
    
    private String getPerformanceStatus(double utilization) {
        if (utilization >= 90) {
            return "CRITICAL - Pool nearly full";
        } else if (utilization >= 75) {
            return "HIGH - Good utilization";
        } else if (utilization >= 50) {
            return "OPTIMAL - Balanced usage";
        } else if (utilization >= 25) {
            return "LOW - Under-utilized";
        } else {
            return "MINIMAL - Very low usage";
        }
    }
    
    private double calculateWaitRatio(HikariPoolMXBean poolMXBean) {
        int totalThreads = poolMXBean.getActiveConnections() + poolMXBean.getThreadsAwaitingConnection();
        if (totalThreads > 0) {
            return (double) poolMXBean.getThreadsAwaitingConnection() / totalThreads * 100;
        }
        return 0.0;
    }
}
