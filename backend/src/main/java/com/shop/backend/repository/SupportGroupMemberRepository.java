package com.shop.backend.repository;

import com.shop.backend.model.SupportGroupMember;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportGroupMemberRepository extends JpaRepository<SupportGroupMember, Long> {
    
    // Find members by group
    Page<SupportGroupMember> findByGroupIdAndIsActiveTrueOrderByJoinedAtAsc(
        Long groupId, Pageable pageable);
    
    // Find groups by user
    Page<SupportGroupMember> findByUserIdAndIsActiveTrueOrderByJoinedAtDesc(
        Long userId, Pageable pageable);
    
    // Check if user is member of group
    Optional<SupportGroupMember> findByGroupIdAndUserIdAndIsActiveTrue(Long groupId, Long userId);
    
    boolean existsByGroupIdAndUserIdAndIsActiveTrue(Long groupId, Long userId);
    
    // Count active members in group
    long countByGroupIdAndIsActiveTrue(Long groupId);
    
    // Find all active members of a group
    List<SupportGroupMember> findByGroupIdAndIsActiveTrue(Long groupId);
}

