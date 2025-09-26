package com.shop.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Service
public class IpFilteringService {

    // Configuration from application.properties
    @Value("${security.ip-filtering.enabled:true}")
    private boolean ipFilteringEnabled;

    @Value("${security.ip-filtering.block-tor:true}")
    private boolean blockTor;

    @Value("${security.ip-filtering.block-vpn:false}")
    private boolean blockVpn;

    @Value("${security.ip-filtering.allowed-countries:VN,US,GB,CA,AU}")
    private String allowedCountries;

    @Value("${security.ip-filtering.blocked-countries:CN,RU,KP}")
    private String blockedCountries;

    // In-memory storage for IP lists
    private final Set<String> blacklistedIps = ConcurrentHashMap.newKeySet();
    private final Set<String> whitelistedIps = ConcurrentHashMap.newKeySet();
    private final Map<String, Long> suspiciousIps = new ConcurrentHashMap<>();
    private final Map<String, String> ipToCountry = new ConcurrentHashMap<>();

    // Patterns for suspicious IP detection
    private static final Pattern SUSPICIOUS_PATTERN = Pattern.compile(
        "^(0\\.|169\\.254\\.|224\\.|255\\.)"
    );

    // Tor exit node detection (simplified)
    private final Set<String> torExitNodes = ConcurrentHashMap.newKeySet();

    public IpFilteringService() {
        loadDefaultLists();
        loadTorExitNodes();
    }

    /**
     * Check if an IP address should be blocked
     */
    public boolean isIpBlocked(String ip) {
        if (!ipFilteringEnabled) {
            return false;
        }

        // Clean IP address
        String cleanIp = cleanIpAddress(ip);
        if (cleanIp == null) {
            return true; // Block invalid IPs
        }

        // Allow localhost and local IPs for development
        if (isLocalIp(cleanIp)) {
            return false;
        }

        // Check whitelist first
        if (whitelistedIps.contains(cleanIp)) {
            return false;
        }

        // Check blacklist
        if (blacklistedIps.contains(cleanIp)) {
            return true;
        }

        // Check suspicious IPs
        if (isSuspiciousIp(cleanIp)) {
            return true;
        }

        // Check Tor exit nodes
        if (blockTor && torExitNodes.contains(cleanIp)) {
            return true;
        }

        // Check geographic restrictions
        if (isGeographicallyBlocked(cleanIp)) {
            return true;
        }

        return false;
    }

    /**
     * Add IP to blacklist
     */
    public void addToBlacklist(String ip) {
        String cleanIp = cleanIpAddress(ip);
        if (cleanIp != null) {
            blacklistedIps.add(cleanIp);
        }
    }

    /**
     * Add IP to whitelist
     */
    public void addToWhitelist(String ip) {
        String cleanIp = cleanIpAddress(ip);
        if (cleanIp != null) {
            whitelistedIps.add(cleanIp);
        }
    }

    /**
     * Remove IP from blacklist
     */
    public void removeFromBlacklist(String ip) {
        String cleanIp = cleanIpAddress(ip);
        if (cleanIp != null) {
            blacklistedIps.remove(cleanIp);
        }
    }

    /**
     * Mark IP as suspicious
     */
    public void markSuspicious(String ip) {
        String cleanIp = cleanIpAddress(ip);
        if (cleanIp != null) {
            suspiciousIps.put(cleanIp, System.currentTimeMillis());
        }
    }

