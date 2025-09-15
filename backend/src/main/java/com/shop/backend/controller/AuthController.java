package com.shop.backend.controller;

import com.shop.backend.dto.auth.AuthResponse;
import com.shop.backend.dto.auth.LoginRequest;
import com.shop.backend.dto.auth.RegisterRequest;
import com.shop.backend.dto.auth.ForgotPasswordRequest;
import com.shop.backend.dto.auth.VerifyOtpRequest;
import com.shop.backend.dto.auth.UpgradeAnonymousRequest;
import com.shop.backend.service.AuthService;
import com.shop.backend.service.OtpService;
import com.shop.backend.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.shop.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;
import com.shop.backend.dto.SystemAnnouncementDTO;
import com.shop.backend.service.AdminService;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @Autowired
    private OtpService otpService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private AdminService adminService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/anonymous/create")
    public ResponseEntity<AuthResponse> createAnonymousUser() {
        return ResponseEntity.ok(authService.createAnonymousUser());
    }

    @PostMapping("/anonymous/upgrade/{userId}")
    public ResponseEntity<AuthResponse> upgradeAnonymousUser(
            @PathVariable Long userId,
            @Valid @RequestBody UpgradeAnonymousRequest request) {
        return ResponseEntity.ok(authService.upgradeAnonymousUser(userId, request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String message = authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok().body(Map.of("message", message));
    }

    @PostMapping("/forgot-password/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody ForgotPasswordRequest req) {
        var user = userRepository.findByEmail(req.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Email không tồn tại!");
        }
        authService.forgotPassword(req.getEmail());
        return ResponseEntity.ok("Đã gửi mã OTP về email!");
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest req) {
        var user = userRepository.findByEmail(req.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Email không tồn tại!");
        }
        boolean valid = otpService.verifyOtp(req.getEmail(), req.getOtp());
        if (!valid) {
            return ResponseEntity.badRequest().body("Mã OTP không đúng hoặc đã hết hạn!");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        // Gửi email thông báo đổi mật khẩu thành công
        authService.sendPasswordChangedEmail(user.getEmail(), user.getFirstName() != null ? user.getFirstName() : "Người dùng");
        return ResponseEntity.ok("Đổi mật khẩu thành công!");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");
        
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Email không tồn tại!");
        }
        
        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        return ResponseEntity.ok("Đã reset mật khẩu thành công!");
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            HttpServletRequest request) {
        if (!request.getParameterMap().containsKey("page") && !request.getParameterMap().containsKey("size")) {
            // Trả về toàn bộ user nếu không truyền page/size
            return ResponseEntity.ok(userRepository.findAll());
        }
        try {
            org.springframework.data.domain.Pageable paging = org.springframework.data.domain.PageRequest.of(page, size);
            org.springframework.data.domain.Page<User> pageUsers = userRepository.findAll(paging);

            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("users", pageUsers.getContent());
            response.put("currentPage", pageUsers.getNumber());
            response.put("totalItems", pageUsers.getTotalElements());
            response.put("totalPages", pageUsers.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi khi lấy danh sách người dùng: " + e.getMessage());
        }
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().build();
        }
        user.setId(null); // Đảm bảo tạo mới
        user.setPassword(passwordEncoder.encode(user.getPassword())); // Mã hóa password
        User saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        return userRepository.findById(id)
            .map(u -> {
                u.setEmail(user.getEmail());
                u.setFirstName(user.getFirstName());
                u.setLastName(user.getLastName());
                u.setRole(user.getRole());
                u.setStatus(user.getStatus());
                u.setPhone(user.getPhone());
                User updated = userRepository.save(u);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // API public cho student lấy thông báo hệ thống
    @GetMapping("/student/announcements")
    public ResponseEntity<List<SystemAnnouncementDTO>> getActiveSystemAnnouncementsForStudent() {
        List<SystemAnnouncementDTO> dtos = adminService.getActiveAnnouncements().stream().map(a -> {
            SystemAnnouncementDTO dto = new SystemAnnouncementDTO();
            dto.setId(a.getId());
            dto.setTitle(a.getTitle());
            dto.setContent(a.getContent());
            dto.setAnnouncementType(a.getAnnouncementType() != null ? a.getAnnouncementType().name() : null);
            dto.setIsActive(a.getIsActive());
            dto.setCreatedAt(a.getCreatedAt());
            return dto;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
} 