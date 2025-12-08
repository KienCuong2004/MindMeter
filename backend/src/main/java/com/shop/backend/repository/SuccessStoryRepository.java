package com.shop.backend.repository;

import com.shop.backend.model.SuccessStory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SuccessStoryRepository extends JpaRepository<SuccessStory, Long> {
    
    // Find approved stories
    @EntityGraph(attributePaths = {"author"})
    Page<SuccessStory> findByIsApprovedTrueOrderByPublishedAtDesc(Pageable pageable);
    
    // Find featured stories
    @EntityGraph(attributePaths = {"author"})
    Page<SuccessStory> findByIsFeaturedTrueAndIsApprovedTrueOrderByPublishedAtDesc(Pageable pageable);
    
    // Find stories by category
    @EntityGraph(attributePaths = {"author"})
    Page<SuccessStory> findByCategoryAndIsApprovedTrueOrderByPublishedAtDesc(
        SuccessStory.StoryCategory category, Pageable pageable);
    
    // Find stories by author
    Page<SuccessStory> findByAuthorIdAndIsApprovedTrueOrderByPublishedAtDesc(
        Long authorId, Pageable pageable);
    
    // Find pending stories (for admin approval)
    Page<SuccessStory> findByIsApprovedFalseOrderByCreatedAtDesc(Pageable pageable);
    
    // Search stories by title or content
    @EntityGraph(attributePaths = {"author"})
    @Query("SELECT s FROM SuccessStory s WHERE " +
           "(LOWER(s.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND s.isApproved = true")
    Page<SuccessStory> searchStories(@Param("keyword") String keyword, Pageable pageable);
    
    // Count approved stories
    long countByIsApprovedTrue();
    
    // Count pending stories
    long countByIsApprovedFalse();
    
    // Find story by id and approved status
    @EntityGraph(attributePaths = {"author"})
    Optional<SuccessStory> findByIdAndIsApprovedTrue(Long id);
}

