package com.shop.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;

import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    @Autowired
    private JwtService jwtService;
    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        logger.info("[JwtAuthFilter] Incoming request: {} {}", request.getMethod(), request.getRequestURI());
        final String authHeader = request.getHeader("Authorization");
        logger.info("[JwtAuthFilter] Authorization header: {}", authHeader);
        
        // Debug: Log tất cả headers
        java.util.Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            String headerValue = request.getHeader(headerName);
            logger.info("[JwtAuthFilter] Header {}: {}", headerName, headerValue);
        }
        
        final String jwt;
        final String username;
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("[JwtAuthFilter] No Authorization header or not Bearer");
            filterChain.doFilter(request, response);
            return;
        }
        jwt = authHeader.substring(7);
        try {
            username = jwtService.extractUsername(jwt);
            logger.info("[JwtAuthFilter] Extracted username: {}", username);
        } catch (Exception e) {
            logger.error("[JwtAuthFilter] Failed to extract username from token: {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }
        // Luôn set lại authentication context nếu có JWT
        if (username != null) {
            try {
                UserDetails userDetails;
                
                // Kiểm tra nếu là anonymous session
                if (username.startsWith("anon_")) {
                    // Tạo UserDetails ảo cho anonymous session
                    userDetails = new org.springframework.security.core.userdetails.User(
                        username, // sessionId
                        "", // password rỗng
                        java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_STUDENT"))
                    );
                    logger.info("[JwtAuthFilter] Anonymous session detected: {}", username);
                } else {
                    // Load user thật từ database
                    userDetails = userDetailsService.loadUserByUsername(username);
                    logger.info("[JwtAuthFilter] User {} authorities: {}", username, userDetails.getAuthorities());
                }
                
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("[JwtAuthFilter] Token valid, authentication set for {} with authorities: {}", username, userDetails.getAuthorities());
                } else {
                    logger.warn("[JwtAuthFilter] Token invalid for user {}", username);
                }
            } catch (Exception e) {
                logger.error("[JwtAuthFilter] Exception when loading user or validating token: {}", e.getMessage());
                e.printStackTrace();
            }
        } else {
            logger.warn("[JwtAuthFilter] Username null");
        }
        filterChain.doFilter(request, response);
    }
} 