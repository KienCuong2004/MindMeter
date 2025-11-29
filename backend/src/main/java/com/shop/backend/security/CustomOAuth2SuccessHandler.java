package com.shop.backend.security;

import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.service.PasswordGeneratorService;
import org.springframework.security.crypto.password.PasswordEncoder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;

@Component
public class CustomOAuth2SuccessHandler implements org.springframework.security.web.authentication.AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final PasswordGeneratorService passwordGeneratorService;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public CustomOAuth2SuccessHandler(UserRepository userRepository, 
                                     PasswordGeneratorService passwordGeneratorService,
                                     PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordGeneratorService = passwordGeneratorService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        if (email == null || email.isEmpty()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Không lấy được email từ Google. Vui lòng cấp quyền truy cập email.");
            return;
        }
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture"); // Lấy avatar từ Google

        // Đảm bảo email luôn lowercase để tránh trùng lặp do khác hoa/thường
        email = email != null ? email.trim().toLowerCase() : null;
        // Tìm user theo email đã chuẩn hóa
        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;
        boolean isAccountLinking = false;
        if (userOpt.isPresent()) {
            user = userOpt.get();

            // Trường hợp: Local → Google (cùng email)
            // Nếu user đã tồn tại với local account (có password), liên kết với Google
            if (user.getOauthProvider() == null || user.getOauthProvider().isEmpty()) {
                user.setOauthProvider("GOOGLE");
                if (picture != null) {
                    user.setAvatarUrl(picture);
                }
                userRepository.save(user);
                isAccountLinking = true;
            } else if ("GOOGLE".equals(user.getOauthProvider())) {
                // User đã đăng nhập bằng Google trước đó
            }
            
            // Cập nhật avatar nếu user chưa có hoặc muốn cập nhật từ Google
            if (picture != null && (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty())) {
                user.setAvatarUrl(picture);
                userRepository.save(user);
            }
            
        } else {
            // Create new user for Google OAuth2
            user = new User();
            user.setEmail(email);
            
            // Split name into firstName and lastName
            String[] nameParts = name != null ? name.split(" ", 2) : new String[2];
            user.setFirstName(nameParts != null && nameParts.length > 0 ? nameParts[0] : "");
            user.setLastName(nameParts != null && nameParts.length > 1 ? nameParts[1] : "");
            user.setRole(Role.STUDENT);
            user.setStatus(User.Status.ACTIVE);
            user.setOauthProvider("GOOGLE");
            
            // Generate secure temporary password for the user
            String generatedPassword = passwordGeneratorService.generateSecurePassword();
            user.setPassword(passwordEncoder.encode(generatedPassword));
            user.setTemporaryPassword(true);
            user.setTempPasswordUsed(false);
            
            // Save avatar from Google if available
            if (picture != null) {
                user.setAvatarUrl(picture);
            }
            
            // Save user to database
            userRepository.save(user);
            
            // Send password email to user (commented out for Option 3 - auto-login with modal)
            // passwordEmailService.sendPasswordEmail(email, generatedPassword, user.getFirstName());
            
        }

        // Sinh JWT với đầy đủ thông tin
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        String token = Jwts.builder()
                .subject(user.getEmail())
                .claim("role", user.getRole().name())
                .claim("firstName", user.getFirstName())
                .claim("lastName", user.getLastName())
                .claim("plan", user.getPlan())
                .claim("phone", user.getPhone())
                .claim("avatarUrl", user.getAvatarUrl())
                .claim("planStartDate", user.getPlanStartDate() != null ? user.getPlanStartDate().toString() : null) // Thêm planStartDate
                .claim("planExpiryDate", user.getPlanExpiryDate() != null ? user.getPlanExpiryDate().toString() : null) // Thêm planExpiryDate
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(key)
                .compact();

        // Redirect về frontend kèm token và thông tin về temporary password
        String redirectUrl;
        
        if (isAccountLinking) {
            // Nếu là account linking, redirect đến trang thông báo liên kết
            redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/account-linking")
                    .queryParam("email", email)
                    .queryParam("name", name != null ? name : "")
                    .queryParam("token", token)
                    .build()
                    .encode()
                    .toUriString();
        } else {
            // Redirect bình thường - không cần password change cho Google OAuth
            redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/auth/callback")
                    .queryParam("token", token)
                    .build()
                    .toUriString();
        }
        response.sendRedirect(redirectUrl);
    }
} 