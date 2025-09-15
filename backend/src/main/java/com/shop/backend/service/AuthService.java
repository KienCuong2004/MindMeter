package com.shop.backend.service;

import com.shop.backend.dto.auth.AuthResponse;
import com.shop.backend.dto.auth.LoginRequest;
import com.shop.backend.dto.auth.RegisterRequest;
import com.shop.backend.dto.auth.UpgradeAnonymousRequest;
import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Random;
import com.shop.backend.dto.UserDTO;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final JavaMailSender mailSender;
    private final Random random = new Random();
    private final OtpService otpService;

    // Helper method để convert User entity thành UserDTO
    private UserDTO convertToUserDTO(User user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setEmail(user.getEmail());
        userDTO.setFirstName(user.getFirstName());
        userDTO.setLastName(user.getLastName());
        userDTO.setPhone(user.getPhone());
        userDTO.setAvatarUrl(user.getAvatarUrl());
        userDTO.setRole(user.getRole().toString());
        userDTO.setStatus(user.getStatus().toString());
        userDTO.setPlan(user.getPlan());
        userDTO.setPlanStartDate(user.getPlanStartDate());
        userDTO.setPlanExpiryDate(user.getPlanExpiryDate());
        userDTO.setCreatedAt(user.getCreatedAt());
        userDTO.setUpdatedAt(user.getUpdatedAt());
        return userDTO;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName("Người dùng");
        user.setLastName(String.valueOf(10000 + random.nextInt(90000)));
        user.setRole(Role.STUDENT);
        user.setStatus(User.Status.ACTIVE);
        user.setAvatarUrl("/src/assets/images/User-avatar.png"); // Avatar mặc định cho user đăng ký thông thường

        userRepository.save(user);
        sendRegisterSuccessEmail(user.getEmail(), user.getFirstName());
        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role", user.getRole().name().toUpperCase());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put("avatarUrl", user.getAvatarUrl()); // Thêm thông tin avatar
        claims.put("plan", user.getPlan()); // Thêm thông tin plan
        String token = jwtService.generateToken(
            claims,
            new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            )
        );
        return new AuthResponse(token, user.getEmail(), user.getRole(), convertToUserDTO(user));
    }

    @Transactional
    public AuthResponse createAnonymousUser() {
        // Tạo tài khoản ẩn danh với thông tin tạm thời
        User user = new User();
        user.setEmail(null); // Email null cho user ẩn danh
        user.setPassword(null); // Password null cho user ẩn danh
        user.setFirstName("Người dùng");
        user.setLastName("Ẩn danh");
        user.setRole(Role.STUDENT);
        user.setStatus(User.Status.ACTIVE);
        user.setAnonymous(true);

        userRepository.save(user);

        // Tạo JWT token cho user ẩn danh
        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role", user.getRole().name().toUpperCase());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put("anonymous", true);
        claims.put("userId", user.getId());

        String token = jwtService.generateToken(
            claims,
            new org.springframework.security.core.userdetails.User(
                "anonymous_" + user.getId(), // Username tạm thời
                "", // Password rỗng
                java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            )
        );

        return new AuthResponse(token, null, user.getRole(), convertToUserDTO(user));
    }

    @Transactional
    public AuthResponse upgradeAnonymousUser(Long userId, UpgradeAnonymousRequest request) {
        // Tìm user ẩn danh
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản ẩn danh"));

        if (!user.isAnonymous()) {
            throw new RuntimeException("Tài khoản này không phải là tài khoản ẩn danh");
        }

        // Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }

        // Cập nhật thông tin user
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setAnonymous(false);
        user.setAvatarUrl("/src/assets/images/User-avatar.png"); // Avatar mặc định cho user upgrade từ anonymous

        userRepository.save(user);

        // Gửi email chào mừng
        sendRegisterSuccessEmail(user.getEmail(), user.getFirstName());

        // Tạo JWT token mới
        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role", user.getRole().name().toUpperCase());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put("anonymous", false);
        claims.put("avatarUrl", user.getAvatarUrl()); // Thêm thông tin avatar
        claims.put("plan", user.getPlan()); // Thêm thông tin plan

        String token = jwtService.generateToken(
            claims,
            new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            )
        );

        return new AuthResponse(token, user.getEmail(), user.getRole(), convertToUserDTO(user));
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Debug: Log user plan để kiểm tra
        // System.out.println("[DEBUG] User from database - Email: " + user.getEmail() + ", Plan: " + user.getPlan());
        // System.out.println("[DEBUG] User entity details:");
        // System.out.println("  - ID: " + user.getId());
        // System.out.println("  - Email: " + user.getEmail());
        // System.out.println("  - FirstName: " + user.getFirstName());
        // System.out.println("  - LastName: " + user.getLastName());
        // System.out.println("  - Phone: " + user.getPhone());
        // System.out.println("  - AvatarUrl: " + user.getAvatarUrl());
        // System.out.println("  - Role: " + user.getRole());
        // System.out.println("  - Status: " + user.getStatus());
        // System.out.println("  - Plan: " + user.getPlan());
        // System.out.println("  - Anonymous: " + user.isAnonymous());
        
        // Sử dụng JWT mới với thông tin user đầy đủ
        String token = jwtService.generateTokenWithUserInfo(user);
        
        // Debug: Log JWT token để kiểm tra
        // System.out.println("[DEBUG] Generated JWT token: " + token);
        
        // Convert User entity thành UserDTO
        UserDTO userDTO = convertToUserDTO(user);
        
        // Debug: Log UserDTO để kiểm tra
        // System.out.println("[DEBUG] UserDTO created:");
        // System.out.println("  - firstName: " + userDTO.getFirstName());
        // System.out.println("  - lastName: " + userDTO.getLastName());
        // System.out.println("  - email: " + userDTO.getEmail());
        // System.out.println("  - phone: " + userDTO.getPhone());
        // System.out.println("  - role: " + userDTO.getRole());
        // System.out.println("  - plan: " + userDTO.getPlan());
        // System.out.println("  - avatarUrl: " + userDTO.getAvatarUrl());
        
        return new AuthResponse(token, user.getEmail(), user.getRole(), userDTO);
    }

    public String forgotPassword(String email) {
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy người dùng với email này");
        }
        User user = userOpt.get();
        String customerName = user.getFirstName() != null ? user.getFirstName() : "Người dùng";
        // Sinh OTP 6 số
        String otp = String.format("%06d", random.nextInt(1000000));
        otpService.saveOtp(email, otp, 5); // Lưu OTP qua OtpService
        // Gửi email
        try {
            sendOtpEmail(email, customerName, otp);
        } catch (Exception e) {
            throw new RuntimeException("Không gửi được email OTP: " + e.getMessage());
        }
        return "OTP đã được gửi về email. Vui lòng kiểm tra hộp thư.";
    }

    private void sendOtpEmail(String to, String customerName, String otp) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject("[MindMeter] Mã OTP đặt lại mật khẩu");
        String html = String.format("""
        <div style='max-width:520px;margin:40px auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);padding:36px 28px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
          <div style='font-size:1.7rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:18px;text-align:center;'>MindMeter</div>
          <div style='font-size:1.15rem;margin-bottom:18px;'><b>Xin chào %s,</b></div>
          <div style='margin-bottom:18px;line-height:1.7;'>
            Chúng tôi nhận được yêu cầu <b>đặt lại mật khẩu</b> cho tài khoản MindMeter của bạn.<br>
            Để hoàn tất quá trình này, vui lòng sử dụng mã xác thực (OTP) bên dưới để xác nhận yêu cầu:
          </div>
          <div style='background:#f1f5f9;border:2px dashed #2563eb;border-radius:10px;padding:28px 0;margin:28px 0;text-align:center;'>
            <span style='font-size:2.7rem;font-weight:700;color:#2563eb;letter-spacing:10px;'>%s</span>
          </div>
          <div style='color:#64748b;font-size:1.01rem;margin-bottom:18px;line-height:1.6;'>
            <ul style='padding-left:18px;margin:0;'>
              <li><b>Mã OTP có hiệu lực trong 5 phút</b> kể từ thời điểm nhận email này.</li>
              <li>Vui lòng <b>không chia sẻ mã OTP</b> cho bất kỳ ai, kể cả nhân viên MindMeter.</li>
              <li>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Tài khoản của bạn sẽ không bị ảnh hưởng.</li>
              <li>Nếu mã OTP hết hạn, bạn có thể gửi lại yêu cầu đặt lại mật khẩu để nhận mã mới.</li>
            </ul>
          </div>
          <div style='margin-bottom:18px;font-size:1.01rem;line-height:1.6;'>
            <b>Lưu ý bảo mật:</b><br>
            - MindMeter <b>không bao giờ</b> yêu cầu bạn cung cấp mật khẩu hoặc mã OTP qua email, điện thoại hay bất kỳ hình thức nào khác.<br>
            - Nếu phát hiện dấu hiệu lừa đảo hoặc nghi ngờ tài khoản bị truy cập trái phép, hãy liên hệ ngay với chúng tôi để được hỗ trợ kịp thời.
          </div>
          <div style='color:#94a3b8;font-size:0.98rem;text-align:center;margin-top:36px;line-height:1.5;'>
            Trân trọng,<br>
            <b>Đội ngũ MindMeter</b><br>
            <span style='font-size:0.95rem;'>Hotline CSKH: <a href='tel:19001234' style='color:#2563eb;text-decoration:none;'>1900 1234</a> &nbsp;|&nbsp; Email: <a href='mailto:support@mindmeter.com' style='color:#2563eb;text-decoration:none;'>support@mindmeter.com</a></span>
          </div>
        </div>
        """, customerName, otp);
        helper.setText(html, true);
        mailSender.send(message);
    }

    private void sendRegisterSuccessEmail(String to, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("[MindMeter] Chào mừng bạn đến với MindMeter - Đăng ký tài khoản thành công");
            String html = String.format("""
                <div style='max-width:520px;margin:40px auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);padding:36px 28px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
                  <div style='font-size:1.7rem;font-weight:700;color:#22c55e;letter-spacing:1px;margin-bottom:18px;text-align:center;'>MindMeter</div>
                  <div style='font-size:1.15rem;margin-bottom:18px;'><b>Xin chào %s,</b></div>
                  <div style='margin-bottom:18px;line-height:1.7;'>
                    Chúc mừng bạn đã đăng ký tài khoản thành công tại <b>MindMeter</b>!<br><br>
                    Tài khoản của bạn đã được tạo thành công với email này. Từ bây giờ, bạn có thể:
                    <ul style='margin: 12px 0 12px 18px; padding: 0;'>
                      <li>Thực hiện bài test đánh giá trầm cảm để kiểm tra tình trạng tâm lý.</li>
                      <li>Xem lịch sử kết quả test và theo dõi tiến trình.</li>
                      <li>Nhận tư vấn từ chuyên gia tâm lý khi cần thiết.</li>
                      <li>Truy cập các tài liệu hướng dẫn về sức khỏe tâm thần.</li>
                    </ul>
                    <b>Hướng dẫn tiếp theo:</b><br>
                    - Đăng nhập vào hệ thống bằng email này.<br>
                    - Thực hiện bài test đầu tiên để đánh giá tình trạng hiện tại.<br>
                    - Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi để được hỗ trợ.<br>
                  </div>
                  <div style='background:#f1f5f9;border-radius:10px;padding:18px 20px;margin:24px 0 18px 0;font-size:1.01rem;color:#2563eb;'>
                    <b>Đội ngũ MindMeter luôn sẵn sàng hỗ trợ bạn 24/7.</b><br>
                    Nếu có bất kỳ thắc mắc hoặc cần trợ giúp, hãy liên hệ với chúng tôi qua:
                    <ul style='margin: 8px 0 8px 18px; padding: 0;'>
                      <li>Hotline CSKH: <a href='tel:0369702376' style='color:#22c55e;text-decoration:none;'>0369 702 376</a></li>
                      <li>Email: <a href='mailto:support@mindmeter.com' style='color:#22c55e;text-decoration:none;'>support@mindmeter.com</a></li>
                    </ul>
                  </div>
                  <div style='color:#94a3b8;font-size:0.98rem;text-align:center;margin-top:36px;line-height:1.5;'>
                    Trân trọng,<br>
                    <b>Đội ngũ MindMeter</b><br>
                  </div>
                </div>
            """, name);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            // Có thể log lỗi gửi mail nhưng không throw để không ảnh hưởng flow đăng ký
        }
    }

    public void sendPasswordChangedEmail(String to, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("[MindMeter] Mật khẩu của bạn đã được thay đổi");
            String html = String.format("""
                <div style='max-width:520px;margin:40px auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);padding:36px 28px;font-family:Segoe UI,Roboto,Arial,sans-serif;'>
                  <div style='font-size:1.7rem;font-weight:700;color:#2563eb;letter-spacing:1px;margin-bottom:18px;text-align:center;'>MindMeter</div>
                  <div style='font-size:1.15rem;margin-bottom:18px;'><b>Xin chào %s,</b></div>
                  <div style='margin-bottom:18px;line-height:1.7;'>
                    Mật khẩu tài khoản MindMeter của bạn vừa được thay đổi thành công.<br>
                    Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với chúng tôi để được hỗ trợ kịp thời.<br>
                    Nếu đây là bạn, bạn có thể bỏ qua email này.
                  </div>
                  <div style='color:#94a3b8;font-size:0.98rem;text-align:center;margin-top:36px;line-height:1.5;'>
                    Trân trọng,<br>
                    <b>Đội ngũ MindMeter</b><br>
                  </div>
                </div>
            """, name);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            // Có thể log lỗi gửi mail nhưng không throw để không ảnh hưởng flow đổi mật khẩu
        }
    }
} 