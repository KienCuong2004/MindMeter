package com.shop.backend.config;

import com.shop.backend.security.CustomOAuth2SuccessHandler;
import com.shop.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;
import java.util.Arrays;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, 
                         CustomOAuth2SuccessHandler customOAuth2SuccessHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customOAuth2SuccessHandler = customOAuth2SuccessHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(org.springframework.security.web.csrf.CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/api/payment/**", "/api/depression-test/**", "/api/admin/**", "/api/expert/**", "/api/auth/**", "/api/blog/**", "/api/chatbot", "/api/auto-booking")
            )
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login**", "/error", "/api/depression-test/**", "/api/auth/**").permitAll()
                .requestMatchers("/api/feedback").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/payment/**").permitAll() // Tất cả payment endpoints
                .requestMatchers("/api/currency/**").permitAll() // Currency endpoints
                .requestMatchers("/api/blog/**").permitAll() // Blog endpoints - public access
                .requestMatchers("/ws/**").permitAll() // WebSocket endpoints
                .requestMatchers("/api/chatbot").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/expert/**").hasAnyRole("ADMIN", "EXPERT")
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(customOAuth2SuccessHandler)
            )
            .exceptionHandling(exceptionHandling ->
                exceptionHandling.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Unauthorized\"}");
                })
            );
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(new com.shop.backend.config.CsrfCookieFilter(), org.springframework.security.web.authentication.www.BasicAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // SECURITY FIX: Restrict origins instead of using wildcards
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:3001",
            "https://your-production-domain.com" // Add your production domain
        ));
        
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