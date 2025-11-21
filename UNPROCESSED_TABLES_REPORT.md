# Báo Cáo Các Bảng Database Chưa Được Xử Lý

## Tổng Quan

Báo cáo này liệt kê các bảng trong database `mindmeter` chưa được xử lý đầy đủ qua backend và frontend.

**Ngày tạo:** 2025-11-20  
**Tổng số bảng trong database:** 29  
**Số bảng chưa được xử lý:** Xem chi tiết bên dưới

---

## 1. Bảng Chưa Có Entity (Backend)

### 1.1. `appointment_notifications`
- **Mô tả:** Bảng lưu thông báo cho các lịch hẹn
- **Trạng thái:** ❌ Chưa có Entity
- **Trạng thái Repository:** ❌ Chưa có Repository
- **Trạng thái Service/Controller:** ❌ Chưa có
- **Trạng thái Frontend:** ❌ Chưa có

**Cấu trúc bảng:**
```sql
CREATE TABLE appointment_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    appointment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    notification_type ENUM('REMINDER', 'CONFIRMATION', 'CANCELLATION', 'RESCHEDULE', 'COMPLETION') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ...
);
```

**Gợi ý triển khai:**
- Tạo Entity `AppointmentNotification`
- Tạo Repository `AppointmentNotificationRepository`
- Tạo Service `AppointmentNotificationService`
- Tạo Controller `AppointmentNotificationController` (cho admin và user)
- Tạo frontend service và components để hiển thị thông báo

---

## 2. Bảng Có Entity Nhưng Chưa Có Service/Controller Đầy Đủ

### 2.1. `blog_reports`
- **Mô tả:** Bảng lưu các báo cáo về bài viết blog không phù hợp
- **Trạng thái Entity:** ✅ Có (`BlogReport.java`)
- **Trạng thái Repository:** ✅ Có (`BlogReportRepository.java`)
- **Trạng thái Service:** ⚠️ Có nhưng chưa implement (commented out trong `BlogService.java`)
- **Trạng thái Controller:** ⚠️ Có endpoint nhưng chưa implement (trong `AdminBlogController.java`)
- **Trạng thái Frontend:** ❌ Chưa có

**Chi tiết:**
- Entity: `backend/src/main/java/com/shop/backend/model/BlogReport.java` ✅
- Repository: `backend/src/main/java/com/shop/backend/repository/BlogReportRepository.java` ✅
- Service: Trong `BlogService.java`, dòng 61 có comment: `// private BlogReportRepository blogReportRepository; // Not used yet` ⚠️
- Controller: Trong `AdminBlogController.java` có các endpoint nhưng chưa implement:
  - `GET /api/admin/blog/reports` - Chưa implement
  - `GET /api/admin/blog/reports/pending` - Chưa implement
  - `PUT /api/admin/blog/reports/{id}/review` - Chưa implement
- Frontend: Chưa có service hoặc component để:
  - Báo cáo bài viết (user)
  - Xem danh sách báo cáo (admin)
  - Xử lý báo cáo (admin)

**Gợi ý triển khai:**
1. **Backend:**
   - Uncomment và implement các method trong `BlogService`:
     - `createReport(BlogReportRequest request)`
     - `getAllReportsForAdmin(ReportStatus status, Pageable pageable)`
     - `getPendingReports(Pageable pageable)`
     - `reviewReport(Long id, ReportStatus status, String adminNotes)`
   - Implement các endpoint trong `AdminBlogController`
   - Tạo endpoint public `POST /api/blog/posts/{id}/report` để user báo cáo bài viết

2. **Frontend:**
   - Tạo service `blogReportService.js` với các method:
     - `reportPost(postId, reason, description)`
     - `getMyReports()`
   - Tạo component `ReportPostModal.js` để user báo cáo bài viết
   - Tạo page `AdminBlogReportsPage.js` để admin xem và xử lý báo cáo
   - Thêm nút "Báo cáo" vào `BlogPostDetailPage.js`

---

## 3. Bảng Có Entity và Repository Nhưng Chưa Có Frontend

### 3.1. `blog_likes`
- **Mô tả:** Bảng lưu lượt thích bài viết blog
- **Trạng thái Entity:** ✅ Có (`BlogLike.java`)
- **Trạng thái Repository:** ✅ Có (`BlogLikeRepository.java`)
- **Trạng thái Service:** ⚠️ Cần kiểm tra
- **Trạng thái Controller:** ⚠️ Cần kiểm tra
- **Trạng thái Frontend:** ❌ Chưa có UI để like/unlike

**Gợi ý triển khai:**
- Tạo endpoint `POST /api/blog/posts/{id}/like` và `DELETE /api/blog/posts/{id}/like`
- Tạo frontend service method `likePost(postId)` và `unlikePost(postId)`
- Thêm nút like vào `BlogPostCard.js` và `BlogPostDetailPage.js`

