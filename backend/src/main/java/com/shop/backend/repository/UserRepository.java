package com.shop.backend.repository;

import com.shop.backend.model.User;
import com.shop.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    long countByRole(Role role);
    
    /**
     * Tìm tất cả users có plan trong danh sách và đã hết hạn
     */
    List<User> findByPlanInAndPlanExpiryDateBefore(List<String> plans, java.time.LocalDateTime expiryDate);
} 