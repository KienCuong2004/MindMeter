package com.shop.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class SecurityMetricsService {

    @Autowired
    private IpFilteringService ipFilteringService;

    // Real-time metrics storage
    private final Map<String, AtomicLong> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> blockedCounts = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> rateLimitCounts = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> suspiciousIpCounts = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> geographicBlockCounts = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> torBlockCounts = new ConcurrentHashMap<>();

    // Historical data (last 24 hours)
    private final Map<String, List<MetricPoint>> historicalData = new ConcurrentHashMap<>();
    private final int MAX_HISTORICAL_POINTS = 1440; // 24 hours * 60 minutes

    public static class MetricPoint {
        private LocalDateTime timestamp;
        private long value;
        private String type;

        public MetricPoint(LocalDateTime timestamp, long value, String type) {
            this.timestamp = timestamp;
            this.value = value;
            this.type = type;
        }

        // Getters and setters
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        public long getValue() { return value; }
        public void setValue(long value) { this.value = value; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }

    /**
     * Record a request metric
     */
    public void recordRequest(String endpoint, String ip) {
        String key = endpoint + ":" + ip;
        requestCounts.computeIfAbsent(key, k -> new AtomicLong(0)).incrementAndGet();
        
        // Add to historical data
        addToHistoricalData("requests", 1);
    }

    /**
     * Record a blocked request
     */
    public void recordBlockedRequest(String reason, String ip) {
        String key = reason + ":" + ip;
        blockedCounts.computeIfAbsent(key, k -> new AtomicLong(0)).incrementAndGet();
        
        // Add to historical data
        addToHistoricalData("blocked", 1);
    }

    /**
     * Record a rate limit hit
     */
    public void recordRateLimitHit(String endpoint, String ip) {
        String key = endpoint + ":" + ip;
        rateLimitCounts.computeIfAbsent(key, k -> new AtomicLong(0)).incrementAndGet();
        
        // Add to historical data
        addToHistoricalData("rate_limited", 1);
    }

    /**
     * Record a suspicious IP detection
     */
    public void recordSuspiciousIp(String ip, String reason) {
        String key = reason + ":" + ip;
        suspiciousIpCounts.computeIfAbsent(key, k -> new AtomicLong(0)).incrementAndGet();
        
        // Add to historical data
        addToHistoricalData("suspicious_ip", 1);
    }

    /**
     * Record geographic blocking
     */
    public void recordGeographicBlock(String country, String ip) {
        String key = country + ":" + ip;
        geographicBlockCounts.computeIfAbsent(key, k -> new AtomicLong(0)).incrementAndGet();
        
        // Add to historical data
        addToHistoricalData("geographic_block", 1);
    }

    /**
     * Record Tor exit node blocking
     */
    public void recordTorBlock(String ip) {
        torBlockCounts.computeIfAbsent(ip, k -> new AtomicLong(0)).incrementAndGet();
        
        // Add to historical data
        addToHistoricalData("tor_block", 1);
    }

    /**
     * Get real-time metrics summary
     */
    public Map<String, Object> getRealTimeMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        // Total counts
        metrics.put("totalRequests", requestCounts.values().stream().mapToLong(AtomicLong::get).sum());
        metrics.put("totalBlocked", blockedCounts.values().stream().mapToLong(AtomicLong::get).sum());
        metrics.put("totalRateLimited", rateLimitCounts.values().stream().mapToLong(AtomicLong::get).sum());
        metrics.put("totalSuspiciousIps", suspiciousIpCounts.values().stream().mapToLong(AtomicLong::get).sum());
        metrics.put("totalGeographicBlocks", geographicBlockCounts.values().stream().mapToLong(AtomicLong::get).sum());
        metrics.put("totalTorBlocks", torBlockCounts.values().stream().mapToLong(AtomicLong::get).sum());
        
        // Top blocked IPs
        metrics.put("topBlockedIps", getTopBlockedIps());
        
        // Top endpoints
        metrics.put("topEndpoints", getTopEndpoints());
        
        // Current status
        metrics.put("ipFilteringEnabled", ipFilteringService.isIpFilteringEnabled());
        metrics.put("timestamp", LocalDateTime.now());
        
        return metrics;
    }

    /**
     * Get historical metrics for charts
     */
    public Map<String, List<MetricPoint>> getHistoricalMetrics() {
        return new HashMap<>(historicalData);
    }

    /**
     * Get security alerts
     */
    public List<Map<String, Object>> getSecurityAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        
        // Check for high blocked request rate
        long totalBlocked = blockedCounts.values().stream().mapToLong(AtomicLong::get).sum();
        long totalRequests = requestCounts.values().stream().mapToLong(AtomicLong::get).sum();
        
        if (totalRequests > 0) {
            double blockRate = (double) totalBlocked / totalRequests;
            if (blockRate > 0.1) { // More than 10% blocked
                Map<String, Object> alert = new HashMap<>();
                alert.put("type", "HIGH_BLOCK_RATE");
                alert.put("severity", "WARNING");
                alert.put("message", String.format("High block rate detected: %.2f%%", blockRate * 100));
                alert.put("timestamp", LocalDateTime.now());
                alerts.add(alert);
            }
        }
        
        // Check for suspicious IP activity
        if (suspiciousIpCounts.size() > 10) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "MULTIPLE_SUSPICIOUS_IPS");
            alert.put("severity", "INFO");
            alert.put("message", String.format("Multiple suspicious IPs detected: %d", suspiciousIpCounts.size()));
            alert.put("timestamp", LocalDateTime.now());
            alerts.add(alert);
        }
        
        return alerts;
    }

    /**
     * Get top blocked IPs
     */
    private List<Map<String, Object>> getTopBlockedIps() {
        return blockedCounts.entrySet().stream()
                .sorted(Map.Entry.<String, AtomicLong>comparingByValue((a, b) -> Long.compare(b.get(), a.get())))
                .limit(10)
                .map(entry -> {
                    Map<String, Object> ipData = new HashMap<>();
                    String[] parts = entry.getKey().split(":");
                    ipData.put("ip", parts.length > 1 ? parts[1] : parts[0]);
                    ipData.put("reason", parts.length > 1 ? parts[0] : "unknown");
                    ipData.put("count", entry.getValue().get());
                    return ipData;
                })
                .toList();
    }

    /**
     * Get top endpoints by request count
     */
    private List<Map<String, Object>> getTopEndpoints() {
        Map<String, Long> endpointCounts = new HashMap<>();
        
        requestCounts.forEach((key, count) -> {
            String endpoint = key.split(":")[0];
            endpointCounts.merge(endpoint, count.get(), Long::sum);
        });
        
        return endpointCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    Map<String, Object> endpointData = new HashMap<>();
                    endpointData.put("endpoint", entry.getKey());
                    endpointData.put("count", entry.getValue());
                    return endpointData;
                })
                .toList();
    }

    /**
     * Add data point to historical storage
     */
    private void addToHistoricalData(String type, long value) {
        historicalData.computeIfAbsent(type, k -> new ArrayList<>()).add(
                new MetricPoint(LocalDateTime.now(), value, type)
        );
        
        // Keep only last 24 hours of data
        List<MetricPoint> data = historicalData.get(type);
        if (data.size() > MAX_HISTORICAL_POINTS) {
            data.remove(0);
        }
    }

    /**
     * Clear old data (call periodically)
     */
    public void cleanupOldData() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        
        historicalData.forEach((type, data) -> {
            data.removeIf(point -> point.getTimestamp().isBefore(cutoff));
        });
        
        // Clear counters that are too old
        requestCounts.clear();
        blockedCounts.clear();
        rateLimitCounts.clear();
        suspiciousIpCounts.clear();
        geographicBlockCounts.clear();
        torBlockCounts.clear();
    }

    public boolean isIpFilteringEnabled() {
        return ipFilteringService.isIpFilteringEnabled();
    }
}