### 3.2. `blog_bookmarks`
- **Mô tả:** Bảng lưu bookmark bài viết blog
- **Trạng thái Entity:** ✅ Có (`BlogBookmark.java`)
- **Trạng thái Repository:** ✅ Có (`BlogBookmarkRepository.java`)
- **Trạng thái Service:** ⚠️ Cần kiểm tra
- **Trạng thái Controller:** ⚠️ Cần kiểm tra
- **Trạng thái Frontend:** ❌ Chưa có UI để bookmark

**Gợi ý triển khai:**
- Tạo endpoint `POST /api/blog/posts/{id}/bookmark` và `DELETE /api/blog/posts/{id}/bookmark`
- Tạo frontend service method `bookmarkPost(postId)` và `unbookmarkPost(postId)`
- Thêm nút bookmark vào `BlogPostCard.js` và `BlogPostDetailPage.js`
- Tạo page `MyBookmarksPage.js` để hiển thị các bài viết đã bookmark

### 3.3. `blog_shares`
- **Mô tả:** Bảng lưu lượt chia sẻ bài viết blog
- **Trạng thái Entity:** ✅ Có (`BlogShare.java`)
- **Trạng thái Repository:** ✅ Có (`BlogShareRepository.java`)
- **Trạng thái Service:** ⚠️ Cần kiểm tra
- **Trạng thái Controller:** ⚠️ Cần kiểm tra
- **Trạng thái Frontend:** ❌ Chưa có UI để share

**Gợi ý triển khai:**
- Tạo endpoint `POST /api/blog/posts/{id}/share`
- Tạo frontend service method `sharePost(postId, platform)`
- Thêm nút share vào `BlogPostCard.js` và `BlogPostDetailPage.js`
- Tích hợp với các nền tảng: Facebook, Twitter, LinkedIn, Copy link

### 3.4. `blog_post_views`
- **Mô tả:** Bảng lưu lượt xem bài viết blog
- **Trạng thái Entity:** ✅ Có (`BlogPostView.java`)
- **Trạng thái Repository:** ✅ Có (`BlogPostViewRepository.java`)
- **Trạng thái Service:** ⚠️ Cần kiểm tra
- **Trạng thái Controller:** ⚠️ Cần kiểm tra
- **Trạng thái Frontend:** ❌ Chưa có logic để track views

**Gợi ý triển khai:**
- Tạo endpoint `POST /api/blog/posts/{id}/view` (tự động gọi khi user xem bài viết)
- Tích hợp vào `BlogPostDetailPage.js` để tự động track view khi component mount

### 3.5. `blog_comment_likes`
- **Mô tả:** Bảng lưu lượt thích comment
- **Trạng thái Entity:** ✅ Có (`BlogCommentLike.java`)
- **Trạng thái Repository:** ✅ Có (`BlogCommentLikeRepository.java`)
- **Trạng thái Service:** ⚠️ Cần kiểm tra
- **Trạng thái Controller:** ⚠️ Cần kiểm tra
- **Trạng thái Frontend:** ❌ Chưa có UI để like comment

**Gợi ý triển khai:**
- Tạo endpoint `POST /api/blog/comments/{id}/like` và `DELETE /api/blog/comments/{id}/like`
- Tạo frontend service method `likeComment(commentId)` và `unlikeComment(commentId)`
- Thêm nút like vào `BlogComment.js` component

---

## 4. Tổng Kết

### Bảng Hoàn Toàn Chưa Được Xử Lý (0 Entity, 0 Repository, 0 Service/Controller, 0 Frontend)
1. ❌ `appointment_notifications`

### Bảng Có Entity/Repository Nhưng Chưa Có Service/Controller Đầy Đủ
1. ⚠️ `blog_reports` - Có Entity và Repository, nhưng Service và Controller chưa implement

### Bảng Có Entity/Repository/Service/Controller Nhưng Chưa Có Frontend
1. ⚠️ `blog_likes` - Chưa có UI
2. ⚠️ `blog_bookmarks` - Chưa có UI
3. ⚠️ `blog_shares` - Chưa có UI
4. ⚠️ `blog_post_views` - Chưa có logic track
5. ⚠️ `blog_comment_likes` - Chưa có UI

---

## 5. Đề Xuất Ưu Tiên Triển Khai

### Priority 1 (High) - Tính Năng Quan Trọng
1. **`blog_reports`** - Cần thiết để quản lý nội dung không phù hợp
2. **`blog_likes`** - Tính năng cơ bản của blog system
3. **`blog_bookmarks`** - Tính năng hữu ích cho user

### Priority 2 (Medium) - Tính Năng Hỗ Trợ
4. **`blog_shares`** - Tăng engagement và reach
5. **`blog_post_views`** - Analytics và tracking
6. **`blog_comment_likes`** - Tăng tương tác với comments

### Priority 3 (Low) - Tính Năng Nâng Cao
7. **`appointment_notifications`** - Có thể sử dụng email service thay thế (đã có)

---

## 6. Ghi Chú

- Các bảng liên quan đến blog đã có đầy đủ Entity và Repository
- Các bảng liên quan đến appointments đã được xử lý khá đầy đủ, chỉ thiếu `appointment_notifications`
- Các bảng liên quan đến depression test đã được xử lý đầy đủ
- Các bảng liên quan đến expert management đã được xử lý đầy đủ

