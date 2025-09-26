package com.shop.backend.controller;

import com.shop.backend.service.IpFilteringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/security/ip-filtering")
public class IpFilteringController {

    @Autowired
    private IpFilteringService ipFilteringService;

    @PostMapping("/public/test-ip")
    public ResponseEntity<Map<String, Object>> testIpPublic(@RequestBody Map<String, String> request) {
        String ip = request.get("ip");
        if (ip == null || ip.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "IP address is required"));
        }
        
        boolean isBlocked = ipFilteringService.isIpBlocked(ip);
        Map<String, Object> result = Map.of(
            "ip", ip,
            "isBlocked", isBlocked,
            "reason", isBlocked ? "IP is blocked" : "IP is allowed"
        );
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/public/stats")
    public ResponseEntity<Map<String, Object>> getFilteringStatsPublic() {
        Map<String, Object> stats = ipFilteringService.getFilteringStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/blacklist")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Set<String>> getBlacklistedIps() {
        Set<String> blacklistedIps = ipFilteringService.getBlacklistedIps();
        return ResponseEntity.ok(blacklistedIps);
    }

    @GetMapping("/whitelist")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Set<String>> getWhitelistedIps() {
        Set<String> whitelistedIps = ipFilteringService.getWhitelistedIps();
        return ResponseEntity.ok(whitelistedIps);
    }

    @GetMapping("/suspicious")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getSuspiciousIps() {
        Map<String, Long> suspiciousIps = ipFilteringService.getSuspiciousIps();
        return ResponseEntity.ok(suspiciousIps);
    }

    @PostMapping("/blacklist")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> addToBlacklist(@RequestBody Map<String, String> request) {
        String ip = request.get("ip");
        if (ip == null || ip.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "IP address is required"));
        }
        
        ipFilteringService.addToBlacklist(ip);
        return ResponseEntity.ok(Map.of("message", "IP added to blacklist successfully"));
    }

    @PostMapping("/whitelist")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> addToWhitelist(@RequestBody Map<String, String> request) {
        String ip = request.get("ip");
        if (ip == null || ip.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "IP address is required"));
        }
        
        ipFilteringService.addToWhitelist(ip);
        return ResponseEntity.ok(Map.of("message", "IP added to whitelist successfully"));
    }

    @DeleteMapping("/blacklist/{ip}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> removeFromBlacklist(@PathVariable String ip) {
        ipFilteringService.removeFromBlacklist(ip);
        return ResponseEntity.ok(Map.of("message", "IP removed from blacklist successfully"));
    }

    @PostMapping("/suspicious")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> markSuspicious(@RequestBody Map<String, String> request) {
        String ip = request.get("ip");
        if (ip == null || ip.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "IP address is required"));
        }
        
        ipFilteringService.markSuspicious(ip);
        return ResponseEntity.ok(Map.of("message", "IP marked as suspicious successfully"));
    }

    @PostMapping("/clear-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> clearAllLists() {
        ipFilteringService.clearAllLists();
        return ResponseEntity.ok(Map.of("message", "All IP lists cleared successfully"));
    }

    @PostMapping("/test-ip")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> testIp(@RequestBody Map<String, String> request) {
        String ip = request.get("ip");
        if (ip == null || ip.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "IP address is required"));
        }
        
        boolean isBlocked = ipFilteringService.isIpBlocked(ip);
        Map<String, Object> result = Map.of(
            "ip", ip,
            "isBlocked", isBlocked,
            "reason", isBlocked ? "IP is blocked" : "IP is allowed"
        );
        
        return ResponseEntity.ok(result);
    }
}