    /**
     * Get IP filtering statistics
     */
    public Map<String, Object> getFilteringStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("enabled", ipFilteringEnabled);
        stats.put("blacklistedCount", blacklistedIps.size());
        stats.put("whitelistedCount", whitelistedIps.size());
        stats.put("suspiciousCount", suspiciousIps.size());
        stats.put("torExitNodesCount", torExitNodes.size());
        stats.put("allowedCountries", Arrays.asList(allowedCountries.split(",")));
        stats.put("blockedCountries", Arrays.asList(blockedCountries.split(",")));
        return stats;
    }

    /**
     * Clean and validate IP address
     */
    private String cleanIpAddress(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return null;
        }

        // Remove port if present
        String cleanIp = ip.split(":")[0].trim();
        
        // Validate IP format
        try {
            InetAddress.getByName(cleanIp);
            return cleanIp;
        } catch (UnknownHostException e) {
            return null;
        }
    }

    /**
     * Check if IP is local (localhost, private networks)
     */
    private boolean isLocalIp(String ip) {
        // Allow localhost
        if (ip.equals("127.0.0.1") || ip.equals("::1") || ip.equals("localhost")) {
            return true;
        }
        
        // Allow private IP ranges
        if (ip.startsWith("192.168.") || 
            ip.startsWith("10.") || 
            ip.startsWith("172.16.") || 
            ip.startsWith("172.17.") || 
            ip.startsWith("172.18.") || 
            ip.startsWith("172.19.") || 
            ip.startsWith("172.20.") || 
            ip.startsWith("172.21.") || 
            ip.startsWith("172.22.") || 
            ip.startsWith("172.23.") || 
            ip.startsWith("172.24.") || 
            ip.startsWith("172.25.") || 
            ip.startsWith("172.26.") || 
            ip.startsWith("172.27.") || 
            ip.startsWith("172.28.") || 
            ip.startsWith("172.29.") || 
            ip.startsWith("172.30.") || 
            ip.startsWith("172.31.")) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if IP is suspicious based on patterns
     */
    private boolean isSuspiciousIp(String ip) {
        // Check suspicious patterns
        if (SUSPICIOUS_PATTERN.matcher(ip).find()) {
            return true;
        }

        // Check if recently marked as suspicious
        Long suspiciousTime = suspiciousIps.get(ip);
        if (suspiciousTime != null) {
            long timeDiff = System.currentTimeMillis() - suspiciousTime;
            // Consider suspicious for 1 hour
            if (timeDiff < TimeUnit.HOURS.toMillis(1)) {
                return true;
            } else {
                // Remove old suspicious entries
                suspiciousIps.remove(ip);
            }
        }

        return false;
    }

    /**
     * Check geographic restrictions
     */
    private boolean isGeographicallyBlocked(String ip) {
        try {
            String country = getCountryFromIp(ip);
            if (country == null) {
                return false; // Allow if country unknown
            }

            // Check blocked countries
            if (Arrays.asList(blockedCountries.split(",")).contains(country)) {
                return true;
            }

            // Check if country is in allowed list (if specified)
            if (!allowedCountries.isEmpty() && 
                !Arrays.asList(allowedCountries.split(",")).contains(country)) {
                return true;
            }

        } catch (Exception e) {
            // Log error but don't block
        }

        return false;
    }

    /**
     * Get country from IP (simplified implementation)
     * In production, use a proper GeoIP service like MaxMind
     */
    private String getCountryFromIp(String ip) {
        // Check cache first
        String cached = ipToCountry.get(ip);
        if (cached != null) {
            return cached;
        }

        // Simplified country detection based on IP ranges
        // This is a basic implementation - in production use MaxMind GeoIP2
        String country = detectCountryFromIpRange(ip);
        
        // Cache result
        if (country != null) {
            ipToCountry.put(ip, country);
        }

        return country;
    }

    /**
     * Simplified country detection based on IP ranges
     * This is a basic implementation for demo purposes
     */
    private String detectCountryFromIpRange(String ip) {
        try {
            InetAddress inetAddress = InetAddress.getByName(ip);
            byte[] bytes = inetAddress.getAddress();
            
            // Basic country detection based on IP ranges
            // This is simplified - use MaxMind GeoIP2 for accurate results
            
            if (bytes.length == 4) { // IPv4
                int firstByte = bytes[0] & 0xFF;
                
                // Vietnam IP ranges (simplified)
                if ((firstByte >= 1 && firstByte <= 14) || 
                    (firstByte >= 27 && firstByte <= 30) ||
                    (firstByte >= 42 && firstByte <= 43) ||
                    (firstByte >= 58 && firstByte <= 60) ||
                    (firstByte >= 103 && firstByte <= 104) ||
                    (firstByte >= 112 && firstByte <= 115) ||
                    (firstByte >= 118 && firstByte <= 119) ||
                    (firstByte >= 123 && firstByte <= 125) ||
                    (firstByte >= 171 && firstByte <= 175) ||
                    (firstByte >= 180 && firstByte <= 183) ||
                    (firstByte >= 202 && firstByte <= 203) ||
                    (firstByte >= 210 && firstByte <= 211) ||
                    (firstByte >= 222 && firstByte <= 223)) {
                    return "VN";
                }
                
                // US IP ranges (simplified)
                if ((firstByte >= 3 && firstByte <= 6) ||
                    (firstByte >= 8 && firstByte <= 9) ||
                    (firstByte >= 11 && firstByte <= 12) ||
                    (firstByte >= 15 && firstByte <= 16) ||
                    (firstByte >= 18 && firstByte <= 19) ||
                    (firstByte >= 20 && firstByte <= 23) ||
                    (firstByte >= 24 && firstByte <= 26) ||
                    (firstByte >= 32 && firstByte <= 33) ||
                    (firstByte >= 35 && firstByte <= 40) ||
                    (firstByte >= 44 && firstByte <= 46) ||
                    (firstByte >= 47 && firstByte <= 50) ||
                    (firstByte >= 52 && firstByte <= 54) ||
                    (firstByte >= 56 && firstByte <= 57) ||
                    (firstByte >= 63 && firstByte <= 66) ||
                    (firstByte >= 67 && firstByte <= 70) ||
                    (firstByte >= 71 && firstByte <= 72) ||
                    (firstByte >= 73 && firstByte <= 76) ||
                    (firstByte >= 96 && firstByte <= 99) ||
                    (firstByte >= 100 && firstByte <= 102) ||
                    (firstByte >= 104 && firstByte <= 107) ||
                    (firstByte >= 108 && firstByte <= 111) ||
                    (firstByte >= 128 && firstByte <= 131) ||
                    (firstByte >= 132 && firstByte <= 135) ||
                    (firstByte >= 136 && firstByte <= 139) ||
                    (firstByte >= 140 && firstByte <= 143) ||
                    (firstByte >= 144 && firstByte <= 147) ||
                    (firstByte >= 148 && firstByte <= 151) ||
                    (firstByte >= 152 && firstByte <= 155) ||
                    (firstByte >= 156 && firstByte <= 159) ||
                    (firstByte >= 160 && firstByte <= 163) ||
                    (firstByte >= 164 && firstByte <= 167) ||
                    (firstByte >= 168 && firstByte <= 170) ||
                    (firstByte >= 172 && firstByte <= 175) ||
                    (firstByte >= 184 && firstByte <= 187) ||
                    (firstByte >= 192 && firstByte <= 195) ||
                    (firstByte >= 198 && firstByte <= 201) ||
                    (firstByte >= 204 && firstByte <= 207) ||
                    (firstByte >= 208 && firstByte <= 211) ||
                    (firstByte >= 216 && firstByte <= 219) ||
                    (firstByte >= 224 && firstByte <= 227) ||
                    (firstByte >= 232 && firstByte <= 235) ||
                    (firstByte >= 236 && firstByte <= 239) ||
                    (firstByte >= 240 && firstByte <= 243) ||
                    (firstByte >= 244 && firstByte <= 247) ||
                    (firstByte >= 248 && firstByte <= 251) ||
                    (firstByte >= 252 && firstByte <= 255)) {
                    return "US";
                }
            }
            
        } catch (Exception e) {
            // Return null if detection fails
        }
        
        return null; // Unknown country
    }

    /**
     * Load default IP lists
     */
    private void loadDefaultLists() {
        // Load from application.properties or external files
        // For now, add some common malicious IPs
        blacklistedIps.addAll(Arrays.asList(
            "127.0.0.1", // Localhost (for testing)
            "0.0.0.0"    // Invalid IP
        ));
    }

    /**
     * Load Tor exit nodes (simplified)
     */
    private void loadTorExitNodes() {
        // In production, fetch from Tor Project API
        // For now, add some known Tor exit nodes
        torExitNodes.addAll(Arrays.asList(
            "185.220.100.240",
            "185.220.100.241",
            "185.220.100.242"
        ));
    }

    /**
     * Get all blacklisted IPs
     */
    public Set<String> getBlacklistedIps() {
        return new HashSet<>(blacklistedIps);
    }

    /**
     * Get all whitelisted IPs
     */
    public Set<String> getWhitelistedIps() {
        return new HashSet<>(whitelistedIps);
    }

    /**
     * Get suspicious IPs
     */
    public Map<String, Long> getSuspiciousIps() {
        return new HashMap<>(suspiciousIps);
    }

    /**
     * Clear all IP lists
     */
    public void clearAllLists() {
        blacklistedIps.clear();
        whitelistedIps.clear();
        suspiciousIps.clear();
        ipToCountry.clear();
    }

    /**
     * Check if IP filtering is enabled
     */
    public boolean isIpFilteringEnabled() {
        return ipFilteringEnabled;
    }
}
