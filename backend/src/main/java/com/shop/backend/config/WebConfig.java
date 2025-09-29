package com.shop.backend.config;

import com.shop.backend.interceptor.RateLimitInterceptor;
import com.shop.backend.interceptor.IpFilteringInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private RateLimitInterceptor rateLimitInterceptor;
    
    @Autowired
    private IpFilteringInterceptor ipFilteringInterceptor;
    
    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        // IP Filtering Interceptor - runs first
        registry.addInterceptor(ipFilteringInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                    "/api/health",
                    "/api/actuator/**",
                    "/api/public/**",
                    "/api/admin/security/ip-filtering/public/**"
                );
        
        // Rate Limiting Interceptor - runs after IP filtering
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                    "/api/health",
                    "/api/actuator/**",
                    "/api/public/**"
                );
    }
    
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Configure static resource handling for uploads
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/")
                .setCachePeriod(3600) // Cache for 1 hour
                .resourceChain(true);
    }
}