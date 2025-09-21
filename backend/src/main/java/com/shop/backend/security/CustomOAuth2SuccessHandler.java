package com.shop.backend.security;

import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.service.PasswordGeneratorService;
import org.springframework.security.crypto.password.PasswordEncoder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
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
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;

@Component
public class CustomOAuth2SuccessHandler implements org.springframework.security.web.authentication.AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final PasswordGeneratorService passwordGeneratorService;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${app.frontend-url}")
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
            // Có thể log thêm thông tin sub để debug
            String sub = oAuth2User.getAttribute("sub");
            System.err.println("[OAuth2] Không lấy được email từ Google! sub=" + sub);
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
        if (userOpt.isPresent()) {
            user = userOpt.get();

            // Nếu user đã tồn tại nhưng chưa có OAuth provider, cập nhật thông tin
            if (user.getOauthProvider() == null || user.getOauthProvider().isEmpty()) {
                user.setOauthProvider("GOOGLE");
                if (picture != null) {
                    user.setAvatarUrl(picture);
                }
                userRepository.save(user);
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
        Key key = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), SignatureAlgorithm.HS256.getJcaName());
        String token = Jwts.builder()
                .setSubject(user.getEmail())
                .claim("role", user.getRole().name())
                .claim("firstName", user.getFirstName())
                .claim("lastName", user.getLastName())
                .claim("plan", user.getPlan())
                .claim("phone", user.getPhone())
                .claim("avatarUrl", user.getAvatarUrl())
                .claim("planStartDate", user.getPlanStartDate() != null ? user.getPlanStartDate().toString() : null) // Thêm planStartDate
                .claim("planExpiryDate", user.getPlanExpiryDate() != null ? user.getPlanExpiryDate().toString() : null) // Thêm planExpiryDate
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        // Redirect về frontend kèm token và thông tin về temporary password
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(frontendUrl)
                .queryParam("token", token);
        
        // Nếu là user mới với temporary password, thêm flag để frontend hiển thị modal
        if (user.isTemporaryPassword() && !user.isTempPasswordUsed()) {
            builder.queryParam("requiresPasswordChange", "true");
            builder.queryParam("message", "Chao mung! Vui long dat mat khau moi cho tai khoan cua ban.");
        } else {
        }
        
        String redirectUrl = builder.build().toUriString();
        response.sendRedirect(redirectUrl);
    }
} 