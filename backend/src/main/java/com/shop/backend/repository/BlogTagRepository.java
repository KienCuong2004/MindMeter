package com.shop.backend.repository;

import com.shop.backend.model.BlogTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogTagRepository extends JpaRepository<BlogTag, Long> {
    
    // Find by slug
    Optional<BlogTag> findBySlug(String slug);
    
    // Find by name (case insensitive)
    Optional<BlogTag> findByNameIgnoreCase(String name);
    
    // Search tags by name
    List<BlogTag> findByNameContainingIgnoreCase(String name);
    
    // Check if slug exists
    boolean existsBySlug(String slug);
    
    // Check if slug exists excluding current tag
    boolean existsBySlugAndIdNot(String slug, Long id);
    
    // Find tags with post count
    @Query("SELECT t, COUNT(pt.post.id) as postCount FROM BlogTag t " +
           "LEFT JOIN t.postTags pt " +
           "GROUP BY t.id " +
           "ORDER BY postCount DESC, t.name ASC")
    List<Object[]> findTagsWithPostCount();
    
    // Find most popular tags
    @Query("SELECT t FROM BlogTag t " +
           "JOIN t.postTags pt " +
           "GROUP BY t.id " +
           "ORDER BY COUNT(pt.post.id) DESC")
    List<BlogTag> findMostPopularTags();
}
