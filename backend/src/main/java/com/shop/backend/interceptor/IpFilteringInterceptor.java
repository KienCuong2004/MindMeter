package com.shop.backend.interceptor;

import com.shop.backend.service.IpFilteringService;
import com.shop.backend.service.SecurityMetricsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.lang.NonNull;

@Component
public class IpFilteringInterceptor implements HandlerInterceptor {

    @Autowired
    private IpFilteringService ipFilteringService;

    @Autowired
    private SecurityMetricsService securityMetricsService;

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) throws Exception {
        String clientIp = getClientIp(request);
        
        // Check if IP is blocked
        if (ipFilteringService.isIpBlocked(clientIp)) {
            // Record blocked request in metrics
            securityMetricsService.recordBlockedRequest("IP_FILTERED", clientIp);
            
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setHeader("X-Blocked-Reason", "IP_FILTERED");
            response.getWriter().write("Access denied: IP address is blocked");
            return false;
        }
        
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(".")) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
