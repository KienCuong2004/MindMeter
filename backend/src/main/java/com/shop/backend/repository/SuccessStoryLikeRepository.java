package com.shop.backend.repository;

import com.shop.backend.model.SuccessStoryLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SuccessStoryLikeRepository extends JpaRepository<SuccessStoryLike, Long> {
    
    Optional<SuccessStoryLike> findByStoryIdAndUserId(Long storyId, Long userId);
    
    boolean existsByStoryIdAndUserId(Long storyId, Long userId);
    
    long countByStoryId(Long storyId);
    
    void deleteByStoryIdAndUserId(Long storyId, Long userId);
}

