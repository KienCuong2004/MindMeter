package com.shop.backend.config;

import com.shop.backend.security.CustomOAuth2SuccessHandler;
import com.shop.backend.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.frontend.url}")
    private String frontendUrl;
    
    @Value("${app.frontend.dev-ports:}")
    private String devPortsString;
    
    @Value("${app.frontend.production-domains:}")
    private String productionDomainsString;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, 
                         CustomOAuth2SuccessHandler customOAuth2SuccessHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customOAuth2SuccessHandler = customOAuth2SuccessHandler;
    }


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.deny())
                .contentTypeOptions(contentTypeOptions -> {})
                .httpStrictTransportSecurity(hstsConfig -> hstsConfig
                    .maxAgeInSeconds(31536000)
                )
                .referrerPolicy(referrerPolicy -> referrerPolicy
                    .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login**", "/error", "/api/depression-test/**", "/api/auth/**", "/api/password/**", "/oauth2/**", "/login/oauth2/**").permitAll()
                .requestMatchers("/api/feedback").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/payment/**").permitAll() // Tất cả payment endpoints
                .requestMatchers("/api/currency/**").permitAll() // Currency endpoints
                .requestMatchers("/api/blog/**").permitAll() // Blog endpoints - public access
                .requestMatchers("/api/forum/**").permitAll() // Forum endpoints - public access
                .requestMatchers("/api/support-groups/**").permitAll() // Support groups endpoints - public access
                .requestMatchers("/api/success-stories/**").permitAll() // Success stories endpoints - public access
                .requestMatchers("/api/peer-matching/**").permitAll() // Peer matching endpoints - public access
                .requestMatchers("/ws/**").permitAll() // WebSocket endpoints
                .requestMatchers("/api/chatbot").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/expert/**").hasAnyRole("ADMIN", "EXPERT")
                .requestMatchers("/api/student/**").hasAnyRole("STUDENT", "ANONYMOUS") // Allow anonymous users to access student endpoints
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(10)
                .maxSessionsPreventsLogin(false)
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(customOAuth2SuccessHandler)
                .failureHandler((request, response, exception) -> {
                    response.sendRedirect(frontendUrl + "/login?error=oauth_failed");
                })
            )
            .exceptionHandling(exceptionHandling ->
                exceptionHandling.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Unauthorized\"}");
                })
            );
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // SECURITY FIX: Restrict origins instead of using wildcards
        List<String> allowedOrigins = new ArrayList<>();
        allowedOrigins.add(frontendUrl);
        
        // Parse dev ports from comma-separated string
        if (devPortsString != null && !devPortsString.trim().isEmpty()) {
            String[] devPorts = devPortsString.split(",");
            for (String port : devPorts) {
                allowedOrigins.add(port.trim());
            }
        }
        
        // Parse production domains from comma-separated string
        if (productionDomainsString != null && !productionDomainsString.trim().isEmpty()) {
            String[] productionDomains = productionDomainsString.split(",");
            for (String domain : productionDomains) {
                allowedOrigins.add(domain.trim());
            }
        }
        
        configuration.setAllowedOrigins(allowedOrigins);
        
        // SECURITY FIX: Specify allowed headers instead of wildcard
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "X-CSRF-TOKEN"
        ));
        
        // SECURITY FIX: Specify allowed methods instead of wildcard
        configuration.setAllowedMethods(Arrays.asList(
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS",
            "PATCH"
        ));
        
        // SECURITY FIX: Only allow credentials for specific origins
        configuration.setAllowCredentials(true);
        
        // SECURITY FIX: Set max age for preflight requests
        configuration.setMaxAge(3600L);
        
        // SECURITY FIX: Expose only necessary headers
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "X-CSRF-TOKEN"
        ));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}