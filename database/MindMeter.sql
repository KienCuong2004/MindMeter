-- MindMeter Database Schema & Sample Data
-- Created: 2025-06-30
-- Hệ thống chuẩn đoán trầm cảm cho học sinh - sinh viên

-- Drop database if exists and create new one
DROP DATABASE IF EXISTS mindmeter;
CREATE DATABASE mindmeter;
USE mindmeter;

-- ========================================
-- 1. USERS AND AUTHENTICATION TABLES
-- ========================================

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NULL,
    password VARCHAR(255) NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    avatar_url VARCHAR(255),
    role ENUM('STUDENT', 'EXPERT', 'ADMIN') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    plan ENUM('FREE', 'PLUS', 'PRO') NOT NULL DEFAULT 'FREE',
    plan_start_date TIMESTAMP NULL,
    plan_expiry_date TIMESTAMP NULL,
    oauth_provider VARCHAR(50) NULL,
    is_temp_password BOOLEAN NOT NULL DEFAULT FALSE,
    temp_password_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cập nhật các users hiện tại có plan PLUS hoặc PRO để set expiry date
-- Giả sử họ đã mua gói 30 ngày trước
-- Sử dụng bảng tạm thời để tránh lỗi safe update mode
CREATE TEMPORARY TABLE temp_users_to_update AS
SELECT id FROM users 
WHERE plan IN ('PLUS', 'PRO') 
AND plan_start_date IS NULL 
AND plan_expiry_date IS NULL;

UPDATE users 
SET plan_start_date = DATE_SUB(NOW(), INTERVAL 30 DAY),
    plan_expiry_date = NOW()
WHERE id IN (SELECT id FROM temp_users_to_update);

DROP TEMPORARY TABLE temp_users_to_update;

-- Hiển thị kết quả migration
SELECT 
    id,
    email,
    plan,
    plan_start_date,
    plan_expiry_date,
    CASE 
        WHEN plan = 'FREE' THEN 'Không giới hạn'
        WHEN plan_expiry_date IS NULL THEN 'Chưa set'
        WHEN NOW() > plan_expiry_date THEN 'Đã hết hạn'
        ELSE CONCAT(DATEDIFF(plan_expiry_date, NOW()), ' ngày còn lại')
    END as status
FROM users 
ORDER BY plan, id;



-- ========================================
-- 2. DEPRESSION DIAGNOSIS TABLES
-- ========================================

-- ========================================
-- 2a. DEPRESSION QUESTIONS TABLES (VIETNAMESE & ENGLISH)
-- ========================================
CREATE TABLE depression_questions_vi (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_text TEXT NOT NULL,
    weight INT DEFAULT 1,
    category VARCHAR(50) DEFAULT 'DASS-21',
    test_key VARCHAR(50) NOT NULL DEFAULT 'DASS-21',
    `order` INT NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE depression_questions_en (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_text TEXT NOT NULL,
    weight INT DEFAULT 1,
    category VARCHAR(50) DEFAULT 'DASS-21',
    test_key VARCHAR(50) NOT NULL DEFAULT 'DASS-21',
    `order` INT NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE depression_test_results (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    total_score INT NOT NULL,
    diagnosis VARCHAR(100) NOT NULL,
    severity_level ENUM('MINIMAL', 'MILD', 'MODERATE', 'SEVERE') NOT NULL,
    tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recommendation VARCHAR(255),
    test_type VARCHAR(50),
    language ENUM('vi', 'en') NOT NULL DEFAULT 'vi',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE depression_test_answers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    test_result_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    answer_value INT NOT NULL,
    language ENUM('vi', 'en') NOT NULL DEFAULT 'vi',
    question_table ENUM('depression_questions_vi', 'depression_questions_en') NOT NULL DEFAULT 'depression_questions_vi',
    FOREIGN KEY (test_result_id) REFERENCES depression_test_results(id),
    CONSTRAINT chk_language_question_table 
    CHECK (
        (language = 'vi' AND question_table = 'depression_questions_vi') OR
        (language = 'en' AND question_table = 'depression_questions_en')
    )
);

-- ========================================
-- 2b. DEPRESSION QUESTION OPTIONS TABLES (VIETNAMESE & ENGLISH)
-- ========================================
CREATE TABLE depression_question_options_vi (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    option_value INT NOT NULL,
    `order` INT DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES depression_questions_vi(id) ON DELETE CASCADE
);

CREATE TABLE depression_question_options_en (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    option_value INT NOT NULL,
    `order` INT DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES depression_questions_en(id) ON DELETE CASCADE
);

-- ========================================
-- 3. EXPERT MANAGEMENT TABLES
-- ========================================

CREATE TABLE expert_notes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    expert_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    test_result_id BIGINT,
    note TEXT NOT NULL,
    note_type ENUM('ADVICE', 'RECOMMENDATION', 'WARNING', 'GENERAL') DEFAULT 'GENERAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expert_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (test_result_id) REFERENCES depression_test_results(id)
);

CREATE TABLE advice_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('ADVICE', 'APPOINTMENT', 'URGENT', 'GENERAL') DEFAULT 'GENERAL',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- ========================================
-- 4. SYSTEM MANAGEMENT TABLES
-- ========================================

CREATE TABLE system_announcements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type ENUM('INFO', 'WARNING', 'URGENT', 'GUIDE') DEFAULT 'INFO',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- 5. SAMPLE DATA
-- ========================================

-- Users (Người dùng mẫu)
INSERT INTO users (email, password, first_name, last_name, phone, avatar_url, role, status, anonymous, plan, plan_start_date, plan_expiry_date) VALUES
-- Admin (PRO plan - gói vĩnh viễn)
('nguyenthidung21022003@gmail.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Nguyễn Thị', 'Dung', '0396225584', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'ADMIN', 'ACTIVE', false, 'PRO', NULL, NULL),
('trankiencuong30072003@gmail.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Trần Kiên', 'Cường', '0369702376', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'ADMIN', 'ACTIVE', false, 'PRO', NULL, NULL),

-- Experts (Chuyên gia tâm lý) - FREE plan không có thời hạn
('cuongcodehub@gmail.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Trần Kiên', 'Cường', '0369702376', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'EXPERT', 'ACTIVE', false, 'FREE', NULL, NULL),
('expert2@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Trần Văn', 'Hùng', '0987654323', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'EXPERT', 'ACTIVE', false, 'FREE', NULL, NULL),
('expert3@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Lê Thị', 'Thu Hà', '0987654324', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'EXPERT', 'ACTIVE', false, 'FREE', NULL, NULL),

-- Students (Học sinh/Sinh viên)
-- PRO plan - đã mua gói 20 ngày trước, còn 10 ngày
('mindmeter.app@gmail.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'MindMeter', 'App', '0396225584', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'PRO', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY)),

-- FREE plan - không có thời hạn
('student1@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Nguyễn Văn', 'An', '0987654325', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student2@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Hoàng Thị', 'Linh', '0987654326', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student3@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Nguyễn Đức', 'Minh', '0987654327', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student4@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Trần Thị', 'Hương', '0987654328', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student5@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Lê Văn', 'Tuấn', '0987654329', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student6@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Phạm Thị', 'Mai', '0987654330', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student7@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Vũ Hoàng', 'Nam', '0987654331', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student8@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Đỗ Thị', 'Lan', '0987654332', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student9@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Bùi Văn', 'Hải', '0987654333', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student10@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Lý Thị', 'Hoa', '0987654334', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student11@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Hồ Văn', 'Sơn', '0987654335', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student12@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Ngô Thị', 'Thảo', '0987654336', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student13@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Trịnh Văn', 'Dũng', '0987654337', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student14@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Đinh Thị', 'Nga', '0987654338', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student15@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Lưu Văn', 'Phúc', '0987654339', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student16@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Tô Thị', 'Hằng', '0987654340', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student17@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Châu Văn', 'Tài', '0987654341', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL),
('student18@mindmeter.com', '$2a$10$oMvmyp3yQ2Yz3nOHdd/ymOGbWXOgf5Cq.qWUUJ9ahvpW/xaBvpxOW', 'Huỳnh Thị', 'Trang', '0987654342', 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg', 'STUDENT', 'ACTIVE', false, 'FREE', NULL, NULL);

-- ========================================
-- 6. DEPRESSION QUESTIONS & OPTIONS
-- ========================================

-- Depression Questions (Câu hỏi DASS-21 chuẩn)
INSERT INTO depression_questions_vi (question_text, weight, category, test_key, `order`, is_active) VALUES
-- DASS-21 Standard Questions (Vietnamese)
('Tôi thấy khó chịu và bản thân không được thoải mái', 1, 'DASS-21', 'DASS-21', 1, true),
('Tôi bị khô miệng', 1, 'DASS-21', 'DASS-21', 2, true),
('Tôi cảm thấy bản thân không có chút cảm xúc tích cực nào', 1, 'DASS-21', 'DASS-21', 3, true),
('Tôi bị rối loạn nhịp thở (thở gấp, khó thở dù chẳng làm việc gì nặng)', 1, 'DASS-21', 'DASS-21', 4, true),
('Tôi thấy bản thân khó bắt tay vào bất cứ việc công việc gì', 1, 'DASS-21', 'DASS-21', 5, true),
('Tôi đã phản ứng thái quá khi có những sự việc xảy ra', 1, 'DASS-21', 'DASS-21', 6, true),
('Tôi bị toát mồ hôi (chẳng hạn như mồ hôi tay...)', 1, 'DASS-21', 'DASS-21', 7, true),
('Tôi cảm thấy bản thân mình đang suy nghĩ quá nhiều', 1, 'DASS-21', 'DASS-21', 8, true),
('Tôi lo lắng và suy nghĩ về những tình huống có thể khiến tôi hoảng sợ hoặc biến tôi thành trò cười', 1, 'DASS-21', 'DASS-21', 9, true),
('Tôi thấy bản thân vô dụng và chẳng có gì để mong đợi cả', 1, 'DASS-21', 'DASS-21', 10, true),
('Tôi thấy bản thân dễ bị kích động', 1, 'DASS-21', 'DASS-21', 11, true),
('Tôi thấy bản thân khó thư giãn được', 1, 'DASS-21', 'DASS-21', 12, true),
('Tôi cảm thấy chán nản, thất vọng và tuyệt vọng', 1, 'DASS-21', 'DASS-21', 13, true),
('Tôi không chấp nhận được việc có cái gì đó xen vào cản trở việc tôi đang làm', 1, 'DASS-21', 'DASS-21', 14, true),
('Tôi cảm thấy tinh thần gần như hoảng loạn', 1, 'DASS-21', 'DASS-21', 15, true),
('Tôi không thấy hăng hái với bất kỳ việc gì nữa', 1, 'DASS-21', 'DASS-21', 16, true),
('Tôi cảm thấy mình chẳng đáng làm người', 1, 'DASS-21', 'DASS-21', 17, true),
('Tôi thấy mình khá dễ phật ý, tự ái', 1, 'DASS-21', 'DASS-21', 18, true),
('Tôi nghe thấy rõ tiếng nhịp tim dù chẳng làm việc gì cả (ví dụ, tiếng nhịp tim tăng, tiếng tim loạn nhịp)', 1, 'DASS-21', 'DASS-21', 19, true),
('Tôi hay suy nghĩ và lo sợ vô cớ', 1, 'DASS-21', 'DASS-21', 20, true),
('Tôi thấy cuộc sống thật vô nghĩa', 1, 'DASS-21', 'DASS-21', 21, true);

-- DASS-21 Standard Questions (English)
INSERT INTO depression_questions_en (question_text, weight, category, test_key, `order`, is_active) VALUES
('I found it hard to wind down', 1, 'DASS-21', 'DASS-21-EN', 1, true),
('I was aware of dryness of my mouth', 1, 'DASS-21', 'DASS-21-EN', 2, true),
('I couldn\'t seem to experience any positive feeling at all', 1, 'DASS-21', 'DASS-21-EN', 3, true),
('I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in the absence of physical exertion)', 1, 'DASS-21', 'DASS-21-EN', 4, true),
('I just couldn\'t seem to get going', 1, 'DASS-21', 'DASS-21-EN', 5, true),
('I tended to over-react to situations', 1, 'DASS-21', 'DASS-21-EN', 6, true),
('I experienced trembling (e.g., in the hands)', 1, 'DASS-21', 'DASS-21-EN', 7, true),
('I felt that I was using a lot of nervous energy', 1, 'DASS-21', 'DASS-21-EN', 8, true),
('I was worried about situations in which I might make a fool of myself', 1, 'DASS-21', 'DASS-21-EN', 9, true),
('I felt that I had nothing to look forward to', 1, 'DASS-21', 'DASS-21-EN', 10, true),
('I found myself getting agitated', 1, 'DASS-21', 'DASS-21-EN', 11, true),
('I found it difficult to relax', 1, 'DASS-21', 'DASS-21-EN', 12, true),
('I felt down-hearted and blue', 1, 'DASS-21', 'DASS-21-EN', 13, true),
('I was intolerant of anything that kept me from getting on with what I was doing', 1, 'DASS-21', 'DASS-21-EN', 14, true),
('I felt I was close to panic', 1, 'DASS-21', 'DASS-21-EN', 15, true),
('I was unable to become enthusiastic about anything', 1, 'DASS-21', 'DASS-21-EN', 16, true),
('I felt I wasn\'t worth much as a person', 1, 'DASS-21', 'DASS-21-EN', 17, true),
('I felt that I was rather touchy', 1, 'DASS-21', 'DASS-21-EN', 18, true),
('I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase, heart missing a beat)', 1, 'DASS-21', 'DASS-21-EN', 19, true),
('I felt scared without any good reason', 1, 'DASS-21', 'DASS-21-EN', 20, true),
('I felt that life was meaningless', 1, 'DASS-21', 'DASS-21-EN', 21, true);

-- DASS-42 Standard Questions (Vietnamese)
INSERT INTO depression_questions_vi (question_text, weight, category, test_key, `order`, is_active) VALUES
('Tôi thấy mình hay bối rối trước những việc chẳng đâu vào đâu', 1, 'DASS-42', 'DASS-42', 1, true),
('Tôi bị khô miệng', 1, 'DASS-42', 'DASS-42', 2, true),
('Tôi dường như chẳng có chút cảm xúc tích cực nào', 1, 'DASS-42', 'DASS-42', 3, true),
('Tôi bị rối loạn nhịp thở (thở gấp, khó thở dù chẳng làm việc gì nặng)', 1, 'DASS-42', 'DASS-42', 4, true),
('Tôi dường như không thể làm việc như trước được', 1, 'DASS-42', 'DASS-42', 5, true),
('Tôi có xu hướng phản ứng thái quá với mọi tình huống', 1, 'DASS-42', 'DASS-42', 6, true),
('Tôi có cảm giác bị run (tay, chân…)', 1, 'DASS-42', 'DASS-42', 7, true),
('Tôi thấy khó thư giãn được', 1, 'DASS-42', 'DASS-42', 8, true),
('Tôi rơi vào sự việc khiến tôi rất lo lắng và hoảng sợ (tôi chỉ dịu lại khi sự việc đó đã qua đi)', 1, 'DASS-42', 'DASS-42', 9, true),
('Tôi thấy mình vô dụng và chẳng có gì để mong đợi cả', 1, 'DASS-42', 'DASS-42', 10, true),
('Tôi thấy mình vô dụng và chẳng có gì để mong đợi cả', 1, 'DASS-42', 'DASS-42', 11, true),
('Tôi thấy mình đang suy nghĩ quá nhiều', 1, 'DASS-42', 'DASS-42', 12, true),
('Tôi cảm thấy buồn chán, trì trệ', 1, 'DASS-42', 'DASS-42', 13, true),
('Tôi thấy bản thân không thể kiên nhẫn được khi phải chờ đợi', 1, 'DASS-42', 'DASS-42', 14, true),
('Tôi thấy mình mệt mỏi và muốn ngất xỉu', 1, 'DASS-42', 'DASS-42', 15, true),
('Tôi mất hứng thú với mọi việc', 1, 'DASS-42', 'DASS-42', 16, true),
('Tôi cảm thấy mình chẳng đáng làm người', 1, 'DASS-42', 'DASS-42', 17, true),
('Tôi khá dễ phật ý, tự ái', 1, 'DASS-42', 'DASS-42', 18, true),
('Tôi bị đổ mồ hôi dù chẳng vì làm việc nặng hay do trời nóng', 1, 'DASS-42', 'DASS-42', 19, true),
('Tôi hay lo sợ vô cớ', 1, 'DASS-42', 'DASS-42', 20, true),
('Tôi thấy cuộc sống vô nghĩa và chẳng có gì đáng giá cả', 1, 'DASS-42', 'DASS-42', 21, true),
('Tôi thấy bản thân khó chịu và không được thoải mái', 1, 'DASS-42', 'DASS-42', 22, true),
('Tôi thấy khó nuốt', 1, 'DASS-42', 'DASS-42', 23, true),
('Tôi chẳng thấy thích thú gì với những việc mình đã làm', 1, 'DASS-42', 'DASS-42', 24, true),
('Tôi cảm thấy tim đập nhanh (hoặc đập loạn nhịp) dù không hoạt động gắng sức', 1, 'DASS-42', 'DASS-42', 25, true),
('Tôi cảm thấy chán nản và thất vọng', 1, 'DASS-42', 'DASS-42', 26, true),
('Tôi dễ cáu kỉnh và bực bội', 1, 'DASS-42', 'DASS-42', 27, true),
('Tôi thấy bản thân gần như hoảng loạn', 1, 'DASS-42', 'DASS-42', 28, true),
('Sau khi bị bối rối tôi thấy khó mà trấn tĩnh lại được', 1, 'DASS-42', 'DASS-42', 29, true),
('Tôi sợ phải làm những việc tuy bình thường nhưng trước đây tôi chưa làm bao giờ', 1, 'DASS-42', 'DASS-42', 30, true),
('Tôi không thấy hào hứng với bất kỳ việc gì nữa', 1, 'DASS-42', 'DASS-42', 31, true),
('Tôi thấy khó chấp nhận việc đang làm nhưng bị gián đoạn', 1, 'DASS-42', 'DASS-42', 32, true),
('Tôi sống trong tình trạng lo lắng và căng thẳng', 1, 'DASS-42', 'DASS-42', 33, true),
('Tôi thấy bản thân vô dụng và vô tích sự', 1, 'DASS-42', 'DASS-42', 34, true),
('Tôi không chấp nhận được việc có cái gì đó xen vào cản trở việc tôi đang làm', 1, 'DASS-42', 'DASS-42', 35, true),
('Tôi cảm thấy khiếp sợ', 1, 'DASS-42', 'DASS-42', 36, true),
('Tôi chẳng thấy có hy vọng gì ở tương lai cả', 1, 'DASS-42', 'DASS-42', 37, true),
('Tôi thấy cuộc sống buồn tẻ và vô nghĩa', 1, 'DASS-42', 'DASS-42', 38, true),
('Tôi dễ bị khích động', 1, 'DASS-42', 'DASS-42', 39, true),
('Tôi lo lắng về những tình huống có thể làm cho tôi hoảng sợ (hoặc biến tôi thành trò cười)', 1, 'DASS-42', 'DASS-42', 40, true),
('Tôi bị run (run tay, run chân,v.v)', 1, 'DASS-42', 'DASS-42', 41, true),
('Tôi không hào hứng làm bất cứ việc gì', 1, 'DASS-42', 'DASS-42', 42, true);

-- DASS-42 Standard Questions (English)
INSERT INTO depression_questions_en (question_text, weight, category, test_key, `order`, is_active) VALUES
('I found myself getting upset by quite trivial things', 1, 'DASS-42', 'DASS-42-EN', 1, true),
('I was aware of dryness of my mouth', 1, 'DASS-42', 'DASS-42-EN', 2, true),
('I couldn\'t seem to experience any positive feeling at all', 1, 'DASS-42', 'DASS-42-EN', 3, true),
('I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in the absence of physical exertion)', 1, 'DASS-42', 'DASS-42-EN', 4, true),
('I just couldn\'t seem to get going', 1, 'DASS-42', 'DASS-42-EN', 5, true),
('I tended to over-react to situations', 1, 'DASS-42', 'DASS-42-EN', 6, true),
('I experienced trembling (e.g., in the hands)', 1, 'DASS-42', 'DASS-42-EN', 7, true),
('I found it difficult to relax', 1, 'DASS-42', 'DASS-42-EN', 8, true),
('I found myself in situations that made me so anxious I was relieved when they ended', 1, 'DASS-42', 'DASS-42-EN', 9, true),
('I felt that I had nothing to look forward to', 1, 'DASS-42', 'DASS-42-EN', 10, true),
('I found myself getting upset rather easily', 1, 'DASS-42', 'DASS-42-EN', 11, true),
('I felt that I was using a lot of nervous energy', 1, 'DASS-42', 'DASS-42-EN', 12, true),
('I felt sad and depressed', 1, 'DASS-42', 'DASS-42-EN', 13, true),
('I found myself getting impatient when I was delayed in any way (e.g., elevators, traffic lights, being kept waiting)', 1, 'DASS-42', 'DASS-42-EN', 14, true),
('I had a feeling of faintness', 1, 'DASS-42', 'DASS-42-EN', 15, true),
('I had lost interest in just about everything', 1, 'DASS-42', 'DASS-42-EN', 16, true),
('I felt I wasn\'t worth much as a person', 1, 'DASS-42', 'DASS-42-EN', 17, true),
('I felt that I was rather touchy', 1, 'DASS-42', 'DASS-42-EN', 18, true),
('I perspired noticeably (e.g., hands sweaty) in the absence of high temperatures or physical exertion', 1, 'DASS-42', 'DASS-42-EN', 19, true),
('I felt scared without any good reason', 1, 'DASS-42', 'DASS-42-EN', 20, true),
('I felt that life was meaningless', 1, 'DASS-42', 'DASS-42-EN', 21, true),
('I found myself getting upset by quite trivial things', 1, 'DASS-42', 'DASS-42-EN', 22, true),
('I had difficulty swallowing', 1, 'DASS-42', 'DASS-42-EN', 23, true),
('I just couldn\'t seem to get any enjoyment out of the things I did', 1, 'DASS-42', 'DASS-42-EN', 24, true),
('I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase, heart missing a beat)', 1, 'DASS-42', 'DASS-42-EN', 25, true),
('I felt down-hearted and blue', 1, 'DASS-42', 'DASS-42-EN', 26, true),
('I found that I was very irritable', 1, 'DASS-42', 'DASS-42-EN', 27, true),
('I felt I was close to panic', 1, 'DASS-42', 'DASS-42-EN', 28, true),
('I found it hard to calm down after something upset me', 1, 'DASS-42', 'DASS-42-EN', 29, true),
('I feared that I would be "thrown" by some trivial but unfamiliar situation', 1, 'DASS-42', 'DASS-42-EN', 30, true),
('I was unable to become enthusiastic about anything', 1, 'DASS-42', 'DASS-42-EN', 31, true),
('I found it difficult to tolerate interruptions to what I was doing', 1, 'DASS-42', 'DASS-42-EN', 32, true),
('I was in a state of nervous tension', 1, 'DASS-42', 'DASS-42-EN', 33, true),
('I felt I was pretty worthless', 1, 'DASS-42', 'DASS-42-EN', 34, true),
('I was intolerant of anything that kept me from getting on with what I was doing', 1, 'DASS-42', 'DASS-42-EN', 35, true),
('I felt terrified', 1, 'DASS-42', 'DASS-42-EN', 36, true),
('I could see nothing in the future to be hopeful about', 1, 'DASS-42', 'DASS-42-EN', 37, true),
('I felt that life was meaningless', 1, 'DASS-42', 'DASS-42-EN', 38, true),
('I found myself getting agitated', 1, 'DASS-42', 'DASS-42-EN', 39, true),
('I was worried about situations in which I might make a fool of myself', 1, 'DASS-42', 'DASS-42-EN', 40, true),
('I experienced trembling (e.g., in the hands)', 1, 'DASS-42', 'DASS-42-EN', 41, true),
('I was unable to become enthusiastic about anything', 1, 'DASS-42', 'DASS-42-EN', 42, true);

-- BDI Standard Questions (Vietnamese)
INSERT INTO depression_questions_vi (question_text, weight, category, test_key, `order`, is_active) VALUES
('Bạn cảm thấy tinh thần như thế nào? Có hay buồn hay không?', 1, 'BDI', 'BDI', 1, true),
('Bạn có nhận định gì đối với tương lai của bản thân?', 1, 'BDI', 'BDI', 2, true),
('Bạn đánh giá bản thân mình là một người như thế nào?', 1, 'BDI', 'BDI', 3, true),
('Bạn có hài lòng đối với những quyết định của bản thân không?', 1, 'BDI', 'BDI', 4, true),
('Bạn có thấy những việc tồi tệ xảy ra có liên quan đến bạn không?', 1, 'BDI', 'BDI', 5, true),
('Bạn có lo lắng sẽ bị trừng phạt không?', 1, 'BDI', 'BDI', 6, true),
('Bạn có hài lòng về bản thân mình không?', 1, 'BDI', 'BDI', 7, true),
('Bạn có thường xuyên đổ lỗi cho người khác không?', 1, 'BDI', 'BDI', 8, true),
('Bạn có street đến mức muốn tự sát không?', 1, 'BDI', 'BDI', 9, true),
('Bạn có thường xuyên khóc không?', 1, 'BDI', 'BDI', 10, true),
('Bạn có phải là người dễ nổi nóng không?', 1, 'BDI', 'BDI', 11, true),
('Bạn có quan tâm đến mọi người xung quanh không?', 1, 'BDI', 'BDI', 12, true),
('Bạn có gặp khó khăn trong việc đưa ra quyết định không?', 1, 'BDI', 'BDI', 13, true),
('Bạn có phải là một người có ích không?', 1, 'BDI', 'BDI', 14, true),
('Bạn có cảm thấy sức khoẻ của mình suy giảm không?', 1, 'BDI', 'BDI', 15, true),
('Bạn có thấy ngủ ngon không?', 1, 'BDI', 'BDI', 16, true),
('Bạn có phải là người dễ nóng giận?', 1, 'BDI', 'BDI', 17, true),
('Bạn có còn cảm giác ăn ngon miệng như trước không?', 1, 'BDI', 'BDI', 18, true),
('Cân nặng của bạn có thay đổi không?', 1, 'BDI', 'BDI', 19, true),
('Bạn có thường xuyên cảm thấy mệt mỏi không?', 1, 'BDI', 'BDI', 20, true),
('Bạn có bị suy giảm ham muốn tình dục không?', 1, 'BDI', 'BDI', 21, true);

-- BDI Standard Questions (English)
INSERT INTO depression_questions_en (question_text, weight, category, test_key, `order`, is_active) VALUES
('How do you feel about your mood? Do you feel sad?', 1, 'BDI', 'BDI-EN', 1, true),
('What do you think about your future?', 1, 'BDI', 'BDI-EN', 2, true),
('How would you evaluate yourself as a person?', 1, 'BDI', 'BDI-EN', 3, true),
('Are you satisfied with your decisions?', 1, 'BDI', 'BDI-EN', 4, true),
('Do you think bad things happen because of you?', 1, 'BDI', 'BDI-EN', 5, true),
('Are you worried about being punished?', 1, 'BDI', 'BDI-EN', 6, true),
('Are you satisfied with yourself?', 1, 'BDI', 'BDI-EN', 7, true),
('Do you often blame others?', 1, 'BDI', 'BDI-EN', 8, true),
('Do you feel stressed to the point of wanting to commit suicide?', 1, 'BDI', 'BDI-EN', 9, true),
('Do you cry often?', 1, 'BDI', 'BDI-EN', 10, true),
('Are you easily angered?', 1, 'BDI', 'BDI-EN', 11, true),
('Do you care about people around you?', 1, 'BDI', 'BDI-EN', 12, true),
('Do you have difficulty making decisions?', 1, 'BDI', 'BDI-EN', 13, true),
('Do you feel useful?', 1, 'BDI', 'BDI-EN', 14, true),
('Do you feel your health is declining?', 1, 'BDI', 'BDI-EN', 15, true),
('Do you sleep well?', 1, 'BDI', 'BDI-EN', 16, true),
('Are you easily angered?', 1, 'BDI', 'BDI-EN', 17, true),
('Do you still enjoy eating as before?', 1, 'BDI', 'BDI-EN', 18, true),
('Has your weight changed?', 1, 'BDI', 'BDI-EN', 19, true),
('Do you often feel tired?', 1, 'BDI', 'BDI-EN', 20, true),
('Has your sexual desire decreased?', 1, 'BDI', 'BDI-EN', 21, true);

-- RADS Standard Questions (Vietnamese)
INSERT INTO depression_questions_vi (question_text, weight, category, test_key, `order`, is_active) VALUES
('Tôi cảm thấy hạnh phúc', 1, 'RADS', 'RADS', 1, true),
('Tôi thấy lo lắng về chuyện học', 1, 'RADS', 'RADS', 2, true),
('Tôi cảm thấy cô đơn', 1, 'RADS', 'RADS', 3, true),
('Tôi cảm thấy cha mẹ không thích tôi', 1, 'RADS', 'RADS', 4, true),
('Tôi thấy mình là người không quan trọng', 1, 'RADS', 'RADS', 5, true),
('Tôi muốn xa lánh, trốn tránh mọi người', 1, 'RADS', 'RADS', 6, true),
('Tôi cảm thấy buồn chán', 1, 'RADS', 'RADS', 7, true),
('Tôi muốn khóc', 1, 'RADS', 'RADS', 8, true),
('Tôi có cảm giác chẳng có ai quan tâm đến tôi', 1, 'RADS', 'RADS', 9, true),
('Tôi không thích cười đùa với mọi người', 1, 'RADS', 'RADS', 10, true),
('Tôi có cảm giác cơ thể rệu rã, thiếu sinh lực', 1, 'RADS', 'RADS', 11, true),
('Tôi có cảm giác mình không được được mọi người yêu quý', 1, 'RADS', 'RADS', 12, true),
('Tôi cảm thấy mình giống như kẻ bỏ chạy', 1, 'RADS', 'RADS', 13, true),
('Tôi cảm thấy mình đang tự làm khổ mình', 1, 'RADS', 'RADS', 14, true),
('Tôi cảm thấy những người khác không thích tôi', 1, 'RADS', 'RADS', 15, true),
('Tôi cảm thấy bực bội', 1, 'RADS', 'RADS', 16, true),
('Tôi cảm thấy cuộc sống bất công với tôi', 1, 'RADS', 'RADS', 17, true),
('Tôi cảm thấy mệt mỏi', 1, 'RADS', 'RADS', 18, true),
('Tôi cảm thấy mình là một kẻ tồi tệ', 1, 'RADS', 'RADS', 19, true),
('Tôi cảm thấy mình là một kẻ vô tích sự', 1, 'RADS', 'RADS', 20, true),
('Tôi thấy mình là một kẻ đáng thương', 1, 'RADS', 'RADS', 21, true),
('Tôi thấy phát điên lên về mọi thứ', 1, 'RADS', 'RADS', 22, true),
('Tôi không thích trò chuyện với mọi người', 1, 'RADS', 'RADS', 23, true),
('Tôi trằn trọc khó ngủ (hoặc Tôi thấy mình ngủ nhiều)', 1, 'RADS', 'RADS', 24, true),
('Tôi không thích vui đùa với bất kỳ ai', 1, 'RADS', 'RADS', 25, true),
('Tôi cảm thấy lo lắng', 1, 'RADS', 'RADS', 26, true),
('Tôi có cảm giác như bị đau dạ dày', 1, 'RADS', 'RADS', 27, true),
('Tôi cảm thấy cuộc sống tẻ nhạt, vô vị', 1, 'RADS', 'RADS', 28, true),
('Tôi không cảm thấy ăn thấy ngon miệng', 1, 'RADS', 'RADS', 29, true),
('Tôi thất vọng, không muốn làm gì cả', 1, 'RADS', 'RADS', 30, true);

-- RADS Standard Questions (English)
INSERT INTO depression_questions_en (question_text, weight, category, test_key, `order`, is_active) VALUES
('I feel happy', 1, 'RADS', 'RADS-EN', 1, true),
('I worry about school', 1, 'RADS', 'RADS-EN', 2, true),
('I feel lonely', 1, 'RADS', 'RADS-EN', 3, true),
('I feel my parents don\'t like me', 1, 'RADS', 'RADS-EN', 4, true),
('I feel I am not important', 1, 'RADS', 'RADS-EN', 5, true),
('I want to avoid and hide from people', 1, 'RADS', 'RADS-EN', 6, true),
('I feel sad', 1, 'RADS', 'RADS-EN', 7, true),
('I want to cry', 1, 'RADS', 'RADS-EN', 8, true),
('I feel like no one cares about me', 1, 'RADS', 'RADS-EN', 9, true),
('I don\'t like to joke around with people', 1, 'RADS', 'RADS-EN', 10, true),
('I feel my body is weak and lacks energy', 1, 'RADS', 'RADS-EN', 11, true),
('I feel like I am not loved by anyone', 1, 'RADS', 'RADS-EN', 12, true),
('I feel like I am a runaway', 1, 'RADS', 'RADS-EN', 13, true),
('I feel like I am hurting myself', 1, 'RADS', 'RADS-EN', 14, true),
('I feel like others don\'t like me', 1, 'RADS', 'RADS-EN', 15, true),
('I feel irritated', 1, 'RADS', 'RADS-EN', 16, true),
('I feel life is unfair to me', 1, 'RADS', 'RADS-EN', 17, true),
('I feel tired', 1, 'RADS', 'RADS-EN', 18, true),
('I feel like I am a bad person', 1, 'RADS', 'RADS-EN', 19, true),
('I feel like I am useless', 1, 'RADS', 'RADS-EN', 20, true),
('I feel like I am pitiful', 1, 'RADS', 'RADS-EN', 21, true),
('I feel like going crazy about everything', 1, 'RADS', 'RADS-EN', 22, true),
('I don\'t like to talk to people', 1, 'RADS', 'RADS-EN', 23, true),
('I toss and turn and can\'t sleep (or I feel I sleep too much)', 1, 'RADS', 'RADS-EN', 24, true),
('I don\'t like to play with anyone', 1, 'RADS', 'RADS-EN', 25, true),
('I feel worried', 1, 'RADS', 'RADS-EN', 26, true),
('I feel like I have a stomachache', 1, 'RADS', 'RADS-EN', 27, true),
('I feel life is boring and meaningless', 1, 'RADS', 'RADS-EN', 28, true),
('I don\'t feel like eating is enjoyable', 1, 'RADS', 'RADS-EN', 29, true),
('I feel disappointed and don\'t want to do anything', 1, 'RADS', 'RADS-EN', 30, true);

-- Sample answer options for EPDS questions
INSERT INTO depression_questions_vi (question_text, weight, category, test_key, `order`, is_active) VALUES
('Tôi không thể vui vẻ và xem xét các sự kiện dưới khía cạnh hài hước', 1, 'EPDS', 'EPDS', 1, true),
('Tôi không tìm được niềm vui từ những sự việc xảy ra', 1, 'EPDS', 'EPDS', 2, true),
('Tôi đã tự khiển trách (đổ lỗi) mình một cách không cần thiết khi có chuyện sai', 1, 'EPDS', 'EPDS', 3, true),
('Tôi cảm thấy lo âu hoặc lo lắng không lý do', 1, 'EPDS', 'EPDS', 4, true),
('Tôi đã cảm thấy lo sợ hoặc hoảng loạn không rõ lý do', 1, 'EPDS', 'EPDS', 5, true),
('Mọi việc trở nên cực kỳ khó khăn đối với tôi', 1, 'EPDS', 'EPDS', 6, true),
('Tôi đã từng cảm thấy không vui tới mức khó ngủ', 1, 'EPDS', 'EPDS', 7, true),
('Tôi cảm thấy bản thân luôn buồn và bất hạnh', 1, 'EPDS', 'EPDS', 8, true),
('Tôi đã từng cảm thấy buồn, không vui tới mức phát khóc', 1, 'EPDS', 'EPDS', 9, true),
('Những ý nghĩ tự gây tổn thương cho mình đã từng xuất hiện trong đầu tôi', 1, 'EPDS', 'EPDS', 10, true);

-- EPDS Standard Questions (English)
INSERT INTO depression_questions_en (question_text, weight, category, test_key, `order`, is_active) VALUES
('I have been able to laugh and see the funny side of things', 1, 'EPDS', 'EPDS-EN', 1, true),
('I have looked forward with enjoyment to things', 1, 'EPDS', 'EPDS-EN', 2, true),
('I have blamed myself unnecessarily when things went wrong', 1, 'EPDS', 'EPDS-EN', 3, true),
('I have been anxious or worried for no good reason', 1, 'EPDS', 'EPDS-EN', 4, true),
('I have felt scared or panicky for no very good reason', 1, 'EPDS', 'EPDS-EN', 5, true),
('Things have been getting on top of me', 1, 'EPDS', 'EPDS-EN', 6, true),
('I have been so unhappy that I have had difficulty sleeping', 1, 'EPDS', 'EPDS-EN', 7, true),
('I have felt sad or miserable', 1, 'EPDS', 'EPDS-EN', 8, true),
('I have been so unhappy that I have been crying', 1, 'EPDS', 'EPDS-EN', 9, true),
('The thought of harming myself has occurred to me', 1, 'EPDS', 'EPDS-EN', 10, true);

-- SAS Standard Questions (English)
INSERT INTO depression_questions_en (question_text, weight, category, test_key, `order`, is_active) VALUES
('I feel more nervous and anxious than usual', 1, 'SAS', 'SAS-EN', 1, true),
('I feel afraid for no reason at all', 1, 'SAS', 'SAS-EN', 2, true),
('I get upset easily or feel panicky', 1, 'SAS', 'SAS-EN', 3, true),
('I feel like I\'m falling apart and going to pieces', 1, 'SAS', 'SAS-EN', 4, true),
('I feel that something bad is going to happen to me', 1, 'SAS', 'SAS-EN', 5, true),
('My hands and feet shake and tremble', 1, 'SAS', 'SAS-EN', 6, true),
('I am bothered by headaches, neck and back pain', 1, 'SAS', 'SAS-EN', 7, true),
('I feel weak and get tired easily', 1, 'SAS', 'SAS-EN', 8, true),
('I feel calm and can sit still easily', 1, 'SAS', 'SAS-EN', 9, true),
('I can feel my heart beating fast', 1, 'SAS', 'SAS-EN', 10, true),
('I am bothered by dizzy spells', 1, 'SAS', 'SAS-EN', 11, true),
('I have fainting spells or feel like it', 1, 'SAS', 'SAS-EN', 12, true),
('I can breathe in and out easily', 1, 'SAS', 'SAS-EN', 13, true),
('I get numbness or tingling in my fingers and toes', 1, 'SAS', 'SAS-EN', 14, true),
('I am bothered by stomach aches or indigestion', 1, 'SAS', 'SAS-EN', 15, true),
('I have to empty my bladder often', 1, 'SAS', 'SAS-EN', 16, true),
('My hands are usually dry and warm', 1, 'SAS', 'SAS-EN', 17, true),
('My face gets hot and blushes', 1, 'SAS', 'SAS-EN', 18, true),
('I fall asleep easily and get a good night\'s rest', 1, 'SAS', 'SAS-EN', 19, true),
('I have nightmares', 1, 'SAS', 'SAS-EN', 20, true);

-- SAS Standard Questions (Vietnamese)
INSERT INTO depression_questions_vi (question_text, weight, category, test_key, `order`, is_active) VALUES
('Tôi cảm thấy bản thân nóng nảy và lo âu hơn thường lệ', 1, 'SAS', 'SAS', 1, true),
('Tôi cảm thấy lo sợ một cách vô cớ', 1, 'SAS', 'SAS', 2, true),
('Tôi dễ bối rối và cảm thấy hoảng sợ', 1, 'SAS', 'SAS', 3, true),
('Tôi cảm thấy bản thân như bị ngã và vỡ ra từng mảnh', 1, 'SAS', 'SAS', 4, true),
('Tôi cảm thấy mọi điều xấu sẽ xảy ra đối với tôi', 1, 'SAS', 'SAS', 5, true),
('Tay và chân tôi lắc lư, run lên', 1, 'SAS', 'SAS', 6, true),
('Tôi đang khó chịu vì đau đầu, đau cổ, đau lưng', 1, 'SAS', 'SAS', 7, true),
('Tôi cảm thấy sức lực bản thân rất yếu và dễ mệt mỏi', 1, 'SAS', 'SAS', 8, true),
('Tôi cảm thấy bản thân mất bình tĩnh và không thể ngồi yên một chỗ', 1, 'SAS', 'SAS', 9, true),
('Tôi thường xuyên cảm thấy tim mình đập nhanh dù không vận động mạnh', 1, 'SAS', 'SAS', 10, true),
('Tôi đang khó chịu vì cơn hoa mắt chóng mặt', 1, 'SAS', 'SAS', 11, true),
('Tôi bị ngất và có nhiều lúc cảm thấy gần như thế', 1, 'SAS', 'SAS', 12, true),
('Tôi hít thở khó khăn và không dễ dàng', 1, 'SAS', 'SAS', 13, true),
('Tôi cảm thấy tê buốt, như có kiến bò ở đầu ngón tay, ngón chân', 1, 'SAS', 'SAS', 14, true),
('Tôi đang khó chịu vì đau dạ dày và đầy bụng', 1, 'SAS', 'SAS', 15, true),
('Tôi luôn luôn cần phải đi tiểu', 1, 'SAS', 'SAS', 16, true),
('Bàn tay tôi thường khô và ấm', 1, 'SAS', 'SAS', 17, true),
('Mặt tôi thường nóng và đỏ', 1, 'SAS', 'SAS', 18, true),
('Tôi mất ngủ và khó có một giấc ngủ sâu', 1, 'SAS', 'SAS', 19, true),
('Tôi thường mơ thấy những ác mộng', 1, 'SAS', 'SAS', 20, true);

-- SAS Standard Questions (English)
INSERT INTO depression_questions_en (question_text, weight, category, test_key, `order`, is_active) VALUES
('I feel more nervous and anxious than usual', 1, 'SAS', 'SAS-EN', 1, true),
('I feel afraid for no reason at all', 1, 'SAS', 'SAS-EN', 2, true),
('I get upset easily or feel panicky', 1, 'SAS', 'SAS-EN', 3, true),
('I feel like I\'m falling apart and going to pieces', 1, 'SAS', 'SAS-EN', 4, true),
('I feel that something bad is going to happen to me', 1, 'SAS', 'SAS-EN', 5, true),
('My hands and feet shake and tremble', 1, 'SAS', 'SAS-EN', 6, true),
('I am bothered by headaches, neck and back pain', 1, 'SAS', 'SAS-EN', 7, true),
('I feel weak and get tired easily', 1, 'SAS', 'SAS-EN', 8, true),
('I feel calm and can sit still easily', 1, 'SAS', 'SAS-EN', 9, true),
('I can feel my heart beating fast', 1, 'SAS', 'SAS-EN', 10, true),
('I am bothered by dizzy spells', 1, 'SAS', 'SAS-EN', 11, true),
('I have fainting spells or feel like it', 1, 'SAS', 'SAS-EN', 12, true),
('I can breathe in and out easily', 1, 'SAS', 'SAS-EN', 13, true),
('I get numbness or tingling in my fingers and toes', 1, 'SAS', 'SAS-EN', 14, true),
('I am bothered by stomach aches or indigestion', 1, 'SAS', 'SAS-EN', 15, true),
('I have to empty my bladder often', 1, 'SAS', 'SAS-EN', 16, true),
('My hands are usually dry and warm', 1, 'SAS', 'SAS-EN', 17, true),
('My face gets hot and blushes', 1, 'SAS', 'SAS-EN', 18, true),
('I fall asleep easily and get a good night\'s rest', 1, 'SAS', 'SAS-EN', 19, true),
('I have nightmares', 1, 'SAS', 'SAS-EN', 20, true);

-- Sample answer options for DASS-21 questions (Vietnamese)
INSERT INTO depression_question_options_vi (question_id, option_text, option_value, `order`) VALUES
-- Câu hỏi 1 (DASS-21)
(1, 'Không đúng với tôi chút nào cả', 0, 1),
(1, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(1, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(1, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 2
(2, 'Không đúng với tôi chút nào cả', 0, 1),
(2, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(2, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(2, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 3
(3, 'Không đúng với tôi chút nào cả', 0, 1),
(3, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(3, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(3, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 4
(4, 'Không đúng với tôi chút nào cả', 0, 1),
(4, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(4, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(4, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 5
(5, 'Không đúng với tôi chút nào cả', 0, 1),
(5, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(5, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(5, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 6
(6, 'Không đúng với tôi chút nào cả', 0, 1),
(6, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(6, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(6, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 7
(7, 'Không đúng với tôi chút nào cả', 0, 1),
(7, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(7, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(7, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 8
(8, 'Không đúng với tôi chút nào cả', 0, 1),
(8, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(8, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(8, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 9
(9, 'Không đúng với tôi chút nào cả', 0, 1),
(9, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(9, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(9, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 10
(10, 'Không đúng với tôi chút nào cả', 0, 1),
(10, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(10, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(10, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 11
(11, 'Không đúng với tôi chút nào cả', 0, 1),
(11, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(11, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(11, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 12
(12, 'Không đúng với tôi chút nào cả', 0, 1),
(12, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(12, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(12, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 13
(13, 'Không đúng với tôi chút nào cả', 0, 1),
(13, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(13, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(13, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 14
(14, 'Không đúng với tôi chút nào cả', 0, 1),
(14, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(14, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(14, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 15
(15, 'Không đúng với tôi chút nào cả', 0, 1),
(15, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(15, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(15, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 16
(16, 'Không đúng với tôi chút nào cả', 0, 1),
(16, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(16, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(16, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 17
(17, 'Không đúng với tôi chút nào cả', 0, 1),
(17, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(17, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(17, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 18
(18, 'Không đúng với tôi chút nào cả', 0, 1),
(18, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(18, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(18, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 19
(19, 'Không đúng với tôi chút nào cả', 0, 1),
(19, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(19, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(19, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 20
(20, 'Không đúng với tôi chút nào cả', 0, 1),
(20, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(20, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(20, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 21
(21, 'Không đúng với tôi chút nào cả', 0, 1),
(21, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(21, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(21, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4);

-- Sample answer options for DASS-21 questions (English)
INSERT INTO depression_question_options_en (question_id, option_text, option_value, `order`) VALUES
-- Câu hỏi 1 (English)
(1, 'Did not apply to me at all', 0, 1),
(1, 'Applied to me to some degree, or some of the time', 1, 2),
(1, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(1, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 2 (English)
(2, 'Did not apply to me at all', 0, 1),
(2, 'Applied to me to some degree, or some of the time', 1, 2),
(2, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(2, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 3 (English)
(3, 'Did not apply to me at all', 0, 1),
(3, 'Applied to me to some degree, or some of the time', 1, 2),
(3, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(3, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 4 (English)
(4, 'Did not apply to me at all', 0, 1),
(4, 'Applied to me to some degree, or some of the time', 1, 2),
(4, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(4, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 5 (English)
(5, 'Did not apply to me at all', 0, 1),
(5, 'Applied to me to some degree, or some of the time', 1, 2),
(5, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(5, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 6 (English)
(6, 'Did not apply to me at all', 0, 1),
(6, 'Applied to me to some degree, or some of the time', 1, 2),
(6, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(6, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 7 (English)
(7, 'Did not apply to me at all', 0, 1),
(7, 'Applied to me to some degree, or some of the time', 1, 2),
(7, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(7, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 8 (English)
(8, 'Did not apply to me at all', 0, 1),
(8, 'Applied to me to some degree, or some of the time', 1, 2),
(8, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(8, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 9 (English)
(9, 'Did not apply to me at all', 0, 1),
(9, 'Applied to me to some degree, or some of the time', 1, 2),
(9, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(9, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 10 (English)
(10, 'Did not apply to me at all', 0, 1),
(10, 'Applied to me to some degree, or some of the time', 1, 2),
(10, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(10, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 11 (English)
(11, 'Did not apply to me at all', 0, 1),
(11, 'Applied to me to some degree, or some of the time', 1, 2),
(11, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(11, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 12 (English)
(12, 'Did not apply to me at all', 0, 1),
(12, 'Applied to me to some degree, or some of the time', 1, 2),
(12, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(12, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 13 (English)
(13, 'Did not apply to me at all', 0, 1),
(13, 'Applied to me to some degree, or some of the time', 1, 2),
(13, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(13, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 14 (English)
(14, 'Did not apply to me at all', 0, 1),
(14, 'Applied to me to some degree, or some of the time', 1, 2),
(14, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(14, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 15 (English)
(15, 'Did not apply to me at all', 0, 1),
(15, 'Applied to me to some degree, or some of the time', 1, 2),
(15, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(15, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 16 (English)
(16, 'Did not apply to me at all', 0, 1),
(16, 'Applied to me to some degree, or some of the time', 1, 2),
(16, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(16, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 17 (English)
(17, 'Did not apply to me at all', 0, 1),
(17, 'Applied to me to some degree, or some of the time', 1, 2),
(17, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(17, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 18 (English)
(18, 'Did not apply to me at all', 0, 1),
(18, 'Applied to me to some degree, or some of the time', 1, 2),
(18, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(18, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 19 (English)
(19, 'Did not apply to me at all', 0, 1),
(19, 'Applied to me to some degree, or some of the time', 1, 2),
(19, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(19, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 20 (English)
(20, 'Did not apply to me at all', 0, 1),
(20, 'Applied to me to some degree, or some of the time', 1, 2),
(20, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(20, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 21 (English)
(21, 'Did not apply to me at all', 0, 1),
(21, 'Applied to me to some degree, or some of the time', 1, 2),
(21, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(21, 'Applied to me very much, or most of the time', 3, 4);

-- Sample answer options for DASS-42 questions (Vietnamese)
INSERT INTO depression_question_options_vi (question_id, option_text, option_value, `order`) VALUES
-- Câu hỏi 1
(22, 'Không đúng với tôi chút nào cả', 0, 1),
(22, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(22, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(22, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 2
(23, 'Không đúng với tôi chút nào cả', 0, 1),
(23, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(23, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(23, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 3
(24, 'Không đúng với tôi chút nào cả', 0, 1),
(24, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(24, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(24, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 4
(25, 'Không đúng với tôi chút nào cả', 0, 1),
(25, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(25, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(25, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 5
(26, 'Không đúng với tôi chút nào cả', 0, 1),
(26, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(26, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(26, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 6
(27, 'Không đúng với tôi chút nào cả', 0, 1),
(27, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(27, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(27, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 7
(28, 'Không đúng với tôi chút nào cả', 0, 1),
(28, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(28, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(28, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 8
(29, 'Không đúng với tôi chút nào cả', 0, 1),
(29, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(29, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(29, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 9
(30, 'Không đúng với tôi chút nào cả', 0, 1),
(30, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(30, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(30, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 10
(31, 'Không đúng với tôi chút nào cả', 0, 1),
(31, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(31, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(31, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 11
(32, 'Không đúng với tôi chút nào cả', 0, 1),
(32, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(32, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(32, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 12
(33, 'Không đúng với tôi chút nào cả', 0, 1),
(33, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(33, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(33, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 13
(34, 'Không đúng với tôi chút nào cả', 0, 1),
(34, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(34, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(34, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 14
(35, 'Không đúng với tôi chút nào cả', 0, 1),
(35, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(35, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(35, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 15
(36, 'Không đúng với tôi chút nào cả', 0, 1),
(36, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(36, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(36, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 16
(37, 'Không đúng với tôi chút nào cả', 0, 1),
(37, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(37, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(37, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 17
(38, 'Không đúng với tôi chút nào cả', 0, 1),
(38, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(38, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(38, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 18
(39, 'Không đúng với tôi chút nào cả', 0, 1),
(39, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(39, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(39, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 19
(40, 'Không đúng với tôi chút nào cả', 0, 1),
(40, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(40, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(40, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 20
(41, 'Không đúng với tôi chút nào cả', 0, 1),
(41, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(41, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(41, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 21
(42, 'Không đúng với tôi chút nào cả', 0, 1),
(42, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(42, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(42, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 22
(43, 'Không đúng với tôi chút nào cả', 0, 1),
(43, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(43, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(43, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 23
(44, 'Không đúng với tôi chút nào cả', 0, 1),
(44, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(44, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(44, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 24
(45, 'Không đúng với tôi chút nào cả', 0, 1),
(45, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(45, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(45, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 25
(46, 'Không đúng với tôi chút nào cả', 0, 1),
(46, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(46, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(46, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 26
(47, 'Không đúng với tôi chút nào cả', 0, 1),
(47, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(47, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(47, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 27
(48, 'Không đúng với tôi chút nào cả', 0, 1),
(48, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(48, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(48, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 28
(49, 'Không đúng với tôi chút nào cả', 0, 1),
(49, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(49, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(49, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 29
(50, 'Không đúng với tôi chút nào cả', 0, 1),
(50, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(50, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(50, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 30
(51, 'Không đúng với tôi chút nào cả', 0, 1),
(51, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(51, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(51, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 31
(52, 'Không đúng với tôi chút nào cả', 0, 1),
(52, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(52, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(52, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 32
(53, 'Không đúng với tôi chút nào cả', 0, 1),
(53, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(53, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(53, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 33
(54, 'Không đúng với tôi chút nào cả', 0, 1),
(54, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(54, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(54, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 34
(55, 'Không đúng với tôi chút nào cả', 0, 1),
(55, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(55, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(55, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 35
(56, 'Không đúng với tôi chút nào cả', 0, 1),
(56, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(56, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(56, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 36
(57, 'Không đúng với tôi chút nào cả', 0, 1),
(57, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(57, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(57, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 37
(58, 'Không đúng với tôi chút nào cả', 0, 1),
(58, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(58, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(58, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 38
(59, 'Không đúng với tôi chút nào cả', 0, 1),
(59, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(59, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(59, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 39
(60, 'Không đúng với tôi chút nào cả', 0, 1),
(60, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(60, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(60, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 40
(61, 'Không đúng với tôi chút nào cả', 0, 1),
(61, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(61, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(61, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 41
(62, 'Không đúng với tôi chút nào cả', 0, 1),
(62, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(62, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(62, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4),
-- Câu hỏi 42
(63, 'Không đúng với tôi chút nào cả', 0, 1),
(63, 'Đúng với tôi một phần, hoặc thỉnh thoảng mới đúng', 1, 2),
(63, 'Đúng với tôi phần nhiều, hoặc phần lớn thời gian là đúng', 2, 3),
(63, 'Hoàn toàn đúng với tôi, hoặc hầu hết thời gian là đúng', 3, 4);

-- Sample answer options for DASS-42 questions (English)
INSERT INTO depression_question_options_en (question_id, option_text, option_value, `order`) VALUES
-- Câu hỏi 1 (English) - DASS-42
(22, 'Did not apply to me at all', 0, 1),
(22, 'Applied to me to some degree, or some of the time', 1, 2),
(22, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(22, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 2 (English) - DASS-42
(23, 'Did not apply to me at all', 0, 1),
(23, 'Applied to me to some degree, or some of the time', 1, 2),
(23, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(23, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 3 (English) - DASS-42
(24, 'Did not apply to me at all', 0, 1),
(24, 'Applied to me to some degree, or some of the time', 1, 2),
(24, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(24, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 4 (English) - DASS-42
(25, 'Did not apply to me at all', 0, 1),
(25, 'Applied to me to some degree, or some of the time', 1, 2),
(25, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(25, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 5 (English) - DASS-42
(26, 'Did not apply to me at all', 0, 1),
(26, 'Applied to me to some degree, or some of the time', 1, 2),
(26, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(26, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 6 (English) - DASS-42
(27, 'Did not apply to me at all', 0, 1),
(27, 'Applied to me to some degree, or some of the time', 1, 2),
(27, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(27, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 7 (English) - DASS-42
(28, 'Did not apply to me at all', 0, 1),
(28, 'Applied to me to some degree, or some of the time', 1, 2),
(28, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(28, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 8 (English) - DASS-42
(29, 'Did not apply to me at all', 0, 1),
(29, 'Applied to me to some degree, or some of the time', 1, 2),
(29, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(29, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 9 (English) - DASS-42
(30, 'Did not apply to me at all', 0, 1),
(30, 'Applied to me to some degree, or some of the time', 1, 2),
(30, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(30, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 10 (English) - DASS-42
(31, 'Did not apply to me at all', 0, 1),
(31, 'Applied to me to some degree, or some of the time', 1, 2),
(31, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(31, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 11 (English) - DASS-42
(32, 'Did not apply to me at all', 0, 1),
(32, 'Applied to me to some degree, or some of the time', 1, 2),
(32, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(32, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 12 (English) - DASS-42
(33, 'Did not apply to me at all', 0, 1),
(33, 'Applied to me to some degree, or some of the time', 1, 2),
(33, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(33, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 13 (English) - DASS-42
(34, 'Did not apply to me at all', 0, 1),
(34, 'Applied to me to some degree, or some of the time', 1, 2),
(34, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(34, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 14 (English) - DASS-42
(35, 'Did not apply to me at all', 0, 1),
(35, 'Applied to me to some degree, or some of the time', 1, 2),
(35, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(35, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 15 (English) - DASS-42
(36, 'Did not apply to me at all', 0, 1),
(36, 'Applied to me to some degree, or some of the time', 1, 2),
(36, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(36, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 16 (English) - DASS-42
(37, 'Did not apply to me at all', 0, 1),
(37, 'Applied to me to some degree, or some of the time', 1, 2),
(37, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(37, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 17 (English) - DASS-42
(38, 'Did not apply to me at all', 0, 1),
(38, 'Applied to me to some degree, or some of the time', 1, 2),
(38, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(38, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 18 (English) - DASS-42
(39, 'Did not apply to me at all', 0, 1),
(39, 'Applied to me to some degree, or some of the time', 1, 2),
(39, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(39, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 19 (English) - DASS-42
(40, 'Did not apply to me at all', 0, 1),
(40, 'Applied to me to some degree, or some of the time', 1, 2),
(40, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(40, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 20 (English) - DASS-42
(41, 'Did not apply to me at all', 0, 1),
(41, 'Applied to me to some degree, or some of the time', 1, 2),
(41, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(41, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 21 (English) - DASS-42
(42, 'Did not apply to me at all', 0, 1),
(42, 'Applied to me to some degree, or some of the time', 1, 2),
(42, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(42, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 22 (English) - DASS-42
(43, 'Did not apply to me at all', 0, 1),
(43, 'Applied to me to some degree, or some of the time', 1, 2),
(43, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(43, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 23 (English) - DASS-42
(44, 'Did not apply to me at all', 0, 1),
(44, 'Applied to me to some degree, or some of the time', 1, 2),
(44, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(44, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 24 (English) - DASS-42
(45, 'Did not apply to me at all', 0, 1),
(45, 'Applied to me to some degree, or some of the time', 1, 2),
(45, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(45, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 25 (English) - DASS-42
(46, 'Did not apply to me at all', 0, 1),
(46, 'Applied to me to some degree, or some of the time', 1, 2),
(46, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(46, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 26 (English) - DASS-42
(47, 'Did not apply to me at all', 0, 1),
(47, 'Applied to me to some degree, or some of the time', 1, 2),
(47, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(47, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 27 (English) - DASS-42
(48, 'Did not apply to me at all', 0, 1),
(48, 'Applied to me to some degree, or some of the time', 1, 2),
(48, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(48, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 28 (English) - DASS-42
(49, 'Did not apply to me at all', 0, 1),
(49, 'Applied to me to some degree, or some of the time', 1, 2),
(49, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(49, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 29 (English) - DASS-42
(50, 'Did not apply to me at all', 0, 1),
(50, 'Applied to me to some degree, or some of the time', 1, 2),
(50, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(50, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 30 (English) - DASS-42
(51, 'Did not apply to me at all', 0, 1),
(51, 'Applied to me to some degree, or some of the time', 1, 2),
(51, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(51, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 31 (English) - DASS-42
(52, 'Did not apply to me at all', 0, 1),
(52, 'Applied to me to some degree, or some of the time', 1, 2),
(52, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(52, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 32 (English) - DASS-42
(53, 'Did not apply to me at all', 0, 1),
(53, 'Applied to me to some degree, or some of the time', 1, 2),
(53, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(53, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 33 (English) - DASS-42
(54, 'Did not apply to me at all', 0, 1),
(54, 'Applied to me to some degree, or some of the time', 1, 2),
(54, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(54, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 34 (English) - DASS-42
(55, 'Did not apply to me at all', 0, 1),
(55, 'Applied to me to some degree, or some of the time', 1, 2),
(55, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(55, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 35 (English) - DASS-42
(56, 'Did not apply to me at all', 0, 1),
(56, 'Applied to me to some degree, or some of the time', 1, 2),
(56, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(56, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 36 (English) - DASS-42
(57, 'Did not apply to me at all', 0, 1),
(57, 'Applied to me to some degree, or some of the time', 1, 2),
(57, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(57, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 37 (English) - DASS-42
(58, 'Did not apply to me at all', 0, 1),
(58, 'Applied to me to some degree, or some of the time', 1, 2),
(58, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(58, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 38 (English) - DASS-42
(59, 'Did not apply to me at all', 0, 1),
(59, 'Applied to me to some degree, or some of the time', 1, 2),
(59, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(59, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 39 (English) - DASS-42
(60, 'Did not apply to me at all', 0, 1),
(60, 'Applied to me to some degree, or some of the time', 1, 2),
(60, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(60, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 40 (English) - DASS-42
(61, 'Did not apply to me at all', 0, 1),
(61, 'Applied to me to some degree, or some of the time', 1, 2),
(61, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(61, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 41 (English) - DASS-42
(62, 'Did not apply to me at all', 0, 1),
(62, 'Applied to me to some degree, or some of the time', 1, 2),
(62, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(62, 'Applied to me very much, or most of the time', 3, 4),
-- Câu hỏi 42 (English) - DASS-42
(63, 'Did not apply to me at all', 0, 1),
(63, 'Applied to me to some degree, or some of the time', 1, 2),
(63, 'Applied to me to a considerable degree, or a good part of the time', 2, 3),
(63, 'Applied to me very much, or most of the time', 3, 4);

-- Sample answer options for BDI questions (Vietnamese)
INSERT INTO depression_question_options_vi (question_id, option_text, option_value, `order`) VALUES
-- Câu hỏi 1
(64, 'Tôi cảm thấy tinh thần sảng khoái và vui vẻ', 0, 1),
(64, 'Nhiều lúc tôi cảm thấy chán nản và buồn bã', 1, 2),
(64, 'Lúc nào tôi cũng cảm thấy buồn chán và bản thân tôi không thể kiểm soát được', 2, 3),
(64, 'Lúc nào tôi cũng suy nghĩ lo âu, cảm thấy bất hạnh, buồn chán đến mức hoàn toàn đau khổ', 3, 4),
(64, 'Tôi cảm thấy cực kì buồn tủi, tinh thần hoảng loạn, khổ sở đến mức không thể chịu đựng được', 4, 5),

-- Câu hỏi 2
(65, 'Tôi cảm thấy tự tin và có hy vọng về tương lai', 0, 1),
(65, 'Tôi bắt đầu cảm thấy lo lắng và nản lòng về tương lai', 1, 2),
(65, 'Tôi cảm thấy bản thân chẳng có gì mong đợi và không biết phải làm gì ở tương lai', 2, 3),
(65, 'Tôi cảm thấy mình không có khả năng khắc phục những phiền muộn của bản thân', 3, 4),
(65, 'Tôi cảm thấy tuyệt vọng về tương lai và tình hình của bản thân ngày càng tệ đi không thể khắc phục được', 4, 5),

-- Câu 3
(66, 'Tôi cảm thấy bản thân luôn có những ý tưởng và định hướng mới', 0, 1),
(66, 'Tôi cảm giác bản thân mình thất bại so với những người khác', 1, 2),
(66, 'Tôi cảm thấy bản thân chưa làm được gì đáng giá và có ích cho bản thân và mọi người xung quanh', 2, 3),
(66, 'Tôi cảm thấy cuộc đời mình đa số điều là thất bại', 3, 4),
(66, 'Tôi cảm thấy bản thân là một người hoàn toàn thất bại và vô dụng', 4, 5),
(66, 'Tôi tự cảm thấy hoàn toàn thất bại trong vai trò của một người cha, người mẹ, người ông, người bà,v.v', 5, 6),

-- Câu 4
(67, 'Tôi tin tưởng, yêu thích những lựa chọn và quyết định của mình', 0, 1),
(67, 'Tôi luôn luôn cảm thấy buồn chán', 1, 2),
(67, 'Tôi cảm thấy bản thân không còn hứng thú và yêu thích với những lựa chọn trước đây', 2, 3),
(67, 'Không có gì làm cho tôi thoả mãn và hài lòng', 3, 4),
(67, 'Tôi mất hứng thú với những điều trước đây làm tôi yêu thích', 4, 5),
(67, 'Tôi hoàn toàn không còn chút thích thú nào với tất cả mọi thứ', 5, 6),
(67, 'Tôi cáu gắt và không hài lòng với tất cả mọi thứ', 6, 7),

-- Câu 5
(68, 'Tôi cảm thấy bản thân không gây ra vấn đề gì nghiêm trọng', 0, 1),
(68, 'Phần lớn những việc tôi đã làm khiến tôi đều cảm thấy bản thân có tội', 1, 2),
(68, 'Phần lớn thời gian tôi cảm thấy bản thân tồi tệ hoặc không xứng đáng', 2, 3),
(68, 'Tôi cảm thấy mình hoàn toàn có tội', 3, 4),
(68, 'Giờ đây tôi luôn cảm thấy bản thân là một người tồi tệ và không xứng đáng', 4, 5),
(68, 'Lúc nào tôi cũng cảm thấy bản thân là người gây ra tội lỗi', 5, 6),
(68, 'Tôi cảm thấy mình là người cực kì tồi tệ và vô dụng', 6, 7),

-- Câu 6
(69, 'Tôi cảm thấy không có chuyện gì gây ảnh hưởng đến bản thân', 0, 1),
(69, 'Tôi cảm thấy có thể bản thân sẽ bị trừng phạt bởi một cái gì đó', 1, 2),
(69, 'Tôi cảm thấy chuyện xấu có thể xảy ra với tôi', 2, 3),
(69, 'Tôi mong chờ bị trừng phạt', 3, 4),
(69, 'Tôi luôn cảm thấy bản thân sẽ bị trừng phạt', 4, 5),
(69, 'Tôi cảm thấy mình đang bị trừng phạt', 5, 6),
(69, 'Tôi muốn bị trừng phạt', 6, 7),

-- Câu 7
(70, 'Tôi hoàn toàn hài lòng với bản thân', 0, 1),
(70, 'Tôi thất vọng và không còn tin tưởng vào bản thân', 1, 2),
(70, 'Tôi hoàn toàn thất vọng và ghê tởm bản thân', 2, 3),
(70, 'Tôi ghét và căm thù bản thân mình', 3, 4),

-- Câu 8
(71, 'Tôi không phê phán và đổ lỗi cho bản thân', 0, 1),
(71, 'Tôi cảm thấy bản thân không có gì thua kém người khác', 1, 2),
(71, 'Hiện tại tôi phê phán và tự trách bản thân mình nhiều hơn', 2, 3),
(71, 'Tôi tự chê trách bản thân về sự yếu đuối và những sai lầm của mình', 3, 4),
(71, 'Tôi luôn luôn phê phán bản thân về tất cả những lỗi lầm của mình', 4, 5),
(71, 'Tôi khiển trách bản thân vì những lỗi lầm của mình gây ra', 5, 6),
(71, 'Tôi cảm thấy những điều tồi tệ xảy là đều tại tôi', 6, 7),
(71, 'Tôi khiển trách, tự nhận về mình khi mọi điều xấu xảy đến', 7, 8),

-- Câu 9
(72, 'Tôi yêu đời và hạnh phúc với cuộc sống hiện tại', 0, 1),
(72, 'Tôi không có bất kỳ ý nghĩ gì làm tổn hại bản thân', 1, 2),
(72, 'Tôi có ý nghĩ tự sát nhưng không thực hiện', 2, 3),
(72, 'Tôi luôn có những ý nghĩ làm tổn hại bản thân nhưng tôi không thực hiện chúng', 3, 4),
(72, 'Tôi muốn tự sát', 4, 5),
(72, 'Tôi cảm thấy giá mà bản thân chết thì tốt hơn', 5, 6),
(72, 'Tôi cảm thấy gia đình tôi sẽ tốt hơn nếu tôi chết', 6, 7),
(72, 'Tôi có những dự định rõ ràng để tự sát', 7, 8),
(72, 'Nếu có cơ hội tôi sẽ tự sát', 8, 9),

-- Câu 10
(73, 'Tôi vui vẻ và không cảm thấy có gì đáng buồn đến mức phải khóc', 0, 1),
(73, 'Hiện nay tôi hay dễ khóc và cảm xúc hỗn loạn hơn trước', 1, 2),
(73, 'Tôi thường khóc vì những điều nhỏ nhặt', 2, 3),
(73, 'Hiện tại tôi luôn luôn khóc và bản thân không thể kiểm soát được', 3, 4),
(73, 'Tôi thấy muốn khóc nhưng không thể khóc được', 4, 5),
(73, 'Trước đây thỉnh thoảng tôi vẫn khóc, nhưng hiện tại tôi không thể khóc được chút nào mặc dù tôi muốn khóc', 5, 6),

-- Câu 11
(74, 'Tôi bình thản và tự tin xử lý mọi vấn đề', 0, 1),
(74, 'Tôi trầm ổn và không dễ bị kích động', 1, 2),
(74, 'Tôi cảm thấy dễ bồn chồn và căng thẳng hơn so với trước đây', 2, 3),
(74, 'Tôi hay bực mình và dễ phát cáu hơn trước', 3, 4),
(74, 'Tôi cảm thấy bồn chồn và căng thẳng đến mức khó có thể ngồi yên được', 4, 5),
(74, 'Tôi luôn luôn cảm thấy bản thân dễ nổi nóng và cáu gắt', 5, 6),
(74, 'Tôi thấy rất bồn chồn và kích động đến mức phải đi lại liên tục hoặc làm việc gì đó', 6, 7),

-- Câu 12
(75, 'Tôi luôn quan tâm mọi người xung quanh', 0, 1),
(75, 'Tôi ít quan tâm đến mọi người, mọi việc xung quanh hơn trước', 1, 2),
(75, 'Tôi mất hầu hết sự quan tâm đến mọi người, mọi việc xung quanh và ít có cảm tình với họ', 2, 3),
(75, 'Tôi không còn quan tâm đến bất kỳ điều gì nữa', 3, 4),
(75, 'Tôi hoàn toàn không còn quan tâm đến người khác và không cần đến họ chút nào', 4, 5),

-- Câu 13
(76, 'Tôi hài lòng với những quyết định của mình', 0, 1),
(76, 'Tôi thấy khó quyết định mọi việc hơn trước', 1, 2),
(76, 'Tôi thấy bản thân khó đưa ra quyết định về mọi việc hơn trước rất nhiều', 2, 3),
(76, 'Không có sự giúp đỡ, tôi không thể quyết định gì được nữa', 3, 4),
(76, 'Tôi chẳng còn có thể quyết định được việc gì nữa', 4, 5),

-- Câu 14
(77, 'Tôi cảm thấy bản thân là người có ích', 0, 1),
(77, 'Tôi vui vẻ chấp nhận và hài lòng về bản thân', 1, 2),
(77, 'Tôi cảm thấy mình không có giá trị và có ích như trước kia', 2, 3),
(77, 'Tôi buồn phiền vì bản thân trông như già và không hấp dẫn', 3, 4),
(77, 'Tôi cảm thấy mình vô dụng hơn so với những người xung quanh', 4, 5),
(77, 'Tôi cảm thấy có những thay đổi trong diện mạo làm cho tôi có vẻ không hấp dẫn', 5, 6),
(77, 'Tôi thấy mình là người hoàn toàn vô dụng', 6, 7),
(77, 'Tôi cảm thấy bản thân có vẻ ngoài xấu xí và ghê tởm', 7, 8),

-- Câu 15
(78, 'Tôi thấy bản thân tràn đầy sức sống', 0, 1),
(78, 'Sức lực của tôi kém hơn trước (hoặc tôi không làm việc tốt như trước)', 1, 2),
(78, 'Tôi phải cố gắng để có thể khởi động làm bất cứ việc gì', 2, 3),
(78, 'Tôi không đủ sức lực để làm được nhiều việc nữa', 3, 4),
(78, 'Tôi phải cố gắng hết sức để làm một việc gì', 4, 5),
(78, 'Tôi không đủ sức lực để làm được bất cứ việc gì nữa', 5, 6),
(78, 'Tôi hoàn toàn không thể làm một việc gì cả', 6, 7),

-- Câu 16
(79, 'Tôi ngủ rất ngon và không có chuyện gì xảy ra khi ngủ', 0, 1),
(79, 'Tôi ngủ hơi nhiều hơn trước', 1, 2),
(79, 'Tôi ngủ hơi ít hơn trước', 2, 3),
(79, 'Tôi ngủ rất nhiều hơn trước', 3, 4),
(79, 'Tôi ngủ ít hơn trước', 4, 5),
(79, 'Tôi ngủ hầu như suốt cả ngày', 5, 6),
(79, 'Tôi thức dậy 1 - 2 giờ sớm hơn trước và không thể ngủ lại được', 6,7),

-- Câu 17
(80, 'Tôi luôn bình tĩnh và không nóng giận', 0, 1),
(80, 'Tôi làm việc vui vẻ và không cảm thấy mệt mỏi hay áp lực', 1, 2),
(80, 'Tôi dễ cáu kỉnh và bực bội hơn trước', 2, 3),
(80, 'Tôi làm việc dễ mệt hơn trước', 3, 4),
(80, 'Tôi dễ cáu kỉnh và bực bội hơn trước rất nhiều', 4, 5),
(80, 'Làm bất cứ việc gì tôi cũng mệt', 5, 6),
(80, 'Lúc nào tôi cũng dễ cáu kỉnh và bực bội', 6, 7),
(80, 'Làm cảm thấy quá mệt mỏi và không thể làm bất cứ thứ gì', 7, 8),

-- Câu 18
(81, 'Tôi ăn uống rất ngon miệng', 0, 1),
(81, 'Tôi ăn kém ngon miệng hơn trước', 1, 2),
(81, 'Tôi ăn kém ngon miệng hơn trước rất nhiều', 2, 3),
(81, 'Tôi không còn ăn ngon miệng như trước', 3, 4),
(81, 'Tôi không thấy ăn ngon miệng một chút nào cả', 4, 5),
(81, 'Lúc nào tôi cũng thấy thèm ăn', 5, 6),

-- Câu 19
(82, 'Cân nặng của tôi hoàn toàn bình thường', 0, 1),
(82, 'Cân nặng của tôi không có gì thay đổi', 1, 2),
(82, 'Tôi không thể tập trung chú ý được như trước', 2, 3),
(82, 'Tôi bị sút cân trên 2 kg', 3, 4),
(82, 'Tôi thấy khó tập trung chú ý lâu được vào bất kỳ điều gì', 4, 5),
(82, 'Tôi bị sút cân trên 4 kg', 5, 6),
(82, 'Tôi thấy mình không thể tập trung chú ý được vào bất kỳ điều gì nữa', 6, 7),
(82, 'Tôi bị sút cân trên 6 kg', 7, 8),

-- Câu 20
(83, 'Sức khoẻ của bản thân cực kỳ tốt', 0, 1),
(83, 'Tôi khoẻ mạnh và không lo lắng về sức khỏe của bản thân', 1, 2),
(83, 'Tôi dễ mệt mỏi hơn trước', 2, 3),
(83, 'Tôi lo lắng về những đau đớn hoặc những khó chịu ở dạ dày, táo bón và những cảm giác khác của cơ thể', 3, 4),
(83, 'Hầu như làm bất kỳ việc gì tôi cũng thấy mệt mỏi', 4, 5),
(83, 'Tôi quá lo lắng về sức khỏe của tôi đến nổi tôi rất khó suy nghĩ gì thêm nữa', 5, 6),
(83, 'Tôi quá mệt mỏi khi làm bất kỳ việc gì', 6, 7),
(83, 'Tôi hoàn toàn bị thu hút vào những cảm giác tiêu cực của bản thân', 7, 8),

-- Câu 21
(84, 'Vấn đề tình dục của tôi bình thường và không có gì thay đổi', 0, 1),
(84, 'Tôi ít hứng thú với tình dục hơn trước', 1, 2),
(84, 'Hiện nay tôi rất ít có hứng thú với tình dục', 2, 3),
(84, 'Tôi hoàn toàn mất hứng thú tình dục', 3, 4);

-- Sample answer options for BDI questions (English)
INSERT INTO depression_question_options_en (question_id, option_text, option_value, `order`) VALUES
-- Câu hỏi 1 (English) - BDI
(64, 'I feel mentally refreshed and happy', 0, 1),
(64, 'Many times I feel bored and sad', 1, 2),
(64, 'I always feel sad and I cannot control myself', 2, 3),
(64, 'I always worry and feel unhappy, sad to the point of complete suffering', 3, 4),
(64, 'I feel extremely sad, mentally panic, miserable to the point of being unbearable', 4, 5),

-- Câu hỏi 2 (English) - BDI
(65, 'I feel confident and hopeful about the future', 0, 1),
(65, 'I am starting to feel worried and discouraged about the future', 1, 2),
(65, 'I feel I have nothing to look forward to and don\'t know what to do in the future', 2, 3),
(65, 'I feel I am unable to overcome my troubles', 3, 4),
(65, 'I feel hopeless about the future and my situation is getting worse and cannot be overcome', 4, 5),

-- Câu hỏi 3 (English) - BDI
(66, 'I feel I always have new ideas and directions', 0, 1),
(66, 'I feel like I have failed compared to others', 1, 2),
(66, 'I feel I have not done anything valuable and useful for myself and people around me', 2, 3),
(66, 'I feel that most of my life has been a failure', 3, 4),
(66, 'I feel I am a complete failure and useless person', 4, 5),
(66, 'I feel completely failed in my role as a father, mother, grandfather, grandmother, etc.', 5, 6),

-- Câu hỏi 4 (English) - BDI
(67, 'I trust and love my choices and decisions', 0, 1),
(67, 'I always feel bored', 1, 2),
(67, 'I feel I am no longer interested and fond of previous choices', 2, 3),
(67, 'Nothing makes me satisfied and happy', 3, 4),
(67, 'I lose interest in things that used to make me happy', 4, 5),
(67, 'I have absolutely no interest in everything', 5, 6),
(67, 'I am irritated and dissatisfied with everything', 6, 7),

-- Câu hỏi 5 (English) - BDI
(68, 'I feel I do not cause any serious problems', 0, 1),
(68, 'Most of the things I did made me feel guilty', 1, 2),
(68, 'Most of the time I feel bad or unworthy', 2, 3),
(68, 'I feel completely guilty', 3, 4),
(68, 'Now I always feel I am a bad and unworthy person', 4, 5),
(68, 'I always feel I am the one who causes guilt', 5, 6),
(68, 'I feel I am an extremely bad and useless person', 6, 7),

-- Câu hỏi 6 (English) - BDI
(69, 'I feel nothing affects me', 0, 1),
(69, 'I feel I might be punished by something', 1, 2),
(69, 'I feel bad things might happen to me', 2, 3),
(69, 'I expect to be punished', 3, 4),
(69, 'I always feel I will be punished', 4, 5),
(69, 'I feel I am being punished', 5, 6),
(69, 'I want to be punished', 6, 7),

-- Câu hỏi 7 (English) - BDI
(70, 'I am completely satisfied with myself', 0, 1),
(70, 'I am disappointed and no longer trust myself', 1, 2),
(70, 'I am completely disappointed and disgusted with myself', 2, 3),
(70, 'I hate and despise myself', 3, 4),

-- Câu hỏi 8 (English) - BDI
(71, 'I do not criticize and blame myself', 0, 1),
(71, 'I feel I am no worse than others', 1, 2),
(71, 'Now I criticize and blame myself more', 2, 3),
(71, 'I blame myself for my weaknesses and mistakes', 3, 4),
(71, 'I always criticize myself for all my mistakes', 4, 5),
(71, 'I blame myself for the mistakes I caused', 5, 6),
(71, 'I feel bad things happen because of me', 6, 7),
(71, 'I blame and take responsibility when bad things happen', 7, 8),

-- Câu hỏi 9 (English) - BDI
(72, 'I love life and am happy with my current life', 0, 1),
(72, 'I have no thoughts of harming myself', 1, 2),
(72, 'I have suicidal thoughts but do not carry them out', 2, 3),
(72, 'I always have thoughts of harming myself but I do not carry them out', 3, 4),
(72, 'I want to commit suicide', 4, 5),
(72, 'I feel it would be better if I died', 5, 6),
(72, 'I feel my family would be better off if I died', 6, 7),
(72, 'I have clear plans to commit suicide', 7, 8),
(72, 'If I have the chance, I will commit suicide', 8, 9),

-- Câu hỏi 10 (English) - BDI
(73, 'I am happy and do not feel there is anything sad enough to cry about', 0, 1),
(73, 'Now I cry easily and my emotions are more chaotic than before', 1, 2),
(73, 'I often cry over small things', 2, 3),
(73, 'Now I always cry and I cannot control myself', 3, 4),
(73, 'I want to cry but cannot cry', 4, 5),
(73, 'I used to cry sometimes before, but now I cannot cry at all even though I want to', 5, 6),

-- Câu hỏi 11 (English) - BDI
(74, 'I am calm and confident in handling all problems', 0, 1),
(74, 'I am calm and not easily agitated', 1, 2),
(74, 'I feel more restless and tense than before', 2, 3),
(74, 'I get annoyed and get angry more easily than before', 3, 4),
(74, 'I feel restless and tense to the point where it is hard to sit still', 4, 5),
(74, 'I always feel easily angry and irritated', 5, 6),
(74, 'I feel very restless and agitated to the point of having to walk around or do something', 6, 7),

-- Câu hỏi 12 (English) - BDI
(75, 'I always care about people around me', 0, 1),
(75, 'I care less about people and things around me than before', 1, 2),
(75, 'I have lost most of my interest in people and things around me and have little affection for them', 2, 3),
(75, 'I no longer care about anything', 3, 4),
(75, 'I completely no longer care about others and do not need them at all', 4, 5),

-- Câu hỏi 13 (English) - BDI
(76, 'I am satisfied with my decisions', 0, 1),
(76, 'I find it harder to decide things than before', 1, 2),
(76, 'I find it much harder to make decisions about things than before', 2, 3),
(76, 'Without help, I cannot decide anything anymore', 3, 4),
(76, 'I can no longer decide anything', 4, 5),

-- Câu hỏi 14 (English) - BDI
(77, 'I feel I am a useful person', 0, 1),
(77, 'I happily accept and am satisfied with myself', 1, 2),
(77, 'I feel I am not as valuable and useful as before', 2, 3),
(77, 'I am sad because I look old and unattractive', 3, 4),
(77, 'I feel more useless than people around me', 4, 5),
(77, 'I feel there are changes in appearance that make me look unattractive', 5, 6),
(77, 'I feel I am completely useless', 6, 7),
(77, 'I feel I look ugly and disgusting', 7, 8),

-- Câu hỏi 15 (English) - BDI
(78, 'I feel full of vitality', 0, 1),
(78, 'My strength is weaker than before (or I don\'t work as well as before)', 1, 2),
(78, 'I have to try to be able to start doing anything', 2, 3),
(78, 'I don\'t have enough strength to do many things anymore', 3, 4),
(78, 'I have to try my best to do anything', 4, 5),
(78, 'I don\'t have enough strength to do anything anymore', 5, 6),
(78, 'I can\'t do anything at all', 6, 7),

-- Câu hỏi 16 (English) - BDI
(79, 'I sleep very well and nothing happens when I sleep', 0, 1),
(79, 'I sleep a little more than before', 1, 2),
(79, 'I sleep a little less than before', 2, 3),
(79, 'I sleep much more than before', 3, 4),
(79, 'I sleep less than before', 4, 5),
(163, 'I sleep almost all day', 5, 6),
(79, 'I wake up 1-2 hours earlier than before and cannot sleep again', 6, 7),

-- Câu hỏi 17 (English) - BDI
(80, 'I am always calm and not angry', 0, 1),
(80, 'I work happily and do not feel tired or pressured', 1, 2),
(80, 'I get irritated and annoyed more easily than before', 2, 3),
(80, 'I get tired from work more easily than before', 3, 4),
(80, 'I get irritated and annoyed much more easily than before', 4, 5),
(80, 'Whatever I do makes me tired', 5, 6),
(80, 'I am always easily irritated and annoyed', 6, 7),
(80, 'I feel too tired and cannot do anything', 7, 8),

-- Câu hỏi 18 (English) - BDI
(81, 'I eat very well', 0, 1),
(81, 'I eat less appetizing than before', 1, 2),
(81, 'I eat much less appetizing than before', 2, 3),
(81, 'I no longer eat as appetizing as before', 3, 4),
(81, 'I don\'t find eating appetizing at all', 4, 5),
(81, 'I always feel hungry', 5, 6),

-- Câu hỏi 19 (English) - BDI
(82, 'My weight is completely normal', 0, 1),
(82, 'My weight has not changed', 1, 2),
(82, 'I cannot concentrate attention like before', 2, 3),
(82, 'I lost more than 2 kg', 3, 4),
(82, 'I find it difficult to concentrate for long on anything', 4, 5),
(82, 'I lost more than 4 kg', 5, 6),
(82, 'I find I cannot concentrate on anything anymore', 6, 7),
(82, 'I lost more than 6 kg', 7, 8),

-- Câu hỏi 20 (English) - BDI
(83, 'My health is extremely good', 0, 1),
(83, 'I am healthy and do not worry about my health', 1, 2),
(83, 'I get tired more easily than before', 2, 3),
(83, 'I worry about pain or discomfort in the stomach, constipation and other bodily sensations', 3, 4),
(83, 'Almost anything I do makes me feel tired', 4, 5),
(83, 'I worry too much about my health that I find it very difficult to think of anything else', 5, 6),
(83, 'I am too tired when doing anything', 6, 7),
(83, 'I am completely attracted to my negative feelings', 7, 8),

-- Câu hỏi 21 (English) - BDI
(84, 'My sexual issues are normal and unchanged', 0, 1),
(84, 'I am less interested in sex than before', 1, 2),
(84, 'Now I have very little interest in sex', 2, 3),
(84, 'I have completely lost interest in sex', 3, 4);

-- Sample answer options for RADS questions (Vietnamese)
INSERT INTO depression_question_options_vi (question_id, option_text, option_value, `order`) VALUES
-- Câu hỏi 1
(85, 'Hầu như không', 0, 1),
(85, 'Thỉnh thoảng', 1, 2),
(85, 'Phần lớn thời gian', 2, 3),
(85, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 2
(86, 'Hầu như không', 0, 1),
(86, 'Thỉnh thoảng', 1, 2),
(86, 'Phần lớn thời gian', 2, 3),
(86, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 3
(87, 'Hầu như không', 0, 1),
(87, 'Thỉnh thoảng', 1, 2),
(87, 'Phần lớn thời gian', 2, 3),
(87, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 4
(88, 'Hầu như không', 0, 1),
(88, 'Thỉnh thoảng', 1, 2),
(88, 'Phần lớn thời gian', 2, 3),
(88, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 5
(89, 'Hầu như không', 0, 1),
(89, 'Thỉnh thoảng', 1, 2),
(89, 'Phần lớn thời gian', 2, 3),
(89, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 6
(90, 'Hầu như không', 0, 1),
(90, 'Thỉnh thoảng', 1, 2),
(90, 'Phần lớn thời gian', 2, 3),
(90, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 7
(91, 'Hầu như không', 0, 1),
(91, 'Thỉnh thoảng', 1, 2),
(91, 'Phần lớn thời gian', 2, 3),
(91, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 8
(92, 'Hầu như không', 0, 1),
(92, 'Thỉnh thoảng', 1, 2),
(92, 'Phần lớn thời gian', 2, 3),
(92, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 9
(93, 'Hầu như không', 0, 1),
(93, 'Thỉnh thoảng', 1, 2),
(93, 'Phần lớn thời gian', 2, 3),
(93, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 10
(94, 'Hầu như không', 0, 1),
(94, 'Thỉnh thoảng', 1, 2),
(94, 'Phần lớn thời gian', 2, 3),
(94, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 11
(95, 'Hầu như không', 0, 1),
(95, 'Thỉnh thoảng', 1, 2),
(95, 'Phần lớn thời gian', 2, 3),
(95, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 12
(96, 'Hầu như không', 0, 1),
(96, 'Thỉnh thoảng', 1, 2),
(96, 'Phần lớn thời gian', 2, 3),
(96, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 13
(97, 'Hầu như không', 0, 1),
(97, 'Thỉnh thoảng', 1, 2),
(97, 'Phần lớn thời gian', 2, 3),
(97, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 14
(98, 'Hầu như không', 0, 1),
(98, 'Thỉnh thoảng', 1, 2),
(98, 'Phần lớn thời gian', 2, 3),
(98, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 15
(99, 'Hầu như không', 0, 1),
(99, 'Thỉnh thoảng', 1, 2),
(99, 'Phần lớn thời gian', 2, 3),
(99, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 16
(100, 'Hầu như không', 0, 1),
(100, 'Thỉnh thoảng', 1, 2),
(100, 'Phần lớn thời gian', 2, 3),
(100, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 17
(101, 'Hầu như không', 0, 1),
(101, 'Thỉnh thoảng', 1, 2),
(101, 'Phần lớn thời gian', 2, 3),
(101, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 18
(102, 'Hầu như không', 0, 1),
(102, 'Thỉnh thoảng', 1, 2),
(102, 'Phần lớn thời gian', 2, 3),
(102, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 19
(103, 'Hầu như không', 0, 1),
(103, 'Thỉnh thoảng', 1, 2),
(103, 'Phần lớn thời gian', 2, 3),
(103, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 20
(104, 'Hầu như không', 0, 1),
(104, 'Thỉnh thoảng', 1, 2),
(104, 'Phần lớn thời gian', 2, 3),
(104, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 21
(105, 'Hầu như không', 0, 1),
(105, 'Thỉnh thoảng', 1, 2),
(105, 'Phần lớn thời gian', 2, 3),
(105, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 22
(106, 'Hầu như không', 0, 1),
(106, 'Thỉnh thoảng', 1, 2),
(106, 'Phần lớn thời gian', 2, 3),
(106, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 23
(107, 'Hầu như không', 0, 1),
(107, 'Thỉnh thoảng', 1, 2),
(107, 'Phần lớn thời gian', 2, 3),
(107, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 24
(108, 'Hầu như không', 0, 1),
(108, 'Thỉnh thoảng', 1, 2),
(108, 'Phần lớn thời gian', 2, 3),
(108, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 25
(109, 'Hầu như không', 0, 1),
(109, 'Thỉnh thoảng', 1, 2),
(109, 'Phần lớn thời gian', 2, 3),
(109, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 26
(110, 'Hầu như không', 0, 1),
(110, 'Thỉnh thoảng', 1, 2),
(110, 'Phần lớn thời gian', 2, 3),
(110, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 27
(111, 'Hầu như không', 0, 1),
(111, 'Thỉnh thoảng', 1, 2),
(111, 'Phần lớn thời gian', 2, 3),
(111, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 28
(112, 'Hầu như không', 0, 1),
(112, 'Thỉnh thoảng', 1, 2),
(112, 'Phần lớn thời gian', 2, 3),
(112, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 29
(113, 'Hầu như không', 0, 1),
(113, 'Thỉnh thoảng', 1, 2),
(113, 'Phần lớn thời gian', 2, 3),
(113, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 30
(114, 'Hầu như không', 0, 1),
(114, 'Thỉnh thoảng', 1, 2),
(114, 'Phần lớn thời gian', 2, 3),
(114, 'Hầu hết hoặc tất cả thời gian', 3, 4);

-- Sample answer options for RADS questions (English)
INSERT INTO depression_question_options_en (question_id, option_text, option_value, `order`) VALUES
-- Câu hỏi 1 (English) - RADS
(85, 'Not at all', 0, 1),
(85, 'Sometimes', 1, 2),
(85, 'Most of the time', 2, 3),
(85, 'Most or all of the time', 3, 4),
-- Câu hỏi 2 (English) - RADS
(86, 'Not at all', 0, 1),
(86, 'Sometimes', 1, 2),
(86, 'Most of the time', 2, 3),
(86, 'Most or all of the time', 3, 4),
-- Câu hỏi 3 (English) - RADS
(87, 'Not at all', 0, 1),
(87, 'Sometimes', 1, 2),
(87, 'Most of the time', 2, 3),
(87, 'Most or all of the time', 3, 4),
-- Câu hỏi 4 (English) - RADS
(88, 'Not at all', 0, 1),
(88, 'Sometimes', 1, 2),
(88, 'Most of the time', 2, 3),
(88, 'Most or all of the time', 3, 4),
-- Câu hỏi 5 (English) - RADS
(89, 'Not at all', 0, 1),
(89, 'Sometimes', 1, 2),
(89, 'Most of the time', 2, 3),
(89, 'Most or all of the time', 3, 4),
-- Câu hỏi 6 (English) - RADS
(90, 'Not at all', 0, 1),
(90, 'Sometimes', 1, 2),
(90, 'Most of the time', 2, 3),
(90, 'Most or all of the time', 3, 4),
-- Câu hỏi 7 (English) - RADS
(91, 'Not at all', 0, 1),
(91, 'Sometimes', 1, 2),
(91, 'Most of the time', 2, 3),
(91, 'Most or all of the time', 3, 4),
-- Câu hỏi 8 (English) - RADS
(92, 'Not at all', 0, 1),
(92, 'Sometimes', 1, 2),
(92, 'Most of the time', 2, 3),
(92, 'Most or all of the time', 3, 4),
-- Câu hỏi 9 (English) - RADS
(93, 'Not at all', 0, 1),
(93, 'Sometimes', 1, 2),
(93, 'Most of the time', 2, 3),
(93, 'Most or all of the time', 3, 4),
-- Câu hỏi 10 (English) - RADS
(94, 'Not at all', 0, 1),
(94, 'Sometimes', 1, 2),
(94, 'Most of the time', 2, 3),
(94, 'Most or all of the time', 3, 4),
-- Câu hỏi 11 (English) - RADS
(95, 'Not at all', 0, 1),
(95, 'Sometimes', 1, 2),
(95, 'Most of the time', 2, 3),
(95, 'Most or all of the time', 3, 4),
-- Câu hỏi 12 (English) - RADS
(96, 'Not at all', 0, 1),
(96, 'Sometimes', 1, 2),
(96, 'Most of the time', 2, 3),
(96, 'Most or all of the time', 3, 4),
-- Câu hỏi 13 (English) - RADS
(97, 'Not at all', 0, 1),
(97, 'Sometimes', 1, 2),
(97, 'Most of the time', 2, 3),
(97, 'Most or all of the time', 3, 4),
-- Câu hỏi 14 (English) - RADS
(98, 'Not at all', 0, 1),
(98, 'Sometimes', 1, 2),
(98, 'Most of the time', 2, 3),
(98, 'Most or all of the time', 3, 4),
-- Câu hỏi 15 (English) - RADS
(99, 'Not at all', 0, 1),
(99, 'Sometimes', 1, 2),
(99, 'Most of the time', 2, 3),
(99, 'Most or all of the time', 3, 4),
-- Câu hỏi 16 (English) - RADS
(100, 'Not at all', 0, 1),
(100, 'Sometimes', 1, 2),
(100, 'Most of the time', 2, 3),
(100, 'Most or all of the time', 3, 4),
-- Câu hỏi 17 (English) - RADS
(101, 'Not at all', 0, 1),
(101, 'Sometimes', 1, 2),
(101, 'Most of the time', 2, 3),
(101, 'Most or all of the time', 3, 4),
-- Câu hỏi 18 (English) - RADS
(102, 'Not at all', 0, 1),
(102, 'Sometimes', 1, 2),
(102, 'Most of the time', 2, 3),
(102, 'Most or all of the time', 3, 4),
-- Câu hỏi 19 (English) - RADS
(103, 'Not at all', 0, 1),
(103, 'Sometimes', 1, 2),
(103, 'Most of the time', 2, 3),
(103, 'Most or all of the time', 3, 4),
-- Câu hỏi 20 (English) - RADS
(104, 'Not at all', 0, 1),
(104, 'Sometimes', 1, 2),
(104, 'Most of the time', 2, 3),
(104, 'Most or all of the time', 3, 4),
-- Câu hỏi 21 (English) - RADS
(105, 'Not at all', 0, 1),
(105, 'Sometimes', 1, 2),
(105, 'Most of the time', 2, 3),
(105, 'Most or all of the time', 3, 4),
-- Câu hỏi 22 (English) - RADS
(106, 'Not at all', 0, 1),
(106, 'Sometimes', 1, 2),
(106, 'Most of the time', 2, 3),
(106, 'Most or all of the time', 3, 4),
-- Câu hỏi 23 (English) - RADS
(107, 'Not at all', 0, 1),
(107, 'Sometimes', 1, 2),
(107, 'Most of the time', 2, 3),
(107, 'Most or all of the time', 3, 4),
-- Câu hỏi 24 (English) - RADS
(108, 'Not at all', 0, 1),
(108, 'Sometimes', 1, 2),
(108, 'Most of the time', 2, 3),
(108, 'Most or all of the time', 3, 4),
-- Câu hỏi 25 (English) - RADS
(109, 'Not at all', 0, 1),
(109, 'Sometimes', 1, 2),
(109, 'Most of the time', 2, 3),
(109, 'Most or all of the time', 3, 4),
-- Câu hỏi 26 (English) - RADS
(110, 'Not at all', 0, 1),
(110, 'Sometimes', 1, 2),
(110, 'Most of the time', 2, 3),
(110, 'Most or all of the time', 3, 4),
-- Câu hỏi 27 (English) - RADS
(111, 'Not at all', 0, 1),
(111, 'Sometimes', 1, 2),
(111, 'Most of the time', 2, 3),
(111, 'Most or all of the time', 3, 4),
-- Câu hỏi 28 (English) - RADS
(112, 'Not at all', 0, 1),
(112, 'Sometimes', 1, 2),
(112, 'Most of the time', 2, 3),
(112, 'Most or all of the time', 3, 4),
-- Câu hỏi 29 (English) - RADS
(113, 'Not at all', 0, 1),
(113, 'Sometimes', 1, 2),
(113, 'Most of the time', 2, 3),
(113, 'Most or all of the time', 3, 4),
-- Câu hỏi 30 (English) - RADS
(114, 'Not at all', 0, 1),
(114, 'Sometimes', 1, 2),
(114, 'Most of the time', 2, 3),
(114, 'Most or all of the time', 3, 4);

-- Sample answer options for EPDS questions (Vietnamese)
INSERT INTO depression_question_options_vi (question_id, option_text, option_value, `order`) VALUES
-- Câu hỏi 1
(115, 'Không có', 0, 1),
(115, 'Đôi khi', 1, 2),
(115, 'Phần lớn thời gian', 2, 3),
(115, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 2
(116, 'Không có', 0, 1),
(116, 'Đôi khi', 1, 2),
(116, 'Phần lớn thời gian', 2, 3),
(116, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 3
(117, 'Không có', 0, 1),
(117, 'Đôi khi', 1, 2),
(117, 'Phần lớn thời gian', 2, 3),
(117, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 4
(118, 'Không có', 0, 1),
(118, 'Đôi khi', 1, 2),
(118, 'Phần lớn thời gian', 2, 3),
(118, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 5
(119, 'Không có', 0, 1),
(119, 'Đôi khi', 1, 2),
(119, 'Phần lớn thời gian', 2, 3),
(119, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 6
(120, 'Không có', 0, 1),
(120, 'Đôi khi', 1, 2),
(120, 'Phần lớn thời gian', 2, 3),
(120, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 7
(121, 'Không có', 0, 1),
(121, 'Đôi khi', 1, 2),
(121, 'Phần lớn thời gian', 2, 3),
(121, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 8
(122, 'Không có', 0, 1),
(122, 'Đôi khi', 1, 2),
(122, 'Phần lớn thời gian', 2, 3),
(122, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 9
(123, 'Không có', 0, 1),
(123, 'Đôi khi', 1, 2),
(123, 'Phần lớn thời gian', 2, 3),
(123, 'Hầu hết hoặc tất cả thời gian', 3, 4),

-- Câu hỏi 10
(124, 'Không có', 0, 1),
(124, 'Đôi khi', 1, 2),
(124, 'Phần lớn thời gian', 2, 3),
(124, 'Hầu hết hoặc tất cả thời gian', 3, 4);

-- Sample answer options for EPDS questions (English)
INSERT INTO depression_question_options_en (question_id, option_text, option_value, `order`) VALUES
-- Câu hỏi 1 (English) - EPDS
(115, 'Not at all', 0, 1),
(115, 'Most or all of the time', 1, 2),
(115, 'Clearly reduced now', 2, 3),
(115, 'Almost impossible', 3, 4),
-- Câu hỏi 2 (English) - EPDS
(116, 'Not at all', 0, 1),
(116, 'Most or all of the time', 1, 2),
(116, 'Clearly reduced now', 2, 3),
(116, 'Almost impossible', 3, 4),
-- Câu hỏi 3 (English) - EPDS
(117, 'Not at all', 0, 1),
(117, 'Most or all of the time', 1, 2),
(117, 'Clearly reduced now', 2, 3),
(117, 'Almost impossible', 3, 4),
-- Câu hỏi 4 (English) - EPDS
(118, 'Not at all', 0, 1),
(118, 'Most or all of the time', 1, 2),
(118, 'Clearly reduced now', 2, 3),
(118, 'Almost impossible', 3, 4),
-- Câu hỏi 5 (English) - EPDS
(119, 'Not at all', 0, 1),
(119, 'Most or all of the time', 1, 2),
(119, 'Clearly reduced now', 2, 3),
(119, 'Almost impossible', 3, 4),
-- Câu hỏi 6 (English) - EPDS
(120, 'Not at all', 0, 1),
(120, 'Most or all of the time', 1, 2),
(120, 'Clearly reduced now', 2, 3),
(120, 'Almost impossible', 3, 4),
-- Câu hỏi 7 (English) - EPDS
(121, 'Not at all', 0, 1),
(121, 'Most or all of the time', 1, 2),
(121, 'Clearly reduced now', 2, 3),
(121, 'Almost impossible', 3, 4),
-- Câu hỏi 8 (English) - EPDS
(122, 'Not at all', 0, 1),
(122, 'Most or all of the time', 1, 2),
(122, 'Clearly reduced now', 2, 3),
(122, 'Almost impossible', 3, 4),
-- Câu hỏi 9 (English) - EPDS
(123, 'Not at all', 0, 1),
(123, 'Most or all of the time', 1, 2),
(123, 'Clearly reduced now', 2, 3),
(123, 'Almost impossible', 3, 4),
-- Câu hỏi 10 (English) - EPDS
(124, 'Not at all', 0, 1),
(124, 'Most or all of the time', 1, 2),
(124, 'Clearly reduced now', 2, 3),
(124, 'Almost impossible', 3, 4);

-- Sample answer options for SAS questions (Vietnamese)
INSERT INTO depression_question_options_vi (question_id, option_text, option_value, `order`) VALUES
-- Question 1 (Vietnamese) - SAS
(125, 'Không có', 0, 1),
(125, 'Đôi khi', 1, 2),
(125, 'Phần lớn thời gian', 2, 3),
(125, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 2 (Vietnamese) - SAS
(126, 'Không có', 0, 1),
(126, 'Đôi khi', 1, 2),
(126, 'Phần lớn thời gian', 2, 3),
(126, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 3 (Vietnamese) - SAS
(127, 'Không có', 0, 1),
(127, 'Đôi khi', 1, 2),
(127, 'Phần lớn thời gian', 2, 3),
(127, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 4 (Vietnamese) - SAS
(128, 'Không có', 0, 1),
(128, 'Đôi khi', 1, 2),
(128, 'Phần lớn thời gian', 2, 3),
(128, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 5 (Vietnamese) - SAS
(129, 'Không có', 0, 1),
(129, 'Đôi khi', 1, 2),
(129, 'Phần lớn thời gian', 2, 3),
(129, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 6 (Vietnamese) - SAS
(130, 'Không có', 0, 1),
(130, 'Đôi khi', 1, 2),
(130, 'Phần lớn thời gian', 2, 3),
(130, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 7 (Vietnamese) - SAS
(131, 'Không có', 0, 1),
(131, 'Đôi khi', 1, 2),
(131, 'Phần lớn thời gian', 2, 3),
(131, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 8 (Vietnamese) - SAS
(132, 'Không có', 0, 1),
(132, 'Đôi khi', 1, 2),
(132, 'Phần lớn thời gian', 2, 3),
(132, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 9 (Vietnamese) - SAS
(133, 'Không có', 0, 1),
(133, 'Đôi khi', 1, 2),
(133, 'Phần lớn thời gian', 2, 3),
(133, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 10 (Vietnamese) - SAS
(134, 'Không có', 0, 1),
(134, 'Đôi khi', 1, 2),
(134, 'Phần lớn thời gian', 2, 3),
(134, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 11 (Vietnamese) - SAS
(135, 'Không có', 0, 1),
(135, 'Đôi khi', 1, 2),
(135, 'Phần lớn thời gian', 2, 3),
(135, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 12 (Vietnamese) - SAS   
(136, 'Không có', 0, 1),
(136, 'Đôi khi', 1, 2),
(136, 'Phần lớn thời gian', 2, 3),
(136, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 13 (Vietnamese) - SAS
(137, 'Không có', 0, 1),
(137, 'Đôi khi', 1, 2),
(137, 'Phần lớn thời gian', 2, 3),
(137, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 14 (Vietnamese) - SAS
(138, 'Không có', 0, 1),
(138, 'Đôi khi', 1, 2),
(138, 'Phần lớn thời gian', 2, 3),
(138, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 15 (Vietnamese) - SAS
(139, 'Không có', 0, 1),
(139, 'Đôi khi', 1, 2),
(139, 'Phần lớn thời gian', 2, 3),
(139, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 16 (Vietnamese) - SAS
(140, 'Không có', 0, 1),
(140, 'Đôi khi', 1, 2),
(140, 'Phần lớn thời gian', 2, 3),
(140, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 17 (Vietnamese) - SAS
(141, 'Không có', 0, 1),
(141, 'Đôi khi', 1, 2),
(141, 'Phần lớn thời gian', 2, 3),
(141, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 18 (Vietnamese) - SAS
(142, 'Không có', 0, 1),
(142, 'Đôi khi', 1, 2),
(142, 'Phần lớn thời gian', 2, 3),
(142, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 19 (Vietnamese) - SAS
(143, 'Không có', 0, 1),
(143, 'Đôi khi', 1, 2),
(143, 'Phần lớn thời gian', 2, 3),
(143, 'Hầu hết hoặc tất cả thời gian', 3, 4),
-- Question 20 (Vietnamese) - SAS
(144, 'Không có', 0, 1),
(144, 'Đôi khi', 1, 2),
(144, 'Phần lớn thời gian', 2, 3),
(144, 'Hầu hết hoặc tất cả thời gian', 3, 4);

-- Sample answer options for SAS questions (English)
INSERT INTO depression_question_options_en (question_id, option_text, option_value, `order`) VALUES
-- Question 1 (English) - SAS
(125, 'Not at all', 0, 1),
(125, 'Sometimes', 1, 2),
(125, 'Most of the time', 2, 3),
(125, 'Most or all of the time', 3, 4),
-- Question 2 (English) - SAS
(126, 'Not at all', 0, 1),
(126, 'Sometimes', 1, 2),
(126, 'Most of the time', 2, 3),
(126, 'Most or all of the time', 3, 4),
-- Question 3 (English) - SAS
(127, 'Not at all', 0, 1),
(127, 'Sometimes', 1, 2),
(127, 'Most of the time', 2, 3),
(127, 'Most or all of the time', 3, 4),
-- Question 4 (English) - SAS
(128, 'Not at all', 0, 1),
(128, 'Sometimes', 1, 2),
(128, 'Most of the time', 2, 3),
(128, 'Most or all of the time', 3, 4),
-- Question 5 (English) - SAS
(129, 'Not at all', 0, 1),
(129, 'Sometimes', 1, 2),
(129, 'Most of the time', 2, 3),
(129, 'Most or all of the time', 3, 4),
-- Question 6 (English) - SAS
(130, 'Not at all', 0, 1),
(130, 'Sometimes', 1, 2),
(130, 'Most of the time', 2, 3),
(130, 'Most or all of the time', 3, 4),
-- Question 7 (English) - SAS
(131, 'Not at all', 0, 1),
(131, 'Sometimes', 1, 2),
(131, 'Most of the time', 2, 3),
(131, 'Most or all of the time', 3, 4),
-- Question 8 (English) - SAS
(132, 'Not at all', 0, 1),
(132, 'Sometimes', 1, 2),
(132, 'Most of the time', 2, 3),
(132, 'Most or all of the time', 3, 4),
-- Question 9 (English) - SAS
(133, 'Not at all', 0, 1),
(133, 'Sometimes', 1, 2),
(133, 'Most of the time', 2, 3),
(133, 'Most or all of the time', 3, 4),
-- Question 10 (English) - SAS
(134, 'Not at all', 0, 1),
(134, 'Sometimes', 1, 2),
(134, 'Most of the time', 2, 3),
(134, 'Most or all of the time', 3, 4),
-- Question 11 (English) - SAS
(135, 'Not at all', 0, 1),
(135, 'Sometimes', 1, 2),
(135, 'Most of the time', 2, 3),
(135, 'Most or all of the time', 3, 4),
-- Question 12 (English) - SAS
(136, 'Not at all', 0, 1),
(136, 'Sometimes', 1, 2),
(136, 'Most of the time', 2, 3),
(136, 'Most or all of the time', 3, 4),
-- Question 13 (English) - SAS
(137, 'Not at all', 0, 1),
(137, 'Sometimes', 1, 2),
(137, 'Most of the time', 2, 3),
(137, 'Most or all of the time', 3, 4),
-- Question 14 (English) - SAS
(138, 'Not at all', 0, 1),
(138, 'Sometimes', 1, 2),
(138, 'Most of the time', 2, 3),
(138, 'Most or all of the time', 3, 4),
-- Question 15 (English) - SAS
(139, 'Not at all', 0, 1),
(139, 'Sometimes', 1, 2),
(139, 'Most of the time', 2, 3),
(139, 'Most or all of the time', 3, 4),
-- Question 16 (English) - SAS
(140, 'Not at all', 0, 1),
(140, 'Sometimes', 1, 2),
(140, 'Most of the time', 2, 3),
(140, 'Most or all of the time', 3, 4),
-- Question 17 (English) - SAS
(141, 'Not at all', 0, 1),
(141, 'Sometimes', 1, 2),
(141, 'Most of the time', 2, 3),
(141, 'Most or all of the time', 3, 4),
-- Question 18 (English) - SAS
(142, 'Not at all', 0, 1),
(142, 'Sometimes', 1, 2),
(142, 'Most of the time', 2, 3),
(142, 'Most or all of the time', 3, 4),
-- Question 19 (English) - SAS
(143, 'Not at all', 0, 1),
(143, 'Sometimes', 1, 2),
(143, 'Most of the time', 2, 3),
(143, 'Most or all of the time', 3, 4),
-- Question 20 (English) - SAS
(144, 'Not at all', 0, 1),
(144, 'Sometimes', 1, 2),
(144, 'Most of the time', 2, 3),
(144, 'Most or all of the time', 3, 4);

-- System Announcements (Thông báo hệ thống)
INSERT INTO system_announcements (title, content, announcement_type, is_active) VALUES
('Chào mừng đến với MindMeter', 'Hệ thống chuẩn đoán trầm cảm cho học sinh - sinh viên. Hãy làm bài test để đánh giá tình trạng tâm lý của bạn.', 'INFO', true),
('Lưu ý quan trọng', 'Kết quả test chỉ mang tính chất tham khảo. Nếu có dấu hiệu trầm cảm nặng, hãy liên hệ chuyên gia tâm lý ngay.', 'WARNING', true),
('Hướng dẫn sử dụng', 'Để có kết quả chính xác nhất, hãy trả lời các câu hỏi một cách trung thực và theo tình trạng thực tế trong 2 tuần qua.', 'GUIDE', true),
('Thông báo bảo trì', 'Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng ngày mai. Xin lỗi vì sự bất tiện.', 'INFO', true),
('Khuyến mãi tư vấn', 'Miễn phí tư vấn tâm lý cho 50 học sinh đầu tiên đăng ký trong tháng này.', 'INFO', true),
('Cảnh báo bảo mật', 'Vui lòng không chia sẻ mật khẩu tài khoản cho bất kỳ ai để đảm bảo an toàn thông tin.', 'WARNING', true),
('Chính sách bảo mật mới', 'Chúng tôi vừa cập nhật chính sách bảo mật. Vui lòng đọc kỹ để bảo vệ quyền lợi của bạn.', 'INFO', true),
('Hỗ trợ 24/7', 'Đội ngũ chuyên gia của MindMeter luôn sẵn sàng hỗ trợ bạn 24/7 qua email và hotline.', 'GUIDE', true),
('Thông báo cập nhật tính năng', 'Hệ thống vừa bổ sung tính năng chat trực tuyến với chuyên gia.', 'INFO', true),
('Khuyến mãi tháng 7', 'Nhận ưu đãi giảm 20% phí tư vấn cho học sinh đăng ký mới trong tháng 7.', 'INFO', true),
('Thông báo sự kiện', 'Tham gia sự kiện "Ngày hội sức khỏe tâm thần" để nhận nhiều phần quà hấp dẫn.', 'INFO', true),
('Cảnh báo giả mạo', 'Cảnh báo: Có đối tượng giả mạo chuyên gia MindMeter để lừa đảo. Vui lòng xác thực thông tin trước khi liên hệ.', 'WARNING', true),
('Hướng dẫn đổi mật khẩu', 'Bạn nên đổi mật khẩu định kỳ để bảo vệ tài khoản cá nhân.', 'GUIDE', true),
('Thông báo nghỉ lễ', 'Hệ thống sẽ tạm nghỉ dịp lễ Quốc khánh 2/9. Chúc bạn kỳ nghỉ vui vẻ!', 'INFO', true),
('Khuyến mãi học bổng', 'Cơ hội nhận học bổng 100% phí tư vấn cho 10 học sinh xuất sắc nhất.', 'INFO', true),
('Thông báo bảo trì định kỳ', 'Hệ thống sẽ bảo trì định kỳ vào chủ nhật hàng tuần từ 1:00 - 3:00 sáng.', 'INFO', true),
('Cảnh báo spam', 'Vui lòng không gửi spam hoặc nội dung không phù hợp trên hệ thống.', 'WARNING', true),
('Hướng dẫn liên hệ chuyên gia', 'Bạn có thể đặt lịch hẹn với chuyên gia qua mục "Tư vấn" trên hệ thống.', 'GUIDE', true),
('Thông báo cập nhật giao diện', 'Giao diện mới của MindMeter đã chính thức ra mắt với nhiều cải tiến.', 'INFO', true),
('Khuyến mãi mùa thi', 'Giảm 30% phí tư vấn cho học sinh tham gia test trong mùa thi.', 'INFO', true);

-- ========================================
-- 7. STATISTICS & VERIFICATION
-- ========================================

-- Hiển thị thống kê tổng quan
SELECT 'Users' as Table_Name, COUNT(*) as Count FROM users
UNION ALL
SELECT 'Depression Questions (Vietnamese)', COUNT(*) FROM depression_questions_vi
UNION ALL
SELECT 'Depression Questions (English)', COUNT(*) FROM depression_questions_en
UNION ALL
SELECT 'Depression Question Options (Vietnamese)', COUNT(*) FROM depression_question_options_vi
UNION ALL
SELECT 'Depression Question Options (English)', COUNT(*) FROM depression_question_options_en
UNION ALL
SELECT 'Test Results', COUNT(*) FROM depression_test_results
UNION ALL
SELECT 'Test Answers', COUNT(*) FROM depression_test_answers
UNION ALL
SELECT 'Expert Notes', COUNT(*) FROM expert_notes
UNION ALL
SELECT 'Advice Messages', COUNT(*) FROM advice_messages
UNION ALL
SELECT 'System Announcements', COUNT(*) FROM system_announcements;

-- Hiển thị phân bố mức độ trầm cảm
SELECT 
    severity_level as 'Mức độ trầm cảm',
    COUNT(*) as 'Số lượng',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM depression_test_results), 2) as 'Tỷ lệ (%)'
FROM depression_test_results 
GROUP BY severity_level 
ORDER BY 
    CASE severity_level 
        WHEN 'MINIMAL' THEN 1 
        WHEN 'MILD' THEN 2 
        WHEN 'MODERATE' THEN 3 
        WHEN 'SEVERE' THEN 4 
    END;

-- Depression Test Results (Kết quả test mẫu) - 60 samples
-- ========================================
-- DASS-21 Test Results (10 samples)
-- ========================================
-- Student 1 - DASS-21 Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(5, 2, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-21', 'vi'),
(5, 8, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-21', 'vi'),
(5, 15, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'DASS-21', 'vi'),
(5, 25, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'DASS-21', 'vi');

-- Student 2 - DASS-21 Tests  
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(6, 5, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-21', 'vi'),
(6, 12, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-21', 'vi'),
(6, 18, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'DASS-21', 'vi'),
(6, 30, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'DASS-21', 'vi');

-- Student 3 - DASS-21 Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(7, 3, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-21', 'vi'),
(7, 10, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 4 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-21', 'vi');

-- ========================================
-- DASS-42 Test Results (10 samples)
-- ========================================
-- Student 4 - DASS-42 Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(8, 8, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-42', 'vi'),
(8, 20, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-42', 'vi'),
(8, 35, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'DASS-42', 'vi'),
(8, 55, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'DASS-42', 'vi');

-- Student 5 - DASS-42 Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(9, 12, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 11 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-42', 'vi'),
(9, 28, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-42', 'vi'),
(9, 42, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'DASS-42', 'vi'),
(9, 65, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'DASS-42', 'vi');

-- Student 6 - DASS-42 Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(10, 15, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-42', 'vi'),
(10, 32, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-42', 'vi');

-- ========================================
-- BDI Test Results (10 samples)
-- ========================================
-- Student 7 - BDI Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(11, 5, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'BDI', 'vi'),
(11, 15, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'BDI', 'vi'),
(11, 30, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'BDI', 'vi'),
(11, 50, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 4 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'BDI', 'vi');

-- Student 8 - BDI Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(12, 8, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'BDI', 'vi'),
(12, 20, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 11 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'BDI', 'vi'),
(12, 38, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'BDI', 'vi'),
(12, 60, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'BDI', 'vi');

-- Student 9 - BDI Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(13, 10, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 13 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'BDI', 'vi'),
(13, 25, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'BDI', 'vi');

-- ========================================
-- RADS Test Results (10 samples)
-- ========================================
-- Student 10 - RADS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(14, 10, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 18 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'RADS', 'vi'),
(14, 25, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'RADS', 'vi'),
(14, 45, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'RADS', 'vi'),
(14, 70, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'RADS', 'vi');

-- Student 11 - RADS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(15, 15, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 17 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'RADS', 'vi'),
(15, 30, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'RADS', 'vi'),
(15, 52, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'RADS', 'vi'),
(15, 75, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'RADS', 'vi');

-- Student 12 - RADS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(16, 12, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 16 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'RADS', 'vi'),
(16, 28, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 13 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'RADS', 'vi');

-- ========================================
-- EPDS Test Results (10 samples)
-- ========================================
-- Student 13 - EPDS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(17, 3, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 20 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'EPDS', 'vi'),
(17, 8, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 17 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'EPDS', 'vi'),
(17, 15, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'EPDS', 'vi'),
(17, 25, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'EPDS', 'vi');

-- Student 14 - EPDS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(18, 5, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 19 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'EPDS', 'vi'),
(18, 12, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 16 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'EPDS', 'vi'),
(18, 18, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'EPDS', 'vi'),
(18, 28, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'EPDS', 'vi');

-- Student 15 - EPDS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(19, 4, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 18 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'EPDS', 'vi'),
(19, 10, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'EPDS', 'vi');

-- ========================================
-- SAS Test Results (10 samples)
-- ========================================
-- Student 16 - SAS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(20, 15, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 22 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'SAS', 'vi'),
(20, 35, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 19 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'SAS', 'vi'),
(20, 55, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 16 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'SAS', 'vi'),
(20, 75, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'SAS', 'vi');

-- Student 17 - SAS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(21, 20, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 21 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'SAS', 'vi'),
(21, 40, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 18 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'SAS', 'vi'),
(21, 60, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'SAS', 'vi'),
(21, 80, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'SAS', 'vi');

-- Student 18 - SAS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(22, 18, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 20 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'SAS', 'vi'),
(22, 38, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 17 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'SAS', 'vi');

-- ========================================
-- BDI Test Answers (21 câu hỏi)
-- ========================================
-- Student 7 - BDI Test 1 (Score: 5)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(21, 64, 0, 'vi', 'depression_questions_vi'), (21, 65, 0, 'vi', 'depression_questions_vi'), (21, 66, 0, 'vi', 'depression_questions_vi'), (21, 67, 0, 'vi', 'depression_questions_vi'), (21, 68, 0, 'vi', 'depression_questions_vi'), (21, 69, 0, 'vi', 'depression_questions_vi'), (21, 70, 0, 'vi', 'depression_questions_vi'), (21, 71, 0, 'vi', 'depression_questions_vi'), (21, 72, 0, 'vi', 'depression_questions_vi'), (21, 73, 0, 'vi', 'depression_questions_vi'),
(21, 74, 0, 'vi', 'depression_questions_vi'), (21, 75, 0, 'vi', 'depression_questions_vi'), (21, 76, 0, 'vi', 'depression_questions_vi'), (21, 77, 0, 'vi', 'depression_questions_vi'), (21, 78, 0, 'vi', 'depression_questions_vi'), (21, 79, 0, 'vi', 'depression_questions_vi'), (21, 80, 0, 'vi', 'depression_questions_vi'), (21, 81, 0, 'vi', 'depression_questions_vi'), (21, 82, 0, 'vi', 'depression_questions_vi'), (21, 83, 0, 'vi', 'depression_questions_vi'), (21, 84, 0, 'vi', 'depression_questions_vi');

-- Student 7 - BDI Test 2 (Score: 15)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(22, 64, 1, 'vi', 'depression_questions_vi'), (22, 65, 1, 'vi', 'depression_questions_vi'), (22, 66, 1, 'vi', 'depression_questions_vi'), (22, 67, 1, 'vi', 'depression_questions_vi'), (22, 68, 1, 'vi', 'depression_questions_vi'), (22, 69, 0, 'vi', 'depression_questions_vi'), (22, 70, 1, 'vi', 'depression_questions_vi'), (22, 71, 1, 'vi', 'depression_questions_vi'), (22, 72, 0, 'vi', 'depression_questions_vi'), (22, 73, 1, 'vi', 'depression_questions_vi'),
(22, 74, 1, 'vi', 'depression_questions_vi'), (22, 75, 1, 'vi', 'depression_questions_vi'), (22, 76, 1, 'vi', 'depression_questions_vi'), (22, 77, 1, 'vi', 'depression_questions_vi'), (22, 78, 1, 'vi', 'depression_questions_vi'), (22, 79, 0, 'vi', 'depression_questions_vi'), (22, 80, 1, 'vi', 'depression_questions_vi'), (22, 81, 1, 'vi', 'depression_questions_vi'), (22, 82, 0, 'vi', 'depression_questions_vi'), (22, 83, 1, 'vi', 'depression_questions_vi'), (22, 84, 0, 'vi', 'depression_questions_vi');

-- Student 7 - BDI Test 3 (Score: 30)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(23, 64, 2, 'vi', 'depression_questions_vi'), (23, 65, 2, 'vi', 'depression_questions_vi'), (23, 66, 2, 'vi', 'depression_questions_vi'), (23, 67, 2, 'vi', 'depression_questions_vi'), (23, 68, 2, 'vi', 'depression_questions_vi'), (23, 69, 1, 'vi', 'depression_questions_vi'), (23, 70, 2, 'vi', 'depression_questions_vi'), (23, 71, 2, 'vi', 'depression_questions_vi'), (23, 72, 1, 'vi', 'depression_questions_vi'), (23, 73, 2, 'vi', 'depression_questions_vi'),
(23, 74, 2, 'vi', 'depression_questions_vi'), (23, 75, 2, 'vi', 'depression_questions_vi'), (23, 76, 2, 'vi', 'depression_questions_vi'), (23, 77, 2, 'vi', 'depression_questions_vi'), (23, 78, 2, 'vi', 'depression_questions_vi'), (23, 79, 1, 'vi', 'depression_questions_vi'), (23, 80, 2, 'vi', 'depression_questions_vi'), (23, 81, 2, 'vi', 'depression_questions_vi'), (23, 82, 1, 'vi', 'depression_questions_vi'), (23, 83, 2, 'vi', 'depression_questions_vi'), (23, 84, 1, 'vi', 'depression_questions_vi');

-- Student 7 - BDI Test 4 (Score: 50)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(24, 64, 3, 'vi', 'depression_questions_vi'), (24, 65, 3, 'vi', 'depression_questions_vi'), (24, 66, 3, 'vi', 'depression_questions_vi'), (24, 67, 3, 'vi', 'depression_questions_vi'), (24, 68, 3, 'vi', 'depression_questions_vi'), (24, 69, 2, 'vi', 'depression_questions_vi'), (24, 70, 3, 'vi', 'depression_questions_vi'), (24, 71, 3, 'vi', 'depression_questions_vi'), (24, 72, 2, 'vi', 'depression_questions_vi'), (24, 73, 3, 'vi', 'depression_questions_vi'),
(24, 74, 3, 'vi', 'depression_questions_vi'), (24, 75, 3, 'vi', 'depression_questions_vi'), (24, 76, 3, 'vi', 'depression_questions_vi'), (24, 77, 3, 'vi', 'depression_questions_vi'), (24, 78, 3, 'vi', 'depression_questions_vi'), (24, 79, 2, 'vi', 'depression_questions_vi'), (24, 80, 3, 'vi', 'depression_questions_vi'), (24, 81, 3, 'vi', 'depression_questions_vi'), (24, 82, 2, 'vi', 'depression_questions_vi'), (24, 83, 3, 'vi', 'depression_questions_vi'), (24, 84, 2, 'vi', 'depression_questions_vi');

-- Student 8 - BDI Test 1 (Score: 8)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(25, 64, 1, 'vi', 'depression_questions_vi'), (25, 65, 0, 'vi', 'depression_questions_vi'), (25, 66, 1, 'vi', 'depression_questions_vi'), (25, 67, 0, 'vi', 'depression_questions_vi'), (25, 68, 1, 'vi', 'depression_questions_vi'), (25, 69, 0, 'vi', 'depression_questions_vi'), (25, 70, 1, 'vi', 'depression_questions_vi'), (25, 71, 1, 'vi', 'depression_questions_vi'), (25, 72, 0, 'vi', 'depression_questions_vi'), (25, 73, 1, 'vi', 'depression_questions_vi'),
(25, 74, 0, 'vi', 'depression_questions_vi'), (25, 75, 1, 'vi', 'depression_questions_vi'), (25, 76, 0, 'vi', 'depression_questions_vi'), (25, 77, 1, 'vi', 'depression_questions_vi'), (25, 78, 0, 'vi', 'depression_questions_vi'), (25, 79, 0, 'vi', 'depression_questions_vi'), (25, 80, 1, 'vi', 'depression_questions_vi'), (25, 81, 0, 'vi', 'depression_questions_vi'), (25, 82, 0, 'vi', 'depression_questions_vi'), (25, 83, 1, 'vi', 'depression_questions_vi'), (25, 84, 0, 'vi', 'depression_questions_vi');

-- Student 8 - BDI Test 2 (Score: 20)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(26, 64, 2, 'vi', 'depression_questions_vi'), (26, 65, 1, 'vi', 'depression_questions_vi'), (26, 66, 2, 'vi', 'depression_questions_vi'), (26, 67, 1, 'vi', 'depression_questions_vi'), (26, 68, 2, 'vi', 'depression_questions_vi'), (26, 69, 0, 'vi', 'depression_questions_vi'), (26, 70, 2, 'vi', 'depression_questions_vi'), (26, 71, 2, 'vi', 'depression_questions_vi'), (26, 72, 1, 'vi', 'depression_questions_vi'), (26, 73, 2, 'vi', 'depression_questions_vi'),
(26, 74, 1, 'vi', 'depression_questions_vi'), (26, 75, 2, 'vi', 'depression_questions_vi'), (26, 76, 1, 'vi', 'depression_questions_vi'), (26, 77, 2, 'vi', 'depression_questions_vi'), (26, 78, 1, 'vi', 'depression_questions_vi'), (26, 79, 0, 'vi', 'depression_questions_vi'), (26, 80, 2, 'vi', 'depression_questions_vi'), (26, 81, 1, 'vi', 'depression_questions_vi'), (26, 82, 0, 'vi', 'depression_questions_vi'), (26, 83, 2, 'vi', 'depression_questions_vi'), (26, 84, 1, 'vi', 'depression_questions_vi');

-- Student 8 - BDI Test 3 (Score: 38)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(27, 64, 3, 'vi', 'depression_questions_vi'), (27, 65, 2, 'vi', 'depression_questions_vi'), (27, 66, 3, 'vi', 'depression_questions_vi'), (27, 67, 2, 'vi', 'depression_questions_vi'), (27, 68, 3, 'vi', 'depression_questions_vi'), (27, 69, 1, 'vi', 'depression_questions_vi'), (27, 70, 3, 'vi', 'depression_questions_vi'), (27, 71, 3, 'vi', 'depression_questions_vi'), (27, 72, 2, 'vi', 'depression_questions_vi'), (27, 73, 3, 'vi', 'depression_questions_vi'),
(27, 74, 2, 'vi', 'depression_questions_vi'), (27, 75, 3, 'vi', 'depression_questions_vi'), (27, 76, 2, 'vi', 'depression_questions_vi'), (27, 77, 3, 'vi', 'depression_questions_vi'), (27, 78, 2, 'vi', 'depression_questions_vi'), (27, 79, 1, 'vi', 'depression_questions_vi'), (27, 80, 3, 'vi', 'depression_questions_vi'), (27, 81, 2, 'vi', 'depression_questions_vi'), (27, 82, 1, 'vi', 'depression_questions_vi'), (27, 83, 3, 'vi', 'depression_questions_vi'), (27, 84, 2, 'vi', 'depression_questions_vi');

-- Student 8 - BDI Test 4 (Score: 60)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(28, 64, 4, 'vi', 'depression_questions_vi'), (28, 65, 3, 'vi', 'depression_questions_vi'), (28, 66, 4, 'vi', 'depression_questions_vi'), (28, 67, 3, 'vi', 'depression_questions_vi'), (28, 68, 4, 'vi', 'depression_questions_vi'), (28, 69, 2, 'vi', 'depression_questions_vi'), (28, 70, 4, 'vi', 'depression_questions_vi'), (28, 71, 4, 'vi', 'depression_questions_vi'), (28, 72, 3, 'vi', 'depression_questions_vi'), (28, 73, 4, 'vi', 'depression_questions_vi'),
(28, 74, 3, 'vi', 'depression_questions_vi'), (28, 75, 4, 'vi', 'depression_questions_vi'), (28, 76, 3, 'vi', 'depression_questions_vi'), (28, 77, 4, 'vi', 'depression_questions_vi'), (28, 78, 3, 'vi', 'depression_questions_vi'), (28, 79, 2, 'vi', 'depression_questions_vi'), (28, 80, 4, 'vi', 'depression_questions_vi'), (28, 81, 3, 'vi', 'depression_questions_vi'), (28, 82, 2, 'vi', 'depression_questions_vi'), (28, 83, 4, 'vi', 'depression_questions_vi'), (28, 84, 3, 'vi', 'depression_questions_vi');

-- Student 9 - BDI Test 1 (Score: 10)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(29, 64, 1, 'vi', 'depression_questions_vi'), (29, 65, 1, 'vi', 'depression_questions_vi'), (29, 66, 1, 'vi', 'depression_questions_vi'), (29, 67, 1, 'vi', 'depression_questions_vi'), (29, 68, 1, 'vi', 'depression_questions_vi'), (29, 69, 0, 'vi', 'depression_questions_vi'), (29, 70, 1, 'vi', 'depression_questions_vi'), (29, 71, 1, 'vi', 'depression_questions_vi'), (29, 72, 0, 'vi', 'depression_questions_vi'), (29, 73, 1, 'vi', 'depression_questions_vi'),
(29, 74, 1, 'vi', 'depression_questions_vi'), (29, 75, 1, 'vi', 'depression_questions_vi'), (29, 76, 1, 'vi', 'depression_questions_vi'), (29, 77, 1, 'vi', 'depression_questions_vi'), (29, 78, 1, 'vi', 'depression_questions_vi'), (29, 79, 0, 'vi', 'depression_questions_vi'), (29, 80, 1, 'vi', 'depression_questions_vi'), (29, 81, 1, 'vi', 'depression_questions_vi'), (29, 82, 0, 'vi', 'depression_questions_vi'), (29, 83, 1, 'vi', 'depression_questions_vi'), (29, 84, 0, 'vi', 'depression_questions_vi');

-- Student 9 - BDI Test 2 (Score: 25)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(30, 64, 2, 'vi', 'depression_questions_vi'), (30, 65, 2, 'vi', 'depression_questions_vi'), (30, 66, 2, 'vi', 'depression_questions_vi'), (30, 67, 2, 'vi', 'depression_questions_vi'), (30, 68, 2, 'vi', 'depression_questions_vi'), (30, 69, 1, 'vi', 'depression_questions_vi'), (30, 70, 2, 'vi', 'depression_questions_vi'), (30, 71, 2, 'vi', 'depression_questions_vi'), (30, 72, 1, 'vi', 'depression_questions_vi'), (30, 73, 2, 'vi', 'depression_questions_vi'),
(30, 74, 2, 'vi', 'depression_questions_vi'), (30, 75, 2, 'vi', 'depression_questions_vi'), (30, 76, 2, 'vi', 'depression_questions_vi'), (30, 77, 2, 'vi', 'depression_questions_vi'), (30, 78, 2, 'vi', 'depression_questions_vi'), (30, 79, 1, 'vi', 'depression_questions_vi'), (30, 80, 2, 'vi', 'depression_questions_vi'), (30, 81, 2, 'vi', 'depression_questions_vi'), (30, 82, 1, 'vi', 'depression_questions_vi'), (30, 83, 2, 'vi', 'depression_questions_vi'), (30, 84, 1, 'vi', 'depression_questions_vi');

-- ========================================
-- RADS Test Answers (30 câu hỏi)
-- ========================================
-- Student 10 - RADS Test 1 (Score: 10)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(31, 85, 0, 'vi', 'depression_questions_vi'), (31, 86, 0, 'vi', 'depression_questions_vi'), (31, 87, 0, 'vi', 'depression_questions_vi'), (31, 88, 0, 'vi', 'depression_questions_vi'), (31, 89, 0, 'vi', 'depression_questions_vi'), (31, 90, 0, 'vi', 'depression_questions_vi'), (31, 91, 0, 'vi', 'depression_questions_vi'), (31, 92, 0, 'vi', 'depression_questions_vi'), (31, 93, 0, 'vi', 'depression_questions_vi'), (31, 94, 0, 'vi', 'depression_questions_vi'),
(31, 95, 0, 'vi', 'depression_questions_vi'), (31, 96, 0, 'vi', 'depression_questions_vi'), (31, 97, 0, 'vi', 'depression_questions_vi'), (31, 98, 0, 'vi', 'depression_questions_vi'), (31, 99, 0, 'vi', 'depression_questions_vi'), (31, 100, 0, 'vi', 'depression_questions_vi'), (31, 101, 0, 'vi', 'depression_questions_vi'), (31, 102, 0, 'vi', 'depression_questions_vi'), (31, 103, 0, 'vi', 'depression_questions_vi'), (31, 104, 0, 'vi', 'depression_questions_vi'),
(31, 105, 0, 'vi', 'depression_questions_vi'), (31, 106, 0, 'vi', 'depression_questions_vi'), (31, 107, 0, 'vi', 'depression_questions_vi'), (31, 108, 0, 'vi', 'depression_questions_vi'), (31, 109, 0, 'vi', 'depression_questions_vi'), (31, 110, 0, 'vi', 'depression_questions_vi'), (31, 111, 0, 'vi', 'depression_questions_vi'), (31, 112, 0, 'vi', 'depression_questions_vi'), (31, 113, 0, 'vi', 'depression_questions_vi'), (31, 114, 0, 'vi', 'depression_questions_vi');

-- Student 10 - RADS Test 2 (Score: 25)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(32, 85, 1, 'vi', 'depression_questions_vi'), (32, 86, 1, 'vi', 'depression_questions_vi'), (32, 87, 1, 'vi', 'depression_questions_vi'), (32, 88, 1, 'vi', 'depression_questions_vi'), (32, 89, 1, 'vi', 'depression_questions_vi'), (32, 90, 1, 'vi', 'depression_questions_vi'), (32, 91, 1, 'vi', 'depression_questions_vi'), (32, 92, 1, 'vi', 'depression_questions_vi'), (32, 93, 1, 'vi', 'depression_questions_vi'), (32, 94, 1, 'vi', 'depression_questions_vi'),
(32, 95, 1, 'vi', 'depression_questions_vi'), (32, 96, 1, 'vi', 'depression_questions_vi'), (32, 97, 1, 'vi', 'depression_questions_vi'), (32, 98, 1, 'vi', 'depression_questions_vi'), (32, 99, 1, 'vi', 'depression_questions_vi'), (32, 100, 1, 'vi', 'depression_questions_vi'), (32, 101, 1, 'vi', 'depression_questions_vi'), (32, 102, 1, 'vi', 'depression_questions_vi'), (32, 103, 1, 'vi', 'depression_questions_vi'), (32, 104, 1, 'vi', 'depression_questions_vi'),
(32, 105, 1, 'vi', 'depression_questions_vi'), (32, 106, 1, 'vi', 'depression_questions_vi'), (32, 107, 1, 'vi', 'depression_questions_vi'), (32, 108, 1, 'vi', 'depression_questions_vi'), (32, 109, 1, 'vi', 'depression_questions_vi'), (32, 110, 1, 'vi', 'depression_questions_vi'), (32, 111, 1, 'vi', 'depression_questions_vi'), (32, 112, 1, 'vi', 'depression_questions_vi'), (32, 113, 1, 'vi', 'depression_questions_vi'), (32, 114, 1, 'vi', 'depression_questions_vi');

-- Student 10 - RADS Test 3 (Score: 45)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(33, 85, 2, 'vi', 'depression_questions_vi'), (33, 86, 2, 'vi', 'depression_questions_vi'), (33, 87, 2, 'vi', 'depression_questions_vi'), (33, 88, 2, 'vi', 'depression_questions_vi'), (33, 89, 2, 'vi', 'depression_questions_vi'), (33, 90, 2, 'vi', 'depression_questions_vi'), (33, 91, 2, 'vi', 'depression_questions_vi'), (33, 92, 2, 'vi', 'depression_questions_vi'), (33, 93, 2, 'vi', 'depression_questions_vi'), (33, 94, 2, 'vi', 'depression_questions_vi'),
(33, 95, 2, 'vi', 'depression_questions_vi'), (33, 96, 2, 'vi', 'depression_questions_vi'), (33, 97, 2, 'vi', 'depression_questions_vi'), (33, 98, 2, 'vi', 'depression_questions_vi'), (33, 99, 2, 'vi', 'depression_questions_vi'), (33, 100, 2, 'vi', 'depression_questions_vi'), (33, 101, 2, 'vi', 'depression_questions_vi'), (33, 102, 2, 'vi', 'depression_questions_vi'), (33, 103, 2, 'vi', 'depression_questions_vi'), (33, 104, 2, 'vi', 'depression_questions_vi'),
(33, 105, 2, 'vi', 'depression_questions_vi'), (33, 106, 2, 'vi', 'depression_questions_vi'), (33, 107, 2, 'vi', 'depression_questions_vi'), (33, 108, 2, 'vi', 'depression_questions_vi'), (33, 109, 2, 'vi', 'depression_questions_vi'), (33, 110, 2, 'vi', 'depression_questions_vi'), (33, 111, 2, 'vi', 'depression_questions_vi'), (33, 112, 2, 'vi', 'depression_questions_vi'), (33, 113, 2, 'vi', 'depression_questions_vi'), (33, 114, 2, 'vi', 'depression_questions_vi');

-- Student 10 - RADS Test 4 (Score: 70)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(34, 85, 3, 'vi', 'depression_questions_vi'), (34, 86, 3, 'vi', 'depression_questions_vi'), (34, 87, 3, 'vi', 'depression_questions_vi'), (34, 88, 3, 'vi', 'depression_questions_vi'), (34, 89, 3, 'vi', 'depression_questions_vi'), (34, 90, 3, 'vi', 'depression_questions_vi'), (34, 91, 3, 'vi', 'depression_questions_vi'), (34, 92, 3, 'vi', 'depression_questions_vi'), (34, 93, 3, 'vi', 'depression_questions_vi'), (34, 94, 3, 'vi', 'depression_questions_vi'),
(34, 95, 3, 'vi', 'depression_questions_vi'), (34, 96, 3, 'vi', 'depression_questions_vi'), (34, 97, 3, 'vi', 'depression_questions_vi'), (34, 98, 3, 'vi', 'depression_questions_vi'), (34, 99, 3, 'vi', 'depression_questions_vi'), (34, 100, 3, 'vi', 'depression_questions_vi'), (34, 101, 3, 'vi', 'depression_questions_vi'), (34, 102, 3, 'vi', 'depression_questions_vi'), (34, 103, 3, 'vi', 'depression_questions_vi'), (34, 104, 3, 'vi', 'depression_questions_vi'),
(34, 105, 3, 'vi', 'depression_questions_vi'), (34, 106, 3, 'vi', 'depression_questions_vi'), (34, 107, 3, 'vi', 'depression_questions_vi'), (34, 108, 3, 'vi', 'depression_questions_vi'), (34, 109, 3, 'vi', 'depression_questions_vi'), (34, 110, 3, 'vi', 'depression_questions_vi'), (34, 111, 3, 'vi', 'depression_questions_vi'), (34, 112, 3, 'vi', 'depression_questions_vi'), (34, 113, 3, 'vi', 'depression_questions_vi'), (34, 114, 3, 'vi', 'depression_questions_vi');

-- Student 11 - RADS Test 1 (Score: 15)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(35, 85, 1, 'vi', 'depression_questions_vi'), (35, 86, 1, 'vi', 'depression_questions_vi'), (35, 87, 1, 'vi', 'depression_questions_vi'), (35, 88, 1, 'vi', 'depression_questions_vi'), (35, 89, 1, 'vi', 'depression_questions_vi'), (35, 90, 1, 'vi', 'depression_questions_vi'), (35, 91, 1, 'vi', 'depression_questions_vi'), (35, 92, 1, 'vi', 'depression_questions_vi'), (35, 93, 1, 'vi', 'depression_questions_vi'), (35, 94, 1, 'vi', 'depression_questions_vi'),
(35, 95, 1, 'vi', 'depression_questions_vi'), (35, 96, 1, 'vi', 'depression_questions_vi'), (35, 97, 1, 'vi', 'depression_questions_vi'), (35, 98, 1, 'vi', 'depression_questions_vi'), (35, 99, 1, 'vi', 'depression_questions_vi'), (35, 100, 1, 'vi', 'depression_questions_vi'), (35, 101, 1, 'vi', 'depression_questions_vi'), (35, 102, 1, 'vi', 'depression_questions_vi'), (35, 103, 1, 'vi', 'depression_questions_vi'), (35, 104, 1, 'vi', 'depression_questions_vi'),
(35, 105, 1, 'vi', 'depression_questions_vi'), (35, 106, 1, 'vi', 'depression_questions_vi'), (35, 107, 1, 'vi', 'depression_questions_vi'), (35, 108, 1, 'vi', 'depression_questions_vi'), (35, 109, 1, 'vi', 'depression_questions_vi'), (35, 110, 1, 'vi', 'depression_questions_vi'), (35, 111, 1, 'vi', 'depression_questions_vi'), (35, 112, 1, 'vi', 'depression_questions_vi'), (35, 113, 1, 'vi', 'depression_questions_vi'), (35, 114, 1, 'vi', 'depression_questions_vi');

-- Student 11 - RADS Test 2 (Score: 30)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(36, 85, 2, 'vi', 'depression_questions_vi'), (36, 86, 2, 'vi', 'depression_questions_vi'), (36, 87, 2, 'vi', 'depression_questions_vi'), (36, 88, 2, 'vi', 'depression_questions_vi'), (36, 89, 2, 'vi', 'depression_questions_vi'), (36, 90, 2, 'vi', 'depression_questions_vi'), (36, 91, 2, 'vi', 'depression_questions_vi'), (36, 92, 2, 'vi', 'depression_questions_vi'), (36, 93, 2, 'vi', 'depression_questions_vi'), (36, 94, 2, 'vi', 'depression_questions_vi'),
(36, 95, 2, 'vi', 'depression_questions_vi'), (36, 96, 2, 'vi', 'depression_questions_vi'), (36, 97, 2, 'vi', 'depression_questions_vi'), (36, 98, 2, 'vi', 'depression_questions_vi'), (36, 99, 2, 'vi', 'depression_questions_vi'), (36, 100, 2, 'vi', 'depression_questions_vi'), (36, 101, 2, 'vi', 'depression_questions_vi'), (36, 102, 2, 'vi', 'depression_questions_vi'), (36, 103, 2, 'vi', 'depression_questions_vi'), (36, 104, 2, 'vi', 'depression_questions_vi'),
(36, 105, 2, 'vi', 'depression_questions_vi'), (36, 106, 2, 'vi', 'depression_questions_vi'), (36, 107, 2, 'vi', 'depression_questions_vi'), (36, 108, 2, 'vi', 'depression_questions_vi'), (36, 109, 2, 'vi', 'depression_questions_vi'), (36, 110, 2, 'vi', 'depression_questions_vi'), (36, 111, 2, 'vi', 'depression_questions_vi'), (36, 112, 2, 'vi', 'depression_questions_vi'), (36, 113, 2, 'vi', 'depression_questions_vi'), (36, 114, 2, 'vi', 'depression_questions_vi');

-- Student 11 - RADS Test 3 (Score: 52)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(37, 85, 3, 'vi', 'depression_questions_vi'), (37, 86, 3, 'vi', 'depression_questions_vi'), (37, 87, 3, 'vi', 'depression_questions_vi'), (37, 88, 3, 'vi', 'depression_questions_vi'), (37, 89, 3, 'vi', 'depression_questions_vi'), (37, 90, 3, 'vi', 'depression_questions_vi'), (37, 91, 3, 'vi', 'depression_questions_vi'), (37, 92, 3, 'vi', 'depression_questions_vi'), (37, 93, 3, 'vi', 'depression_questions_vi'), (37, 94, 3, 'vi', 'depression_questions_vi'),
(37, 95, 3, 'vi', 'depression_questions_vi'), (37, 96, 3, 'vi', 'depression_questions_vi'), (37, 97, 3, 'vi', 'depression_questions_vi'), (37, 98, 3, 'vi', 'depression_questions_vi'), (37, 99, 3, 'vi', 'depression_questions_vi'), (37, 100, 3, 'vi', 'depression_questions_vi'), (37, 101, 3, 'vi', 'depression_questions_vi'), (37, 102, 3, 'vi', 'depression_questions_vi'), (37, 103, 3, 'vi', 'depression_questions_vi'), (37, 104, 3, 'vi', 'depression_questions_vi'),
(37, 105, 3, 'vi', 'depression_questions_vi'), (37, 106, 3, 'vi', 'depression_questions_vi'), (37, 107, 3, 'vi', 'depression_questions_vi'), (37, 108, 3, 'vi', 'depression_questions_vi'), (37, 109, 3, 'vi', 'depression_questions_vi'), (37, 110, 3, 'vi', 'depression_questions_vi'), (37, 111, 3, 'vi', 'depression_questions_vi'), (37, 112, 3, 'vi', 'depression_questions_vi'), (37, 113, 3, 'vi', 'depression_questions_vi'), (37, 114, 3, 'vi', 'depression_questions_vi');

-- Student 11 - RADS Test 4 (Score: 75)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(38, 85, 4, 'vi', 'depression_questions_vi'), (38, 86, 4, 'vi', 'depression_questions_vi'), (38, 87, 4, 'vi', 'depression_questions_vi'), (38, 88, 4, 'vi', 'depression_questions_vi'), (38, 89, 4, 'vi', 'depression_questions_vi'), (38, 90, 4, 'vi', 'depression_questions_vi'), (38, 91, 4, 'vi', 'depression_questions_vi'), (38, 92, 4, 'vi', 'depression_questions_vi'), (38, 93, 4, 'vi', 'depression_questions_vi'), (38, 94, 4, 'vi', 'depression_questions_vi'),
(38, 95, 4, 'vi', 'depression_questions_vi'), (38, 96, 4, 'vi', 'depression_questions_vi'), (38, 97, 4, 'vi', 'depression_questions_vi'), (38, 98, 4, 'vi', 'depression_questions_vi'), (38, 99, 4, 'vi', 'depression_questions_vi'), (38, 100, 4, 'vi', 'depression_questions_vi'), (38, 101, 4, 'vi', 'depression_questions_vi'), (38, 102, 4, 'vi', 'depression_questions_vi'), (38, 103, 4, 'vi', 'depression_questions_vi'), (38, 104, 4, 'vi', 'depression_questions_vi'),
(38, 105, 4, 'vi', 'depression_questions_vi'), (38, 106, 4, 'vi', 'depression_questions_vi'), (38, 107, 4, 'vi', 'depression_questions_vi'), (38, 108, 4, 'vi', 'depression_questions_vi'), (38, 109, 4, 'vi', 'depression_questions_vi'), (38, 110, 4, 'vi', 'depression_questions_vi'), (38, 111, 4, 'vi', 'depression_questions_vi'), (38, 112, 4, 'vi', 'depression_questions_vi'), (38, 113, 4, 'vi', 'depression_questions_vi'), (38, 114, 4, 'vi', 'depression_questions_vi');

-- Student 12 - RADS Test 1 (Score: 12)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(39, 85, 1, 'vi', 'depression_questions_vi'), (39, 86, 1, 'vi', 'depression_questions_vi'), (39, 87, 1, 'vi', 'depression_questions_vi'), (39, 88, 1, 'vi', 'depression_questions_vi'), (39, 89, 1, 'vi', 'depression_questions_vi'), (39, 90, 1, 'vi', 'depression_questions_vi'), (39, 91, 1, 'vi', 'depression_questions_vi'), (39, 92, 1, 'vi', 'depression_questions_vi'), (39, 93, 1, 'vi', 'depression_questions_vi'), (39, 94, 1, 'vi', 'depression_questions_vi'),
(39, 95, 1, 'vi', 'depression_questions_vi'), (39, 96, 1, 'vi', 'depression_questions_vi'), (39, 97, 1, 'vi', 'depression_questions_vi'), (39, 98, 1, 'vi', 'depression_questions_vi'), (39, 99, 1, 'vi', 'depression_questions_vi'), (39, 100, 1, 'vi', 'depression_questions_vi'), (39, 101, 1, 'vi', 'depression_questions_vi'), (39, 102, 1, 'vi', 'depression_questions_vi'), (39, 103, 1, 'vi', 'depression_questions_vi'), (39, 104, 1, 'vi', 'depression_questions_vi'),
(39, 105, 1, 'vi', 'depression_questions_vi'), (39, 106, 1, 'vi', 'depression_questions_vi'), (39, 107, 1, 'vi', 'depression_questions_vi'), (39, 108, 1, 'vi', 'depression_questions_vi'), (39, 109, 1, 'vi', 'depression_questions_vi'), (39, 110, 1, 'vi', 'depression_questions_vi'), (39, 111, 1, 'vi', 'depression_questions_vi'), (39, 112, 1, 'vi', 'depression_questions_vi'), (39, 113, 1, 'vi', 'depression_questions_vi'), (39, 114, 1, 'vi', 'depression_questions_vi');

-- Student 12 - RADS Test 2 (Score: 28)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(40, 85, 2, 'vi', 'depression_questions_vi'), (40, 86, 2, 'vi', 'depression_questions_vi'), (40, 87, 2, 'vi', 'depression_questions_vi'), (40, 88, 2, 'vi', 'depression_questions_vi'), (40, 89, 2, 'vi', 'depression_questions_vi'), (40, 90, 2, 'vi', 'depression_questions_vi'), (40, 91, 2, 'vi', 'depression_questions_vi'), (40, 92, 2, 'vi', 'depression_questions_vi'), (40, 93, 2, 'vi', 'depression_questions_vi'), (40, 94, 2, 'vi', 'depression_questions_vi'),
(40, 95, 2, 'vi', 'depression_questions_vi'), (40, 96, 2, 'vi', 'depression_questions_vi'), (40, 97, 2, 'vi', 'depression_questions_vi'), (40, 98, 2, 'vi', 'depression_questions_vi'), (40, 99, 2, 'vi', 'depression_questions_vi'), (40, 100, 2, 'vi', 'depression_questions_vi'), (40, 101, 2, 'vi', 'depression_questions_vi'), (40, 102, 2, 'vi', 'depression_questions_vi'), (40, 103, 2, 'vi', 'depression_questions_vi'), (40, 104, 2, 'vi', 'depression_questions_vi'),
(40, 105, 2, 'vi', 'depression_questions_vi'), (40, 106, 2, 'vi', 'depression_questions_vi'), (40, 107, 2, 'vi', 'depression_questions_vi'), (40, 108, 2, 'vi', 'depression_questions_vi'), (40, 109, 2, 'vi', 'depression_questions_vi'), (40, 110, 2, 'vi', 'depression_questions_vi'), (40, 111, 2, 'vi', 'depression_questions_vi'), (40, 112, 2, 'vi', 'depression_questions_vi'), (40, 113, 2, 'vi', 'depression_questions_vi'), (40, 114, 2, 'vi', 'depression_questions_vi');

-- ========================================
-- EPDS Test Answers (10 câu hỏi)
-- ========================================
-- Student 13 - EPDS Test 1 (Score: 3)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(41, 115, 0, 'vi', 'depression_questions_vi'), (41, 116, 0, 'vi', 'depression_questions_vi'), (41, 117, 0, 'vi', 'depression_questions_vi'), (41, 118, 0, 'vi', 'depression_questions_vi'), (41, 119, 0, 'vi', 'depression_questions_vi'), (41, 120, 0, 'vi', 'depression_questions_vi'), (41, 121, 0, 'vi', 'depression_questions_vi'), (41, 122, 0, 'vi', 'depression_questions_vi'), (41, 123, 0, 'vi', 'depression_questions_vi'), (41, 124, 0, 'vi', 'depression_questions_vi');

-- Student 13 - EPDS Test 2 (Score: 8)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(42, 115, 1, 'vi', 'depression_questions_vi'), (42, 116, 1, 'vi', 'depression_questions_vi'), (42, 117, 1, 'vi', 'depression_questions_vi'), (42, 118, 1, 'vi', 'depression_questions_vi'), (42, 119, 1, 'vi', 'depression_questions_vi'), (42, 120, 1, 'vi', 'depression_questions_vi'), (42, 121, 1, 'vi', 'depression_questions_vi'), (42, 122, 1, 'vi', 'depression_questions_vi'), (42, 123, 0, 'vi', 'depression_questions_vi'), (42, 124, 0, 'vi', 'depression_questions_vi');

-- Student 13 - EPDS Test 3 (Score: 15)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(43, 115, 2, 'vi', 'depression_questions_vi'), (43, 116, 2, 'vi', 'depression_questions_vi'), (43, 117, 2, 'vi', 'depression_questions_vi'), (43, 118, 2, 'vi', 'depression_questions_vi'), (43, 119, 2, 'vi', 'depression_questions_vi'), (43, 120, 2, 'vi', 'depression_questions_vi'), (43, 121, 2, 'vi', 'depression_questions_vi'), (43, 122, 2, 'vi', 'depression_questions_vi'), (43, 123, 1, 'vi', 'depression_questions_vi'), (43, 124, 0, 'vi', 'depression_questions_vi');

-- Student 13 - EPDS Test 4 (Score: 25)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(44, 115, 3, 'vi', 'depression_questions_vi'), (44, 116, 3, 'vi', 'depression_questions_vi'), (44, 117, 3, 'vi', 'depression_questions_vi'), (44, 118, 3, 'vi', 'depression_questions_vi'), (44, 119, 3, 'vi', 'depression_questions_vi'), (44, 120, 3, 'vi', 'depression_questions_vi'), (44, 121, 3, 'vi', 'depression_questions_vi'), (44, 122, 3, 'vi', 'depression_questions_vi'), (44, 123, 2, 'vi', 'depression_questions_vi'), (44, 124, 1, 'vi', 'depression_questions_vi');

-- Student 14 - EPDS Test 1 (Score: 5)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(45, 115, 1, 'vi', 'depression_questions_vi'), (45, 116, 0, 'vi', 'depression_questions_vi'), (45, 117, 1, 'vi', 'depression_questions_vi'), (45, 118, 0, 'vi', 'depression_questions_vi'), (45, 119, 1, 'vi', 'depression_questions_vi'), (45, 120, 0, 'vi', 'depression_questions_vi'), (45, 121, 1, 'vi', 'depression_questions_vi'), (45, 122, 0, 'vi', 'depression_questions_vi'), (45, 123, 0, 'vi', 'depression_questions_vi'), (45, 124, 0, 'vi', 'depression_questions_vi');

-- Student 14 - EPDS Test 2 (Score: 12)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(46, 115, 2, 'vi', 'depression_questions_vi'), (46, 116, 1, 'vi', 'depression_questions_vi'), (46, 117, 2, 'vi', 'depression_questions_vi'), (46, 118, 1, 'vi', 'depression_questions_vi'), (46, 119, 2, 'vi', 'depression_questions_vi'), (46, 120, 1, 'vi', 'depression_questions_vi'), (46, 121, 2, 'vi', 'depression_questions_vi'), (46, 122, 1, 'vi', 'depression_questions_vi'), (46, 123, 0, 'vi', 'depression_questions_vi'), (46, 124, 0, 'vi', 'depression_questions_vi');

-- Student 14 - EPDS Test 3 (Score: 18)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(47, 115, 3, 'vi', 'depression_questions_vi'), (47, 116, 2, 'vi', 'depression_questions_vi'), (47, 117, 3, 'vi', 'depression_questions_vi'), (47, 118, 2, 'vi', 'depression_questions_vi'), (47, 119, 3, 'vi', 'depression_questions_vi'), (47, 120, 2, 'vi', 'depression_questions_vi'), (47, 121, 3, 'vi', 'depression_questions_vi'), (47, 122, 2, 'vi', 'depression_questions_vi'), (47, 123, 1, 'vi', 'depression_questions_vi'), (47, 124, 0, 'vi', 'depression_questions_vi');

-- Student 14 - EPDS Test 4 (Score: 28)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(48, 115, 3, 'vi', 'depression_questions_vi'), (48, 116, 3, 'vi', 'depression_questions_vi'), (48, 117, 3, 'vi', 'depression_questions_vi'), (48, 118, 3, 'vi', 'depression_questions_vi'), (48, 119, 3, 'vi', 'depression_questions_vi'), (48, 120, 3, 'vi', 'depression_questions_vi'), (48, 121, 3, 'vi', 'depression_questions_vi'), (48, 122, 3, 'vi', 'depression_questions_vi'), (48, 123, 2, 'vi', 'depression_questions_vi'), (48, 124, 1, 'vi', 'depression_questions_vi');

-- Student 15 - EPDS Test 1 (Score: 4)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(49, 115, 0, 'vi', 'depression_questions_vi'), (49, 116, 1, 'vi', 'depression_questions_vi'), (49, 117, 0, 'vi', 'depression_questions_vi'), (49, 118, 1, 'vi', 'depression_questions_vi'), (49, 119, 0, 'vi', 'depression_questions_vi'), (49, 120, 1, 'vi', 'depression_questions_vi'), (49, 121, 0, 'vi', 'depression_questions_vi'), (49, 122, 1, 'vi', 'depression_questions_vi'), (49, 123, 0, 'vi', 'depression_questions_vi'), (49, 124, 0, 'vi', 'depression_questions_vi');

-- Student 15 - EPDS Test 2 (Score: 10)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(50, 115, 1, 'vi', 'depression_questions_vi'), (50, 116, 2, 'vi', 'depression_questions_vi'), (50, 117, 1, 'vi', 'depression_questions_vi'), (50, 118, 2, 'vi', 'depression_questions_vi'), (50, 119, 1, 'vi', 'depression_questions_vi'), (50, 120, 2, 'vi', 'depression_questions_vi'), (50, 121, 1, 'vi', 'depression_questions_vi'), (50, 122, 2, 'vi', 'depression_questions_vi'), (50, 123, 0, 'vi', 'depression_questions_vi'), (50, 124, 0, 'vi', 'depression_questions_vi');

-- ========================================
-- SAS Test Answers (20 câu hỏi)
-- ========================================
-- Student 16 - SAS Test 1 (Score: 15)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(51, 125, 0, 'vi', 'depression_questions_vi'), (51, 126, 0, 'vi', 'depression_questions_vi'), (51, 127, 0, 'vi', 'depression_questions_vi'), (51, 128, 0, 'vi', 'depression_questions_vi'), (51, 129, 0, 'vi', 'depression_questions_vi'), (51, 130, 0, 'vi', 'depression_questions_vi'), (51, 131, 0, 'vi', 'depression_questions_vi'), (51, 132, 0, 'vi', 'depression_questions_vi'), (51, 133, 0, 'vi', 'depression_questions_vi'), (51, 134, 0, 'vi', 'depression_questions_vi'),
(51, 135, 0, 'vi', 'depression_questions_vi'), (51, 136, 0, 'vi', 'depression_questions_vi'), (51, 137, 0, 'vi', 'depression_questions_vi'), (51, 138, 0, 'vi', 'depression_questions_vi'), (51, 139, 0, 'vi', 'depression_questions_vi'), (51, 140, 0, 'vi', 'depression_questions_vi'), (51, 141, 0, 'vi', 'depression_questions_vi'), (51, 142, 0, 'vi', 'depression_questions_vi'), (51, 143, 0, 'vi', 'depression_questions_vi'), (51, 144, 0, 'vi', 'depression_questions_vi');

-- Student 16 - SAS Test 2 (Score: 35)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(52, 125, 1, 'vi', 'depression_questions_vi'), (52, 126, 1, 'vi', 'depression_questions_vi'), (52, 127, 1, 'vi', 'depression_questions_vi'), (52, 128, 1, 'vi', 'depression_questions_vi'), (52, 129, 1, 'vi', 'depression_questions_vi'), (52, 130, 1, 'vi', 'depression_questions_vi'), (52, 131, 1, 'vi', 'depression_questions_vi'), (52, 132, 1, 'vi', 'depression_questions_vi'), (52, 133, 1, 'vi', 'depression_questions_vi'), (52, 134, 1, 'vi', 'depression_questions_vi'),
(52, 135, 1, 'vi', 'depression_questions_vi'), (52, 136, 1, 'vi', 'depression_questions_vi'), (52, 137, 1, 'vi', 'depression_questions_vi'), (52, 138, 1, 'vi', 'depression_questions_vi'), (52, 139, 1, 'vi', 'depression_questions_vi'), (52, 140, 1, 'vi', 'depression_questions_vi'), (52, 141, 1, 'vi', 'depression_questions_vi'), (52, 142, 1, 'vi', 'depression_questions_vi'), (52, 143, 1, 'vi', 'depression_questions_vi'), (52, 144, 1, 'vi', 'depression_questions_vi');

-- Student 16 - SAS Test 3 (Score: 55)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(53, 125, 2, 'vi', 'depression_questions_vi'), (53, 126, 2, 'vi', 'depression_questions_vi'), (53, 127, 2, 'vi', 'depression_questions_vi'), (53, 128, 2, 'vi', 'depression_questions_vi'), (53, 129, 2, 'vi', 'depression_questions_vi'), (53, 130, 2, 'vi', 'depression_questions_vi'), (53, 131, 2, 'vi', 'depression_questions_vi'), (53, 132, 2, 'vi', 'depression_questions_vi'), (53, 133, 2, 'vi', 'depression_questions_vi'), (53, 134, 2, 'vi', 'depression_questions_vi'),
(53, 135, 2, 'vi', 'depression_questions_vi'), (53, 136, 2, 'vi', 'depression_questions_vi'), (53, 137, 2, 'vi', 'depression_questions_vi'), (53, 138, 2, 'vi', 'depression_questions_vi'), (53, 139, 2, 'vi', 'depression_questions_vi'), (53, 140, 2, 'vi', 'depression_questions_vi'), (53, 141, 2, 'vi', 'depression_questions_vi'), (53, 142, 2, 'vi', 'depression_questions_vi'), (53, 143, 2, 'vi', 'depression_questions_vi'), (53, 144, 2, 'vi', 'depression_questions_vi');

-- Student 16 - SAS Test 4 (Score: 75)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(54, 125, 3, 'vi', 'depression_questions_vi'), (54, 126, 3, 'vi', 'depression_questions_vi'), (54, 127, 3, 'vi', 'depression_questions_vi'), (54, 128, 3, 'vi', 'depression_questions_vi'), (54, 129, 3, 'vi', 'depression_questions_vi'), (54, 130, 3, 'vi', 'depression_questions_vi'), (54, 131, 3, 'vi', 'depression_questions_vi'), (54, 132, 3, 'vi', 'depression_questions_vi'), (54, 133, 3, 'vi', 'depression_questions_vi'), (54, 134, 3, 'vi', 'depression_questions_vi'),
(54, 135, 3, 'vi', 'depression_questions_vi'), (54, 136, 3, 'vi', 'depression_questions_vi'), (54, 137, 3, 'vi', 'depression_questions_vi'), (54, 138, 3, 'vi', 'depression_questions_vi'), (54, 139, 3, 'vi', 'depression_questions_vi'), (54, 140, 3, 'vi', 'depression_questions_vi'), (54, 141, 3, 'vi', 'depression_questions_vi'), (54, 142, 3, 'vi', 'depression_questions_vi'), (54, 143, 3, 'vi', 'depression_questions_vi'), (54, 144, 3, 'vi', 'depression_questions_vi');

-- Student 17 - SAS Test 1 (Score: 20)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(55, 125, 1, 'vi', 'depression_questions_vi'), (55, 126, 1, 'vi', 'depression_questions_vi'), (55, 127, 1, 'vi', 'depression_questions_vi'), (55, 128, 1, 'vi', 'depression_questions_vi'), (55, 129, 1, 'vi', 'depression_questions_vi'), (55, 130, 1, 'vi', 'depression_questions_vi'), (55, 131, 1, 'vi', 'depression_questions_vi'), (55, 132, 1, 'vi', 'depression_questions_vi'), (55, 133, 1, 'vi', 'depression_questions_vi'), (55, 134, 1, 'vi', 'depression_questions_vi'),
(55, 135, 1, 'vi', 'depression_questions_vi'), (55, 136, 1, 'vi', 'depression_questions_vi'), (55, 137, 1, 'vi', 'depression_questions_vi'), (55, 138, 1, 'vi', 'depression_questions_vi'), (55, 139, 1, 'vi', 'depression_questions_vi'), (55, 140, 1, 'vi', 'depression_questions_vi'), (55, 141, 1, 'vi', 'depression_questions_vi'), (55, 142, 1, 'vi', 'depression_questions_vi'), (55, 143, 1, 'vi', 'depression_questions_vi'), (55, 144, 1, 'vi', 'depression_questions_vi');

-- Student 17 - SAS Test 2 (Score: 40)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(56, 125, 2, 'vi', 'depression_questions_vi'), (56, 126, 2, 'vi', 'depression_questions_vi'), (56, 127, 2, 'vi', 'depression_questions_vi'), (56, 128, 2, 'vi', 'depression_questions_vi'), (56, 129, 2, 'vi', 'depression_questions_vi'), (56, 130, 2, 'vi', 'depression_questions_vi'), (56, 131, 2, 'vi', 'depression_questions_vi'), (56, 132, 2, 'vi', 'depression_questions_vi'), (56, 133, 2, 'vi', 'depression_questions_vi'), (56, 134, 2, 'vi', 'depression_questions_vi'),
(56, 135, 2, 'vi', 'depression_questions_vi'), (56, 136, 2, 'vi', 'depression_questions_vi'), (56, 137, 2, 'vi', 'depression_questions_vi'), (56, 138, 2, 'vi', 'depression_questions_vi'), (56, 139, 2, 'vi', 'depression_questions_vi'), (56, 140, 2, 'vi', 'depression_questions_vi'), (56, 141, 2, 'vi', 'depression_questions_vi'), (56, 142, 2, 'vi', 'depression_questions_vi'), (56, 143, 2, 'vi', 'depression_questions_vi'), (56, 144, 2, 'vi', 'depression_questions_vi');

-- Student 17 - SAS Test 3 (Score: 60)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(57, 125, 3, 'vi', 'depression_questions_vi'), (57, 126, 3, 'vi', 'depression_questions_vi'), (57, 127, 3, 'vi', 'depression_questions_vi'), (57, 128, 3, 'vi', 'depression_questions_vi'), (57, 129, 3, 'vi', 'depression_questions_vi'), (57, 130, 3, 'vi', 'depression_questions_vi'), (57, 131, 3, 'vi', 'depression_questions_vi'), (57, 132, 3, 'vi', 'depression_questions_vi'), (57, 133, 3, 'vi', 'depression_questions_vi'), (57, 134, 3, 'vi', 'depression_questions_vi'),
(57, 135, 3, 'vi', 'depression_questions_vi'), (57, 136, 3, 'vi', 'depression_questions_vi'), (57, 137, 3, 'vi', 'depression_questions_vi'), (57, 138, 3, 'vi', 'depression_questions_vi'), (57, 139, 3, 'vi', 'depression_questions_vi'), (57, 140, 3, 'vi', 'depression_questions_vi'), (57, 141, 3, 'vi', 'depression_questions_vi'), (57, 142, 3, 'vi', 'depression_questions_vi'), (57, 143, 3, 'vi', 'depression_questions_vi'), (57, 144, 3, 'vi', 'depression_questions_vi');

-- Student 17 - SAS Test 4 (Score: 80)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(58, 125, 4, 'vi', 'depression_questions_vi'), (58, 126, 4, 'vi', 'depression_questions_vi'), (58, 127, 4, 'vi', 'depression_questions_vi'), (58, 128, 4, 'vi', 'depression_questions_vi'), (58, 129, 4, 'vi', 'depression_questions_vi'), (58, 130, 4, 'vi', 'depression_questions_vi'), (58, 131, 4, 'vi', 'depression_questions_vi'), (58, 132, 4, 'vi', 'depression_questions_vi'), (58, 133, 4, 'vi', 'depression_questions_vi'), (58, 134, 4, 'vi', 'depression_questions_vi'),
(58, 135, 4, 'vi', 'depression_questions_vi'), (58, 136, 4, 'vi', 'depression_questions_vi'), (58, 137, 4, 'vi', 'depression_questions_vi'), (58, 138, 4, 'vi', 'depression_questions_vi'), (58, 139, 4, 'vi', 'depression_questions_vi'), (58, 140, 4, 'vi', 'depression_questions_vi'), (58, 141, 4, 'vi', 'depression_questions_vi'), (58, 142, 4, 'vi', 'depression_questions_vi'), (58, 143, 4, 'vi', 'depression_questions_vi'), (58, 144, 4, 'vi', 'depression_questions_vi');

-- Student 18 - SAS Test 1 (Score: 18)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(59, 125, 1, 'vi', 'depression_questions_vi'), (59, 126, 1, 'vi', 'depression_questions_vi'), (59, 127, 1, 'vi', 'depression_questions_vi'), (59, 128, 1, 'vi', 'depression_questions_vi'), (59, 129, 1, 'vi', 'depression_questions_vi'), (59, 130, 1, 'vi', 'depression_questions_vi'), (59, 131, 1, 'vi', 'depression_questions_vi'), (59, 132, 1, 'vi', 'depression_questions_vi'), (59, 133, 1, 'vi', 'depression_questions_vi'), (59, 134, 1, 'vi', 'depression_questions_vi'),
(59, 135, 1, 'vi', 'depression_questions_vi'), (59, 136, 1, 'vi', 'depression_questions_vi'), (59, 137, 1, 'vi', 'depression_questions_vi'), (59, 138, 1, 'vi', 'depression_questions_vi'), (59, 139, 1, 'vi', 'depression_questions_vi'), (59, 140, 1, 'vi', 'depression_questions_vi'), (59, 141, 1, 'vi', 'depression_questions_vi'), (59, 142, 1, 'vi', 'depression_questions_vi'), (59, 143, 1, 'vi', 'depression_questions_vi'), (59, 144, 1, 'vi', 'depression_questions_vi');

-- Student 18 - SAS Test 2 (Score: 38)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(60, 125, 2, 'vi', 'depression_questions_vi'), (60, 126, 2, 'vi', 'depression_questions_vi'), (60, 127, 2, 'vi', 'depression_questions_vi'), (60, 128, 2, 'vi', 'depression_questions_vi'), (60, 129, 2, 'vi', 'depression_questions_vi'), (60, 130, 2, 'vi', 'depression_questions_vi'), (60, 131, 2, 'vi', 'depression_questions_vi'), (60, 132, 2, 'vi', 'depression_questions_vi'), (60, 133, 2, 'vi', 'depression_questions_vi'), (60, 134, 2, 'vi', 'depression_questions_vi'),
(60, 135, 2, 'vi', 'depression_questions_vi'), (60, 136, 2, 'vi', 'depression_questions_vi'), (60, 137, 2, 'vi', 'depression_questions_vi'), (60, 138, 2, 'vi', 'depression_questions_vi'), (60, 139, 2, 'vi', 'depression_questions_vi'), (60, 140, 2, 'vi', 'depression_questions_vi'), (60, 141, 2, 'vi', 'depression_questions_vi'), (60, 142, 2, 'vi', 'depression_questions_vi'), (60, 143, 2, 'vi', 'depression_questions_vi'), (60, 144, 2, 'vi', 'depression_questions_vi');

-- Advice Messages
INSERT INTO advice_messages (sender_id, receiver_id, message, message_type, is_read, sent_at) VALUES
(1, 6, 'Chào em, đây là lời khuyên thử nghiệm!', 'ADVICE', 0, NOW());

-- ========================================
-- 8. EXPERT NOTES SAMPLE DATA
-- ========================================

-- Expert Notes (Ghi chú của chuyên gia cho học sinh)
INSERT INTO expert_notes (expert_id, student_id, test_result_id, note, note_type, created_at) VALUES
-- Expert 1 (cuongcodehub@gmail.com) - ID: 3
-- Ghi chú cho Student 1 (student1@mindmeter.com) - ID: 6
(3, 6, 1, 'Học sinh có dấu hiệu trầm cảm nhẹ. Cần theo dõi tâm trạng và khuyến khích tham gia hoạt động thể thao.', 'RECOMMENDATION', NOW()),
(3, 6, 2, 'Tình trạng có cải thiện so với lần test trước. Tiếp tục duy trì lối sống lành mạnh.', 'ADVICE', NOW()),

-- Expert 1 ghi chú cho Student 2 (student2@mindmeter.com) - ID: 7
(3, 7, 3, 'Học sinh có mức độ lo âu cao. Cần học cách thở sâu và thư giãn cơ bắp.', 'WARNING', NOW()),
(3, 7, 4, 'Áp dụng kỹ thuật thở 4-7-8 đã giúp giảm lo âu đáng kể. Tiếp tục luyện tập.', 'ADVICE', NOW()),

-- Expert 2 (expert2@mindmeter.com) - ID: 4
-- Ghi chú cho Student 3 (student3@mindmeter.com) - ID: 8
(4, 8, 5, 'Học sinh có dấu hiệu stress từ áp lực học tập. Cần cân bằng thời gian học và nghỉ ngơi.', 'RECOMMENDATION', NOW()),
(4, 8, 6, 'Đã áp dụng phương pháp Pomodoro hiệu quả. Stress giảm rõ rệt.', 'ADVICE', NOW()),

-- Expert 2 ghi chú cho Student 4 (student4@mindmeter.com) - ID: 9
(4, 9, 7, 'Học sinh có xu hướng cô lập xã hội. Khuyến khích tham gia nhóm học tập và hoạt động ngoại khóa.', 'WARNING', NOW()),
(4, 9, 8, 'Đã tham gia câu lạc bộ đọc sách. Tương tác xã hội cải thiện tốt.', 'ADVICE', NOW()),

-- Expert 3 (expert3@mindmeter.com) - ID: 5
-- Ghi chú cho Student 5 (student5@mindmeter.com) - ID: 10
(5, 10, 9, 'Học sinh có dấu hiệu rối loạn giấc ngủ. Cần thiết lập lịch trình ngủ đều đặn.', 'RECOMMENDATION', NOW()),
(5, 10, 10, 'Áp dụng kỹ thuật "không sử dụng điện thoại 1 giờ trước khi ngủ" đã cải thiện giấc ngủ.', 'ADVICE', NOW()),

-- Expert 3 ghi chú cho Student 6 (student6@mindmeter.com) - ID: 11
(5, 11, 11, 'Học sinh có mức độ trầm cảm trung bình. Cần tham khảo ý kiến chuyên gia tâm lý.', 'WARNING', NOW()),
(5, 11, 12, 'Đã tham gia buổi tư vấn tâm lý đầu tiên. Tâm trạng có dấu hiệu tích cực.', 'ADVICE', NOW()),

-- Expert 1 ghi chú cho Student 7 (student7@mindmeter.com) - ID: 12
(3, 12, 13, 'Học sinh có dấu hiệu lo âu xã hội. Cần luyện tập kỹ năng giao tiếp từng bước nhỏ.', 'RECOMMENDATION', NOW()),
(3, 12, 14, 'Đã thực hiện bài thuyết trình trước lớp thành công. Sự tự tin tăng lên đáng kể.', 'ADVICE', NOW()),

-- Expert 2 ghi chú cho Student 8 (student8@mindmeter.com) - ID: 13
(4, 13, 15, 'Học sinh có dấu hiệu stress từ mối quan hệ gia đình. Cần học cách đặt ranh giới lành mạnh.', 'WARNING', NOW()),
(4, 13, 16, 'Đã áp dụng kỹ thuật giao tiếp "Tôi cảm thấy..." hiệu quả. Mối quan hệ gia đình cải thiện.', 'ADVICE', NOW()),

-- Expert 3 ghi chú cho Student 9 (student9@mindmeter.com) - ID: 14
(5, 14, 17, 'Học sinh có dấu hiệu trầm cảm sau trải nghiệm thất bại. Cần học cách đối mặt với thất bại.', 'RECOMMENDATION', NOW()),
(5, 14, 18, 'Đã tham gia workshop "Vượt qua thất bại" và áp dụng các kỹ năng học được.', 'ADVICE', NOW()),

-- Expert 1 ghi chú cho Student 10 (student10@mindmeter.com) - ID: 15
(3, 15, 19, 'Học sinh có dấu hiệu lo âu về tương lai. Cần học cách lập kế hoạch và đặt mục tiêu thực tế.', 'RECOMMENDATION', NOW()),
(3, 15, 20, 'Đã lập kế hoạch học tập chi tiết và thực hiện theo đúng lộ trình.', 'ADVICE', NOW()),

-- Expert 2 ghi chú cho Student 11 (student11@mindmeter.com) - ID: 16
(4, 16, 21, 'Học sinh có dấu hiệu stress từ áp lực thi cử. Cần học cách quản lý thời gian và ôn tập hiệu quả.', 'WARNING', NOW()),
(4, 16, 22, 'Đã áp dụng phương pháp ôn tập "spaced repetition" và giảm stress đáng kể.', 'ADVICE', NOW()),

-- Expert 3 ghi chú cho Student 12 (student12@mindmeter.com) - ID: 17
(5, 17, 23, 'Học sinh có dấu hiệu rối loạn ăn uống do stress. Cần thiết lập thói quen ăn uống lành mạnh.', 'RECOMMENDATION', NOW()),
(5, 17, 24, 'Đã áp dụng chế độ ăn uống cân bằng và luyện tập yoga thường xuyên.', 'ADVICE', NOW()),

-- Expert 1 ghi chú cho Student 13 (student13@mindmeter.com) - ID: 18
(3, 18, 25, 'Học sinh có dấu hiệu trầm cảm mùa đông. Cần tăng cường tiếp xúc ánh sáng tự nhiên và vitamin D.', 'RECOMMENDATION', NOW()),
(3, 18, 26, 'Đã thực hiện đi bộ buổi sáng và bổ sung vitamin D theo chỉ định.', 'ADVICE', NOW()),

-- Expert 2 ghi chú cho Student 14 (student14@mindmeter.com) - ID: 19
(4, 19, 27, 'Học sinh có dấu hiệu lo âu về sức khỏe. Cần học cách phân biệt lo âu thực tế và lo âu không cần thiết.', 'WARNING', NOW()),
(4, 19, 28, 'Đã áp dụng kỹ thuật "thought challenging" và giảm lo âu về sức khỏe.', 'ADVICE', NOW()),

-- Expert 3 ghi chú cho Student 15 (student15@mindmeter.com) - ID: 20
(5, 20, 29, 'Học sinh có dấu hiệu stress từ mạng xã hội. Cần thiết lập ranh giới sử dụng công nghệ.', 'RECOMMENDATION', NOW()),
(5, 20, 30, 'Đã áp dụng "digital detox" và tham gia hoạt động ngoài trời nhiều hơn.', 'ADVICE', NOW()),

-- Expert 1 ghi chú cho Student 16 (student16@mindmeter.com) - ID: 21
(3, 21, 31, 'Học sinh có dấu hiệu trầm cảm sau ly hôn của bố mẹ. Cần hỗ trợ tâm lý chuyên biệt.', 'WARNING', NOW()),
(3, 21, 32, 'Đã tham gia nhóm hỗ trợ trẻ em có hoàn cảnh tương tự và có tiến bộ tốt.', 'ADVICE', NOW()),

-- Expert 2 ghi chú cho Student 17 (student17@mindmeter.com) - ID: 22
(4, 22, 33, 'Học sinh có dấu hiệu lo âu về định hướng nghề nghiệp. Cần tư vấn hướng nghiệp chuyên sâu.', 'RECOMMENDATION', NOW()),
(4, 22, 34, 'Đã tham gia chương trình tư vấn hướng nghiệp và xác định được mục tiêu rõ ràng.', 'ADVICE', NOW()),

-- Expert 3 ghi chú cho Student 18 (student18@mindmeter.com) - ID: 23
(5, 23, 35, 'Học sinh có dấu hiệu stress từ việc so sánh bản thân với người khác. Cần học cách tự tin và chấp nhận bản thân.', 'RECOMMENDATION', NOW()),
(5, 23, 36, 'Đã tham gia workshop "Xây dựng lòng tự tin" và có cải thiện tích cực.', 'ADVICE', NOW()),

-- Ghi chú chung không liên quan đến test result cụ thể
(3, 6, NULL, 'Học sinh cần duy trì lịch trình sinh hoạt đều đặn và tham gia hoạt động thể thao thường xuyên.', 'GENERAL', NOW()),
(4, 7, NULL, 'Khuyến khích học sinh tham gia các hoạt động nhóm để cải thiện kỹ năng giao tiếp xã hội.', 'GENERAL', NOW()),
(5, 8, NULL, 'Học sinh nên học cách quản lý thời gian hiệu quả và tránh để công việc tích tụ.', 'GENERAL', NOW());

-- ========================================
-- 9. SYSTEM ANNOUNCEMENTS SAMPLE DATA
-- ========================================

-- System Announcements (Thông báo hệ thống)
INSERT INTO system_announcements (title, content, announcement_type, is_active, created_at) VALUES
('Chào mừng đến với MindMeter!', 'MindMeter là nền tảng hỗ trợ sức khỏe tâm thần hàng đầu Việt Nam. Chúng tôi cam kết mang đến dịch vụ chất lượng cao và bảo mật tuyệt đối.', 'INFO', true, NOW()),
('Cập nhật tính năng mới - Chatbot AI', 'Chatbot AI của chúng tôi đã được cải tiến với khả năng tư vấn tâm lý chính xác hơn. Hãy trải nghiệm ngay!', 'GUIDE', true, NOW()),
('Lưu ý quan trọng về bảo mật', 'Để đảm bảo an toàn, vui lòng không chia sẻ thông tin cá nhân với người lạ và báo cáo ngay nếu phát hiện hành vi đáng ngờ.', 'WARNING', true, NOW()),
('Hướng dẫn sử dụng MindMeter', 'Xem video hướng dẫn chi tiết cách sử dụng các tính năng của MindMeter tại trang Hướng dẫn sử dụng.', 'GUIDE', true, NOW()),
('Thông báo bảo trì hệ thống', 'Hệ thống sẽ bảo trì từ 02:00 - 04:00 ngày mai. Trong thời gian này, một số tính năng có thể không khả dụng.', 'INFO', true, NOW()),
('Khuyến mãi đặc biệt - Gói PRO', 'Giảm 20% cho gói PRO trong tháng này! Nâng cấp ngay để trải nghiệm tất cả tính năng cao cấp.', 'INFO', true, NOW()),
('Cảnh báo về tin nhắn lừa đảo', 'Có một số tin nhắn lừa đảo giả mạo MindMeter. Hãy cẩn thận và chỉ tin tưởng thông tin từ nguồn chính thức.', 'URGENT', true, NOW()),
('Kết quả khảo sát người dùng', 'Cảm ơn sự tham gia của tất cả người dùng trong cuộc khảo sát vừa qua. Kết quả sẽ được công bố sớm nhất.', 'INFO', true, NOW()),
('Cập nhật chính sách bảo mật', 'Chúng tôi đã cập nhật chính sách bảo mật để tuân thủ quy định mới. Vui lòng xem xét và chấp thuận.', 'WARNING', true, NOW()),
('Sự kiện sắp diễn ra - Workshop Tâm lý', 'Workshop "Chăm sóc sức khỏe tâm thần trong thời đại số" sẽ diễn ra vào cuối tuần này. Đăng ký ngay!', 'INFO', true, NOW());

-- ========================================
-- 10. DEPRESSION TEST RESULTS
-- ========================================

-- Depression Test Results (Kết quả test mẫu) - 60 samples
-- ========================================
-- DASS-21 Test Results (10 samples)
-- ========================================
-- Student 1 - DASS-21 Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(5, 2, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-21', 'vi'),
(5, 8, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-21', 'vi'),
(5, 15, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'DASS-21', 'vi'),
(5, 25, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'DASS-21', 'vi');

-- Student 2 - DASS-21 Tests  
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(6, 5, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-21', 'vi'),
(6, 12, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-21', 'vi'),
(6, 18, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'DASS-21', 'vi'),
(6, 30, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'DASS-21', 'vi');

-- Student 3 - DASS-21 Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(7, 3, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-21', 'vi'),
(7, 10, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 4 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-21', 'vi');

-- ========================================
-- DASS-42 Test Results (10 samples)
-- ========================================
-- Student 4 - DASS-42 Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(8, 8, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-42', 'vi'),
(8, 20, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-42', 'vi'),
(8, 35, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'DASS-42', 'vi'),
(8, 55, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'DASS-42', 'vi');

-- Student 5 - DASS-42 Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(9, 12, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 11 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-42', 'vi'),
(9, 28, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-42', 'vi'),
(9, 42, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'DASS-42', 'vi'),
(9, 65, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'DASS-42', 'vi');

-- Student 6 - DASS-42 Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(10, 15, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-42', 'vi'),
(10, 32, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-42', 'vi');

-- ========================================
-- BDI Test Results (10 samples)
-- ========================================
-- Student 7 - BDI Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(11, 5, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'BDI', 'vi'),
(11, 15, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'BDI', 'vi'),
(11, 30, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'BDI', 'vi'),
(11, 50, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 4 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'BDI', 'vi');

-- Student 8 - BDI Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(12, 8, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'BDI', 'vi'),
(12, 20, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 11 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'BDI', 'vi'),
(12, 38, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'BDI', 'vi'),
(12, 60, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'BDI', 'vi');

-- Student 9 - BDI Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(13, 10, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 13 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'BDI', 'vi'),
(13, 25, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'BDI', 'vi');

-- ========================================
-- RADS Test Results (10 samples)
-- ========================================
-- Student 10 - RADS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(14, 10, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 18 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'RADS', 'vi'),
(14, 25, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'RADS', 'vi'),
(14, 45, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'RADS', 'vi'),
(14, 70, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'RADS', 'vi');

-- Student 11 - RADS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(15, 15, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 17 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'RADS', 'vi'),
(15, 30, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'RADS', 'vi'),
(15, 52, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'RADS', 'vi'),
(15, 75, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'RADS', 'vi');

-- Student 12 - RADS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(16, 12, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 16 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'RADS', 'vi'),
(16, 28, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 13 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'RADS', 'vi');

-- ========================================
-- EPDS Test Results (10 samples)
-- ========================================
-- Student 13 - EPDS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(17, 3, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 20 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'EPDS', 'vi'),
(17, 8, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 17 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'EPDS', 'vi'),
(17, 15, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'EPDS', 'vi'),
(17, 25, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'EPDS', 'vi');

-- Student 14 - EPDS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(18, 5, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 19 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'EPDS', 'vi'),
(18, 12, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 16 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'EPDS', 'vi'),
(18, 18, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'EPDS', 'vi'),
(18, 28, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'EPDS', 'vi');

-- Student 15 - EPDS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(19, 4, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 18 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'EPDS', 'vi'),
(19, 10, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'EPDS', 'vi');

-- ========================================
-- SAS Test Results (10 samples)
-- ========================================
-- Student 16 - SAS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(20, 15, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 22 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'SAS', 'vi'),
(20, 35, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 19 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'SAS', 'vi'),
(20, 55, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 16 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'SAS', 'vi'),
(20, 75, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'SAS', 'vi');

-- Student 17 - SAS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(21, 20, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 21 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'SAS', 'vi'),
(21, 40, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 18 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'SAS', 'vi'),
(21, 60, 'Có dấu hiệu trầm cảm vừa phải', 'MODERATE', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'SAS', 'vi'),
(21, 80, 'Có dấu hiệu trầm cảm nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'SAS', 'vi');

-- Student 18 - SAS Tests
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(22, 18, 'Không có dấu hiệu trầm cảm rõ ràng', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 20 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'SAS', 'vi'),
(22, 38, 'Có một số dấu hiệu trầm cảm nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 17 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'SAS', 'vi');

-- ========================================
-- BDI Test Answers (21 câu hỏi)
-- ========================================
-- Student 7 - BDI Test 1 (Score: 5)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(21, 64, 0, 'vi', 'depression_questions_vi'), (21, 65, 0, 'vi', 'depression_questions_vi'), (21, 66, 0, 'vi', 'depression_questions_vi'), (21, 67, 0, 'vi', 'depression_questions_vi'), (21, 68, 0, 'vi', 'depression_questions_vi'), (21, 69, 0, 'vi', 'depression_questions_vi'), (21, 70, 0, 'vi', 'depression_questions_vi'), (21, 71, 0, 'vi', 'depression_questions_vi'), (21, 72, 0, 'vi', 'depression_questions_vi'), (21, 73, 0, 'vi', 'depression_questions_vi'),
(21, 74, 0, 'vi', 'depression_questions_vi'), (21, 75, 0, 'vi', 'depression_questions_vi'), (21, 76, 0, 'vi', 'depression_questions_vi'), (21, 77, 0, 'vi', 'depression_questions_vi'), (21, 78, 0, 'vi', 'depression_questions_vi'), (21, 79, 0, 'vi', 'depression_questions_vi'), (21, 80, 0, 'vi', 'depression_questions_vi'), (21, 81, 0, 'vi', 'depression_questions_vi'), (21, 82, 0, 'vi', 'depression_questions_vi'), (21, 83, 0, 'vi', 'depression_questions_vi'), (21, 84, 0, 'vi', 'depression_questions_vi');

-- Student 7 - BDI Test 2 (Score: 15)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(22, 64, 1, 'vi', 'depression_questions_vi'), (22, 65, 1, 'vi', 'depression_questions_vi'), (22, 66, 1, 'vi', 'depression_questions_vi'), (22, 67, 1, 'vi', 'depression_questions_vi'), (22, 68, 1, 'vi', 'depression_questions_vi'), (22, 69, 0, 'vi', 'depression_questions_vi'), (22, 70, 1, 'vi', 'depression_questions_vi'), (22, 71, 1, 'vi', 'depression_questions_vi'), (22, 72, 0, 'vi', 'depression_questions_vi'), (22, 73, 1, 'vi', 'depression_questions_vi'),
(22, 74, 1, 'vi', 'depression_questions_vi'), (22, 75, 1, 'vi', 'depression_questions_vi'), (22, 76, 1, 'vi', 'depression_questions_vi'), (22, 77, 1, 'vi', 'depression_questions_vi'), (22, 78, 1, 'vi', 'depression_questions_vi'), (22, 79, 0, 'vi', 'depression_questions_vi'), (22, 80, 1, 'vi', 'depression_questions_vi'), (22, 81, 1, 'vi', 'depression_questions_vi'), (22, 82, 0, 'vi', 'depression_questions_vi'), (22, 83, 1, 'vi', 'depression_questions_vi'), (22, 84, 0, 'vi', 'depression_questions_vi');

-- Student 7 - BDI Test 3 (Score: 30)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(23, 64, 2, 'vi', 'depression_questions_vi'), (23, 65, 2, 'vi', 'depression_questions_vi'), (23, 66, 2, 'vi', 'depression_questions_vi'), (23, 67, 2, 'vi', 'depression_questions_vi'), (23, 68, 2, 'vi', 'depression_questions_vi'), (23, 69, 1, 'vi', 'depression_questions_vi'), (23, 70, 2, 'vi', 'depression_questions_vi'), (23, 71, 2, 'vi', 'depression_questions_vi'), (23, 72, 1, 'vi', 'depression_questions_vi'), (23, 73, 2, 'vi', 'depression_questions_vi'),
(23, 74, 2, 'vi', 'depression_questions_vi'), (23, 75, 2, 'vi', 'depression_questions_vi'), (23, 76, 2, 'vi', 'depression_questions_vi'), (23, 77, 2, 'vi', 'depression_questions_vi'), (23, 78, 2, 'vi', 'depression_questions_vi'), (23, 79, 1, 'vi', 'depression_questions_vi'), (23, 80, 2, 'vi', 'depression_questions_vi'), (23, 81, 2, 'vi', 'depression_questions_vi'), (23, 82, 1, 'vi', 'depression_questions_vi'), (23, 83, 2, 'vi', 'depression_questions_vi'), (23, 84, 1, 'vi', 'depression_questions_vi');

-- Student 7 - BDI Test 4 (Score: 50)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(24, 64, 3, 'vi', 'depression_questions_vi'), (24, 65, 3, 'vi', 'depression_questions_vi'), (24, 66, 3, 'vi', 'depression_questions_vi'), (24, 67, 3, 'vi', 'depression_questions_vi'), (24, 68, 3, 'vi', 'depression_questions_vi'), (24, 69, 2, 'vi', 'depression_questions_vi'), (24, 70, 3, 'vi', 'depression_questions_vi'), (24, 71, 3, 'vi', 'depression_questions_vi'), (24, 72, 2, 'vi', 'depression_questions_vi'), (24, 73, 3, 'vi', 'depression_questions_vi'),
(24, 74, 3, 'vi', 'depression_questions_vi'), (24, 75, 3, 'vi', 'depression_questions_vi'), (24, 76, 3, 'vi', 'depression_questions_vi'), (24, 77, 3, 'vi', 'depression_questions_vi'), (24, 78, 3, 'vi', 'depression_questions_vi'), (24, 79, 2, 'vi', 'depression_questions_vi'), (24, 80, 3, 'vi', 'depression_questions_vi'), (24, 81, 3, 'vi', 'depression_questions_vi'), (24, 82, 2, 'vi', 'depression_questions_vi'), (24, 83, 3, 'vi', 'depression_questions_vi'), (24, 84, 2, 'vi', 'depression_questions_vi');

-- Student 8 - BDI Test 1 (Score: 8)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(25, 64, 1, 'vi', 'depression_questions_vi'), (25, 65, 0, 'vi', 'depression_questions_vi'), (25, 66, 1, 'vi', 'depression_questions_vi'), (25, 67, 0, 'vi', 'depression_questions_vi'), (25, 68, 1, 'vi', 'depression_questions_vi'), (25, 69, 0, 'vi', 'depression_questions_vi'), (25, 70, 1, 'vi', 'depression_questions_vi'), (25, 71, 1, 'vi', 'depression_questions_vi'), (25, 72, 0, 'vi', 'depression_questions_vi'), (25, 73, 1, 'vi', 'depression_questions_vi'),
(25, 74, 0, 'vi', 'depression_questions_vi'), (25, 75, 1, 'vi', 'depression_questions_vi'), (25, 76, 0, 'vi', 'depression_questions_vi'), (25, 77, 1, 'vi', 'depression_questions_vi'), (25, 78, 0, 'vi', 'depression_questions_vi'), (25, 79, 0, 'vi', 'depression_questions_vi'), (25, 80, 1, 'vi', 'depression_questions_vi'), (25, 81, 0, 'vi', 'depression_questions_vi'), (25, 82, 0, 'vi', 'depression_questions_vi'), (25, 83, 1, 'vi', 'depression_questions_vi'), (25, 84, 0, 'vi', 'depression_questions_vi');

-- Student 8 - BDI Test 2 (Score: 20)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(26, 64, 2, 'vi', 'depression_questions_vi'), (26, 65, 1, 'vi', 'depression_questions_vi'), (26, 66, 2, 'vi', 'depression_questions_vi'), (26, 67, 1, 'vi', 'depression_questions_vi'), (26, 68, 2, 'vi', 'depression_questions_vi'), (26, 69, 0, 'vi', 'depression_questions_vi'), (26, 70, 2, 'vi', 'depression_questions_vi'), (26, 71, 2, 'vi', 'depression_questions_vi'), (26, 72, 1, 'vi', 'depression_questions_vi'), (26, 73, 2, 'vi', 'depression_questions_vi'),
(26, 74, 1, 'vi', 'depression_questions_vi'), (26, 75, 2, 'vi', 'depression_questions_vi'), (26, 76, 1, 'vi', 'depression_questions_vi'), (26, 77, 2, 'vi', 'depression_questions_vi'), (26, 78, 1, 'vi', 'depression_questions_vi'), (26, 79, 0, 'vi', 'depression_questions_vi'), (26, 80, 2, 'vi', 'depression_questions_vi'), (26, 81, 1, 'vi', 'depression_questions_vi'), (26, 82, 0, 'vi', 'depression_questions_vi'), (26, 83, 2, 'vi', 'depression_questions_vi'), (26, 84, 1, 'vi', 'depression_questions_vi');

-- Student 8 - BDI Test 3 (Score: 38)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(27, 64, 3, 'vi', 'depression_questions_vi'), (27, 65, 2, 'vi', 'depression_questions_vi'), (27, 66, 3, 'vi', 'depression_questions_vi'), (27, 67, 2, 'vi', 'depression_questions_vi'), (27, 68, 3, 'vi', 'depression_questions_vi'), (27, 69, 1, 'vi', 'depression_questions_vi'), (27, 70, 3, 'vi', 'depression_questions_vi'), (27, 71, 3, 'vi', 'depression_questions_vi'), (27, 72, 2, 'vi', 'depression_questions_vi'), (27, 73, 3, 'vi', 'depression_questions_vi'),
(27, 74, 2, 'vi', 'depression_questions_vi'), (27, 75, 3, 'vi', 'depression_questions_vi'), (27, 76, 2, 'vi', 'depression_questions_vi'), (27, 77, 3, 'vi', 'depression_questions_vi'), (27, 78, 2, 'vi', 'depression_questions_vi'), (27, 79, 1, 'vi', 'depression_questions_vi'), (27, 80, 3, 'vi', 'depression_questions_vi'), (27, 81, 2, 'vi', 'depression_questions_vi'), (27, 82, 1, 'vi', 'depression_questions_vi'), (27, 83, 3, 'vi', 'depression_questions_vi'), (27, 84, 2, 'vi', 'depression_questions_vi');

-- Student 8 - BDI Test 4 (Score: 60)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(28, 64, 4, 'vi', 'depression_questions_vi'), (28, 65, 3, 'vi', 'depression_questions_vi'), (28, 66, 4, 'vi', 'depression_questions_vi'), (28, 67, 3, 'vi', 'depression_questions_vi'), (28, 68, 4, 'vi', 'depression_questions_vi'), (28, 69, 2, 'vi', 'depression_questions_vi'), (28, 70, 4, 'vi', 'depression_questions_vi'), (28, 71, 4, 'vi', 'depression_questions_vi'), (28, 72, 3, 'vi', 'depression_questions_vi'), (28, 73, 4, 'vi', 'depression_questions_vi'),
(28, 74, 3, 'vi', 'depression_questions_vi'), (28, 75, 4, 'vi', 'depression_questions_vi'), (28, 76, 3, 'vi', 'depression_questions_vi'), (28, 77, 4, 'vi', 'depression_questions_vi'), (28, 78, 3, 'vi', 'depression_questions_vi'), (28, 79, 2, 'vi', 'depression_questions_vi'), (28, 80, 4, 'vi', 'depression_questions_vi'), (28, 81, 3, 'vi', 'depression_questions_vi'), (28, 82, 2, 'vi', 'depression_questions_vi'), (28, 83, 4, 'vi', 'depression_questions_vi'), (28, 84, 3, 'vi', 'depression_questions_vi');

-- Student 9 - BDI Test 1 (Score: 10)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(29, 64, 1, 'vi', 'depression_questions_vi'), (29, 65, 1, 'vi', 'depression_questions_vi'), (29, 66, 1, 'vi', 'depression_questions_vi'), (29, 67, 1, 'vi', 'depression_questions_vi'), (29, 68, 1, 'vi', 'depression_questions_vi'), (29, 69, 0, 'vi', 'depression_questions_vi'), (29, 70, 1, 'vi', 'depression_questions_vi'), (29, 71, 1, 'vi', 'depression_questions_vi'), (29, 72, 0, 'vi', 'depression_questions_vi'), (29, 73, 1, 'vi', 'depression_questions_vi'),
(29, 74, 1, 'vi', 'depression_questions_vi'), (29, 75, 1, 'vi', 'depression_questions_vi'), (29, 76, 1, 'vi', 'depression_questions_vi'), (29, 77, 1, 'vi', 'depression_questions_vi'), (29, 78, 1, 'vi', 'depression_questions_vi'), (29, 79, 0, 'vi', 'depression_questions_vi'), (29, 80, 1, 'vi', 'depression_questions_vi'), (29, 81, 1, 'vi', 'depression_questions_vi'), (29, 82, 0, 'vi', 'depression_questions_vi'), (29, 83, 1, 'vi', 'depression_questions_vi'), (29, 84, 0, 'vi', 'depression_questions_vi');

-- Student 9 - BDI Test 2 (Score: 25)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(30, 64, 2, 'vi', 'depression_questions_vi'), (30, 65, 2, 'vi', 'depression_questions_vi'), (30, 66, 2, 'vi', 'depression_questions_vi'), (30, 67, 2, 'vi', 'depression_questions_vi'), (30, 68, 2, 'vi', 'depression_questions_vi'), (30, 69, 1, 'vi', 'depression_questions_vi'), (30, 70, 2, 'vi', 'depression_questions_vi'), (30, 71, 2, 'vi', 'depression_questions_vi'), (30, 72, 1, 'vi', 'depression_questions_vi'), (30, 73, 2, 'vi', 'depression_questions_vi'),
(30, 74, 2, 'vi', 'depression_questions_vi'), (30, 75, 2, 'vi', 'depression_questions_vi'), (30, 76, 2, 'vi', 'depression_questions_vi'), (30, 77, 2, 'vi', 'depression_questions_vi'), (30, 78, 2, 'vi', 'depression_questions_vi'), (30, 79, 1, 'vi', 'depression_questions_vi'), (30, 80, 2, 'vi', 'depression_questions_vi'), (30, 81, 2, 'vi', 'depression_questions_vi'), (30, 82, 1, 'vi', 'depression_questions_vi'), (30, 83, 2, 'vi', 'depression_questions_vi'), (30, 84, 1, 'vi', 'depression_questions_vi');

-- ========================================
-- RADS Test Answers (30 câu hỏi)
-- ========================================
-- Student 10 - RADS Test 1 (Score: 10)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(31, 85, 0, 'vi', 'depression_questions_vi'), (31, 86, 0, 'vi', 'depression_questions_vi'), (31, 87, 0, 'vi', 'depression_questions_vi'), (31, 88, 0, 'vi', 'depression_questions_vi'), (31, 89, 0, 'vi', 'depression_questions_vi'), (31, 90, 0, 'vi', 'depression_questions_vi'), (31, 91, 0, 'vi', 'depression_questions_vi'), (31, 92, 0, 'vi', 'depression_questions_vi'), (31, 93, 0, 'vi', 'depression_questions_vi'), (31, 94, 0, 'vi', 'depression_questions_vi'),
(31, 95, 0, 'vi', 'depression_questions_vi'), (31, 96, 0, 'vi', 'depression_questions_vi'), (31, 97, 0, 'vi', 'depression_questions_vi'), (31, 98, 0, 'vi', 'depression_questions_vi'), (31, 99, 0, 'vi', 'depression_questions_vi'), (31, 100, 0, 'vi', 'depression_questions_vi'), (31, 101, 0, 'vi', 'depression_questions_vi'), (31, 102, 0, 'vi', 'depression_questions_vi'), (31, 103, 0, 'vi', 'depression_questions_vi'), (31, 104, 0, 'vi', 'depression_questions_vi'),
(31, 105, 0, 'vi', 'depression_questions_vi'), (31, 106, 0, 'vi', 'depression_questions_vi'), (31, 107, 0, 'vi', 'depression_questions_vi'), (31, 108, 0, 'vi', 'depression_questions_vi'), (31, 109, 0, 'vi', 'depression_questions_vi'), (31, 110, 0, 'vi', 'depression_questions_vi'), (31, 111, 0, 'vi', 'depression_questions_vi'), (31, 112, 0, 'vi', 'depression_questions_vi'), (31, 113, 0, 'vi', 'depression_questions_vi'), (31, 114, 0, 'vi', 'depression_questions_vi');

-- Student 10 - RADS Test 2 (Score: 25)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(32, 85, 1, 'vi', 'depression_questions_vi'), (32, 86, 1, 'vi', 'depression_questions_vi'), (32, 87, 1, 'vi', 'depression_questions_vi'), (32, 88, 1, 'vi', 'depression_questions_vi'), (32, 89, 1, 'vi', 'depression_questions_vi'), (32, 90, 1, 'vi', 'depression_questions_vi'), (32, 91, 1, 'vi', 'depression_questions_vi'), (32, 92, 1, 'vi', 'depression_questions_vi'), (32, 93, 1, 'vi', 'depression_questions_vi'), (32, 94, 1, 'vi', 'depression_questions_vi'),
(32, 95, 1, 'vi', 'depression_questions_vi'), (32, 96, 1, 'vi', 'depression_questions_vi'), (32, 97, 1, 'vi', 'depression_questions_vi'), (32, 98, 1, 'vi', 'depression_questions_vi'), (32, 99, 1, 'vi', 'depression_questions_vi'), (32, 100, 1, 'vi', 'depression_questions_vi'), (32, 101, 1, 'vi', 'depression_questions_vi'), (32, 102, 1, 'vi', 'depression_questions_vi'), (32, 103, 1, 'vi', 'depression_questions_vi'), (32, 104, 1, 'vi', 'depression_questions_vi'),
(32, 105, 1, 'vi', 'depression_questions_vi'), (32, 106, 1, 'vi', 'depression_questions_vi'), (32, 107, 1, 'vi', 'depression_questions_vi'), (32, 108, 1, 'vi', 'depression_questions_vi'), (32, 109, 1, 'vi', 'depression_questions_vi'), (32, 110, 1, 'vi', 'depression_questions_vi'), (32, 111, 1, 'vi', 'depression_questions_vi'), (32, 112, 1, 'vi', 'depression_questions_vi'), (32, 113, 1, 'vi', 'depression_questions_vi'), (32, 114, 1, 'vi', 'depression_questions_vi');

-- Student 10 - RADS Test 3 (Score: 45)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(33, 85, 2, 'vi', 'depression_questions_vi'), (33, 86, 2, 'vi', 'depression_questions_vi'), (33, 87, 2, 'vi', 'depression_questions_vi'), (33, 88, 2, 'vi', 'depression_questions_vi'), (33, 89, 2, 'vi', 'depression_questions_vi'), (33, 90, 2, 'vi', 'depression_questions_vi'), (33, 91, 2, 'vi', 'depression_questions_vi'), (33, 92, 2, 'vi', 'depression_questions_vi'), (33, 93, 2, 'vi', 'depression_questions_vi'), (33, 94, 2, 'vi', 'depression_questions_vi'),
(33, 95, 2, 'vi', 'depression_questions_vi'), (33, 96, 2, 'vi', 'depression_questions_vi'), (33, 97, 2, 'vi', 'depression_questions_vi'), (33, 98, 2, 'vi', 'depression_questions_vi'), (33, 99, 2, 'vi', 'depression_questions_vi'), (33, 100, 2, 'vi', 'depression_questions_vi'), (33, 101, 2, 'vi', 'depression_questions_vi'), (33, 102, 2, 'vi', 'depression_questions_vi'), (33, 103, 2, 'vi', 'depression_questions_vi'), (33, 104, 2, 'vi', 'depression_questions_vi'),
(33, 105, 2, 'vi', 'depression_questions_vi'), (33, 106, 2, 'vi', 'depression_questions_vi'), (33, 107, 2, 'vi', 'depression_questions_vi'), (33, 108, 2, 'vi', 'depression_questions_vi'), (33, 109, 2, 'vi', 'depression_questions_vi'), (33, 110, 2, 'vi', 'depression_questions_vi'), (33, 111, 2, 'vi', 'depression_questions_vi'), (33, 112, 2, 'vi', 'depression_questions_vi'), (33, 113, 2, 'vi', 'depression_questions_vi'), (33, 114, 2, 'vi', 'depression_questions_vi');

-- Student 10 - RADS Test 4 (Score: 70)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(34, 85, 3, 'vi', 'depression_questions_vi'), (34, 86, 3, 'vi', 'depression_questions_vi'), (34, 87, 3, 'vi', 'depression_questions_vi'), (34, 88, 3, 'vi', 'depression_questions_vi'), (34, 89, 3, 'vi', 'depression_questions_vi'), (34, 90, 3, 'vi', 'depression_questions_vi'), (34, 91, 3, 'vi', 'depression_questions_vi'), (34, 92, 3, 'vi', 'depression_questions_vi'), (34, 93, 3, 'vi', 'depression_questions_vi'), (34, 94, 3, 'vi', 'depression_questions_vi'),
(34, 95, 3, 'vi', 'depression_questions_vi'), (34, 96, 3, 'vi', 'depression_questions_vi'), (34, 97, 3, 'vi', 'depression_questions_vi'), (34, 98, 3, 'vi', 'depression_questions_vi'), (34, 99, 3, 'vi', 'depression_questions_vi'), (34, 100, 3, 'vi', 'depression_questions_vi'), (34, 101, 3, 'vi', 'depression_questions_vi'), (34, 102, 3, 'vi', 'depression_questions_vi'), (34, 103, 3, 'vi', 'depression_questions_vi'), (34, 104, 3, 'vi', 'depression_questions_vi'),
(34, 105, 3, 'vi', 'depression_questions_vi'), (34, 106, 3, 'vi', 'depression_questions_vi'), (34, 107, 3, 'vi', 'depression_questions_vi'), (34, 108, 3, 'vi', 'depression_questions_vi'), (34, 109, 3, 'vi', 'depression_questions_vi'), (34, 110, 3, 'vi', 'depression_questions_vi'), (34, 111, 3, 'vi', 'depression_questions_vi'), (34, 112, 3, 'vi', 'depression_questions_vi'), (34, 113, 3, 'vi', 'depression_questions_vi'), (34, 114, 3, 'vi', 'depression_questions_vi');

-- Student 11 - RADS Test 1 (Score: 15)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(35, 85, 1, 'vi', 'depression_questions_vi'), (35, 86, 1, 'vi', 'depression_questions_vi'), (35, 87, 1, 'vi', 'depression_questions_vi'), (35, 88, 1, 'vi', 'depression_questions_vi'), (35, 89, 1, 'vi', 'depression_questions_vi'), (35, 90, 1, 'vi', 'depression_questions_vi'), (35, 91, 1, 'vi', 'depression_questions_vi'), (35, 92, 1, 'vi', 'depression_questions_vi'), (35, 93, 1, 'vi', 'depression_questions_vi'), (35, 94, 1, 'vi', 'depression_questions_vi'),
(35, 95, 1, 'vi', 'depression_questions_vi'), (35, 96, 1, 'vi', 'depression_questions_vi'), (35, 97, 1, 'vi', 'depression_questions_vi'), (35, 98, 1, 'vi', 'depression_questions_vi'), (35, 99, 1, 'vi', 'depression_questions_vi'), (35, 100, 1, 'vi', 'depression_questions_vi'), (35, 101, 1, 'vi', 'depression_questions_vi'), (35, 102, 1, 'vi', 'depression_questions_vi'), (35, 103, 1, 'vi', 'depression_questions_vi'), (35, 104, 1, 'vi', 'depression_questions_vi'),
(35, 105, 1, 'vi', 'depression_questions_vi'), (35, 106, 1, 'vi', 'depression_questions_vi'), (35, 107, 1, 'vi', 'depression_questions_vi'), (35, 108, 1, 'vi', 'depression_questions_vi'), (35, 109, 1, 'vi', 'depression_questions_vi'), (35, 110, 1, 'vi', 'depression_questions_vi'), (35, 111, 1, 'vi', 'depression_questions_vi'), (35, 112, 1, 'vi', 'depression_questions_vi'), (35, 113, 1, 'vi', 'depression_questions_vi'), (35, 114, 1, 'vi', 'depression_questions_vi');

-- Student 11 - RADS Test 2 (Score: 30)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(36, 85, 2, 'vi', 'depression_questions_vi'), (36, 86, 2, 'vi', 'depression_questions_vi'), (36, 87, 2, 'vi', 'depression_questions_vi'), (36, 88, 2, 'vi', 'depression_questions_vi'), (36, 89, 2, 'vi', 'depression_questions_vi'), (36, 90, 2, 'vi', 'depression_questions_vi'), (36, 91, 2, 'vi', 'depression_questions_vi'), (36, 92, 2, 'vi', 'depression_questions_vi'), (36, 93, 2, 'vi', 'depression_questions_vi'), (36, 94, 2, 'vi', 'depression_questions_vi'),
(36, 95, 2, 'vi', 'depression_questions_vi'), (36, 96, 2, 'vi', 'depression_questions_vi'), (36, 97, 2, 'vi', 'depression_questions_vi'), (36, 98, 2, 'vi', 'depression_questions_vi'), (36, 99, 2, 'vi', 'depression_questions_vi'), (36, 100, 2, 'vi', 'depression_questions_vi'), (36, 101, 2, 'vi', 'depression_questions_vi'), (36, 102, 2, 'vi', 'depression_questions_vi'), (36, 103, 2, 'vi', 'depression_questions_vi'), (36, 104, 2, 'vi', 'depression_questions_vi'),
(36, 105, 2, 'vi', 'depression_questions_vi'), (36, 106, 2, 'vi', 'depression_questions_vi'), (36, 107, 2, 'vi', 'depression_questions_vi'), (36, 108, 2, 'vi', 'depression_questions_vi'), (36, 109, 2, 'vi', 'depression_questions_vi'), (36, 110, 2, 'vi', 'depression_questions_vi'), (36, 111, 2, 'vi', 'depression_questions_vi'), (36, 112, 2, 'vi', 'depression_questions_vi'), (36, 113, 2, 'vi', 'depression_questions_vi'), (36, 114, 2, 'vi', 'depression_questions_vi');

-- Student 11 - RADS Test 3 (Score: 52)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(37, 85, 3, 'vi', 'depression_questions_vi'), (37, 86, 3, 'vi', 'depression_questions_vi'), (37, 87, 3, 'vi', 'depression_questions_vi'), (37, 88, 3, 'vi', 'depression_questions_vi'), (37, 89, 3, 'vi', 'depression_questions_vi'), (37, 90, 3, 'vi', 'depression_questions_vi'), (37, 91, 3, 'vi', 'depression_questions_vi'), (37, 92, 3, 'vi', 'depression_questions_vi'), (37, 93, 3, 'vi', 'depression_questions_vi'), (37, 94, 3, 'vi', 'depression_questions_vi'),
(37, 95, 3, 'vi', 'depression_questions_vi'), (37, 96, 3, 'vi', 'depression_questions_vi'), (37, 97, 3, 'vi', 'depression_questions_vi'), (37, 98, 3, 'vi', 'depression_questions_vi'), (37, 99, 3, 'vi', 'depression_questions_vi'), (37, 100, 3, 'vi', 'depression_questions_vi'), (37, 101, 3, 'vi', 'depression_questions_vi'), (37, 102, 3, 'vi', 'depression_questions_vi'), (37, 103, 3, 'vi', 'depression_questions_vi'), (37, 104, 3, 'vi', 'depression_questions_vi'),
(37, 105, 3, 'vi', 'depression_questions_vi'), (37, 106, 3, 'vi', 'depression_questions_vi'), (37, 107, 3, 'vi', 'depression_questions_vi'), (37, 108, 3, 'vi', 'depression_questions_vi'), (37, 109, 3, 'vi', 'depression_questions_vi'), (37, 110, 3, 'vi', 'depression_questions_vi'), (37, 111, 3, 'vi', 'depression_questions_vi'), (37, 112, 3, 'vi', 'depression_questions_vi'), (37, 113, 3, 'vi', 'depression_questions_vi'), (37, 114, 3, 'vi', 'depression_questions_vi');

-- Student 11 - RADS Test 4 (Score: 75)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(38, 85, 4, 'vi', 'depression_questions_vi'), (38, 86, 4, 'vi', 'depression_questions_vi'), (38, 87, 4, 'vi', 'depression_questions_vi'), (38, 88, 4, 'vi', 'depression_questions_vi'), (38, 89, 4, 'vi', 'depression_questions_vi'), (38, 90, 4, 'vi', 'depression_questions_vi'), (38, 91, 4, 'vi', 'depression_questions_vi'), (38, 92, 4, 'vi', 'depression_questions_vi'), (38, 93, 4, 'vi', 'depression_questions_vi'), (38, 94, 4, 'vi', 'depression_questions_vi'),
(38, 95, 4, 'vi', 'depression_questions_vi'), (38, 96, 4, 'vi', 'depression_questions_vi'), (38, 97, 4, 'vi', 'depression_questions_vi'), (38, 98, 4, 'vi', 'depression_questions_vi'), (38, 99, 4, 'vi', 'depression_questions_vi'), (38, 100, 4, 'vi', 'depression_questions_vi'), (38, 101, 4, 'vi', 'depression_questions_vi'), (38, 102, 4, 'vi', 'depression_questions_vi'), (38, 103, 4, 'vi', 'depression_questions_vi'), (38, 104, 4, 'vi', 'depression_questions_vi'),
(38, 105, 4, 'vi', 'depression_questions_vi'), (38, 106, 4, 'vi', 'depression_questions_vi'), (38, 107, 4, 'vi', 'depression_questions_vi'), (38, 108, 4, 'vi', 'depression_questions_vi'), (38, 109, 4, 'vi', 'depression_questions_vi'), (38, 110, 4, 'vi', 'depression_questions_vi'), (38, 111, 4, 'vi', 'depression_questions_vi'), (38, 112, 4, 'vi', 'depression_questions_vi'), (38, 113, 4, 'vi', 'depression_questions_vi'), (38, 114, 4, 'vi', 'depression_questions_vi');

-- Student 12 - RADS Test 1 (Score: 12)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(39, 85, 1, 'vi', 'depression_questions_vi'), (39, 86, 1, 'vi', 'depression_questions_vi'), (39, 87, 1, 'vi', 'depression_questions_vi'), (39, 88, 1, 'vi', 'depression_questions_vi'), (39, 89, 1, 'vi', 'depression_questions_vi'), (39, 90, 1, 'vi', 'depression_questions_vi'), (39, 91, 1, 'vi', 'depression_questions_vi'), (39, 92, 1, 'vi', 'depression_questions_vi'), (39, 93, 1, 'vi', 'depression_questions_vi'), (39, 94, 1, 'vi', 'depression_questions_vi'),
(39, 95, 1, 'vi', 'depression_questions_vi'), (39, 96, 1, 'vi', 'depression_questions_vi'), (39, 97, 1, 'vi', 'depression_questions_vi'), (39, 98, 1, 'vi', 'depression_questions_vi'), (39, 99, 1, 'vi', 'depression_questions_vi'), (39, 100, 1, 'vi', 'depression_questions_vi'), (39, 101, 1, 'vi', 'depression_questions_vi'), (39, 102, 1, 'vi', 'depression_questions_vi'), (39, 103, 1, 'vi', 'depression_questions_vi'), (39, 104, 1, 'vi', 'depression_questions_vi'),
(39, 105, 1, 'vi', 'depression_questions_vi'), (39, 106, 1, 'vi', 'depression_questions_vi'), (39, 107, 1, 'vi', 'depression_questions_vi'), (39, 108, 1, 'vi', 'depression_questions_vi'), (39, 109, 1, 'vi', 'depression_questions_vi'), (39, 110, 1, 'vi', 'depression_questions_vi'), (39, 111, 1, 'vi', 'depression_questions_vi'), (39, 112, 1, 'vi', 'depression_questions_vi'), (39, 113, 1, 'vi', 'depression_questions_vi'), (39, 114, 1, 'vi', 'depression_questions_vi');

-- Student 12 - RADS Test 2 (Score: 28)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(40, 85, 2, 'vi', 'depression_questions_vi'), (40, 86, 2, 'vi', 'depression_questions_vi'), (40, 87, 2, 'vi', 'depression_questions_vi'), (40, 88, 2, 'vi', 'depression_questions_vi'), (40, 89, 2, 'vi', 'depression_questions_vi'), (40, 90, 2, 'vi', 'depression_questions_vi'), (40, 91, 2, 'vi', 'depression_questions_vi'), (40, 92, 2, 'vi', 'depression_questions_vi'), (40, 93, 2, 'vi', 'depression_questions_vi'), (40, 94, 2, 'vi', 'depression_questions_vi'),
(40, 95, 2, 'vi', 'depression_questions_vi'), (40, 96, 2, 'vi', 'depression_questions_vi'), (40, 97, 2, 'vi', 'depression_questions_vi'), (40, 98, 2, 'vi', 'depression_questions_vi'), (40, 99, 2, 'vi', 'depression_questions_vi'), (40, 100, 2, 'vi', 'depression_questions_vi'), (40, 101, 2, 'vi', 'depression_questions_vi'), (40, 102, 2, 'vi', 'depression_questions_vi'), (40, 103, 2, 'vi', 'depression_questions_vi'), (40, 104, 2, 'vi', 'depression_questions_vi'),
(40, 105, 2, 'vi', 'depression_questions_vi'), (40, 106, 2, 'vi', 'depression_questions_vi'), (40, 107, 2, 'vi', 'depression_questions_vi'), (40, 108, 2, 'vi', 'depression_questions_vi'), (40, 109, 2, 'vi', 'depression_questions_vi'), (40, 110, 2, 'vi', 'depression_questions_vi'), (40, 111, 2, 'vi', 'depression_questions_vi'), (40, 112, 2, 'vi', 'depression_questions_vi'), (40, 113, 2, 'vi', 'depression_questions_vi'), (40, 114, 2, 'vi', 'depression_questions_vi');

-- ========================================
-- EPDS Test Answers (10 câu hỏi)
-- ========================================
-- Student 13 - EPDS Test 1 (Score: 3)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(41, 115, 0, 'vi', 'depression_questions_vi'), (41, 116, 0, 'vi', 'depression_questions_vi'), (41, 117, 0, 'vi', 'depression_questions_vi'), (41, 118, 0, 'vi', 'depression_questions_vi'), (41, 119, 0, 'vi', 'depression_questions_vi'), (41, 120, 0, 'vi', 'depression_questions_vi'), (41, 121, 0, 'vi', 'depression_questions_vi'), (41, 122, 0, 'vi', 'depression_questions_vi'), (41, 123, 0, 'vi', 'depression_questions_vi'), (41, 124, 0, 'vi', 'depression_questions_vi');

-- Student 13 - EPDS Test 2 (Score: 8)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(42, 115, 1, 'vi', 'depression_questions_vi'), (42, 116, 1, 'vi', 'depression_questions_vi'), (42, 117, 1, 'vi', 'depression_questions_vi'), (42, 118, 1, 'vi', 'depression_questions_vi'), (42, 119, 1, 'vi', 'depression_questions_vi'), (42, 120, 1, 'vi', 'depression_questions_vi'), (42, 121, 1, 'vi', 'depression_questions_vi'), (42, 122, 1, 'vi', 'depression_questions_vi'), (42, 123, 0, 'vi', 'depression_questions_vi'), (42, 124, 0, 'vi', 'depression_questions_vi');

-- Student 13 - EPDS Test 3 (Score: 15)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(43, 115, 2, 'vi', 'depression_questions_vi'), (43, 116, 2, 'vi', 'depression_questions_vi'), (43, 117, 2, 'vi', 'depression_questions_vi'), (43, 118, 2, 'vi', 'depression_questions_vi'), (43, 119, 2, 'vi', 'depression_questions_vi'), (43, 120, 2, 'vi', 'depression_questions_vi'), (43, 121, 2, 'vi', 'depression_questions_vi'), (43, 122, 2, 'vi', 'depression_questions_vi'), (43, 123, 1, 'vi', 'depression_questions_vi'), (43, 124, 0, 'vi', 'depression_questions_vi');

-- Student 13 - EPDS Test 4 (Score: 25)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(44, 115, 3, 'vi', 'depression_questions_vi'), (44, 116, 3, 'vi', 'depression_questions_vi'), (44, 117, 3, 'vi', 'depression_questions_vi'), (44, 118, 3, 'vi', 'depression_questions_vi'), (44, 119, 3, 'vi', 'depression_questions_vi'), (44, 120, 3, 'vi', 'depression_questions_vi'), (44, 121, 3, 'vi', 'depression_questions_vi'), (44, 122, 3, 'vi', 'depression_questions_vi'), (44, 123, 2, 'vi', 'depression_questions_vi'), (44, 124, 1, 'vi', 'depression_questions_vi');

-- Student 14 - EPDS Test 1 (Score: 5)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(45, 115, 1, 'vi', 'depression_questions_vi'), (45, 116, 0, 'vi', 'depression_questions_vi'), (45, 117, 1, 'vi', 'depression_questions_vi'), (45, 118, 0, 'vi', 'depression_questions_vi'), (45, 119, 1, 'vi', 'depression_questions_vi'), (45, 120, 0, 'vi', 'depression_questions_vi'), (45, 121, 1, 'vi', 'depression_questions_vi'), (45, 122, 0, 'vi', 'depression_questions_vi'), (45, 123, 0, 'vi', 'depression_questions_vi'), (45, 124, 0, 'vi', 'depression_questions_vi');

-- Student 14 - EPDS Test 2 (Score: 12)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(46, 115, 2, 'vi', 'depression_questions_vi'), (46, 116, 1, 'vi', 'depression_questions_vi'), (46, 117, 2, 'vi', 'depression_questions_vi'), (46, 118, 1, 'vi', 'depression_questions_vi'), (46, 119, 2, 'vi', 'depression_questions_vi'), (46, 120, 1, 'vi', 'depression_questions_vi'), (46, 121, 2, 'vi', 'depression_questions_vi'), (46, 122, 1, 'vi', 'depression_questions_vi'), (46, 123, 0, 'vi', 'depression_questions_vi'), (46, 124, 0, 'vi', 'depression_questions_vi');

-- Student 14 - EPDS Test 3 (Score: 18)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(47, 115, 3, 'vi', 'depression_questions_vi'), (47, 116, 2, 'vi', 'depression_questions_vi'), (47, 117, 3, 'vi', 'depression_questions_vi'), (47, 118, 2, 'vi', 'depression_questions_vi'), (47, 119, 3, 'vi', 'depression_questions_vi'), (47, 120, 2, 'vi', 'depression_questions_vi'), (47, 121, 3, 'vi', 'depression_questions_vi'), (47, 122, 2, 'vi', 'depression_questions_vi'), (47, 123, 1, 'vi', 'depression_questions_vi'), (47, 124, 0, 'vi', 'depression_questions_vi');

-- Student 14 - EPDS Test 4 (Score: 28)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(48, 115, 3, 'vi', 'depression_questions_vi'), (48, 116, 3, 'vi', 'depression_questions_vi'), (48, 117, 3, 'vi', 'depression_questions_vi'), (48, 118, 3, 'vi', 'depression_questions_vi'), (48, 119, 3, 'vi', 'depression_questions_vi'), (48, 120, 3, 'vi', 'depression_questions_vi'), (48, 121, 3, 'vi', 'depression_questions_vi'), (48, 122, 3, 'vi', 'depression_questions_vi'), (48, 123, 2, 'vi', 'depression_questions_vi'), (48, 124, 1, 'vi', 'depression_questions_vi');

-- Student 15 - EPDS Test 1 (Score: 4)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(49, 115, 0, 'vi', 'depression_questions_vi'), (49, 116, 1, 'vi', 'depression_questions_vi'), (49, 117, 0, 'vi', 'depression_questions_vi'), (49, 118, 1, 'vi', 'depression_questions_vi'), (49, 119, 0, 'vi', 'depression_questions_vi'), (49, 120, 1, 'vi', 'depression_questions_vi'), (49, 121, 0, 'vi', 'depression_questions_vi'), (49, 122, 1, 'vi', 'depression_questions_vi'), (49, 123, 0, 'vi', 'depression_questions_vi'), (49, 124, 0, 'vi', 'depression_questions_vi');

-- Student 15 - EPDS Test 2 (Score: 10)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(50, 115, 1, 'vi', 'depression_questions_vi'), (50, 116, 2, 'vi', 'depression_questions_vi'), (50, 117, 1, 'vi', 'depression_questions_vi'), (50, 118, 2, 'vi', 'depression_questions_vi'), (50, 119, 1, 'vi', 'depression_questions_vi'), (50, 120, 2, 'vi', 'depression_questions_vi'), (50, 121, 1, 'vi', 'depression_questions_vi'), (50, 122, 2, 'vi', 'depression_questions_vi'), (50, 123, 0, 'vi', 'depression_questions_vi'), (50, 124, 0, 'vi', 'depression_questions_vi');

-- ========================================
-- SAS Test Answers (20 câu hỏi)
-- ========================================
-- Student 16 - SAS Test 1 (Score: 15)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(51, 125, 0, 'vi', 'depression_questions_vi'), (51, 126, 0, 'vi', 'depression_questions_vi'), (51, 127, 0, 'vi', 'depression_questions_vi'), (51, 128, 0, 'vi', 'depression_questions_vi'), (51, 129, 0, 'vi', 'depression_questions_vi'), (51, 130, 0, 'vi', 'depression_questions_vi'), (51, 131, 0, 'vi', 'depression_questions_vi'), (51, 132, 0, 'vi', 'depression_questions_vi'), (51, 133, 0, 'vi', 'depression_questions_vi'), (51, 134, 0, 'vi', 'depression_questions_vi'),
(51, 135, 0, 'vi', 'depression_questions_vi'), (51, 136, 0, 'vi', 'depression_questions_vi'), (51, 137, 0, 'vi', 'depression_questions_vi'), (51, 138, 0, 'vi', 'depression_questions_vi'), (51, 139, 0, 'vi', 'depression_questions_vi'), (51, 140, 0, 'vi', 'depression_questions_vi'), (51, 141, 0, 'vi', 'depression_questions_vi'), (51, 142, 0, 'vi', 'depression_questions_vi'), (51, 143, 0, 'vi', 'depression_questions_vi'), (51, 144, 0, 'vi', 'depression_questions_vi');

-- Student 16 - SAS Test 2 (Score: 35)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(52, 125, 1, 'vi', 'depression_questions_vi'), (52, 126, 1, 'vi', 'depression_questions_vi'), (52, 127, 1, 'vi', 'depression_questions_vi'), (52, 128, 1, 'vi', 'depression_questions_vi'), (52, 129, 1, 'vi', 'depression_questions_vi'), (52, 130, 1, 'vi', 'depression_questions_vi'), (52, 131, 1, 'vi', 'depression_questions_vi'), (52, 132, 1, 'vi', 'depression_questions_vi'), (52, 133, 1, 'vi', 'depression_questions_vi'), (52, 134, 1, 'vi', 'depression_questions_vi'),
(52, 135, 1, 'vi', 'depression_questions_vi'), (52, 136, 1, 'vi', 'depression_questions_vi'), (52, 137, 1, 'vi', 'depression_questions_vi'), (52, 138, 1, 'vi', 'depression_questions_vi'), (52, 139, 1, 'vi', 'depression_questions_vi'), (52, 140, 1, 'vi', 'depression_questions_vi'), (52, 141, 1, 'vi', 'depression_questions_vi'), (52, 142, 1, 'vi', 'depression_questions_vi'), (52, 143, 1, 'vi', 'depression_questions_vi'), (52, 144, 1, 'vi', 'depression_questions_vi');

-- Student 16 - SAS Test 3 (Score: 55)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(53, 125, 2, 'vi', 'depression_questions_vi'), (53, 126, 2, 'vi', 'depression_questions_vi'), (53, 127, 2, 'vi', 'depression_questions_vi'), (53, 128, 2, 'vi', 'depression_questions_vi'), (53, 129, 2, 'vi', 'depression_questions_vi'), (53, 130, 2, 'vi', 'depression_questions_vi'), (53, 131, 2, 'vi', 'depression_questions_vi'), (53, 132, 2, 'vi', 'depression_questions_vi'), (53, 133, 2, 'vi', 'depression_questions_vi'), (53, 134, 2, 'vi', 'depression_questions_vi'),
(53, 135, 2, 'vi', 'depression_questions_vi'), (53, 136, 2, 'vi', 'depression_questions_vi'), (53, 137, 2, 'vi', 'depression_questions_vi'), (53, 138, 2, 'vi', 'depression_questions_vi'), (53, 139, 2, 'vi', 'depression_questions_vi'), (53, 140, 2, 'vi', 'depression_questions_vi'), (53, 141, 2, 'vi', 'depression_questions_vi'), (53, 142, 2, 'vi', 'depression_questions_vi'), (53, 143, 2, 'vi', 'depression_questions_vi'), (53, 144, 2, 'vi', 'depression_questions_vi');

-- Student 16 - SAS Test 4 (Score: 75)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(54, 125, 3, 'vi', 'depression_questions_vi'), (54, 126, 3, 'vi', 'depression_questions_vi'), (54, 127, 3, 'vi', 'depression_questions_vi'), (54, 128, 3, 'vi', 'depression_questions_vi'), (54, 129, 3, 'vi', 'depression_questions_vi'), (54, 130, 3, 'vi', 'depression_questions_vi'), (54, 131, 3, 'vi', 'depression_questions_vi'), (54, 132, 3, 'vi', 'depression_questions_vi'), (54, 133, 3, 'vi', 'depression_questions_vi'), (54, 134, 3, 'vi', 'depression_questions_vi'),
(54, 135, 3, 'vi', 'depression_questions_vi'), (54, 136, 3, 'vi', 'depression_questions_vi'), (54, 137, 3, 'vi', 'depression_questions_vi'), (54, 138, 3, 'vi', 'depression_questions_vi'), (54, 139, 3, 'vi', 'depression_questions_vi'), (54, 140, 3, 'vi', 'depression_questions_vi'), (54, 141, 3, 'vi', 'depression_questions_vi'), (54, 142, 3, 'vi', 'depression_questions_vi'), (54, 143, 3, 'vi', 'depression_questions_vi'), (54, 144, 3, 'vi', 'depression_questions_vi');

-- Student 17 - SAS Test 1 (Score: 20)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(55, 125, 1, 'vi', 'depression_questions_vi'), (55, 126, 1, 'vi', 'depression_questions_vi'), (55, 127, 1, 'vi', 'depression_questions_vi'), (55, 128, 1, 'vi', 'depression_questions_vi'), (55, 129, 1, 'vi', 'depression_questions_vi'), (55, 130, 1, 'vi', 'depression_questions_vi'), (55, 131, 1, 'vi', 'depression_questions_vi'), (55, 132, 1, 'vi', 'depression_questions_vi'), (55, 133, 1, 'vi', 'depression_questions_vi'), (55, 134, 1, 'vi', 'depression_questions_vi'),
(55, 135, 1, 'vi', 'depression_questions_vi'), (55, 136, 1, 'vi', 'depression_questions_vi'), (55, 137, 1, 'vi', 'depression_questions_vi'), (55, 138, 1, 'vi', 'depression_questions_vi'), (55, 139, 1, 'vi', 'depression_questions_vi'), (55, 140, 1, 'vi', 'depression_questions_vi'), (55, 141, 1, 'vi', 'depression_questions_vi'), (55, 142, 1, 'vi', 'depression_questions_vi'), (55, 143, 1, 'vi', 'depression_questions_vi'), (55, 144, 1, 'vi', 'depression_questions_vi');

-- Student 17 - SAS Test 2 (Score: 40)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(56, 125, 2, 'vi', 'depression_questions_vi'), (56, 126, 2, 'vi', 'depression_questions_vi'), (56, 127, 2, 'vi', 'depression_questions_vi'), (56, 128, 2, 'vi', 'depression_questions_vi'), (56, 129, 2, 'vi', 'depression_questions_vi'), (56, 130, 2, 'vi', 'depression_questions_vi'), (56, 131, 2, 'vi', 'depression_questions_vi'), (56, 132, 2, 'vi', 'depression_questions_vi'), (56, 133, 2, 'vi', 'depression_questions_vi'), (56, 134, 2, 'vi', 'depression_questions_vi'),
(56, 135, 2, 'vi', 'depression_questions_vi'), (56, 136, 2, 'vi', 'depression_questions_vi'), (56, 137, 2, 'vi', 'depression_questions_vi'), (56, 138, 2, 'vi', 'depression_questions_vi'), (56, 139, 2, 'vi', 'depression_questions_vi'), (56, 140, 2, 'vi', 'depression_questions_vi'), (56, 141, 2, 'vi', 'depression_questions_vi'), (56, 142, 2, 'vi', 'depression_questions_vi'), (56, 143, 2, 'vi', 'depression_questions_vi'), (56, 144, 2, 'vi', 'depression_questions_vi');

-- Student 17 - SAS Test 3 (Score: 60)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(57, 125, 3, 'vi', 'depression_questions_vi'), (57, 126, 3, 'vi', 'depression_questions_vi'), (57, 127, 3, 'vi', 'depression_questions_vi'), (57, 128, 3, 'vi', 'depression_questions_vi'), (57, 129, 3, 'vi', 'depression_questions_vi'), (57, 130, 3, 'vi', 'depression_questions_vi'), (57, 131, 3, 'vi', 'depression_questions_vi'), (57, 132, 3, 'vi', 'depression_questions_vi'), (57, 133, 3, 'vi', 'depression_questions_vi'), (57, 134, 3, 'vi', 'depression_questions_vi'),
(57, 135, 3, 'vi', 'depression_questions_vi'), (57, 136, 3, 'vi', 'depression_questions_vi'), (57, 137, 3, 'vi', 'depression_questions_vi'), (57, 138, 3, 'vi', 'depression_questions_vi'), (57, 139, 3, 'vi', 'depression_questions_vi'), (57, 140, 3, 'vi', 'depression_questions_vi'), (57, 141, 3, 'vi', 'depression_questions_vi'), (57, 142, 3, 'vi', 'depression_questions_vi'), (57, 143, 3, 'vi', 'depression_questions_vi'), (57, 144, 3, 'vi', 'depression_questions_vi');

-- Student 17 - SAS Test 4 (Score: 80)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(58, 125, 4, 'vi', 'depression_questions_vi'), (58, 126, 4, 'vi', 'depression_questions_vi'), (58, 127, 4, 'vi', 'depression_questions_vi'), (58, 128, 4, 'vi', 'depression_questions_vi'), (58, 129, 4, 'vi', 'depression_questions_vi'), (58, 130, 4, 'vi', 'depression_questions_vi'), (58, 131, 4, 'vi', 'depression_questions_vi'), (58, 132, 4, 'vi', 'depression_questions_vi'), (58, 133, 4, 'vi', 'depression_questions_vi'), (58, 134, 4, 'vi', 'depression_questions_vi'),
(58, 135, 4, 'vi', 'depression_questions_vi'), (58, 136, 4, 'vi', 'depression_questions_vi'), (58, 137, 4, 'vi', 'depression_questions_vi'), (58, 138, 4, 'vi', 'depression_questions_vi'), (58, 139, 4, 'vi', 'depression_questions_vi'), (58, 140, 4, 'vi', 'depression_questions_vi'), (58, 141, 4, 'vi', 'depression_questions_vi'), (58, 142, 4, 'vi', 'depression_questions_vi'), (58, 143, 4, 'vi', 'depression_questions_vi'), (58, 144, 4, 'vi', 'depression_questions_vi');

-- Student 18 - SAS Test 1 (Score: 18)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(59, 125, 1, 'vi', 'depression_questions_vi'), (59, 126, 1, 'vi', 'depression_questions_vi'), (59, 127, 1, 'vi', 'depression_questions_vi'), (59, 128, 1, 'vi', 'depression_questions_vi'), (59, 129, 1, 'vi', 'depression_questions_vi'), (59, 130, 1, 'vi', 'depression_questions_vi'), (59, 131, 1, 'vi', 'depression_questions_vi'), (59, 132, 1, 'vi', 'depression_questions_vi'), (59, 133, 1, 'vi', 'depression_questions_vi'), (59, 134, 1, 'vi', 'depression_questions_vi'),
(59, 135, 1, 'vi', 'depression_questions_vi'), (59, 136, 1, 'vi', 'depression_questions_vi'), (59, 137, 1, 'vi', 'depression_questions_vi'), (59, 138, 1, 'vi', 'depression_questions_vi'), (59, 139, 1, 'vi', 'depression_questions_vi'), (59, 140, 1, 'vi', 'depression_questions_vi'), (59, 141, 1, 'vi', 'depression_questions_vi'), (59, 142, 1, 'vi', 'depression_questions_vi'), (59, 143, 1, 'vi', 'depression_questions_vi'), (59, 144, 1, 'vi', 'depression_questions_vi');

-- Student 18 - SAS Test 2 (Score: 38)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(60, 125, 2, 'vi', 'depression_questions_vi'), (60, 126, 2, 'vi', 'depression_questions_vi'), (60, 127, 2, 'vi', 'depression_questions_vi'), (60, 128, 2, 'vi', 'depression_questions_vi'), (60, 129, 2, 'vi', 'depression_questions_vi'), (60, 130, 2, 'vi', 'depression_questions_vi'), (60, 131, 2, 'vi', 'depression_questions_vi'), (60, 132, 2, 'vi', 'depression_questions_vi'), (60, 133, 2, 'vi', 'depression_questions_vi'), (60, 134, 2, 'vi', 'depression_questions_vi'),
(60, 135, 2, 'vi', 'depression_questions_vi'), (60, 136, 2, 'vi', 'depression_questions_vi'), (60, 137, 2, 'vi', 'depression_questions_vi'), (60, 138, 2, 'vi', 'depression_questions_vi'), (60, 139, 2, 'vi', 'depression_questions_vi'), (60, 140, 2, 'vi', 'depression_questions_vi'), (60, 141, 2, 'vi', 'depression_questions_vi'), (60, 142, 2, 'vi', 'depression_questions_vi'), (60, 143, 2, 'vi', 'depression_questions_vi'), (60, 144, 2, 'vi', 'depression_questions_vi');

-- Advice Messages
INSERT INTO advice_messages (sender_id, receiver_id, message, message_type, is_read, sent_at) VALUES
(1, 6, 'Chào em, đây là lời khuyên thử nghiệm!', 'ADVICE', 0, NOW()),
(1, 7, 'Anh có thể giúp em được không?', 'ADVICE', 0, NOW()),
(1, 8, 'Em có thể nói cho anh biết em cần gì không?', 'ADVICE', 0, NOW()),
(1, 9, 'Anh thấy em có vẻ lo âu, em có thể nói cho anh biết em cần gì không?', 'ADVICE', 0, NOW()),
(1, 10, 'Em có thể nói cho anh biết em cần gì không?', 'ADVICE', 0, NOW()),
(1, 11, 'Anh có thể giúp em được không?', 'ADVICE', 0, NOW()),
(1, 12, 'Em có thể nói cho anh biết em cần gì không?', 'ADVICE', 0, NOW()),
(1, 13, 'Anh thấy em có vẻ lo âu, em có thể nói cho anh biết em cần gì không?', 'ADVICE', 0, NOW()),
(1, 14, 'Em có thể nói cho anh biết em cần gì không?', 'ADVICE', 0, NOW()),
(1, 15, 'Anh có thể giúp em được không?', 'ADVICE', 0, NOW()),
(1, 16, 'Em có thể nói cho anh biết em cần gì không?', 'ADVICE', 0, NOW()),
(1, 17, 'Anh thấy em có vẻ lo âu, em có thể nói cho anh biết em cần gì không?', 'ADVICE', 0, NOW()),
(1, 18, 'Em có thể nói cho anh biết em cần gì không?', 'ADVICE', 0, NOW()),
(1, 19, 'Anh có thể giúp em được không?', 'ADVICE', 0, NOW()),
(1, 20, 'Em có thể nói cho anh biết em cần gì không?', 'ADVICE', 0, NOW());

-- ========================================
-- 11. APPOINTMENT BOOKING SYSTEM TABLES
-- ========================================

-- Bảng lịch hẹn với chuyên gia
CREATE TABLE appointments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    expert_id BIGINT NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 60,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW') DEFAULT 'PENDING',
    consultation_type ENUM('ONLINE', 'PHONE', 'IN_PERSON') DEFAULT 'ONLINE',
    meeting_link VARCHAR(500) NULL, -- Link Zoom/Meet cho tư vấn online
    meeting_location VARCHAR(255) NULL, -- Địa điểm cho tư vấn trực tiếp
    notes TEXT NULL, -- Ghi chú của học sinh
    expert_notes TEXT NULL, -- Ghi chú của chuyên gia
    cancellation_reason TEXT NULL, -- Lý do hủy lịch hẹn
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_expert_id (expert_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status)
);

-- Bảng lịch làm việc của chuyên gia
CREATE TABLE expert_schedules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    expert_id BIGINT NOT NULL,
    day_of_week INT NOT NULL, -- 1=Monday, 2=Tuesday, ..., 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    max_appointments_per_day INT DEFAULT 8, -- Số lịch hẹn tối đa mỗi ngày
    break_start_time TIME NULL, -- Thời gian nghỉ trưa bắt đầu
    break_end_time TIME NULL, -- Thời gian nghỉ trưa kết thúc
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_expert_day (expert_id, day_of_week),
    INDEX idx_expert_id (expert_id),
    INDEX idx_day_of_week (day_of_week)
);

-- Bảng thời gian nghỉ của chuyên gia (nghỉ phép, nghỉ lễ, v.v.)
CREATE TABLE expert_breaks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    expert_id BIGINT NOT NULL,
    break_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason ENUM('VACATION', 'SICK_LEAVE', 'HOLIDAY', 'PERSONAL', 'OTHER') DEFAULT 'OTHER',
    description VARCHAR(255) NULL,
    is_recurring BOOLEAN DEFAULT FALSE, -- Có lặp lại hàng năm không (ví dụ: nghỉ lễ)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_expert_id (expert_id),
    INDEX idx_break_date (break_date),
    INDEX idx_reason (reason)
);

-- Bảng cài đặt lịch hẹn của hệ thống
CREATE TABLE appointment_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng lịch sử thay đổi lịch hẹn
CREATE TABLE appointment_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    appointment_id BIGINT NOT NULL,
    action ENUM('CREATED', 'UPDATED', 'CANCELLED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW') NOT NULL,
    old_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW') NULL,
    new_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW') NULL,
    changed_by BIGINT NOT NULL, -- ID của user thực hiện thay đổi
    change_reason TEXT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_changed_by (changed_by),
    INDEX idx_changed_at (changed_at)
);

-- Bảng thông báo lịch hẹn
CREATE TABLE appointment_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    appointment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL, -- ID của user nhận thông báo
    notification_type ENUM('REMINDER', 'CONFIRMATION', 'CANCELLATION', 'RESCHEDULE', 'COMPLETION') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_notification_type (notification_type),
    INDEX idx_is_sent (is_sent),
    INDEX idx_is_read (is_read)
);

-- ========================================
-- 12. APPOINTMENT SAMPLE DATA
-- ========================================

-- Cài đặt hệ thống lịch hẹn
INSERT INTO appointment_settings (setting_key, setting_value, description) VALUES
('appointment_advance_booking_days', '30', 'Số ngày có thể đặt lịch hẹn trước'),
('appointment_cancellation_hours', '24', 'Số giờ tối thiểu trước khi hủy lịch hẹn'),
('appointment_reminder_hours', '2', 'Số giờ trước khi gửi nhắc nhở lịch hẹn'),
('appointment_duration_default', '60', 'Thời lượng mặc định của lịch hẹn (phút)'),
('appointment_max_per_day', '8', 'Số lịch hẹn tối đa mỗi ngày cho mỗi chuyên gia'),
('appointment_auto_confirm', 'false', 'Tự động xác nhận lịch hẹn khi chuyên gia có lịch trống'),
('appointment_allow_same_day', 'true', 'Cho phép đặt lịch hẹn trong cùng ngày'),
('appointment_time_slots', '09:00,10:00,11:00,14:00,15:00,16:00,17:00', 'Các khung giờ có thể đặt lịch hẹn');

-- Lịch làm việc của chuyên gia 1 (cuongcodehub@gmail.com)
INSERT INTO expert_schedules (expert_id, day_of_week, start_time, end_time, max_appointments_per_day, break_start_time, break_end_time) VALUES
(3, 1, '09:00:00', '17:00:00', 8, '12:00:00', '13:00:00'), -- Monday
(3, 2, '09:00:00', '17:00:00', 8, '12:00:00', '13:00:00'), -- Tuesday
(3, 3, '09:00:00', '17:00:00', 8, '12:00:00', '13:00:00'), -- Wednesday
(3, 4, '09:00:00', '17:00:00', 8, '12:00:00', '13:00:00'), -- Thursday
(3, 5, '09:00:00', '17:00:00', 8, '12:00:00', '13:00:00'), -- Friday
(3, 6, '09:00:00', '15:00:00', 6, '12:00:00', '13:00:00'), -- Saturday
(3, 7, '10:00:00', '15:00:00', 5, '12:00:00', '13:00:00'); -- Sunday

-- Lịch làm việc của chuyên gia 2 (expert2@mindmeter.com)
INSERT INTO expert_schedules (expert_id, day_of_week, start_time, end_time, max_appointments_per_day, break_start_time, break_end_time) VALUES
(4, 1, '08:00:00', '16:00:00', 8, '12:00:00', '13:00:00'), -- Monday
(4, 2, '08:00:00', '16:00:00', 8, '12:00:00', '13:00:00'), -- Tuesday
(4, 3, '08:00:00', '16:00:00', 8, '12:00:00', '13:00:00'), -- Wednesday
(4, 4, '08:00:00', '16:00:00', 8, '12:00:00', '13:00:00'), -- Thursday
(4, 5, '08:00:00', '16:00:00', 8, '12:00:00', '13:00:00'), -- Friday
(4, 6, '09:00:00', '14:00:00', 5, '12:00:00', '13:00:00'), -- Saturday
(4, 7, '09:00:00', '14:00:00', 5, '12:00:00', '13:00:00'); -- Sunday

-- Lịch làm việc của chuyên gia 3 (expert3@mindmeter.com)
INSERT INTO expert_schedules (expert_id, day_of_week, start_time, end_time, max_appointments_per_day, break_start_time, break_end_time) VALUES
(5, 1, '10:00:00', '18:00:00', 8, '13:00:00', '14:00:00'), -- Monday
(5, 2, '10:00:00', '18:00:00', 8, '13:00:00', '14:00:00'), -- Tuesday
(5, 3, '10:00:00', '18:00:00', 8, '13:00:00', '14:00:00'), -- Wednesday
(5, 4, '10:00:00', '18:00:00', 8, '13:00:00', '14:00:00'), -- Thursday
(5, 5, '10:00:00', '18:00:00', 8, '13:00:00', '14:00:00'), -- Friday
(5, 6, '09:00:00', '16:00:00', 7, '13:00:00', '14:00:00'), -- Saturday
(5, 7, '09:00:00', '16:00:00', 7, '13:00:00', '14:00:00'); -- Sunday

-- Thời gian nghỉ của chuyên gia
INSERT INTO expert_breaks (expert_id, break_date, start_time, end_time, reason, description) VALUES
-- Chuyên gia 1 nghỉ lễ Quốc khánh
(3, '2024-09-02', '00:00:00', '23:59:59', 'HOLIDAY', 'Nghỉ lễ Quốc khánh 2/9'),
-- Chuyên gia 2 nghỉ phép
(4, '2024-07-15', '00:00:00', '23:59:59', 'VACATION', 'Nghỉ phép gia đình'),
(4, '2024-07-16', '00:00:00', '23:59:59', 'VACATION', 'Nghỉ phép gia đình'),
-- Chuyên gia 3 nghỉ ốm
(5, '2024-07-20', '00:00:00', '23:59:59', 'SICK_LEAVE', 'Nghỉ ốm');

-- Lịch hẹn mẫu
INSERT INTO appointments (student_id, expert_id, appointment_date, duration_minutes, status, consultation_type, notes, expert_notes) VALUES
-- Lịch hẹn đã xác nhận
(6, 3, DATE_ADD(NOW(), INTERVAL 2 DAY), 60, 'CONFIRMED', 'ONLINE', 'Em muốn tư vấn về vấn đề stress học tập', 'Học sinh có dấu hiệu stress từ áp lực thi cử'),
(7, 4, DATE_ADD(NOW(), INTERVAL 3 DAY), 90, 'CONFIRMED', 'IN_PERSON', 'Em cần tư vấn về mối quan hệ gia đình', 'Học sinh cần hỗ trợ về giao tiếp trong gia đình'),
(8, 5, DATE_ADD(NOW(), INTERVAL 1 DAY), 60, 'CONFIRMED', 'PHONE', 'Em muốn tư vấn về vấn đề tự tin', 'Học sinh cần xây dựng lòng tự tin và kỹ năng giao tiếp'),

-- Lịch hẹn đang chờ xác nhận
(9, 3, DATE_ADD(NOW(), INTERVAL 4 DAY), 60, 'PENDING', 'ONLINE', 'Em cần tư vấn về vấn đề rối loạn giấc ngủ', NULL),
(10, 4, DATE_ADD(NOW(), INTERVAL 5 DAY), 90, 'PENDING', 'IN_PERSON', 'Em muốn tư vấn về định hướng nghề nghiệp', NULL),
(11, 5, DATE_ADD(NOW(), INTERVAL 6 DAY), 60, 'PENDING', 'PHONE', 'Em cần tư vấn về vấn đề lo âu xã hội', NULL),

-- Lịch hẹn đã hoàn thành
(12, 3, DATE_SUB(NOW(), INTERVAL 5 DAY), 60, 'COMPLETED', 'ONLINE', 'Em đã được tư vấn về vấn đề stress học tập', 'Học sinh đã áp dụng các kỹ thuật thư giãn hiệu quả'),
(13, 4, DATE_SUB(NOW(), INTERVAL 7 DAY), 90, 'COMPLETED', 'IN_PERSON', 'Em đã được tư vấn về mối quan hệ gia đình', 'Học sinh đã cải thiện kỹ năng giao tiếp với gia đình'),
(14, 5, DATE_SUB(NOW(), INTERVAL 10 DAY), 60, 'COMPLETED', 'PHONE', 'Em đã được tư vấn về vấn đề tự tin', 'Học sinh đã tham gia workshop và có tiến bộ tích cực'),

-- Lịch hẹn bị hủy
(15, 3, DATE_ADD(NOW(), INTERVAL 8 DAY), 60, 'CANCELLED', 'ONLINE', 'Em cần tư vấn về vấn đề trầm cảm', 'Học sinh hủy do lý do cá nhân'),
(16, 4, DATE_ADD(NOW(), INTERVAL 9 DAY), 90, 'CANCELLED', 'IN_PERSON', 'Em muốn tư vấn về vấn đề rối loạn ăn uống', 'Học sinh hủy do có việc đột xuất'),

-- Lịch hẹn không đến (no-show)
(17, 5, DATE_SUB(NOW(), INTERVAL 3 DAY), 60, 'NO_SHOW', 'ONLINE', 'Em cần tư vấn về vấn đề lo âu', 'Học sinh không liên lạc và không tham gia buổi tư vấn');

-- Lịch sử thay đổi lịch hẹn
INSERT INTO appointment_history (appointment_id, action, old_status, new_status, changed_by, change_reason) VALUES
-- Lịch hẹn 1: Tạo mới
(1, 'CREATED', NULL, 'PENDING', 6, 'Học sinh tạo lịch hẹn mới'),
(1, 'UPDATED', 'PENDING', 'CONFIRMED', 3, 'Chuyên gia xác nhận lịch hẹn'),

-- Lịch hẹn 2: Tạo mới
(2, 'CREATED', NULL, 'PENDING', 7, 'Học sinh tạo lịch hẹn mới'),
(2, 'UPDATED', 'PENDING', 'CONFIRMED', 4, 'Chuyên gia xác nhận lịch hẹn'),

-- Lịch hẹn 3: Tạo mới
(3, 'CREATED', NULL, 'PENDING', 8, 'Học sinh tạo lịch hẹn mới'),
(3, 'UPDATED', 'PENDING', 'CONFIRMED', 5, 'Chuyên gia xác nhận lịch hẹn'),

-- Lịch hẹn 4: Tạo mới
(4, 'CREATED', NULL, 'PENDING', 9, 'Học sinh tạo lịch hẹn mới'),

-- Lịch hẹn 5: Tạo mới
(5, 'CREATED', NULL, 'PENDING', 10, 'Học sinh tạo lịch hẹn mới'),

-- Lịch hẹn 6: Tạo mới
(6, 'CREATED', NULL, 'PENDING', 11, 'Học sinh tạo lịch hẹn mới'),

-- Lịch hẹn 7: Hoàn thành
(7, 'CREATED', NULL, 'PENDING', 12, 'Học sinh tạo lịch hẹn mới'),
(7, 'UPDATED', 'PENDING', 'CONFIRMED', 3, 'Chuyên gia xác nhận lịch hẹn'),
(7, 'UPDATED', 'CONFIRMED', 'COMPLETED', 3, 'Buổi tư vấn đã hoàn thành'),

-- Lịch hẹn 8: Hoàn thành
(8, 'CREATED', NULL, 'PENDING', 13, 'Học sinh tạo lịch hẹn mới'),
(8, 'UPDATED', 'PENDING', 'CONFIRMED', 4, 'Chuyên gia xác nhận lịch hẹn'),
(8, 'UPDATED', 'CONFIRMED', 'COMPLETED', 4, 'Buổi tư vấn đã hoàn thành'),

-- Lịch hẹn 9: Hoàn thành
(9, 'CREATED', NULL, 'PENDING', 14, 'Học sinh tạo lịch hẹn mới'),
(9, 'UPDATED', 'PENDING', 'CONFIRMED', 5, 'Chuyên gia xác nhận lịch hẹn'),
(9, 'UPDATED', 'CONFIRMED', 'COMPLETED', 5, 'Buổi tư vấn đã hoàn thành'),

-- Lịch hẹn 10: Bị hủy
(10, 'CREATED', NULL, 'PENDING', 15, 'Học sinh tạo lịch hẹn mới'),
(10, 'UPDATED', 'PENDING', 'CONFIRMED', 3, 'Chuyên gia xác nhận lịch hẹn'),
(10, 'UPDATED', 'CONFIRMED', 'CANCELLED', 15, 'Học sinh hủy do lý do cá nhân'),

-- Lịch hẹn 11: Bị hủy
(11, 'CREATED', NULL, 'PENDING', 16, 'Học sinh tạo lịch hẹn mới'),
(11, 'UPDATED', 'PENDING', 'CONFIRMED', 4, 'Chuyên gia xác nhận lịch hẹn'),
(11, 'UPDATED', 'CONFIRMED', 'CANCELLED', 16, 'Học sinh hủy do có việc đột xuất'),

-- Lịch hẹn 12: No-show
(12, 'CREATED', NULL, 'PENDING', 17, 'Học sinh tạo lịch hẹn mới'),
(12, 'UPDATED', 'PENDING', 'CONFIRMED', 5, 'Chuyên gia xác nhận lịch hẹn'),
(12, 'UPDATED', 'CONFIRMED', 'NO_SHOW', 5, 'Học sinh không tham gia buổi tư vấn');

-- Thông báo lịch hẹn
INSERT INTO appointment_notifications (appointment_id, user_id, notification_type, title, message) VALUES
-- Nhắc nhở lịch hẹn
(1, 6, 'REMINDER', 'Nhắc nhở lịch hẹn', 'Bạn có lịch hẹn với chuyên gia Trần Kiên Cường vào ngày mai lúc 09:00. Vui lòng chuẩn bị sẵn sàng.'),
(2, 7, 'REMINDER', 'Nhắc nhở lịch hẹn', 'Bạn có lịch hẹn với chuyên gia Trần Văn Hùng vào ngày mai lúc 14:00. Vui lòng chuẩn bị sẵn sàng.'),
(3, 8, 'REMINDER', 'Nhắc nhở lịch hẹn', 'Bạn có lịch hẹn với chuyên gia Lê Thị Thu Hà vào ngày mai lúc 10:00. Vui lòng chuẩn bị sẵn sàng.'),

-- Xác nhận lịch hẹn
(1, 6, 'CONFIRMATION', 'Xác nhận lịch hẹn', 'Lịch hẹn của bạn với chuyên gia Trần Kiên Cường đã được xác nhận vào ngày mai lúc 09:00.'),
(2, 7, 'CONFIRMATION', 'Xác nhận lịch hẹn', 'Lịch hẹn của bạn với chuyên gia Trần Văn Hùng đã được xác nhận vào ngày mai lúc 14:00.'),
(3, 8, 'CONFIRMATION', 'Xác nhận lịch hẹn', 'Lịch hẹn của bạn với chuyên gia Lê Thị Thu Hà đã được xác nhận vào ngày mai lúc 10:00.'),

-- Hủy lịch hẹn
(10, 15, 'CANCELLATION', 'Hủy lịch hẹn', 'Lịch hẹn của bạn với chuyên gia Trần Kiên Cường đã được hủy theo yêu cầu.'),
(11, 16, 'CANCELLATION', 'Hủy lịch hẹn', 'Lịch hẹn của bạn với chuyên gia Trần Văn Hùng đã được hủy theo yêu cầu.'),

-- Hoàn thành lịch hẹn
(7, 12, 'COMPLETION', 'Hoàn thành buổi tư vấn', 'Buổi tư vấn với chuyên gia Trần Kiên Cường đã hoàn thành. Cảm ơn bạn đã tham gia.'),
(8, 13, 'COMPLETION', 'Hoàn thành buổi tư vấn', 'Buổi tư vấn với chuyên gia Trần Văn Hùng đã hoàn thành. Cảm ơn bạn đã tham gia.'),
(9, 14, 'COMPLETION', 'Hoàn thành buổi tư vấn', 'Buổi tư vấn với chuyên gia Lê Thị Thu Hà đã hoàn thành. Cảm ơn bạn đã tham gia.');

-- Cập nhật advice_messages để thêm message_type APPOINTMENT
UPDATE advice_messages SET message_type = 'APPOINTMENT' WHERE id IN (1, 2, 3, 4, 5);

-- ========================================
-- 13. APPOINTMENT STATISTICS & VERIFICATION
-- ========================================

-- Hiển thị thống kê lịch hẹn
SELECT 'Appointments' as Table_Name, COUNT(*) as Count FROM appointments
UNION ALL
SELECT 'Expert Schedules', COUNT(*) FROM expert_schedules
UNION ALL
SELECT 'Expert Breaks', COUNT(*) FROM expert_breaks
UNION ALL
SELECT 'Appointment History', COUNT(*) FROM appointment_history
UNION ALL
SELECT 'Appointment Notifications', COUNT(*) FROM appointment_notifications
UNION ALL
SELECT 'Appointment Settings', COUNT(*) FROM appointment_settings;

-- Hiển thị phân bố trạng thái lịch hẹn
SELECT 
    status as 'Trạng thái lịch hẹn',
    COUNT(*) as 'Số lượng',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM appointments), 2) as 'Tỷ lệ (%)'
FROM appointments 
GROUP BY status 
ORDER BY 
    CASE status 
        WHEN 'PENDING' THEN 1 
        WHEN 'CONFIRMED' THEN 2 
        WHEN 'COMPLETED' THEN 3 
        WHEN 'CANCELLED' THEN 4 
        WHEN 'NO_SHOW' THEN 5 
    END;

-- Hiển thị phân bố loại tư vấn
SELECT 
    consultation_type as 'Loại tư vấn',
    COUNT(*) as 'Số lượng',
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM appointments), 2) as 'Tỷ lệ (%)'
FROM appointments 
GROUP BY consultation_type 
ORDER BY consultation_type;

-- Hiển thị lịch hẹn theo chuyên gia
SELECT 
    CONCAT(u.first_name, ' ', u.last_name) as 'Chuyên gia',
    COUNT(*) as 'Tổng lịch hẹn',
    SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) as 'Đã hoàn thành',
    SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) as 'Đã hủy',
    SUM(CASE WHEN a.status = 'NO_SHOW' THEN 1 ELSE 0 END) as 'Không đến'
FROM appointments a
JOIN users u ON a.expert_id = u.id
GROUP BY a.expert_id, u.first_name, u.last_name
ORDER BY COUNT(*) DESC;

-- Hiển thị lịch hẹn theo học sinh
SELECT 
    CONCAT(u.first_name, ' ', u.last_name) as 'Học sinh',
    COUNT(*) as 'Tổng lịch hẹn',
    SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) as 'Đã hoàn thành',
    SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) as 'Đã hủy',
    SUM(CASE WHEN a.status = 'NO_SHOW' THEN 1 ELSE 0 END) as 'Không đến'
FROM appointments a
JOIN users u ON a.student_id = u.id
GROUP BY a.student_id, u.first_name, u.last_name
ORDER BY COUNT(*) DESC;

-- ========================================
-- 14. FINAL STATISTICS & VERIFICATION
-- ========================================

-- Hiển thị thống kê tổng quan toàn bộ hệ thống
SELECT 'Users' as Table_Name, COUNT(*) as Count FROM users
UNION ALL
SELECT 'Depression Questions (Vietnamese)', COUNT(*) FROM depression_questions_vi
UNION ALL
SELECT 'Depression Questions (English)', COUNT(*) FROM depression_questions_en
UNION ALL
SELECT 'Depression Question Options (Vietnamese)', COUNT(*) FROM depression_question_options_vi
UNION ALL
SELECT 'Depression Question Options (English)', COUNT(*) FROM depression_question_options_en
UNION ALL
SELECT 'Test Results', COUNT(*) FROM depression_test_results
UNION ALL
SELECT 'Test Answers', COUNT(*) FROM depression_test_answers
UNION ALL
SELECT 'Expert Notes', COUNT(*) FROM expert_notes
UNION ALL
SELECT 'Advice Messages', COUNT(*) FROM advice_messages
UNION ALL
SELECT 'System Announcements', COUNT(*) FROM system_announcements
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Expert Schedules', COUNT(*) FROM expert_schedules
UNION ALL
SELECT 'Expert Breaks', COUNT(*) FROM expert_breaks
UNION ALL
SELECT 'Appointment History', COUNT(*) FROM appointment_history
UNION ALL
SELECT 'Appointment Notifications', COUNT(*) FROM appointment_notifications
UNION ALL
SELECT 'Appointment Settings', COUNT(*) FROM appointment_settings;

-- Hiển thị danh sách người dùng
SELECT 
    id,
    CONCAT(first_name, ' ', last_name) as 'Họ và tên',
    email,
    password,
    avatar_url,
    plan,
    plan_start_date,
    plan_expiry_date,
    role,
    phone,
    status,
    created_at
FROM users 
ORDER BY role, id;

-- Additional DASS-21 Test Results with diverse diagnosis text
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(1, 0, 'Tình trạng tâm lý hoàn toàn bình thường', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-21', 'vi'),
(1, 5, 'Có một chút căng thẳng nhẹ nhưng không đáng lo ngại', 'MILD', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-21', 'vi'),
(2, 12, 'Cần chú ý đến sức khỏe tâm thần', 'MODERATE', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'DASS-21', 'vi'),
(2, 28, 'Tình trạng tâm lý cần được quan tâm đặc biệt', 'SEVERE', DATE_SUB(NOW(), INTERVAL 4 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'DASS-21', 'vi'),
(3, 3, 'Sức khỏe tâm thần tốt, không có vấn đề gì', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'DASS-21', 'vi'),
(3, 9, 'Có một số biểu hiện lo âu nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'DASS-21', 'vi'),
(4, 18, 'Cần được hỗ trợ tâm lý chuyên nghiệp', 'MODERATE', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'DASS-21', 'vi'),
(4, 35, 'Tình trạng tâm lý rất nghiêm trọng, cần can thiệp ngay', 'SEVERE', DATE_SUB(NOW(), INTERVAL 8 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'DASS-21', 'vi');

-- Additional BDI Test Results with diverse diagnosis text
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(1, 2, 'Không có dấu hiệu trầm cảm, tâm trạng tích cực', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 9 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'BDI', 'vi'),
(1, 8, 'Có một chút buồn bã nhưng vẫn kiểm soát được', 'MILD', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'BDI', 'vi'),
(2, 22, 'Cần được quan tâm và hỗ trợ tâm lý', 'MODERATE', DATE_SUB(NOW(), INTERVAL 11 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'BDI', 'vi'),
(2, 45, 'Tình trạng tâm lý rất đáng lo ngại', 'SEVERE', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'BDI', 'vi');

-- Additional RADS Test Results with diverse diagnosis text
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(1, 8, 'Tâm trạng ổn định, không có vấn đề gì', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 13 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'RADS', 'vi'),
(1, 20, 'Có một số dấu hiệu lo âu nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 14 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'RADS', 'vi'),
(2, 35, 'Cần được hỗ trợ tâm lý chuyên nghiệp', 'MODERATE', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'RADS', 'vi'),
(2, 55, 'Tình trạng tâm lý rất nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 16 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'RADS', 'vi');

-- Additional EPDS Test Results with diverse diagnosis text
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(1, 1, 'Tâm trạng tốt, không có dấu hiệu trầm cảm', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 17 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'EPDS', 'vi'),
(1, 6, 'Có một chút lo lắng nhưng vẫn ổn', 'MILD', DATE_SUB(NOW(), INTERVAL 18 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'EPDS', 'vi'),
(2, 12, 'Cần được quan tâm và hỗ trợ', 'MODERATE', DATE_SUB(NOW(), INTERVAL 19 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'EPDS', 'vi'),
(2, 20, 'Tình trạng tâm lý cần được can thiệp ngay', 'SEVERE', DATE_SUB(NOW(), INTERVAL 20 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'EPDS', 'vi');

-- Additional SAS Test Results with diverse diagnosis text
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(1, 10, 'Mức độ lo âu bình thường', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 21 DAY), 'Tình trạng tâm lý của bạn ổn định. Hãy duy trì lối sống lành mạnh và tham gia các hoạt động tích cực.', 'SAS', 'vi'),
(1, 25, 'Có một chút lo âu nhẹ', 'MILD', DATE_SUB(NOW(), INTERVAL 22 DAY), 'Bạn có một số dấu hiệu nhẹ. Hãy thử các hoạt động thư giãn và chia sẻ với người thân.', 'SAS', 'vi'),
(2, 40, 'Cần được hỗ trợ tâm lý', 'MODERATE', DATE_SUB(NOW(), INTERVAL 23 DAY), 'Bạn có dấu hiệu trầm cảm vừa. Nên tham khảo ý kiến chuyên gia tâm lý và thực hiện các biện pháp can thiệp sớm.', 'SAS', 'vi'),
(2, 65, 'Tình trạng lo âu rất nghiêm trọng', 'SEVERE', DATE_SUB(NOW(), INTERVAL 24 DAY), 'Bạn có dấu hiệu trầm cảm nghiêm trọng. Cần được hỗ trợ chuyên môn ngay lập tức và có thể cần điều trị y tế.', 'SAS', 'vi');

-- ========================================
-- CORRECTED TEST ANSWERS - PROPER MAPPING
-- ========================================

-- User 5 - DASS-21 Test 1 (Score: 2, MINIMAL) - test_result_id = 1
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(1, 1, 0, 'vi', 'depression_questions_vi'), (1, 2, 0, 'vi', 'depression_questions_vi'), (1, 3, 0, 'vi', 'depression_questions_vi'), (1, 4, 0, 'vi', 'depression_questions_vi'), (1, 5, 0, 'vi', 'depression_questions_vi'), (1, 6, 0, 'vi', 'depression_questions_vi'), (1, 7, 0, 'vi', 'depression_questions_vi'), (1, 8, 0, 'vi', 'depression_questions_vi'), (1, 9, 0, 'vi', 'depression_questions_vi'), (1, 10, 0, 'vi', 'depression_questions_vi'),
(1, 11, 0, 'vi', 'depression_questions_vi'), (1, 12, 0, 'vi', 'depression_questions_vi'), (1, 13, 0, 'vi', 'depression_questions_vi'), (1, 14, 0, 'vi', 'depression_questions_vi'), (1, 15, 0, 'vi', 'depression_questions_vi'), (1, 16, 0, 'vi', 'depression_questions_vi'), (1, 17, 0, 'vi', 'depression_questions_vi'), (1, 18, 0, 'vi', 'depression_questions_vi'), (1, 19, 0, 'vi', 'depression_questions_vi'), (1, 20, 0, 'vi', 'depression_questions_vi'),
(1, 21, 0, 'vi', 'depression_questions_vi'), (1, 22, 0, 'vi', 'depression_questions_vi'), (1, 23, 0, 'vi', 'depression_questions_vi'), (1, 24, 0, 'vi', 'depression_questions_vi'), (1, 25, 0, 'vi', 'depression_questions_vi'), (1, 26, 0, 'vi', 'depression_questions_vi'), (1, 27, 0, 'vi', 'depression_questions_vi'), (1, 28, 0, 'vi', 'depression_questions_vi'), (1, 29, 0, 'vi', 'depression_questions_vi'), (1, 30, 0, 'vi', 'depression_questions_vi'),
(1, 31, 0, 'vi', 'depression_questions_vi'), (1, 32, 0, 'vi', 'depression_questions_vi'), (1, 33, 0, 'vi', 'depression_questions_vi'), (1, 34, 0, 'vi', 'depression_questions_vi'), (1, 35, 0, 'vi', 'depression_questions_vi'), (1, 36, 0, 'vi', 'depression_questions_vi'), (1, 37, 0, 'vi', 'depression_questions_vi'), (1, 38, 0, 'vi', 'depression_questions_vi'), (1, 39, 0, 'vi', 'depression_questions_vi'), (1, 40, 0, 'vi', 'depression_questions_vi'),
(1, 41, 0, 'vi', 'depression_questions_vi'), (1, 42, 0, 'vi', 'depression_questions_vi'), (1, 43, 0, 'vi', 'depression_questions_vi'), (1, 44, 0, 'vi', 'depression_questions_vi'), (1, 45, 0, 'vi', 'depression_questions_vi'), (1, 46, 0, 'vi', 'depression_questions_vi'), (1, 47, 0, 'vi', 'depression_questions_vi'), (1, 48, 0, 'vi', 'depression_questions_vi'), (1, 49, 0, 'vi', 'depression_questions_vi'), (1, 50, 0, 'vi', 'depression_questions_vi'),
(1, 51, 0, 'vi', 'depression_questions_vi'), (1, 52, 0, 'vi', 'depression_questions_vi'), (1, 53, 0, 'vi', 'depression_questions_vi'), (1, 54, 0, 'vi', 'depression_questions_vi'), (1, 55, 0, 'vi', 'depression_questions_vi'), (1, 56, 0, 'vi', 'depression_questions_vi'), (1, 57, 0, 'vi', 'depression_questions_vi'), (1, 58, 0, 'vi', 'depression_questions_vi'), (1, 59, 0, 'vi', 'depression_questions_vi'), (1, 60, 0, 'vi', 'depression_questions_vi'),
(1, 61, 0, 'vi', 'depression_questions_vi'), (1, 62, 0, 'vi', 'depression_questions_vi'), (1, 63, 0, 'vi', 'depression_questions_vi');

-- User 5 - DASS-21 Test 2 (Score: 8, MILD) - test_result_id = 2
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(2, 1, 1, 'vi', 'depression_questions_vi'), (2, 2, 1, 'vi', 'depression_questions_vi'), (2, 3, 1, 'vi', 'depression_questions_vi'), (2, 4, 1, 'vi', 'depression_questions_vi'), (2, 5, 1, 'vi', 'depression_questions_vi'), (2, 6, 1, 'vi', 'depression_questions_vi'), (2, 7, 1, 'vi', 'depression_questions_vi'), (2, 8, 1, 'vi', 'depression_questions_vi'), (2, 9, 0, 'vi', 'depression_questions_vi'), (2, 10, 0, 'vi', 'depression_questions_vi'),
(2, 11, 0, 'vi', 'depression_questions_vi'), (2, 12, 0, 'vi', 'depression_questions_vi'), (2, 13, 0, 'vi', 'depression_questions_vi'), (2, 14, 0, 'vi', 'depression_questions_vi'), (2, 15, 0, 'vi', 'depression_questions_vi'), (2, 16, 0, 'vi', 'depression_questions_vi'), (2, 17, 0, 'vi', 'depression_questions_vi'), (2, 18, 0, 'vi', 'depression_questions_vi'), (2, 19, 0, 'vi', 'depression_questions_vi'), (2, 20, 0, 'vi', 'depression_questions_vi'),
(2, 21, 0, 'vi', 'depression_questions_vi'), (2, 22, 0, 'vi', 'depression_questions_vi'), (2, 23, 0, 'vi', 'depression_questions_vi'), (2, 24, 0, 'vi', 'depression_questions_vi'), (2, 25, 0, 'vi', 'depression_questions_vi'), (2, 26, 0, 'vi', 'depression_questions_vi'), (2, 27, 0, 'vi', 'depression_questions_vi'), (2, 28, 0, 'vi', 'depression_questions_vi'), (2, 29, 0, 'vi', 'depression_questions_vi'), (2, 30, 0, 'vi', 'depression_questions_vi'),
(2, 31, 0, 'vi', 'depression_questions_vi'), (2, 32, 0, 'vi', 'depression_questions_vi'), (2, 33, 0, 'vi', 'depression_questions_vi'), (2, 34, 0, 'vi', 'depression_questions_vi'), (2, 35, 0, 'vi', 'depression_questions_vi'), (2, 36, 0, 'vi', 'depression_questions_vi'), (2, 37, 0, 'vi', 'depression_questions_vi'), (2, 38, 0, 'vi', 'depression_questions_vi'), (2, 39, 0, 'vi', 'depression_questions_vi'), (2, 40, 0, 'vi', 'depression_questions_vi'),
(2, 41, 0, 'vi', 'depression_questions_vi'), (2, 42, 0, 'vi', 'depression_questions_vi'), (2, 43, 0, 'vi', 'depression_questions_vi'), (2, 44, 0, 'vi', 'depression_questions_vi'), (2, 45, 0, 'vi', 'depression_questions_vi'), (2, 46, 0, 'vi', 'depression_questions_vi'), (2, 47, 0, 'vi', 'depression_questions_vi'), (2, 48, 0, 'vi', 'depression_questions_vi'), (2, 49, 0, 'vi', 'depression_questions_vi'), (2, 50, 0, 'vi', 'depression_questions_vi'),
(2, 51, 0, 'vi', 'depression_questions_vi'), (2, 52, 0, 'vi', 'depression_questions_vi'), (2, 53, 0, 'vi', 'depression_questions_vi'), (2, 54, 0, 'vi', 'depression_questions_vi'), (2, 55, 0, 'vi', 'depression_questions_vi'), (2, 56, 0, 'vi', 'depression_questions_vi'), (2, 57, 0, 'vi', 'depression_questions_vi'), (2, 58, 0, 'vi', 'depression_questions_vi'), (2, 59, 0, 'vi', 'depression_questions_vi'), (2, 60, 0, 'vi', 'depression_questions_vi'),
(2, 61, 0, 'vi', 'depression_questions_vi'), (2, 62, 0, 'vi', 'depression_questions_vi'), (2, 63, 0, 'vi', 'depression_questions_vi');

-- User 5 - DASS-21 Test 3 (Score: 15, MODERATE) - test_result_id = 3
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(3, 1, 2, 'vi', 'depression_questions_vi'), (3, 2, 2, 'vi', 'depression_questions_vi'), (3, 3, 2, 'vi', 'depression_questions_vi'), (3, 4, 2, 'vi', 'depression_questions_vi'), (3, 5, 2, 'vi', 'depression_questions_vi'), (3, 6, 2, 'vi', 'depression_questions_vi'), (3, 7, 2, 'vi', 'depression_questions_vi'), (3, 8, 2, 'vi', 'depression_questions_vi'), (3, 9, 1, 'vi', 'depression_questions_vi'), (3, 10, 1, 'vi', 'depression_questions_vi'),
(3, 11, 1, 'vi', 'depression_questions_vi'), (3, 12, 1, 'vi', 'depression_questions_vi'), (3, 13, 1, 'vi', 'depression_questions_vi'), (3, 14, 1, 'vi', 'depression_questions_vi'), (3, 15, 1, 'vi', 'depression_questions_vi'), (3, 16, 1, 'vi', 'depression_questions_vi'), (3, 17, 1, 'vi', 'depression_questions_vi'), (3, 18, 1, 'vi', 'depression_questions_vi'), (3, 19, 1, 'vi', 'depression_questions_vi'), (3, 20, 1, 'vi', 'depression_questions_vi'),
(3, 21, 1, 'vi', 'depression_questions_vi'), (3, 22, 1, 'vi', 'depression_questions_vi'), (3, 23, 1, 'vi', 'depression_questions_vi'), (3, 24, 1, 'vi', 'depression_questions_vi'), (3, 25, 1, 'vi', 'depression_questions_vi'), (3, 26, 1, 'vi', 'depression_questions_vi'), (3, 27, 1, 'vi', 'depression_questions_vi'), (3, 28, 1, 'vi', 'depression_questions_vi'), (3, 29, 1, 'vi', 'depression_questions_vi'), (3, 30, 1, 'vi', 'depression_questions_vi'),
(3, 31, 1, 'vi', 'depression_questions_vi'), (3, 32, 1, 'vi', 'depression_questions_vi'), (3, 33, 1, 'vi', 'depression_questions_vi'), (3, 34, 1, 'vi', 'depression_questions_vi'), (3, 35, 1, 'vi', 'depression_questions_vi'), (3, 36, 1, 'vi', 'depression_questions_vi'), (3, 37, 1, 'vi', 'depression_questions_vi'), (3, 38, 1, 'vi', 'depression_questions_vi'), (3, 39, 1, 'vi', 'depression_questions_vi'), (3, 40, 1, 'vi', 'depression_questions_vi'),
(3, 41, 1, 'vi', 'depression_questions_vi'), (3, 42, 1, 'vi', 'depression_questions_vi'), (3, 43, 1, 'vi', 'depression_questions_vi'), (3, 44, 1, 'vi', 'depression_questions_vi'), (3, 45, 1, 'vi', 'depression_questions_vi'), (3, 46, 1, 'vi', 'depression_questions_vi'), (3, 47, 1, 'vi', 'depression_questions_vi'), (3, 48, 1, 'vi', 'depression_questions_vi'), (3, 49, 1, 'vi', 'depression_questions_vi'), (3, 50, 1, 'vi', 'depression_questions_vi'),
(3, 51, 1, 'vi', 'depression_questions_vi'), (3, 52, 1, 'vi', 'depression_questions_vi'), (3, 53, 1, 'vi', 'depression_questions_vi'), (3, 54, 1, 'vi', 'depression_questions_vi'), (3, 55, 1, 'vi', 'depression_questions_vi'), (3, 56, 1, 'vi', 'depression_questions_vi'), (3, 57, 1, 'vi', 'depression_questions_vi'), (3, 58, 1, 'vi', 'depression_questions_vi'), (3, 59, 1, 'vi', 'depression_questions_vi'), (3, 60, 1, 'vi', 'depression_questions_vi'),
(3, 61, 1, 'vi', 'depression_questions_vi'), (3, 62, 1, 'vi', 'depression_questions_vi'), (3, 63, 1, 'vi', 'depression_questions_vi');

-- User 5 - DASS-21 Test 4 (Score: 25, SEVERE) - test_result_id = 4
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(4, 1, 3, 'vi', 'depression_questions_vi'), (4, 2, 3, 'vi', 'depression_questions_vi'), (4, 3, 3, 'vi', 'depression_questions_vi'), (4, 4, 3, 'vi', 'depression_questions_vi'), (4, 5, 3, 'vi', 'depression_questions_vi'), (4, 6, 3, 'vi', 'depression_questions_vi'), (4, 7, 3, 'vi', 'depression_questions_vi'), (4, 8, 3, 'vi', 'depression_questions_vi'), (4, 9, 2, 'vi', 'depression_questions_vi'), (4, 10, 2, 'vi', 'depression_questions_vi'),
(4, 11, 2, 'vi', 'depression_questions_vi'), (4, 12, 2, 'vi', 'depression_questions_vi'), (4, 13, 2, 'vi', 'depression_questions_vi'), (4, 14, 2, 'vi', 'depression_questions_vi'), (4, 15, 2, 'vi', 'depression_questions_vi'), (4, 16, 2, 'vi', 'depression_questions_vi'), (4, 17, 2, 'vi', 'depression_questions_vi'), (4, 18, 2, 'vi', 'depression_questions_vi'), (4, 19, 2, 'vi', 'depression_questions_vi'), (4, 20, 2, 'vi', 'depression_questions_vi'),
(4, 21, 2, 'vi', 'depression_questions_vi'), (4, 22, 2, 'vi', 'depression_questions_vi'), (4, 23, 2, 'vi', 'depression_questions_vi'), (4, 24, 2, 'vi', 'depression_questions_vi'), (4, 25, 2, 'vi', 'depression_questions_vi'), (4, 26, 2, 'vi', 'depression_questions_vi'), (4, 27, 2, 'vi', 'depression_questions_vi'), (4, 28, 2, 'vi', 'depression_questions_vi'), (4, 29, 2, 'vi', 'depression_questions_vi'), (4, 30, 2, 'vi', 'depression_questions_vi'),
(4, 31, 2, 'vi', 'depression_questions_vi'), (4, 32, 2, 'vi', 'depression_questions_vi'), (4, 33, 2, 'vi', 'depression_questions_vi'), (4, 34, 2, 'vi', 'depression_questions_vi'), (4, 35, 2, 'vi', 'depression_questions_vi'), (4, 36, 2, 'vi', 'depression_questions_vi'), (4, 37, 2, 'vi', 'depression_questions_vi'), (4, 38, 2, 'vi', 'depression_questions_vi'), (4, 39, 2, 'vi', 'depression_questions_vi'), (4, 40, 2, 'vi', 'depression_questions_vi'),
(4, 41, 2, 'vi', 'depression_questions_vi'), (4, 42, 2, 'vi', 'depression_questions_vi'), (4, 43, 2, 'vi', 'depression_questions_vi'), (4, 44, 2, 'vi', 'depression_questions_vi'), (4, 45, 2, 'vi', 'depression_questions_vi'), (4, 46, 2, 'vi', 'depression_questions_vi'), (4, 47, 2, 'vi', 'depression_questions_vi'), (4, 48, 2, 'vi', 'depression_questions_vi'), (4, 49, 2, 'vi', 'depression_questions_vi'), (4, 50, 2, 'vi', 'depression_questions_vi'),
(4, 51, 2, 'vi', 'depression_questions_vi'), (4, 52, 2, 'vi', 'depression_questions_vi'), (4, 53, 2, 'vi', 'depression_questions_vi'), (4, 54, 2, 'vi', 'depression_questions_vi'), (4, 55, 2, 'vi', 'depression_questions_vi'), (4, 56, 2, 'vi', 'depression_questions_vi'), (4, 57, 2, 'vi', 'depression_questions_vi'), (4, 58, 2, 'vi', 'depression_questions_vi'), (4, 59, 2, 'vi', 'depression_questions_vi'), (4, 60, 2, 'vi', 'depression_questions_vi'),
(4, 61, 2, 'vi', 'depression_questions_vi'), (4, 62, 2, 'vi', 'depression_questions_vi'), (4, 63, 2, 'vi', 'depression_questions_vi');

-- ========================================
-- DASS-21 TEST ANSWERS (User 6 - Student 2)
-- ========================================

-- User 6 - DASS-21 Test 1 (Score: 5, MINIMAL) - test_result_id = 5
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(5, 1, 0, 'vi', 'depression_questions_vi'), (5, 2, 0, 'vi', 'depression_questions_vi'), (5, 3, 0, 'vi', 'depression_questions_vi'), (5, 4, 0, 'vi', 'depression_questions_vi'), (5, 5, 0, 'vi', 'depression_questions_vi'), (5, 6, 0, 'vi', 'depression_questions_vi'), (5, 7, 0, 'vi', 'depression_questions_vi'), (5, 8, 0, 'vi', 'depression_questions_vi'), (5, 9, 0, 'vi', 'depression_questions_vi'), (5, 10, 0, 'vi', 'depression_questions_vi'),
(5, 11, 0, 'vi', 'depression_questions_vi'), (5, 12, 0, 'vi', 'depression_questions_vi'), (5, 13, 0, 'vi', 'depression_questions_vi'), (5, 14, 0, 'vi', 'depression_questions_vi'), (5, 15, 0, 'vi', 'depression_questions_vi'), (5, 16, 0, 'vi', 'depression_questions_vi'), (5, 17, 0, 'vi', 'depression_questions_vi'), (5, 18, 0, 'vi', 'depression_questions_vi'), (5, 19, 0, 'vi', 'depression_questions_vi'), (5, 20, 0, 'vi', 'depression_questions_vi'),
(5, 21, 0, 'vi', 'depression_questions_vi'), (5, 22, 0, 'vi', 'depression_questions_vi'), (5, 23, 0, 'vi', 'depression_questions_vi'), (5, 24, 0, 'vi', 'depression_questions_vi'), (5, 25, 0, 'vi', 'depression_questions_vi'), (5, 26, 0, 'vi', 'depression_questions_vi'), (5, 27, 0, 'vi', 'depression_questions_vi'), (5, 28, 0, 'vi', 'depression_questions_vi'), (5, 29, 0, 'vi', 'depression_questions_vi'), (5, 30, 0, 'vi', 'depression_questions_vi'),
(5, 31, 0, 'vi', 'depression_questions_vi'), (5, 32, 0, 'vi', 'depression_questions_vi'), (5, 33, 0, 'vi', 'depression_questions_vi'), (5, 34, 0, 'vi', 'depression_questions_vi'), (5, 35, 0, 'vi', 'depression_questions_vi'), (5, 36, 0, 'vi', 'depression_questions_vi'), (5, 37, 0, 'vi', 'depression_questions_vi'), (5, 38, 0, 'vi', 'depression_questions_vi'), (5, 39, 0, 'vi', 'depression_questions_vi'), (5, 40, 0, 'vi', 'depression_questions_vi'),
(5, 41, 0, 'vi', 'depression_questions_vi'), (5, 42, 0, 'vi', 'depression_questions_vi'), (5, 43, 0, 'vi', 'depression_questions_vi'), (5, 44, 0, 'vi', 'depression_questions_vi'), (5, 45, 0, 'vi', 'depression_questions_vi'), (5, 46, 0, 'vi', 'depression_questions_vi'), (5, 47, 0, 'vi', 'depression_questions_vi'), (5, 48, 0, 'vi', 'depression_questions_vi'), (5, 49, 0, 'vi', 'depression_questions_vi'), (5, 50, 0, 'vi', 'depression_questions_vi'),
(5, 51, 0, 'vi', 'depression_questions_vi'), (5, 52, 0, 'vi', 'depression_questions_vi'), (5, 53, 0, 'vi', 'depression_questions_vi'), (5, 54, 0, 'vi', 'depression_questions_vi'), (5, 55, 0, 'vi', 'depression_questions_vi'), (5, 56, 0, 'vi', 'depression_questions_vi'), (5, 57, 0, 'vi', 'depression_questions_vi'), (5, 58, 0, 'vi', 'depression_questions_vi'), (5, 59, 0, 'vi', 'depression_questions_vi'), (5, 60, 0, 'vi', 'depression_questions_vi'),
(5, 61, 0, 'vi', 'depression_questions_vi'), (5, 62, 0, 'vi', 'depression_questions_vi'), (5, 63, 0, 'vi', 'depression_questions_vi');

-- User 6 - DASS-21 Test 2 (Score: 12, MILD) - test_result_id = 6
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(6, 1, 1, 'vi', 'depression_questions_vi'), (6, 2, 1, 'vi', 'depression_questions_vi'), (6, 3, 1, 'vi', 'depression_questions_vi'), (6, 4, 1, 'vi', 'depression_questions_vi'), (6, 5, 1, 'vi', 'depression_questions_vi'), (6, 6, 1, 'vi', 'depression_questions_vi'), (6, 7, 1, 'vi', 'depression_questions_vi'), (6, 8, 1, 'vi', 'depression_questions_vi'), (6, 9, 1, 'vi', 'depression_questions_vi'), (6, 10, 1, 'vi', 'depression_questions_vi'),
(6, 11, 1, 'vi', 'depression_questions_vi'), (6, 12, 1, 'vi', 'depression_questions_vi'), (6, 13, 0, 'vi', 'depression_questions_vi'), (6, 14, 0, 'vi', 'depression_questions_vi'), (6, 15, 0, 'vi', 'depression_questions_vi'), (6, 16, 0, 'vi', 'depression_questions_vi'), (6, 17, 0, 'vi', 'depression_questions_vi'), (6, 18, 0, 'vi', 'depression_questions_vi'), (6, 19, 0, 'vi', 'depression_questions_vi'), (6, 20, 0, 'vi', 'depression_questions_vi'),
(6, 21, 0, 'vi', 'depression_questions_vi'), (6, 22, 0, 'vi', 'depression_questions_vi'), (6, 23, 0, 'vi', 'depression_questions_vi'), (6, 24, 0, 'vi', 'depression_questions_vi'), (6, 25, 0, 'vi', 'depression_questions_vi'), (6, 26, 0, 'vi', 'depression_questions_vi'), (6, 27, 0, 'vi', 'depression_questions_vi'), (6, 28, 0, 'vi', 'depression_questions_vi'), (6, 29, 0, 'vi', 'depression_questions_vi'), (6, 30, 0, 'vi', 'depression_questions_vi'),
(6, 31, 0, 'vi', 'depression_questions_vi'), (6, 32, 0, 'vi', 'depression_questions_vi'), (6, 33, 0, 'vi', 'depression_questions_vi'), (6, 34, 0, 'vi', 'depression_questions_vi'), (6, 35, 0, 'vi', 'depression_questions_vi'), (6, 36, 0, 'vi', 'depression_questions_vi'), (6, 37, 0, 'vi', 'depression_questions_vi'), (6, 38, 0, 'vi', 'depression_questions_vi'), (6, 39, 0, 'vi', 'depression_questions_vi'), (6, 40, 0, 'vi', 'depression_questions_vi'),
(6, 41, 0, 'vi', 'depression_questions_vi'), (6, 42, 0, 'vi', 'depression_questions_vi'), (6, 43, 0, 'vi', 'depression_questions_vi'), (6, 44, 0, 'vi', 'depression_questions_vi'), (6, 45, 0, 'vi', 'depression_questions_vi'), (6, 46, 0, 'vi', 'depression_questions_vi'), (6, 47, 0, 'vi', 'depression_questions_vi'), (6, 48, 0, 'vi', 'depression_questions_vi'), (6, 49, 0, 'vi', 'depression_questions_vi'), (6, 50, 0, 'vi', 'depression_questions_vi'),
(6, 51, 0, 'vi', 'depression_questions_vi'), (6, 52, 0, 'vi', 'depression_questions_vi'), (6, 53, 0, 'vi', 'depression_questions_vi'), (6, 54, 0, 'vi', 'depression_questions_vi'), (6, 55, 0, 'vi', 'depression_questions_vi'), (6, 56, 0, 'vi', 'depression_questions_vi'), (6, 57, 0, 'vi', 'depression_questions_vi'), (6, 58, 0, 'vi', 'depression_questions_vi'), (6, 59, 0, 'vi', 'depression_questions_vi'), (6, 60, 0, 'vi', 'depression_questions_vi'),
(6, 61, 0, 'vi', 'depression_questions_vi'), (6, 62, 0, 'vi', 'depression_questions_vi'), (6, 63, 0, 'vi', 'depression_questions_vi');

-- User 6 - DASS-21 Test 3 (Score: 18, MODERATE) - test_result_id = 7
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(7, 1, 2, 'vi', 'depression_questions_vi'), (7, 2, 2, 'vi', 'depression_questions_vi'), (7, 3, 2, 'vi', 'depression_questions_vi'), (7, 4, 2, 'vi', 'depression_questions_vi'), (7, 5, 2, 'vi', 'depression_questions_vi'), (7, 6, 2, 'vi', 'depression_questions_vi'), (7, 7, 2, 'vi', 'depression_questions_vi'), (7, 8, 2, 'vi', 'depression_questions_vi'), (7, 9, 2, 'vi', 'depression_questions_vi'), (7, 10, 2, 'vi', 'depression_questions_vi'),
(7, 11, 2, 'vi', 'depression_questions_vi'), (7, 12, 2, 'vi', 'depression_questions_vi'), (7, 13, 1, 'vi', 'depression_questions_vi'), (7, 14, 1, 'vi', 'depression_questions_vi'), (7, 15, 1, 'vi', 'depression_questions_vi'), (7, 16, 1, 'vi', 'depression_questions_vi'), (7, 17, 1, 'vi', 'depression_questions_vi'), (7, 18, 1, 'vi', 'depression_questions_vi'), (7, 19, 1, 'vi', 'depression_questions_vi'), (7, 20, 1, 'vi', 'depression_questions_vi'),
(7, 21, 1, 'vi', 'depression_questions_vi'), (7, 22, 1, 'vi', 'depression_questions_vi'), (7, 23, 1, 'vi', 'depression_questions_vi'), (7, 24, 1, 'vi', 'depression_questions_vi'), (7, 25, 1, 'vi', 'depression_questions_vi'), (7, 26, 1, 'vi', 'depression_questions_vi'), (7, 27, 1, 'vi', 'depression_questions_vi'), (7, 28, 1, 'vi', 'depression_questions_vi'), (7, 29, 1, 'vi', 'depression_questions_vi'), (7, 30, 1, 'vi', 'depression_questions_vi'),
(7, 31, 1, 'vi', 'depression_questions_vi'), (7, 32, 1, 'vi', 'depression_questions_vi'), (7, 33, 1, 'vi', 'depression_questions_vi'), (7, 34, 1, 'vi', 'depression_questions_vi'), (7, 35, 1, 'vi', 'depression_questions_vi'), (7, 36, 1, 'vi', 'depression_questions_vi'), (7, 37, 1, 'vi', 'depression_questions_vi'), (7, 38, 1, 'vi', 'depression_questions_vi'), (7, 39, 1, 'vi', 'depression_questions_vi'), (7, 40, 1, 'vi', 'depression_questions_vi'),
(7, 41, 1, 'vi', 'depression_questions_vi'), (7, 42, 1, 'vi', 'depression_questions_vi'), (7, 43, 1, 'vi', 'depression_questions_vi'), (7, 44, 1, 'vi', 'depression_questions_vi'), (7, 45, 1, 'vi', 'depression_questions_vi'), (7, 46, 1, 'vi', 'depression_questions_vi'), (7, 47, 1, 'vi', 'depression_questions_vi'), (7, 48, 1, 'vi', 'depression_questions_vi'), (7, 49, 1, 'vi', 'depression_questions_vi'), (7, 50, 1, 'vi', 'depression_questions_vi'),
(7, 51, 1, 'vi', 'depression_questions_vi'), (7, 52, 1, 'vi', 'depression_questions_vi'), (7, 53, 1, 'vi', 'depression_questions_vi'), (7, 54, 1, 'vi', 'depression_questions_vi'), (7, 55, 1, 'vi', 'depression_questions_vi'), (7, 56, 1, 'vi', 'depression_questions_vi'), (7, 57, 1, 'vi', 'depression_questions_vi'), (7, 58, 1, 'vi', 'depression_questions_vi'), (7, 59, 1, 'vi', 'depression_questions_vi'), (7, 60, 1, 'vi', 'depression_questions_vi'),
(7, 61, 1, 'vi', 'depression_questions_vi'), (7, 62, 1, 'vi', 'depression_questions_vi'), (7, 63, 1, 'vi', 'depression_questions_vi');

-- User 6 - DASS-21 Test 4 (Score: 30, SEVERE) - test_result_id = 8
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(8, 1, 3, 'vi', 'depression_questions_vi'), (8, 2, 3, 'vi', 'depression_questions_vi'), (8, 3, 3, 'vi', 'depression_questions_vi'), (8, 4, 3, 'vi', 'depression_questions_vi'), (8, 5, 3, 'vi', 'depression_questions_vi'), (8, 6, 3, 'vi', 'depression_questions_vi'), (8, 7, 3, 'vi', 'depression_questions_vi'), (8, 8, 3, 'vi', 'depression_questions_vi'), (8, 9, 3, 'vi', 'depression_questions_vi'), (8, 10, 3, 'vi', 'depression_questions_vi'),
(8, 11, 3, 'vi', 'depression_questions_vi'), (8, 12, 3, 'vi', 'depression_questions_vi'), (8, 13, 2, 'vi', 'depression_questions_vi'), (8, 14, 2, 'vi', 'depression_questions_vi'), (8, 15, 2, 'vi', 'depression_questions_vi'), (8, 16, 2, 'vi', 'depression_questions_vi'), (8, 17, 2, 'vi', 'depression_questions_vi'), (8, 18, 2, 'vi', 'depression_questions_vi'), (8, 19, 2, 'vi', 'depression_questions_vi'), (8, 20, 2, 'vi', 'depression_questions_vi'),
(8, 21, 2, 'vi', 'depression_questions_vi'), (8, 22, 2, 'vi', 'depression_questions_vi'), (8, 23, 2, 'vi', 'depression_questions_vi'), (8, 24, 2, 'vi', 'depression_questions_vi'), (8, 25, 2, 'vi', 'depression_questions_vi'), (8, 26, 2, 'vi', 'depression_questions_vi'), (8, 27, 2, 'vi', 'depression_questions_vi'), (8, 28, 2, 'vi', 'depression_questions_vi'), (8, 29, 2, 'vi', 'depression_questions_vi'), (8, 30, 2, 'vi', 'depression_questions_vi'),
(8, 31, 2, 'vi', 'depression_questions_vi'), (8, 32, 2, 'vi', 'depression_questions_vi'), (8, 33, 2, 'vi', 'depression_questions_vi'), (8, 34, 2, 'vi', 'depression_questions_vi'), (8, 35, 2, 'vi', 'depression_questions_vi'), (8, 36, 2, 'vi', 'depression_questions_vi'), (8, 37, 2, 'vi', 'depression_questions_vi'), (8, 38, 2, 'vi', 'depression_questions_vi'), (8, 39, 2, 'vi', 'depression_questions_vi'), (8, 40, 2, 'vi', 'depression_questions_vi'),
(8, 41, 2, 'vi', 'depression_questions_vi'), (8, 42, 2, 'vi', 'depression_questions_vi'), (8, 43, 2, 'vi', 'depression_questions_vi'), (8, 44, 2, 'vi', 'depression_questions_vi'), (8, 45, 2, 'vi', 'depression_questions_vi'), (8, 46, 2, 'vi', 'depression_questions_vi'), (8, 47, 2, 'vi', 'depression_questions_vi'), (8, 48, 2, 'vi', 'depression_questions_vi'), (8, 49, 2, 'vi', 'depression_questions_vi'), (8, 50, 2, 'vi', 'depression_questions_vi'),
(8, 51, 2, 'vi', 'depression_questions_vi'), (8, 52, 2, 'vi', 'depression_questions_vi'), (8, 53, 2, 'vi', 'depression_questions_vi'), (8, 54, 2, 'vi', 'depression_questions_vi'), (8, 55, 2, 'vi', 'depression_questions_vi'), (8, 56, 2, 'vi', 'depression_questions_vi'), (8, 57, 2, 'vi', 'depression_questions_vi'), (8, 58, 2, 'vi', 'depression_questions_vi'), (8, 59, 2, 'vi', 'depression_questions_vi'), (8, 60, 2, 'vi', 'depression_questions_vi'),
(8, 61, 2, 'vi', 'depression_questions_vi'), (8, 62, 2, 'vi', 'depression_questions_vi'), (8, 63, 2, 'vi', 'depression_questions_vi');

-- ========================================
-- DASS-21 TEST ANSWERS (User 7 - Student 3)
-- ========================================

-- User 7 - DASS-21 Test 1 (Score: 3, MINIMAL) - test_result_id = 9
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(9, 1, 0, 'vi', 'depression_questions_vi'), (9, 2, 0, 'vi', 'depression_questions_vi'), (9, 3, 0, 'vi', 'depression_questions_vi'), (9, 4, 0, 'vi', 'depression_questions_vi'), (9, 5, 0, 'vi', 'depression_questions_vi'), (9, 6, 0, 'vi', 'depression_questions_vi'), (9, 7, 0, 'vi', 'depression_questions_vi'), (9, 8, 0, 'vi', 'depression_questions_vi'), (9, 9, 0, 'vi', 'depression_questions_vi'), (9, 10, 0, 'vi', 'depression_questions_vi'),
(9, 11, 0, 'vi', 'depression_questions_vi'), (9, 12, 0, 'vi', 'depression_questions_vi'), (9, 13, 0, 'vi', 'depression_questions_vi'), (9, 14, 0, 'vi', 'depression_questions_vi'), (9, 15, 0, 'vi', 'depression_questions_vi'), (9, 16, 0, 'vi', 'depression_questions_vi'), (9, 17, 0, 'vi', 'depression_questions_vi'), (9, 18, 0, 'vi', 'depression_questions_vi'), (9, 19, 0, 'vi', 'depression_questions_vi'), (9, 20, 0, 'vi', 'depression_questions_vi'),
(9, 21, 0, 'vi', 'depression_questions_vi'), (9, 22, 0, 'vi', 'depression_questions_vi'), (9, 23, 0, 'vi', 'depression_questions_vi'), (9, 24, 0, 'vi', 'depression_questions_vi'), (9, 25, 0, 'vi', 'depression_questions_vi'), (9, 26, 0, 'vi', 'depression_questions_vi'), (9, 27, 0, 'vi', 'depression_questions_vi'), (9, 28, 0, 'vi', 'depression_questions_vi'), (9, 29, 0, 'vi', 'depression_questions_vi'), (9, 30, 0, 'vi', 'depression_questions_vi'),
(9, 31, 0, 'vi', 'depression_questions_vi'), (9, 32, 0, 'vi', 'depression_questions_vi'), (9, 33, 0, 'vi', 'depression_questions_vi'), (9, 34, 0, 'vi', 'depression_questions_vi'), (9, 35, 0, 'vi', 'depression_questions_vi'), (9, 36, 0, 'vi', 'depression_questions_vi'), (9, 37, 0, 'vi', 'depression_questions_vi'), (9, 38, 0, 'vi', 'depression_questions_vi'), (9, 39, 0, 'vi', 'depression_questions_vi'), (9, 40, 0, 'vi', 'depression_questions_vi'),
(9, 41, 0, 'vi', 'depression_questions_vi'), (9, 42, 0, 'vi', 'depression_questions_vi'), (9, 43, 0, 'vi', 'depression_questions_vi'), (9, 44, 0, 'vi', 'depression_questions_vi'), (9, 45, 0, 'vi', 'depression_questions_vi'), (9, 46, 0, 'vi', 'depression_questions_vi'), (9, 47, 0, 'vi', 'depression_questions_vi'), (9, 48, 0, 'vi', 'depression_questions_vi'), (9, 49, 0, 'vi', 'depression_questions_vi'), (9, 50, 0, 'vi', 'depression_questions_vi'),
(9, 51, 0, 'vi', 'depression_questions_vi'), (9, 52, 0, 'vi', 'depression_questions_vi'), (9, 53, 0, 'vi', 'depression_questions_vi'), (9, 54, 0, 'vi', 'depression_questions_vi'), (9, 55, 0, 'vi', 'depression_questions_vi'), (9, 56, 0, 'vi', 'depression_questions_vi'), (9, 57, 0, 'vi', 'depression_questions_vi'), (9, 58, 0, 'vi', 'depression_questions_vi'), (9, 59, 0, 'vi', 'depression_questions_vi'), (9, 60, 0, 'vi', 'depression_questions_vi'),
(9, 61, 0, 'vi', 'depression_questions_vi'), (9, 62, 0, 'vi', 'depression_questions_vi'), (9, 63, 0, 'vi', 'depression_questions_vi');

-- User 7 - DASS-21 Test 2 (Score: 10, MILD) - test_result_id = 10
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(10, 1, 1, 'vi', 'depression_questions_vi'), (10, 2, 1, 'vi', 'depression_questions_vi'), (10, 3, 1, 'vi', 'depression_questions_vi'), (10, 4, 1, 'vi', 'depression_questions_vi'), (10, 5, 1, 'vi', 'depression_questions_vi'), (10, 6, 1, 'vi', 'depression_questions_vi'), (10, 7, 1, 'vi', 'depression_questions_vi'), (10, 8, 1, 'vi', 'depression_questions_vi'), (10, 9, 1, 'vi', 'depression_questions_vi'), (10, 10, 1, 'vi', 'depression_questions_vi'),
(10, 11, 0, 'vi', 'depression_questions_vi'), (10, 12, 0, 'vi', 'depression_questions_vi'), (10, 13, 0, 'vi', 'depression_questions_vi'), (10, 14, 0, 'vi', 'depression_questions_vi'), (10, 15, 0, 'vi', 'depression_questions_vi'), (10, 16, 0, 'vi', 'depression_questions_vi'), (10, 17, 0, 'vi', 'depression_questions_vi'), (10, 18, 0, 'vi', 'depression_questions_vi'), (10, 19, 0, 'vi', 'depression_questions_vi'), (10, 20, 0, 'vi', 'depression_questions_vi'),
(10, 21, 0, 'vi', 'depression_questions_vi'), (10, 22, 0, 'vi', 'depression_questions_vi'), (10, 23, 0, 'vi', 'depression_questions_vi'), (10, 24, 0, 'vi', 'depression_questions_vi'), (10, 25, 0, 'vi', 'depression_questions_vi'), (10, 26, 0, 'vi', 'depression_questions_vi'), (10, 27, 0, 'vi', 'depression_questions_vi'), (10, 28, 0, 'vi', 'depression_questions_vi'), (10, 29, 0, 'vi', 'depression_questions_vi'), (10, 30, 0, 'vi', 'depression_questions_vi'),
(10, 31, 0, 'vi', 'depression_questions_vi'), (10, 32, 0, 'vi', 'depression_questions_vi'), (10, 33, 0, 'vi', 'depression_questions_vi'), (10, 34, 0, 'vi', 'depression_questions_vi'), (10, 35, 0, 'vi', 'depression_questions_vi'), (10, 36, 0, 'vi', 'depression_questions_vi'), (10, 37, 0, 'vi', 'depression_questions_vi'), (10, 38, 0, 'vi', 'depression_questions_vi'), (10, 39, 0, 'vi', 'depression_questions_vi'), (10, 40, 0, 'vi', 'depression_questions_vi'),
(10, 41, 0, 'vi', 'depression_questions_vi'), (10, 42, 0, 'vi', 'depression_questions_vi'), (10, 43, 0, 'vi', 'depression_questions_vi'), (10, 44, 0, 'vi', 'depression_questions_vi'), (10, 45, 0, 'vi', 'depression_questions_vi'), (10, 46, 0, 'vi', 'depression_questions_vi'), (10, 47, 0, 'vi', 'depression_questions_vi'), (10, 48, 0, 'vi', 'depression_questions_vi'), (10, 49, 0, 'vi', 'depression_questions_vi'), (10, 50, 0, 'vi', 'depression_questions_vi'),
(10, 51, 0, 'vi', 'depression_questions_vi'), (10, 52, 0, 'vi', 'depression_questions_vi'), (10, 53, 0, 'vi', 'depression_questions_vi'), (10, 54, 0, 'vi', 'depression_questions_vi'), (10, 55, 0, 'vi', 'depression_questions_vi'), (10, 56, 0, 'vi', 'depression_questions_vi'), (10, 57, 0, 'vi', 'depression_questions_vi'), (10, 58, 0, 'vi', 'depression_questions_vi'), (10, 59, 0, 'vi', 'depression_questions_vi'), (10, 60, 0, 'vi', 'depression_questions_vi'),
(10, 61, 0, 'vi', 'depression_questions_vi'), (10, 62, 0, 'vi', 'depression_questions_vi'), (10, 63, 0, 'vi', 'depression_questions_vi');

-- ========================================
-- DASS-42 TEST ANSWERS (User 8 - Student 4)
-- ========================================

-- User 8 - DASS-42 Test 1 (Score: 8, MINIMAL) - test_result_id = 11
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(11, 1, 0, 'vi', 'depression_questions_vi'), (11, 2, 0, 'vi', 'depression_questions_vi'), (11, 3, 0, 'vi', 'depression_questions_vi'), (11, 4, 0, 'vi', 'depression_questions_vi'), (11, 5, 0, 'vi', 'depression_questions_vi'), (11, 6, 0, 'vi', 'depression_questions_vi'), (11, 7, 0, 'vi', 'depression_questions_vi'), (11, 8, 0, 'vi', 'depression_questions_vi'), (11, 9, 0, 'vi', 'depression_questions_vi'), (11, 10, 0, 'vi', 'depression_questions_vi'),
(11, 11, 0, 'vi', 'depression_questions_vi'), (11, 12, 0, 'vi', 'depression_questions_vi'), (11, 13, 0, 'vi', 'depression_questions_vi'), (11, 14, 0, 'vi', 'depression_questions_vi'), (11, 15, 0, 'vi', 'depression_questions_vi'), (11, 16, 0, 'vi', 'depression_questions_vi'), (11, 17, 0, 'vi', 'depression_questions_vi'), (11, 18, 0, 'vi', 'depression_questions_vi'), (11, 19, 0, 'vi', 'depression_questions_vi'), (11, 20, 0, 'vi', 'depression_questions_vi'),
(11, 21, 0, 'vi', 'depression_questions_vi'), (11, 22, 0, 'vi', 'depression_questions_vi'), (11, 23, 0, 'vi', 'depression_questions_vi'), (11, 24, 0, 'vi', 'depression_questions_vi'), (11, 25, 0, 'vi', 'depression_questions_vi'), (11, 26, 0, 'vi', 'depression_questions_vi'), (11, 27, 0, 'vi', 'depression_questions_vi'), (11, 28, 0, 'vi', 'depression_questions_vi'), (11, 29, 0, 'vi', 'depression_questions_vi'), (11, 30, 0, 'vi', 'depression_questions_vi'),
(11, 31, 0, 'vi', 'depression_questions_vi'), (11, 32, 0, 'vi', 'depression_questions_vi'), (11, 33, 0, 'vi', 'depression_questions_vi'), (11, 34, 0, 'vi', 'depression_questions_vi'), (11, 35, 0, 'vi', 'depression_questions_vi'), (11, 36, 0, 'vi', 'depression_questions_vi'), (11, 37, 0, 'vi', 'depression_questions_vi'), (11, 38, 0, 'vi', 'depression_questions_vi'), (11, 39, 0, 'vi', 'depression_questions_vi'), (11, 40, 0, 'vi', 'depression_questions_vi'),
(11, 41, 0, 'vi', 'depression_questions_vi'), (11, 42, 0, 'vi', 'depression_questions_vi'), (11, 43, 0, 'vi', 'depression_questions_vi'), (11, 44, 0, 'vi', 'depression_questions_vi'), (11, 45, 0, 'vi', 'depression_questions_vi'), (11, 46, 0, 'vi', 'depression_questions_vi'), (11, 47, 0, 'vi', 'depression_questions_vi'), (11, 48, 0, 'vi', 'depression_questions_vi'), (11, 49, 0, 'vi', 'depression_questions_vi'), (11, 50, 0, 'vi', 'depression_questions_vi'),
(11, 51, 0, 'vi', 'depression_questions_vi'), (11, 52, 0, 'vi', 'depression_questions_vi'), (11, 53, 0, 'vi', 'depression_questions_vi'), (11, 54, 0, 'vi', 'depression_questions_vi'), (11, 55, 0, 'vi', 'depression_questions_vi'), (11, 56, 0, 'vi', 'depression_questions_vi'), (11, 57, 0, 'vi', 'depression_questions_vi'), (11, 58, 0, 'vi', 'depression_questions_vi'), (11, 59, 0, 'vi', 'depression_questions_vi'), (11, 60, 0, 'vi', 'depression_questions_vi'),
(11, 61, 0, 'vi', 'depression_questions_vi'), (11, 62, 0, 'vi', 'depression_questions_vi'), (11, 63, 0, 'vi', 'depression_questions_vi');

-- User 8 - DASS-42 Test 2 (Score: 20, MILD) - test_result_id = 12
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(12, 1, 1, 'vi', 'depression_questions_vi'), (12, 2, 1, 'vi', 'depression_questions_vi'), (12, 3, 1, 'vi', 'depression_questions_vi'), (12, 4, 1, 'vi', 'depression_questions_vi'), (12, 5, 1, 'vi', 'depression_questions_vi'), (12, 6, 1, 'vi', 'depression_questions_vi'), (12, 7, 1, 'vi', 'depression_questions_vi'), (12, 8, 1, 'vi', 'depression_questions_vi'), (12, 9, 1, 'vi', 'depression_questions_vi'), (12, 10, 1, 'vi', 'depression_questions_vi'),
(12, 11, 1, 'vi', 'depression_questions_vi'), (12, 12, 1, 'vi', 'depression_questions_vi'), (12, 13, 1, 'vi', 'depression_questions_vi'), (12, 14, 1, 'vi', 'depression_questions_vi'), (12, 15, 1, 'vi', 'depression_questions_vi'), (12, 16, 1, 'vi', 'depression_questions_vi'), (12, 17, 1, 'vi', 'depression_questions_vi'), (12, 18, 1, 'vi', 'depression_questions_vi'), (12, 19, 1, 'vi', 'depression_questions_vi'), (12, 20, 1, 'vi', 'depression_questions_vi'),
(12, 21, 0, 'vi', 'depression_questions_vi'), (12, 22, 0, 'vi', 'depression_questions_vi'), (12, 23, 0, 'vi', 'depression_questions_vi'), (12, 24, 0, 'vi', 'depression_questions_vi'), (12, 25, 0, 'vi', 'depression_questions_vi'), (12, 26, 0, 'vi', 'depression_questions_vi'), (12, 27, 0, 'vi', 'depression_questions_vi'), (12, 28, 0, 'vi', 'depression_questions_vi'), (12, 29, 0, 'vi', 'depression_questions_vi'), (12, 30, 0, 'vi', 'depression_questions_vi'),
(12, 31, 0, 'vi', 'depression_questions_vi'), (12, 32, 0, 'vi', 'depression_questions_vi'), (12, 33, 0, 'vi', 'depression_questions_vi'), (12, 34, 0, 'vi', 'depression_questions_vi'), (12, 35, 0, 'vi', 'depression_questions_vi'), (12, 36, 0, 'vi', 'depression_questions_vi'), (12, 37, 0, 'vi', 'depression_questions_vi'), (12, 38, 0, 'vi', 'depression_questions_vi'), (12, 39, 0, 'vi', 'depression_questions_vi'), (12, 40, 0, 'vi', 'depression_questions_vi'),
(12, 41, 0, 'vi', 'depression_questions_vi'), (12, 42, 0, 'vi', 'depression_questions_vi'), (12, 43, 0, 'vi', 'depression_questions_vi'), (12, 44, 0, 'vi', 'depression_questions_vi'), (12, 45, 0, 'vi', 'depression_questions_vi'), (12, 46, 0, 'vi', 'depression_questions_vi'), (12, 47, 0, 'vi', 'depression_questions_vi'), (12, 48, 0, 'vi', 'depression_questions_vi'), (12, 49, 0, 'vi', 'depression_questions_vi'), (12, 50, 0, 'vi', 'depression_questions_vi'),
(12, 51, 0, 'vi', 'depression_questions_vi'), (12, 52, 0, 'vi', 'depression_questions_vi'), (12, 53, 0, 'vi', 'depression_questions_vi'), (12, 54, 0, 'vi', 'depression_questions_vi'), (12, 55, 0, 'vi', 'depression_questions_vi'), (12, 56, 0, 'vi', 'depression_questions_vi'), (12, 57, 0, 'vi', 'depression_questions_vi'), (12, 58, 0, 'vi', 'depression_questions_vi'), (12, 59, 0, 'vi', 'depression_questions_vi'), (12, 60, 0, 'vi', 'depression_questions_vi'),
(12, 61, 0, 'vi', 'depression_questions_vi'), (12, 62, 0, 'vi', 'depression_questions_vi'), (12, 63, 0, 'vi', 'depression_questions_vi');

-- ========================================
-- ENGLISH TEST RESULTS (Sample data)
-- ========================================
-- English DASS-21 Test Results
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(5, 3, 'No clear signs of depression', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Your psychological state is stable. Maintain a healthy lifestyle and participate in positive activities.', 'DASS-21', 'en'),
(6, 12, 'Some mild signs of depression', 'MILD', DATE_SUB(NOW(), INTERVAL 3 DAY), 'You have some mild signs. Try relaxation activities and share with loved ones.', 'DASS-21', 'en'),
(7, 20, 'Moderate signs of depression', 'MODERATE', DATE_SUB(NOW(), INTERVAL 1 DAY), 'You have moderate signs of depression. Consider consulting a mental health professional and implementing early intervention measures.', 'DASS-21', 'en');

-- English BDI Test Results
INSERT INTO depression_test_results (user_id, total_score, diagnosis, severity_level, tested_at, recommendation, test_type, language) VALUES
(8, 8, 'No clear signs of depression', 'MINIMAL', DATE_SUB(NOW(), INTERVAL 4 DAY), 'Your psychological state is stable. Maintain a healthy lifestyle and participate in positive activities.', 'BDI', 'en'),
(9, 18, 'Some mild signs of depression', 'MILD', DATE_SUB(NOW(), INTERVAL 2 DAY), 'You have some mild signs. Try relaxation activities and share with loved ones.', 'BDI', 'en');

-- ========================================
-- ENGLISH TEST ANSWERS (Sample data)
-- ========================================
-- Test Result 101 (English DASS-21, Score: 3)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(101, 22, 0, 'en', 'depression_questions_en'), (101, 23, 0, 'en', 'depression_questions_en'), (101, 24, 0, 'en', 'depression_questions_en'), (101, 25, 0, 'en', 'depression_questions_en'), (101, 26, 0, 'en', 'depression_questions_en'),
(101, 27, 0, 'en', 'depression_questions_en'), (101, 28, 0, 'en', 'depression_questions_en'), (101, 29, 0, 'en', 'depression_questions_en'), (101, 30, 0, 'en', 'depression_questions_en'), (101, 31, 0, 'en', 'depression_questions_en'),
(101, 32, 0, 'en', 'depression_questions_en'), (101, 33, 0, 'en', 'depression_questions_en'), (101, 34, 0, 'en', 'depression_questions_en'), (101, 35, 0, 'en', 'depression_questions_en'), (101, 36, 0, 'en', 'depression_questions_en'),
(101, 37, 0, 'en', 'depression_questions_en'), (101, 38, 0, 'en', 'depression_questions_en'), (101, 39, 0, 'en', 'depression_questions_en'), (101, 40, 0, 'en', 'depression_questions_en'), (101, 41, 0, 'en', 'depression_questions_en'), (101, 42, 1, 'en', 'depression_questions_en');

-- Test Result 102 (English DASS-21, Score: 12)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(102, 22, 1, 'en', 'depression_questions_en'), (102, 23, 1, 'en', 'depression_questions_en'), (102, 24, 1, 'en', 'depression_questions_en'), (102, 25, 1, 'en', 'depression_questions_en'), (102, 26, 1, 'en', 'depression_questions_en'),
(102, 27, 1, 'en', 'depression_questions_en'), (102, 28, 1, 'en', 'depression_questions_en'), (102, 29, 1, 'en', 'depression_questions_en'), (102, 30, 1, 'en', 'depression_questions_en'), (102, 31, 1, 'en', 'depression_questions_en'),
(102, 32, 1, 'en', 'depression_questions_en'), (102, 33, 1, 'en', 'depression_questions_en'), (102, 34, 1, 'en', 'depression_questions_en'), (102, 35, 1, 'en', 'depression_questions_en'), (102, 36, 1, 'en', 'depression_questions_en'),
(102, 37, 1, 'en', 'depression_questions_en'), (102, 38, 1, 'en', 'depression_questions_en'), (102, 39, 1, 'en', 'depression_questions_en'), (102, 40, 1, 'en', 'depression_questions_en'), (102, 41, 1, 'en', 'depression_questions_en'), (102, 42, 1, 'en', 'depression_questions_en');

-- Test Result 103 (English BDI, Score: 8)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(103, 148, 0, 'en', 'depression_questions_en'), (103, 149, 0, 'en', 'depression_questions_en'), (103, 150, 0, 'en', 'depression_questions_en'), (103, 151, 0, 'en', 'depression_questions_en'), (103, 152, 0, 'en', 'depression_questions_en'),
(103, 153, 0, 'en', 'depression_questions_en'), (103, 154, 0, 'en', 'depression_questions_en'), (103, 155, 0, 'en', 'depression_questions_en'), (103, 156, 0, 'en', 'depression_questions_en'), (103, 157, 0, 'en', 'depression_questions_en'),
(103, 158, 0, 'en', 'depression_questions_en'), (103, 159, 0, 'en', 'depression_questions_en'), (103, 160, 0, 'en', 'depression_questions_en'), (103, 161, 0, 'en', 'depression_questions_en'), (103, 162, 0, 'en', 'depression_questions_en'),
(103, 163, 0, 'en', 'depression_questions_en'), (103, 164, 0, 'en', 'depression_questions_en'), (103, 165, 0, 'en', 'depression_questions_en'), (103, 166, 0, 'en', 'depression_questions_en'), (103, 167, 0, 'en', 'depression_questions_en'), (103, 168, 1, 'en', 'depression_questions_en');

-- Test Result 104 (English BDI, Score: 18)
INSERT INTO depression_test_answers (test_result_id, question_id, answer_value, language, question_table) VALUES
(104, 148, 1, 'en', 'depression_questions_en'), (104, 149, 1, 'en', 'depression_questions_en'), (104, 150, 1, 'en', 'depression_questions_en'), (104, 151, 1, 'en', 'depression_questions_en'), (104, 152, 1, 'en', 'depression_questions_en'),
(104, 153, 1, 'en', 'depression_questions_en'), (104, 154, 1, 'en', 'depression_questions_en'), (104, 155, 1, 'en', 'depression_questions_en'), (104, 156, 1, 'en', 'depression_questions_en'), (104, 157, 1, 'en', 'depression_questions_en'),
(104, 158, 1, 'en', 'depression_questions_en'), (104, 159, 1, 'en', 'depression_questions_en'), (104, 160, 1, 'en', 'depression_questions_en'), (104, 161, 1, 'en', 'depression_questions_en'), (104, 162, 1, 'en', 'depression_questions_en'),
(104, 163, 1, 'en', 'depression_questions_en'), (104, 164, 1, 'en', 'depression_questions_en'), (104, 165, 1, 'en', 'depression_questions_en'), (104, 166, 1, 'en', 'depression_questions_en'), (104, 167, 1, 'en', 'depression_questions_en'), (104, 168, 1, 'en', 'depression_questions_en');

-- ========================================
-- NOTE: This file contains corrected test answers with proper test_result_id mapping
-- Run this file after importing the main MindMeter.sql to fix the test answers
-- ========================================

-- ========================================
-- BLOG SYSTEM TABLES
-- ========================================

-- Blog posts table
CREATE TABLE blog_posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content LONGTEXT NOT NULL,
    excerpt TEXT,
    author_id BIGINT NOT NULL,
    status ENUM('draft', 'pending', 'approved', 'rejected', 'published') DEFAULT 'pending',
    featured_image VARCHAR(500),
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    share_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_author (author_id),
    INDEX idx_published (published_at),
    INDEX idx_featured (is_featured),
    INDEX idx_slug (slug)
);

-- Blog post tags table
CREATE TABLE blog_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
);

-- Blog post tag relationships
CREATE TABLE blog_post_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_tag (post_id, tag_id),
    INDEX idx_post (post_id),
    INDEX idx_tag (tag_id)
);

-- Blog post likes table
CREATE TABLE blog_likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (post_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_user (user_id)
);

-- Blog post comments table
CREATE TABLE blog_comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parent_id BIGINT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'spam') DEFAULT 'pending',
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_id),
    INDEX idx_status (status)
);

-- Blog comment likes table
CREATE TABLE blog_comment_likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    comment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_comment_like (comment_id, user_id),
    INDEX idx_comment (comment_id),
    INDEX idx_user (user_id)
);

-- Blog post shares table
CREATE TABLE blog_shares (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    platform VARCHAR(50) NOT NULL, -- facebook, twitter, linkedin, etc.
    shared_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_user (user_id),
    INDEX idx_platform (platform)
);

-- Blog post bookmarks table
CREATE TABLE blog_bookmarks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (post_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_user (user_id)
);

-- Blog post images table (for multiple images per post)
CREATE TABLE blog_post_images (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_order (display_order)
);

-- Blog post views tracking table
CREATE TABLE blog_post_views (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NULL, -- NULL for anonymous users
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_post (post_id),
    INDEX idx_user (user_id),
    INDEX idx_viewed_at (viewed_at)
);

-- Blog categories table
CREATE TABLE blog_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#10B981',
    parent_id BIGINT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
);

-- Blog post categories relationship
CREATE TABLE blog_post_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_category (post_id, category_id),
    INDEX idx_post (post_id),
    INDEX idx_category (category_id)
);

-- Blog post reports table (for reporting inappropriate content)
CREATE TABLE blog_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reason ENUM('spam', 'inappropriate', 'harassment', 'false_info', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);

-- ========================================
-- BLOG SAMPLE DATA
-- ========================================

-- Insert sample blog categories
INSERT INTO blog_categories (name, slug, description, color, display_order) VALUES
('Sức khỏe tâm thần', 'suc-khoe-tam-than', 'Các bài viết về sức khỏe tâm thần nói chung', '#3B82F6', 1),
('Trầm cảm', 'tram-cam', 'Chia sẻ về trầm cảm và cách vượt qua', '#EF4444', 2),
('Lo âu', 'lo-au', 'Các vấn đề về lo âu và căng thẳng', '#F59E0B', 3),
('Tự chăm sóc', 'tu-cham-soc', 'Cách tự chăm sóc bản thân', '#10B981', 4),
('Cộng đồng', 'cong-dong', 'Chia sẻ từ cộng đồng', '#8B5CF6', 5),
('Kinh nghiệm', 'kinh-nghiem', 'Kinh nghiệm cá nhân', '#06B6D4', 6);

-- Insert sample blog tags
INSERT INTO blog_tags (name, slug, description, color) VALUES
('trầm cảm', 'tram-cam', 'Các bài viết về trầm cảm', '#EF4444'),
('lo âu', 'lo-au', 'Các bài viết về lo âu', '#F59E0B'),
('căng thẳng', 'cang-thang', 'Các bài viết về căng thẳng', '#F97316'),
('tự chăm sóc', 'tu-cham-soc', 'Các bài viết về tự chăm sóc', '#10B981'),
('thiền định', 'thien-dinh', 'Các bài viết về thiền định', '#8B5CF6'),
('yoga', 'yoga', 'Các bài viết về yoga', '#06B6D4'),
('tập thể dục', 'tap-the-duc', 'Các bài viết về tập thể dục', '#84CC16'),
('ăn uống', 'an-uong', 'Các bài viết về dinh dưỡng', '#F59E0B'),
('giấc ngủ', 'giac-ngu', 'Các bài viết về giấc ngủ', '#6366F1'),
('hỗ trợ', 'ho-tro', 'Các bài viết về hỗ trợ', '#EC4899');

-- Insert sample blog posts
INSERT INTO blog_posts (title, slug, content, excerpt, author_id, status, featured_image, is_featured, published_at) VALUES
('Làm thế nào để vượt qua trầm cảm một cách tích cực', 'lam-the-nao-de-vuot-qua-tram-cam-mot-cach-tich-cuc', 
'<p>Trầm cảm là một căn bệnh tâm lý phổ biến ảnh hưởng đến hàng triệu người trên thế giới. Tuy nhiên, với sự hiểu biết đúng đắn và các phương pháp điều trị phù hợp, chúng ta hoàn toàn có thể vượt qua được căn bệnh này.</p>

<p><strong>1. Nhận biết các dấu hiệu trầm cảm</strong></p>
<p>Trước tiên, việc nhận biết các dấu hiệu của trầm cảm là rất quan trọng. Các dấu hiệu thường gặp bao gồm:</p>
<ul>
<li>Cảm giác buồn bã, trống rỗng kéo dài</li>
<li>Mất hứng thú với các hoạt động yêu thích</li>
<li>Thay đổi khẩu vị và cân nặng</li>
<li>Khó ngủ hoặc ngủ quá nhiều</li>
<li>Mệt mỏi, thiếu năng lượng</li>
<li>Khó tập trung và đưa ra quyết định</li>
<li>Cảm giác vô giá trị hoặc tội lỗi</li>
<li>Suy nghĩ về cái chết hoặc tự tử</li>
</ul>

<p><strong>2. Tìm kiếm sự hỗ trợ chuyên nghiệp</strong></p>
<p>Khi nhận thấy các dấu hiệu trầm cảm, việc tìm kiếm sự hỗ trợ từ các chuyên gia tâm lý là vô cùng quan trọng. Các chuyên gia có thể giúp bạn:</p>
<ul>
<li>Chẩn đoán chính xác tình trạng sức khỏe tâm thần</li>
<li>Đưa ra phác đồ điều trị phù hợp</li>
<li>Hỗ trợ tâm lý và tư vấn</li>
<li>Theo dõi tiến trình phục hồi</li>
</ul>

<p><strong>3. Xây dựng lối sống lành mạnh</strong></p>
<p>Một lối sống lành mạnh có thể giúp cải thiện đáng kể tình trạng trầm cảm:</p>
<ul>
<li><strong>Tập thể dục thường xuyên:</strong> Hoạt động thể chất giúp giải phóng endorphin, cải thiện tâm trạng</li>
<li><strong>Ăn uống cân bằng:</strong> Chế độ ăn giàu omega-3, vitamin B và các chất dinh dưỡng cần thiết</li>
<li><strong>Ngủ đủ giấc:</strong> Duy trì lịch ngủ đều đặn, 7-9 tiếng mỗi đêm</li>
<li><strong>Tránh rượu bia và chất kích thích:</strong> Các chất này có thể làm trầm trọng thêm tình trạng trầm cảm</li>
</ul>

<p><strong>4. Thực hành các kỹ thuật thư giãn</strong></p>
<p>Các kỹ thuật thư giãn có thể giúp giảm căng thẳng và cải thiện tâm trạng:</p>
<ul>
<li><strong>Thiền định:</strong> Thực hành thiền 10-20 phút mỗi ngày</li>
<li><strong>Hít thở sâu:</strong> Kỹ thuật hít thở 4-7-8</li>
<li><strong>Yoga:</strong> Kết hợp vận động và thư giãn</li>
<li><strong>Massage:</strong> Giúp thư giãn cơ bắp và tinh thần</li>
</ul>

<p><strong>5. Xây dựng mối quan hệ tích cực</strong></p>
<p>Mối quan hệ xã hội lành mạnh đóng vai trò quan trọng trong việc phục hồi:</p>
<ul>
<li>Duy trì liên lạc với gia đình và bạn bè</li>
<li>Tham gia các hoạt động cộng đồng</li>
<li>Tìm kiếm nhóm hỗ trợ</li>
<li>Chia sẻ cảm xúc với người tin tưởng</li>
</ul>

<p><strong>6. Đặt mục tiêu thực tế</strong></p>
<p>Khi bị trầm cảm, việc đặt mục tiêu quá cao có thể gây thêm áp lực. Hãy:</p>
<ul>
<li>Chia nhỏ các mục tiêu lớn thành những bước nhỏ</li>
<li>Ghi nhận và khen ngợi bản thân cho mỗi thành tựu nhỏ</li>
<li>Không so sánh với người khác</li>
<li>Kiên nhẫn với bản thân trong quá trình phục hồi</li>
</ul>

<p><strong>Kết luận</strong></p>
<p>Vượt qua trầm cảm là một hành trình dài và đòi hỏi sự kiên nhẫn. Quan trọng nhất là không bao giờ từ bỏ hy vọng và luôn tìm kiếm sự hỗ trợ khi cần thiết. Với sự giúp đỡ đúng đắn và quyết tâm, bạn hoàn toàn có thể vượt qua được căn bệnh này và xây dựng một cuộc sống hạnh phúc, ý nghĩa.</p>

<p>Nếu bạn đang gặp khó khăn với trầm cảm, đừng ngần ngại tìm kiếm sự giúp đỡ. MindMeter luôn sẵn sàng hỗ trợ bạn với các chuyên gia tâm lý giàu kinh nghiệm.</p>', 
'Trầm cảm là một căn bệnh tâm lý phổ biến nhưng hoàn toàn có thể vượt qua được. Bài viết này sẽ hướng dẫn bạn các cách tích cực để đối phó với trầm cảm và xây dựng một cuộc sống hạnh phúc hơn.', 
6, 'published', '/uploads/blog/featured/depression-recovery.jpg', TRUE, NOW()),

('10 cách giảm căng thẳng hiệu quả cho sinh viên', '10-cach-giam-cang-thang-hieu-qua-cho-sinh-vien',
'<p>Cuộc sống sinh viên đầy áp lực với bài tập, thi cử, và các mối quan hệ xã hội. Căng thẳng có thể ảnh hưởng nghiêm trọng đến sức khỏe tâm thần và kết quả học tập. Dưới đây là 10 cách giảm căng thẳng hiệu quả dành riêng cho sinh viên.</p>

<p><strong>1. Quản lý thời gian hiệu quả</strong></p>
<p>Lập kế hoạch học tập và sinh hoạt một cách khoa học:</p>
<ul>
<li>Sử dụng lịch điện tử để theo dõi deadline</li>
<li>Chia nhỏ công việc lớn thành các bước nhỏ</li>
<li>Ưu tiên các nhiệm vụ quan trọng</li>
<li>Dành thời gian nghỉ ngơi giữa các buổi học</li>
</ul>

<p><strong>2. Tập thể dục thường xuyên</strong></p>
<p>Hoạt động thể chất là cách tốt nhất để giảm căng thẳng:</p>
<ul>
<li>Chạy bộ 30 phút mỗi ngày</li>
<li>Tham gia các môn thể thao yêu thích</li>
<li>Đi bộ trong khuôn viên trường</li>
<li>Thực hiện các bài tập đơn giản tại phòng</li>
</ul>

<p><strong>3. Thực hành thiền định</strong></p>
<p>Thiền định giúp tâm trí thư giãn và tập trung:</p>
<ul>
<li>Bắt đầu với 5-10 phút mỗi ngày</li>
<li>Sử dụng các ứng dụng thiền định</li>
<li>Thiền trước khi ngủ để cải thiện giấc ngủ</li>
<li>Tham gia các lớp yoga tại trường</li>
</ul>

<p><strong>4. Xây dựng mối quan hệ tích cực</strong></p>
<p>Mối quan hệ xã hội lành mạnh giúp giảm căng thẳng:</p>
<ul>
<li>Duy trì liên lạc với gia đình</li>
<li>Kết bạn với những người tích cực</li>
<li>Tham gia các câu lạc bộ, hoạt động ngoại khóa</li>
<li>Chia sẻ cảm xúc với bạn bè tin cậy</li>
</ul>

<p><strong>5. Ăn uống lành mạnh</strong></p>
<p>Chế độ ăn uống ảnh hưởng trực tiếp đến tâm trạng:</p>
<ul>
<li>Ăn đủ 3 bữa chính mỗi ngày</li>
<li>Bổ sung nhiều rau xanh và trái cây</li>
<li>Hạn chế caffeine và đồ ngọt</li>
<li>Uống đủ nước (2-3 lít/ngày)</li>
</ul>

<p><strong>6. Ngủ đủ giấc</strong></p>
<p>Giấc ngủ chất lượng là chìa khóa để giảm căng thẳng:</p>
<ul>
<li>Ngủ 7-9 tiếng mỗi đêm</li>
<li>Duy trì lịch ngủ đều đặn</li>
<li>Tắt điện thoại trước khi ngủ</li>
<li>Tạo không gian ngủ thoải mái</li>
</ul>

<p><strong>7. Học cách nói "không"</strong></p>
<p>Đừng ôm đồm quá nhiều việc cùng lúc:</p>
<ul>
<li>Ưu tiên các nhiệm vụ quan trọng</li>
<li>Từ chối các lời mời không cần thiết</li>
<li>Đặt giới hạn cho bản thân</li>
<li>Học cách ủy quyền công việc</li>
</ul>

<p><strong>8. Tìm kiếm sự hỗ trợ chuyên nghiệp</strong></p>
<p>Khi căng thẳng quá mức, hãy tìm kiếm sự giúp đỡ:</p>
<ul>
<li>Tham khảo ý kiến chuyên gia tâm lý</li>
<li>Sử dụng dịch vụ tư vấn của trường</li>
<li>Tham gia các nhóm hỗ trợ</li>
<li>Không ngần ngại yêu cầu giúp đỡ</li>
</ul>

<p><strong>9. Thực hiện các hoạt động thư giãn</strong></p>
<p>Dành thời gian cho những hoạt động yêu thích:</p>
<ul>
<li>Đọc sách, xem phim</li>
<li>Nghe nhạc, chơi nhạc cụ</li>
<li>Vẽ, viết, sáng tạo</li>
<li>Chơi game, giải trí</li>
</ul>

<p><strong>10. Thực hành lòng biết ơn</strong></p>
<p>Ghi nhận những điều tích cực trong cuộc sống:</p>
<ul>
<li>Viết nhật ký biết ơn mỗi ngày</li>
<li>Ghi nhận 3 điều tốt đẹp mỗi ngày</li>
<li>Chia sẻ lòng biết ơn với người khác</li>
<li>Tập trung vào những gì bạn có</li>
</ul>

<p><strong>Kết luận</strong></p>
<p>Căng thẳng là một phần không thể tránh khỏi trong cuộc sống sinh viên, nhưng chúng ta hoàn toàn có thể kiểm soát và giảm thiểu nó. Hãy thử áp dụng những cách trên và tìm ra phương pháp phù hợp nhất với bản thân. Quan trọng nhất là luôn chăm sóc sức khỏe tâm thần của mình.</p>',
'Căng thẳng là vấn đề phổ biến của sinh viên. Bài viết này chia sẻ 10 cách giảm căng thẳng hiệu quả, từ quản lý thời gian đến tìm kiếm sự hỗ trợ chuyên nghiệp.',
7, 'published', '/uploads/blog/featured/student-stress.jpg', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),

('Thiền định cho người mới bắt đầu: Hướng dẫn từ A-Z', 'thien-dinh-cho-nguoi-moi-bat-dau-huong-dan-tu-a-z',
'<p>Thiền định là một phương pháp cổ xưa giúp tâm trí thư giãn, giảm căng thẳng và cải thiện sức khỏe tâm thần. Nếu bạn là người mới bắt đầu, bài viết này sẽ hướng dẫn bạn từng bước cơ bản nhất.</p>

<p><strong>Thiền định là gì?</strong></p>
<p>Thiền định là việc tập trung sự chú ý vào một điểm cụ thể, thường là hơi thở, để đạt được trạng thái tĩnh lặng và nhận thức rõ ràng. Đây không phải là việc "không suy nghĩ gì" mà là quan sát suy nghĩ một cách khách quan.</p>

<p><strong>Lợi ích của thiền định</strong></p>
<ul>
<li>Giảm căng thẳng và lo âu</li>
<li>Cải thiện khả năng tập trung</li>
<li>Tăng cường sức khỏe tâm thần</li>
<li>Cải thiện giấc ngủ</li>
<li>Tăng cường hệ miễn dịch</li>
<li>Phát triển lòng từ bi và sự kiên nhẫn</li>
</ul>

<p><strong>Hướng dẫn thiền định cơ bản</strong></p>

<p><strong>Bước 1: Tìm không gian yên tĩnh</strong></p>
<p>Chọn một nơi yên tĩnh, thoải mái và ít bị gián đoạn. Có thể là:</p>
<ul>
<li>Phòng ngủ của bạn</li>
<li>Một góc yên tĩnh trong nhà</li>
<li>Công viên gần nhà</li>
<li>Phòng thiền định (nếu có)</li>
</ul>

<p><strong>Bước 2: Tư thế ngồi thoải mái</strong></p>
<p>Bạn có thể ngồi theo nhiều cách:</p>
<ul>
<li><strong>Ngồi trên ghế:</strong> Lưng thẳng, chân đặt trên sàn, tay đặt trên đùi</li>
<li><strong>Ngồi xếp bằng:</strong> Chân bắt chéo, lưng thẳng</li>
<li><strong>Ngồi kiết già:</strong> Chân xếp chéo, bàn chân đặt trên đùi đối diện</li>
<li><strong>Nằm:</strong> Nếu ngồi khó khăn, có thể nằm ngửa</li>
</ul>

<p><strong>Bước 3: Thư giãn cơ thể</strong></p>
<p>Nhắm mắt và thư giãn từng bộ phận cơ thể:</p>
<ul>
<li>Bắt đầu từ đỉnh đầu</li>
<li>Thư giãn trán, mắt, má</li>
<li>Thư giãn vai, cánh tay</li>
<li>Thư giãn ngực, bụng</li>
<li>Thư giãn chân, bàn chân</li>
</ul>

<p><strong>Bước 4: Tập trung vào hơi thở</strong></p>
<p>Đây là bước quan trọng nhất:</p>
<ul>
<li>Hít thở tự nhiên, không cố gắng thay đổi</li>
<li>Chú ý đến cảm giác hơi thở ở mũi</li>
<li>Đếm hơi thở: hít vào (1), thở ra (2), hít vào (3)...</li>
<li>Khi tâm trí lang thang, nhẹ nhàng quay lại hơi thở</li>
</ul>

<p><strong>Bước 5: Quan sát suy nghĩ</strong></p>
<p>Khi suy nghĩ xuất hiện:</p>
<ul>
<li>Đừng cố gắng đẩy chúng đi</li>
<li>Quan sát chúng như những đám mây trôi qua</li>
<li>Nhẹ nhàng quay lại hơi thở</li>
<li>Đừng phán xét bản thân</li>
</ul>

<p><strong>Thời gian thiền định</strong></p>
<p>Bắt đầu với thời gian ngắn:</p>
<ul>
<li>5-10 phút mỗi ngày</li>
<li>Tăng dần lên 15-20 phút</li>
<li>Thiền vào cùng một thời điểm mỗi ngày</li>
<li>Thiền buổi sáng hoặc tối</li>
</ul>

<p><strong>Các kỹ thuật thiền định khác</strong></p>

<p><strong>1. Thiền quán hơi thở</strong></p>
<p>Tập trung hoàn toàn vào hơi thở, cảm nhận từng hơi thở vào và ra.</p>

<p><strong>2. Thiền quán cơ thể</strong></p>
<p>Quét qua toàn bộ cơ thể, chú ý đến cảm giác ở từng bộ phận.</p>

<p><strong>3. Thiền từ bi</strong></p>
<p>Gửi lời chúc tốt lành đến bản thân và người khác.</p>

<p><strong>4. Thiền đi bộ</strong></p>
<p>Thiền trong khi đi bộ chậm, chú ý đến từng bước chân.</p>

<p><strong>Những khó khăn thường gặp</strong></p>

<p><strong>1. Tâm trí lang thang</strong></p>
<p>Đây là điều bình thường. Hãy nhẹ nhàng quay lại hơi thở.</p>

<p><strong>2. Cảm thấy buồn ngủ</strong></p>
<p>Thiền vào buổi sáng hoặc ngồi thẳng lưng hơn.</p>

<p><strong>3. Cảm thấy bồn chồn</strong></p>
<p>Bắt đầu với thời gian ngắn hơn, tăng dần theo thời gian.</p>

<p><strong>4. Không thấy kết quả ngay</strong></p>
<p>Thiền định cần thời gian. Hãy kiên trì thực hành.</p>

<p><strong>Mẹo để thiền định hiệu quả</strong></p>
<ul>
<li>Tạo thói quen thiền định hàng ngày</li>
<li>Sử dụng ứng dụng thiền định</li>
<li>Tham gia nhóm thiền định</li>
<li>Đọc sách về thiền định</li>
<li>Không kỳ vọng quá cao</li>
<li>Kiên nhẫn với bản thân</li>
</ul>

<p><strong>Kết luận</strong></p>
<p>Thiền định là một công cụ mạnh mẽ để cải thiện sức khỏe tâm thần và chất lượng cuộc sống. Hãy bắt đầu với những bước đơn giản và kiên trì thực hành. Chỉ cần 10 phút mỗi ngày, bạn sẽ thấy sự khác biệt rõ rệt trong cuộc sống.</p>

<p>Nếu bạn cần hỗ trợ thêm về thiền định hoặc các vấn đề sức khỏe tâm thần, đừng ngần ngại liên hệ với các chuyên gia tại MindMeter.</p>',
'Thiền định là phương pháp cổ xưa giúp cải thiện sức khỏe tâm thần. Bài viết hướng dẫn chi tiết cách thiền định cho người mới bắt đầu, từ tư thế ngồi đến các kỹ thuật cơ bản.',
8, 'published', '/uploads/blog/featured/meditation-guide.jpg', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Insert sample blog post categories
INSERT INTO blog_post_categories (post_id, category_id) VALUES
(1, 2), -- Trầm cảm
(1, 1), -- Sức khỏe tâm thần
(2, 3), -- Lo âu
(2, 1), -- Sức khỏe tâm thần
(3, 4), -- Tự chăm sóc
(3, 1); -- Sức khỏe tâm thần

-- Insert sample blog post tags
INSERT INTO blog_post_tags (post_id, tag_id) VALUES
(1, 1), -- trầm cảm
(1, 4), -- tự chăm sóc
(1, 5), -- thiền định
(2, 2), -- lo âu
(2, 3), -- căng thẳng
(2, 7), -- tập thể dục
(3, 5), -- thiền định
(3, 4), -- tự chăm sóc
(3, 6); -- yoga

-- Insert sample blog likes
INSERT INTO blog_likes (post_id, user_id) VALUES
(1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
(2, 6), (2, 7), (2, 8),
(3, 6), (3, 7), (3, 8), (3, 9);

-- Insert sample blog comments
INSERT INTO blog_comments (post_id, user_id, content, status, created_at, updated_at) VALUES
(1, 7, 'Bài viết rất hữu ích! Tôi đã áp dụng một số phương pháp và thấy cải thiện rõ rệt.', 'approved', '2025-10-06 01:00:00', '2025-10-06 01:00:00'),
(1, 8, 'Cảm ơn tác giả đã chia sẻ. Tôi cũng đang trong quá trình phục hồi từ trầm cảm.', 'approved', '2025-10-06 01:30:00', '2025-10-06 01:30:00'),
(2, 6, 'Là sinh viên, tôi thấy những lời khuyên này rất thực tế và dễ áp dụng.', 'approved', '2025-10-06 02:00:00', '2025-10-06 02:00:00'),
(2, 9, 'Quản lý thời gian là vấn đề lớn nhất của tôi. Cảm ơn vì đã chia sẻ!', 'approved', '2025-10-06 02:30:00', '2025-10-06 02:30:00'),
(3, 7, 'Tôi mới bắt đầu thiền định được 1 tuần. Cảm thấy tâm trí thư thái hơn nhiều.', 'approved', '2025-10-06 03:00:00', '2025-10-06 03:00:00'),
(3, 8, 'Hướng dẫn rất chi tiết và dễ hiểu. Cảm ơn tác giả!', 'approved', '2025-10-06 03:30:00', '2025-10-06 03:30:00');

-- Fix existing comments with wrong timestamps
UPDATE blog_comments SET created_at = '2025-10-06 02:00:00', updated_at = '2025-10-06 02:00:00' WHERE id = 3 AND post_id = 2;
UPDATE blog_comments SET created_at = '2025-10-06 02:30:00', updated_at = '2025-10-06 02:30:00' WHERE id = 4 AND post_id = 2;

-- Insert sample blog shares
INSERT INTO blog_shares (post_id, user_id, platform) VALUES
(1, 6, 'facebook'),
(1, 7, 'twitter'),
(2, 8, 'facebook'),
(2, 9, 'linkedin'),
(3, 6, 'facebook'),
(3, 7, 'twitter');

-- Insert sample blog bookmarks
INSERT INTO blog_bookmarks (post_id, user_id) VALUES
(1, 6), (1, 7), (1, 8),
(2, 6), (2, 7),
(3, 6), (3, 7), (3, 8), (3, 9);

-- Update like counts and comment counts
-- Tắt Safe Update Mode để có thể UPDATE mà không cần WHERE clause
SET SQL_SAFE_UPDATES = 0;

UPDATE blog_posts SET 
    like_count = (SELECT COUNT(*) FROM blog_likes WHERE post_id = blog_posts.id),
    comment_count = (SELECT COUNT(*) FROM blog_comments WHERE post_id = blog_posts.id AND status = 'approved'),
    share_count = (SELECT COUNT(*) FROM blog_shares WHERE post_id = blog_posts.id);

-- Bật lại Safe Update Mode
SET SQL_SAFE_UPDATES = 1;

-- ========================================
-- BLOG SYSTEM COMPLETE
-- ========================================


-- ========================================
-- DATABASE OPTIMIZATION - MySQL Indexing
-- ========================================
-- Tối ưu hóa database với các index cho hiệu suất tốt hơn

-- ========================================
-- 1. USERS TABLE OPTIMIZATION
-- ========================================

-- Index cho email lookups (authentication)
CREATE INDEX idx_users_email ON users(email);

-- Index cho role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Index cho status checks
CREATE INDEX idx_users_status ON users(status);

-- Index cho anonymous user queries
CREATE INDEX idx_users_anonymous ON users(anonymous);

-- Index cho plan-based queries
CREATE INDEX idx_users_plan ON users(plan);

-- Composite index cho plan expiry checks
CREATE INDEX idx_users_plan_expiry ON users(plan, plan_expiry_date);

-- Index cho created_at (reporting queries)
CREATE INDEX idx_users_created_at ON users(created_at);

-- Composite index cho active users by role
CREATE INDEX idx_users_role_status ON users(role, status);

-- ========================================
-- 2. DEPRESSION TEST RESULTS OPTIMIZATION
-- ========================================

-- Index cho user's test history
CREATE INDEX idx_test_results_user_id ON depression_test_results(user_id);

-- Index cho severity level filtering
CREATE INDEX idx_test_results_severity ON depression_test_results(severity_level);

-- Index cho test date queries
CREATE INDEX idx_test_results_tested_at ON depression_test_results(tested_at);

-- Composite index cho user's tests by date
CREATE INDEX idx_test_results_user_date ON depression_test_results(user_id, tested_at);

-- Composite index cho severity statistics
CREATE INDEX idx_test_results_severity_date ON depression_test_results(severity_level, tested_at);

-- Index cho test type filtering
CREATE INDEX idx_test_results_test_type ON depression_test_results(test_type);

-- Composite index cho admin dashboard queries
CREATE INDEX idx_test_results_user_severity_date ON depression_test_results(user_id, severity_level, tested_at);

-- ========================================
-- 3. DEPRESSION TEST ANSWERS OPTIMIZATION
-- ========================================

-- Index cho test result answers
CREATE INDEX idx_test_answers_result_id ON depression_test_answers(test_result_id);

-- Index cho question-based queries
CREATE INDEX idx_test_answers_question_id ON depression_test_answers(question_id);

-- Composite index cho answer analysis
CREATE INDEX idx_test_answers_result_question ON depression_test_answers(test_result_id, question_id);

-- Index cho answer value analysis
CREATE INDEX idx_test_answers_value ON depression_test_answers(answer_value);

-- ========================================
-- 4. DEPRESSION QUESTIONS OPTIMIZATION
-- ========================================

-- Index cho active questions (Vietnamese)
CREATE INDEX idx_questions_vi_active ON depression_questions_vi(is_active);

-- Index cho question ordering (Vietnamese)
CREATE INDEX idx_questions_vi_order ON depression_questions_vi(`order`);

-- Index cho test key filtering (Vietnamese)
CREATE INDEX idx_questions_vi_test_key ON depression_questions_vi(test_key);

-- Composite index cho active questions by test type (Vietnamese)
CREATE INDEX idx_questions_vi_test_key_active ON depression_questions_vi(test_key, is_active, `order`);

-- Index cho active questions (English)
CREATE INDEX idx_questions_en_active ON depression_questions_en(is_active);

-- Index cho question ordering (English)
CREATE INDEX idx_questions_en_order ON depression_questions_en(`order`);

-- Index cho test key filtering (English)
CREATE INDEX idx_questions_en_test_key ON depression_questions_en(test_key);

-- Composite index cho active questions by test type (English)
CREATE INDEX idx_questions_en_test_key_active ON depression_questions_en(test_key, is_active, `order`);

-- ========================================
-- 5. EXPERT NOTES OPTIMIZATION
-- ========================================

-- Index cho expert's notes
CREATE INDEX idx_expert_notes_expert_id ON expert_notes(expert_id);

-- Index cho student's notes
CREATE INDEX idx_expert_notes_student_id ON expert_notes(student_id);

-- Index cho test result notes
CREATE INDEX idx_expert_notes_test_result_id ON expert_notes(test_result_id);

-- Index cho note type filtering
CREATE INDEX idx_expert_notes_type ON expert_notes(note_type);

-- Index cho date-based queries
CREATE INDEX idx_expert_notes_created_at ON expert_notes(created_at);

-- Composite index cho expert-student relationship
CREATE INDEX idx_expert_notes_expert_student ON expert_notes(expert_id, student_id);

-- Composite index cho expert's notes by date
CREATE INDEX idx_expert_notes_expert_date ON expert_notes(expert_id, created_at);

-- ========================================
-- 6. ADVICE MESSAGES OPTIMIZATION
-- ========================================

-- Index cho sender's messages
CREATE INDEX idx_advice_sender_id ON advice_messages(sender_id);

-- Index cho receiver's messages
CREATE INDEX idx_advice_receiver_id ON advice_messages(receiver_id);

-- Index cho message type filtering
CREATE INDEX idx_advice_message_type ON advice_messages(message_type);

-- Index cho read status
CREATE INDEX idx_advice_is_read ON advice_messages(is_read);

-- Index cho sent date
CREATE INDEX idx_advice_sent_at ON advice_messages(sent_at);

-- Composite index cho unread messages
CREATE INDEX idx_advice_receiver_unread ON advice_messages(receiver_id, is_read);

-- Composite index cho conversation queries
CREATE INDEX idx_advice_sender_receiver ON advice_messages(sender_id, receiver_id, sent_at);

-- ========================================
-- 7. SYSTEM ANNOUNCEMENTS OPTIMIZATION
-- ========================================

-- Index cho active announcements
CREATE INDEX idx_announcements_active ON system_announcements(is_active);

-- Index cho announcement type
CREATE INDEX idx_announcements_type ON system_announcements(announcement_type);

-- Index cho creation date
CREATE INDEX idx_announcements_created_at ON system_announcements(created_at);

-- Composite index cho active announcements by type
CREATE INDEX idx_announcements_active_type ON system_announcements(is_active, announcement_type, created_at);

-- ========================================
-- 8. APPOINTMENTS OPTIMIZATION (Additional indexes)
-- ========================================

-- Composite indexes for better performance
CREATE INDEX idx_appointments_student_status ON appointments(student_id, status);
CREATE INDEX idx_appointments_expert_status ON appointments(expert_id, status);
CREATE INDEX idx_appointments_date_status ON appointments(appointment_date, status);
CREATE INDEX idx_appointments_expert_date ON appointments(expert_id, appointment_date);
CREATE INDEX idx_appointments_student_date ON appointments(student_id, appointment_date);

-- Index cho consultation type
CREATE INDEX idx_appointments_consultation_type ON appointments(consultation_type);

-- Composite index cho dashboard queries
CREATE INDEX idx_appointments_expert_date_status ON appointments(expert_id, appointment_date, status);

-- ========================================
-- 9. EXPERT SCHEDULES OPTIMIZATION (Additional indexes)
-- ========================================

-- Index cho availability queries
CREATE INDEX idx_expert_schedules_available ON expert_schedules(is_available);

-- Composite index cho schedule lookup
CREATE INDEX idx_expert_schedules_expert_available ON expert_schedules(expert_id, is_available);

-- ========================================
-- 10. EXPERT BREAKS OPTIMIZATION (Additional indexes)
-- ========================================

-- Composite index cho break checking
CREATE INDEX idx_expert_breaks_expert_date_time ON expert_breaks(expert_id, break_date, start_time, end_time);

-- Index cho recurring breaks
CREATE INDEX idx_expert_breaks_recurring ON expert_breaks(is_recurring);

-- ========================================
-- 11. APPOINTMENT HISTORY OPTIMIZATION (Additional indexes)
-- ========================================

-- Index cho action tracking
CREATE INDEX idx_appointment_history_action ON appointment_history(action);

-- Composite index cho audit queries
CREATE INDEX idx_appointment_history_appointment_action ON appointment_history(appointment_id, action, changed_at);

-- ========================================
-- 12. APPOINTMENT NOTIFICATIONS OPTIMIZATION (Additional indexes)
-- ========================================

-- Composite indexes
CREATE INDEX idx_appointment_notifications_user_unread ON appointment_notifications(user_id, is_read);
CREATE INDEX idx_appointment_notifications_user_unsent ON appointment_notifications(user_id, is_sent);
CREATE INDEX idx_appointment_notifications_type_sent ON appointment_notifications(notification_type, is_sent);

-- ========================================
-- 13. DEPRESSION QUESTION OPTIONS OPTIMIZATION
-- ========================================

-- Index cho question options (Vietnamese)
CREATE INDEX idx_question_options_vi_question_id ON depression_question_options_vi(question_id);
CREATE INDEX idx_question_options_vi_order ON depression_question_options_vi(`order`);
CREATE INDEX idx_question_options_vi_question_order ON depression_question_options_vi(question_id, `order`);

-- Index cho question options (English)
CREATE INDEX idx_question_options_en_question_id ON depression_question_options_en(question_id);
CREATE INDEX idx_question_options_en_order ON depression_question_options_en(`order`);
CREATE INDEX idx_question_options_en_question_order ON depression_question_options_en(question_id, `order`);

-- ========================================
-- 14. ADVANCED PERFORMANCE OPTIMIZATION
-- ========================================

-- Advanced Performance Indexes for Critical Queries
CREATE INDEX idx_test_results_user_date ON depression_test_results(user_id, created_at);
CREATE INDEX idx_test_results_test_type ON depression_test_results(test_type, created_at);
CREATE INDEX idx_test_results_score_range ON depression_test_results(score_range, created_at);

-- Appointments Performance Optimization
CREATE INDEX idx_appointments_expert_date ON appointments(expert_id, appointment_date);
CREATE INDEX idx_appointments_student_date ON appointments(student_id, appointment_date);
CREATE INDEX idx_appointments_status_date ON appointments(status, appointment_date);
CREATE INDEX idx_appointments_created_at ON appointments(created_at);

-- Blog Posts Performance Optimization
CREATE INDEX idx_blog_posts_category_status ON blog_posts(category_id, status, created_at);
CREATE INDEX idx_blog_posts_author_date ON blog_posts(author_id, created_at);
CREATE INDEX idx_blog_posts_featured_date ON blog_posts(featured, created_at);
CREATE INDEX idx_blog_posts_views ON blog_posts(view_count DESC);

-- User Activity Performance Optimization
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_plan_expiry ON users(plan, plan_expiry_date);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Expert Schedule Performance Optimization
CREATE INDEX idx_expert_schedules_expert_date ON expert_schedules(expert_id, schedule_date);
CREATE INDEX idx_expert_schedules_available ON expert_schedules(is_available, schedule_date);

-- Chat Messages Performance Optimization
CREATE INDEX idx_chat_messages_user_date ON chat_messages(user_id, created_at);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);

-- ========================================
-- 15. TABLE PARTITIONING FOR LARGE TABLES
-- ========================================

-- Partition depression_test_results by year for better performance
ALTER TABLE depression_test_results 
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Partition chat_messages by month for high volume data
ALTER TABLE chat_messages 
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    PARTITION p202403 VALUES LESS THAN (202404),
    PARTITION p202404 VALUES LESS THAN (202405),
    PARTITION p202405 VALUES LESS THAN (202406),
    PARTITION p202406 VALUES LESS THAN (202407),
    PARTITION p202407 VALUES LESS THAN (202408),
    PARTITION p202408 VALUES LESS THAN (202409),
    PARTITION p202409 VALUES LESS THAN (202410),
    PARTITION p202410 VALUES LESS THAN (202411),
    PARTITION p202411 VALUES LESS THAN (202412),
    PARTITION p202412 VALUES LESS THAN (202501),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ========================================
-- 16. PERFORMANCE MONITORING VIEWS
-- ========================================

-- User Statistics View
CREATE VIEW user_statistics AS
SELECT 
    role,
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_users,
    COUNT(CASE WHEN plan = 'FREE' THEN 1 END) as free_users,
    COUNT(CASE WHEN plan = 'PLUS' THEN 1 END) as plus_users,
    COUNT(CASE WHEN plan = 'PRO' THEN 1 END) as pro_users,
    AVG(DATEDIFF(NOW(), created_at)) as avg_account_age_days
FROM users 
GROUP BY role;

-- Test Statistics View
CREATE VIEW test_statistics AS
SELECT 
    test_type,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN score_range = 'NORMAL' THEN 1 END) as normal_count,
    COUNT(CASE WHEN score_range = 'MILD' THEN 1 END) as mild_count,
    COUNT(CASE WHEN score_range = 'MODERATE' THEN 1 END) as moderate_count,
    COUNT(CASE WHEN score_range = 'SEVERE' THEN 1 END) as severe_count,
    COUNT(CASE WHEN score_range = 'EXTREMELY_SEVERE' THEN 1 END) as extremely_severe_count,
    AVG(total_score) as avg_score,
    DATE(created_at) as test_date
FROM depression_test_results 
GROUP BY test_type, DATE(created_at);

-- Expert Performance View
CREATE VIEW expert_performance AS
SELECT 
    e.id as expert_id,
    e.first_name,
    e.last_name,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.id END) as completed_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'CANCELLED' THEN a.id END) as cancelled_appointments,
    AVG(CASE WHEN a.status = 'COMPLETED' THEN a.rating END) as avg_rating,
    COUNT(DISTINCT CASE WHEN a.appointment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN a.id END) as appointments_last_30_days
FROM users e
LEFT JOIN appointments a ON e.id = a.expert_id
WHERE e.role = 'EXPERT'
GROUP BY e.id, e.first_name, e.last_name;

-- ========================================
-- 17. PERFORMANCE MONITORING QUERIES
-- ========================================

-- Table Size Analysis
SELECT 
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb,
    ROUND((data_length / 1024 / 1024), 2) as data_mb,
    ROUND((index_length / 1024 / 1024), 2) as index_mb
FROM information_schema.tables 
WHERE table_schema = 'mindmeter'
ORDER BY (data_length + index_length) DESC;

-- Index Usage Statistics
SELECT 
    t.table_name,
    s.index_name,
    s.seq_in_index,
    s.column_name,
    s.cardinality,
    CASE WHEN s.non_unique = 0 THEN 'UNIQUE' ELSE 'NON-UNIQUE' END as index_type
FROM information_schema.statistics s
JOIN information_schema.tables t ON s.table_name = t.table_name
WHERE t.table_schema = 'mindmeter'
ORDER BY t.table_name, s.index_name, s.seq_in_index;

-- ========================================
-- 18. MAINTENANCE PROCEDURES
-- ========================================

-- Procedure to analyze and optimize tables
DELIMITER //
CREATE PROCEDURE OptimizeTables()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE table_name VARCHAR(255);
    DECLARE table_cursor CURSOR FOR 
        SELECT TABLE_NAME FROM information_schema.tables 
        WHERE table_schema = 'mindmeter' AND table_type = 'BASE TABLE';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN table_cursor;
    
    read_loop: LOOP
        FETCH table_cursor INTO table_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET @sql = CONCAT('OPTIMIZE TABLE ', table_name);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        
    END LOOP;
    
    CLOSE table_cursor;
END //
DELIMITER ;

-- ========================================
-- 19. PERFORMANCE TESTING QUERIES
-- ========================================

-- Test query performance with EXPLAIN
EXPLAIN SELECT 
    u.first_name,
    u.last_name,
    dtr.test_type,
    dtr.total_score,
    dtr.score_range,
    dtr.created_at
FROM users u
JOIN depression_test_results dtr ON u.id = dtr.user_id
WHERE u.role = 'STUDENT'
    AND dtr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY dtr.created_at DESC
LIMIT 100;

-- Test appointment query performance with EXPLAIN
EXPLAIN SELECT 
    a.id,
    a.appointment_date,
    a.status,
    u1.first_name as expert_name,
    u2.first_name as student_name
FROM appointments a
JOIN users u1 ON a.expert_id = u1.id
JOIN users u2 ON a.student_id = u2.id
WHERE a.appointment_date >= CURDATE()
    AND a.status IN ('CONFIRMED', 'PENDING')
ORDER BY a.appointment_date ASC;

-- ========================================
-- OPTIMIZATION SUMMARY
-- ========================================

SELECT 'MindMeter Database Advanced Performance Optimization Complete!' as status;
SELECT 'All performance indexes, partitioning, and monitoring features added' as info;

-- ========================================
-- FINAL RESULTS DISPLAY
-- ========================================
-- Hiển thị kết quả sau khi tối ưu hóa database

-- 1. Hiển thị tổng số indexes đã tạo
SELECT 
    'Database Optimization Summary' as section,
    COUNT(*) as total_indexes,
    'indexes created' as description
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'mindmeter' AND INDEX_NAME != 'PRIMARY';

-- 2. Hiển thị danh sách tất cả indexes theo bảng
SELECT 
    'Indexes by Table' as section,
    TABLE_NAME as table_name,
    COUNT(*) as index_count,
    GROUP_CONCAT(INDEX_NAME ORDER BY INDEX_NAME SEPARATOR ', ') as index_names
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'mindmeter' AND INDEX_NAME != 'PRIMARY'
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;

-- 3. Hiển thị danh sách người dùng theo role
SELECT 
    'Users by Role' as section,
    role as user_role,
    COUNT(*) as user_count,
    GROUP_CONCAT(
        CONCAT(first_name, ' ', last_name, ' (', email, ')') 
        ORDER BY first_name, last_name 
        SEPARATOR '; '
    ) as user_details
FROM users 
GROUP BY role 
ORDER BY 
    CASE role 
        WHEN 'ADMIN' THEN 1 
        WHEN 'EXPERT' THEN 2 
        WHEN 'STUDENT' THEN 3 
    END;

-- 4. Hiển thị chi tiết từng người dùng
SELECT 
    'Detailed User List' as section,
    id as user_id,
    CONCAT(first_name, ' ', last_name) as full_name,
    email,
    role,
    status,
    plan,
    CASE 
        WHEN plan = 'FREE' THEN 'Không giới hạn'
        WHEN plan_expiry_date IS NULL THEN 'Chưa set'
        WHEN NOW() > plan_expiry_date THEN 'Đã hết hạn'
        ELSE CONCAT(DATEDIFF(plan_expiry_date, NOW()), ' ngày còn lại')
    END as plan_status,
    created_at,
    anonymous
FROM users 
ORDER BY 
    CASE role 
        WHEN 'ADMIN' THEN 1 
        WHEN 'EXPERT' THEN 2 
        WHEN 'STUDENT' THEN 3 
    END,
    first_name, last_name;

-- 5. Hiển thị thống kê test results
SELECT 
    'Test Results Statistics' as section,
    COUNT(*) as total_tests,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(total_score) as average_score,
    severity_level,
    COUNT(*) as test_count
FROM depression_test_results 
GROUP BY severity_level 
ORDER BY 
    CASE severity_level 
        WHEN 'MINIMAL' THEN 1 
        WHEN 'MILD' THEN 2 
        WHEN 'MODERATE' THEN 3 
        WHEN 'SEVERE' THEN 4 
    END;

-- 6. Hiển thị thống kê appointments
SELECT 
    'Appointment Statistics' as section,
    status as appointment_status,
    COUNT(*) as appointment_count,
    consultation_type,
    COUNT(*) as type_count
FROM appointments 
GROUP BY status, consultation_type 
ORDER BY status, consultation_type;

-- 7. Hiển thị thống kê expert notes
SELECT 
    'Expert Notes Statistics' as section,
    note_type,
    COUNT(*) as note_count,
    COUNT(DISTINCT expert_id) as unique_experts,
    COUNT(DISTINCT student_id) as unique_students
FROM expert_notes 
GROUP BY note_type 
ORDER BY note_count DESC;

-- 8. Hiển thị thống kê advice messages
SELECT 
    'Advice Messages Statistics' as section,
    message_type,
    COUNT(*) as message_count,
    SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_count,
    SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END) as unread_count
FROM advice_messages 
GROUP BY message_type 
ORDER BY message_count DESC;

-- 9. Hiển thị thống kê system announcements
SELECT 
    'System Announcements Statistics' as section,
    announcement_type,
    COUNT(*) as announcement_count,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count,
    SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) as inactive_count
FROM system_announcements 
GROUP BY announcement_type 
ORDER BY announcement_count DESC;

-- 10. Hiển thị tổng kết cuối cùng
SELECT 
    'Final Summary' as section,
    'MindMeter Database Optimization Complete!' as status,
    'All indexes created successfully' as details,
    NOW() as completion_time;
