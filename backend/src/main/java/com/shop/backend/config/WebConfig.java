package com.shop.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // CORS configuration moved to SecurityConfig to avoid conflicts
    
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Serve avatar files from uploads/avatars directory
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations("file:uploads/avatars/");
        
        // Serve blog featured images from uploads/blog/featured directory
        registry.addResourceHandler("/uploads/blog/featured/**")
                .addResourceLocations("file:uploads/blog/featured/");
    }
}