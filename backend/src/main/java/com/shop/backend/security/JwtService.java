package com.shop.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Thêm method để tạo token với thông tin user đầy đủ
    public String generateTokenWithUserInfo(com.shop.backend.model.User user) {
        Map<String, Object> claims = new HashMap<>();
        
        // Xử lý null an toàn cho tất cả các trường
        claims.put("role", user.getRole() != null ? user.getRole().toString() : "STUDENT");
        claims.put("firstName", user.getFirstName() != null ? user.getFirstName() : "");
        claims.put("lastName", user.getLastName() != null ? user.getLastName() : "");
        claims.put("plan", user.getPlan() != null ? user.getPlan() : "FREE");
        claims.put("phone", user.getPhone() != null ? user.getPhone() : "");
        claims.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : null);
        claims.put("planStartDate", user.getPlanStartDate() != null ? user.getPlanStartDate().toString() : null);
        claims.put("planExpiryDate", user.getPlanExpiryDate() != null ? user.getPlanExpiryDate().toString() : null);
        
        // Debug: Log claims để kiểm tra
        // System.out.println("[DEBUG] JWT Claims: " + claims);
        // System.out.println("[DEBUG] User plan in claims: " + claims.get("plan"));
        // System.out.println("[DEBUG] User phone in claims: " + claims.get("phone"));
        // System.out.println("[DEBUG] User avatarUrl in claims: " + claims.get("avatarUrl"));
        // System.out.println("[DEBUG] User planStartDate in claims: " + claims.get("planStartDate"));
        // System.out.println("[DEBUG] User planExpiryDate in claims: " + claims.get("planExpiryDate"));
        
        String token = Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
        
        // Debug: Log token để kiểm tra
        // System.out.println("[DEBUG] Generated JWT token length: " + token.length());
        // System.out.println("[DEBUG] JWT token starts with: " + token.substring(0, Math.min(50, token.length())));
        
        return token;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith((SecretKey) getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Key getSigningKey() {
        byte[] keyBytes = secretKey.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
} 