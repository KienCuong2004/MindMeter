# Báo cáo các bảng trong database chưa được sử dụng

## Tổng quan

- **Tổng số bảng trong database:** 29 bảng
- **Số bảng đã có Entity và Repository:** 26 bảng
- **Số bảng chưa có Entity:** 2 bảng
- **Số bảng có Entity nhưng chưa có Repository:** 1 bảng

---

## 1. Các bảng CHƯA CÓ Entity và Repository (2 bảng)

### 1.1. `appointment_history` - Bảng lịch sử thay đổi lịch hẹn

**Trạng thái:** ❌ Chưa có Entity và Repository

**Mô tả:** Lưu trữ lịch sử các thay đổi của lịch hẹn

**Cấu trúc bảng:**

- `id` - BIGINT PRIMARY KEY
- `appointment_id` - BIGINT (FK → appointments.id)
- `action` - ENUM('CREATED', 'UPDATED', 'CANCELLED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW')
- `old_status` - ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')
- `new_status` - ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')
- `changed_by` - BIGINT (FK → users.id)
- `change_reason` - TEXT
- `changed_at` - TIMESTAMP

**Tác động:**

- Không thể theo dõi lịch sử thay đổi của lịch hẹn
- Không thể audit các thao tác trên lịch hẹn
- Mất khả năng debug khi có vấn đề với lịch hẹn

**Đề xuất:**

- Tạo Entity `AppointmentHistory.java`
- Tạo Repository `AppointmentHistoryRepository.java`
- Tích hợp vào `AppointmentService` để tự động ghi log khi có thay đổi

---

### 1.2. `appointment_notifications` - Bảng thông báo lịch hẹn

**Trạng thái:** ❌ Chưa có Entity và Repository

**Mô tả:** Lưu trữ các thông báo liên quan đến lịch hẹn

**Cấu trúc bảng:**

- `id` - BIGINT PRIMARY KEY
- `appointment_id` - BIGINT (FK → appointments.id)
- `user_id` - BIGINT (FK → users.id)
- `notification_type` - ENUM('REMINDER', 'CONFIRMATION', 'CANCELLATION', 'RESCHEDULE', 'COMPLETION')
- `title` - VARCHAR(255)
- `message` - TEXT
- `is_sent` - BOOLEAN
- `sent_at` - TIMESTAMP
- `is_read` - BOOLEAN
- `read_at` - TIMESTAMP
- `created_at` - TIMESTAMP

**Tác động:**

- Không thể lưu trữ lịch sử thông báo đã gửi
- Không thể tracking trạng thái đã gửi/đã đọc của thông báo
- Khó khăn trong việc quản lý và debug hệ thống thông báo

**Lưu ý:** Hiện tại có `NotificationService` nhưng chỉ gửi thông báo, không lưu vào database.

**Đề xuất:**

- Tạo Entity `AppointmentNotification.java`
- Tạo Repository `AppointmentNotificationRepository.java`
- Tích hợp vào `AppointmentEmailService` để lưu log khi gửi email
- Tạo API endpoint để đọc thông báo và đánh dấu đã đọc

---

## 2. Các bảng CÓ Entity nhưng CHƯA CÓ Repository (1 bảng)

### 2.1. `appointment_settings` - Bảng cài đặt lịch hẹn

**Trạng thái:** ⚠️ Có Entity nhưng chưa có Repository

**Mô tả:** Lưu trữ các cài đặt hệ thống liên quan đến lịch hẹn

**Entity hiện có:** `AppointmentSettings.java` ✅

**Repository:** ❌ Chưa có `AppointmentSettingsRepository.java`

**Cấu trúc bảng:**

- `id` - BIGINT PRIMARY KEY
- `setting_key` - VARCHAR(100) UNIQUE
- `setting_value` - TEXT
- `description` - VARCHAR(255)
- `is_active` - BOOLEAN
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**Tác động:**

- Không thể truy vấn cài đặt từ database
- Phải hardcode các giá trị cài đặt trong code
- Không thể thay đổi cài đặt động mà không cần deploy lại

**Đề xuất:**

- Tạo Repository `AppointmentSettingsRepository.java`
- Tạo Service `AppointmentSettingsService.java` để quản lý cài đặt
- Tạo API endpoint cho admin để quản lý cài đặt
- Sử dụng trong `AutoBookingService` và các service khác để lấy cài đặt động

---

## 3. Tổng kết và Khuyến nghị

### Ưu tiên triển khai:

1. **Cao (High Priority):**

   - `appointment_notifications` - Quan trọng cho việc tracking và quản lý thông báo
   - `appointment_settings` Repository - Cần thiết để quản lý cài đặt động

2. **Trung bình (Medium Priority):**
   - `appointment_history` - Hữu ích cho audit và debug nhưng không ảnh hưởng trực tiếp đến chức năng chính

### Lợi ích khi triển khai:

1. **appointment_notifications:**

   - Có thể xem lịch sử thông báo đã gửi
   - Tracking trạng thái đã đọc của người dùng
   - Tránh gửi duplicate notifications
   - Hỗ trợ tính năng notification center trong UI

2. **appointment_settings Repository:**

   - Quản lý cài đặt động không cần deploy
   - Admin có thể thay đổi cài đặt qua UI
   - Dễ dàng test với các cấu hình khác nhau

3. **appointment_history:**
   - Audit trail đầy đủ cho compliance
   - Debug dễ dàng khi có vấn đề
   - Hiển thị lịch sử thay đổi cho người dùng

---

## 4. Các bảng đã được sử dụng đầy đủ (26 bảng)

✅ **USERS AND AUTHENTICATION:**

- `users`

✅ **DEPRESSION DIAGNOSIS:**

- `depression_questions_vi`
- `depression_questions_en`
- `depression_question_options_vi`
- `depression_question_options_en`
- `depression_test_results`
- `depression_test_answers`

✅ **EXPERT MANAGEMENT:**

- `expert_notes`
- `advice_messages`

✅ **SYSTEM MANAGEMENT:**

- `system_announcements`

✅ **APPOINTMENT MANAGEMENT:**

- `appointments`
- `expert_schedules`
- `expert_breaks`

✅ **BLOG SYSTEM:**

- `blog_posts`
- `blog_categories`
- `blog_post_categories`
- `blog_tags`
- `blog_post_tags`
- `blog_likes`
- `blog_comments`
- `blog_comment_likes`
- `blog_shares`
- `blog_bookmarks`
- `blog_post_images`
- `blog_post_views`
- `blog_reports`

---

**Ngày tạo báo cáo:** $(date)
**Phiên bản:** 1.0
