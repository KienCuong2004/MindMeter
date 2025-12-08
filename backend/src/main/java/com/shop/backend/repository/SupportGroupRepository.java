package com.shop.backend.repository;

import com.shop.backend.model.SupportGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupportGroupRepository extends JpaRepository<SupportGroup, Long> {
    
    // Find active public groups
    Page<SupportGroup> findByIsActiveTrueAndIsPublicTrueOrderByCreatedAtDesc(Pageable pageable);
    
    // Find groups by category
    Page<SupportGroup> findByCategoryAndIsActiveTrueAndIsPublicTrueOrderByCreatedAtDesc(
        SupportGroup.SupportGroupCategory category, Pageable pageable);
    
    // Find groups by creator
    Page<SupportGroup> findByCreatorIdAndIsActiveTrueOrderByCreatedAtDesc(
        Long creatorId, Pageable pageable);
    
    // Search groups by name or description
    @Query("SELECT g FROM SupportGroup g WHERE " +
           "(LOWER(g.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND g.isActive = true AND g.isPublic = true")
    Page<SupportGroup> searchGroups(@Param("keyword") String keyword, Pageable pageable);
    
    // Find group by id and active status
    Optional<SupportGroup> findByIdAndIsActiveTrue(Long id);
    
    // Count active groups
    long countByIsActiveTrue();
}

