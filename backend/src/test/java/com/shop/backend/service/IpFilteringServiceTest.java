package com.shop.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "security.ip-filtering.enabled=true",
    "security.ip-filtering.block-tor=true",
    "security.ip-filtering.allowed-countries=VN,US",
    "security.ip-filtering.blocked-countries=CN,RU"
})
class IpFilteringServiceTest {

    private IpFilteringService ipFilteringService;

    @BeforeEach
    void setUp() {
        ipFilteringService = new IpFilteringService();
    }

    @Test
    void testValidIpNotBlocked() {
        // Test with a valid IP that should not be blocked
        String validIp = "192.168.1.1";
        assertFalse(ipFilteringService.isIpBlocked(validIp));
    }

    @Test
    void testBlacklistedIpBlocked() {
        // Add IP to blacklist
        String maliciousIp = "10.0.0.1";
        ipFilteringService.addToBlacklist(maliciousIp);
        
        // Should be blocked
        assertTrue(ipFilteringService.isIpBlocked(maliciousIp));
    }

    @Test
    void testWhitelistedIpNotBlocked() {
        // Add IP to whitelist
        String trustedIp = "203.0.113.1";
        ipFilteringService.addToWhitelist(trustedIp);
        
        // Should not be blocked even if suspicious
        assertFalse(ipFilteringService.isIpBlocked(trustedIp));
    }

    @Test
    void testSuspiciousIpBlocked() {
        // Test suspicious IP patterns
        String suspiciousIp = "127.0.0.1";
        assertTrue(ipFilteringService.isIpBlocked(suspiciousIp));
    }

    @Test
    void testInvalidIpBlocked() {
        // Test invalid IP
        String invalidIp = "invalid-ip";
        assertTrue(ipFilteringService.isIpBlocked(invalidIp));
    }

    @Test
    void testNullIpBlocked() {
        // Test null IP
        assertTrue(ipFilteringService.isIpBlocked(null));
    }

    @Test
    void testEmptyIpBlocked() {
        // Test empty IP
        assertTrue(ipFilteringService.isIpBlocked(""));
    }

    @Test
    void testMarkSuspicious() {
        String ip = "192.168.1.100";
        
        // Initially not blocked
        assertFalse(ipFilteringService.isIpBlocked(ip));
        
        // Mark as suspicious
        ipFilteringService.markSuspicious(ip);
        
        // Should be blocked now
        assertTrue(ipFilteringService.isIpBlocked(ip));
    }

    @Test
    void testRemoveFromBlacklist() {
        String ip = "10.0.0.2";
        
        // Add to blacklist
        ipFilteringService.addToBlacklist(ip);
        assertTrue(ipFilteringService.isIpBlocked(ip));
        
        // Remove from blacklist
        ipFilteringService.removeFromBlacklist(ip);
        assertFalse(ipFilteringService.isIpBlocked(ip));
    }

    @Test
    void testGetFilteringStats() {
        // Add some test data
        ipFilteringService.addToBlacklist("10.0.0.1");
        ipFilteringService.addToWhitelist("203.0.113.1");
        ipFilteringService.markSuspicious("192.168.1.1");
        
        var stats = ipFilteringService.getFilteringStats();
        
        assertNotNull(stats);
        assertTrue(stats.containsKey("enabled"));
        assertTrue(stats.containsKey("blacklistedCount"));
        assertTrue(stats.containsKey("whitelistedCount"));
        assertTrue(stats.containsKey("suspiciousCount"));
    }

    @Test
    void testClearAllLists() {
        // Add some test data
        ipFilteringService.addToBlacklist("10.0.0.1");
        ipFilteringService.addToWhitelist("203.0.113.1");
        ipFilteringService.markSuspicious("192.168.1.1");
        
        // Clear all
        ipFilteringService.clearAllLists();
        
        // Check that lists are empty
        assertTrue(ipFilteringService.getBlacklistedIps().isEmpty());
        assertTrue(ipFilteringService.getWhitelistedIps().isEmpty());
        assertTrue(ipFilteringService.getSuspiciousIps().isEmpty());
    }
}
