package com.shop.backend.repository;

import com.shop.backend.model.BlogCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogCategoryRepository extends JpaRepository<BlogCategory, Long> {
    
    // Find by slug
    Optional<BlogCategory> findBySlug(String slug);
    
    // Find active categories
    List<BlogCategory> findByIsActiveTrueOrderByDisplayOrderAsc();
    
    // Find parent categories
    List<BlogCategory> findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
    
    // Find child categories
    List<BlogCategory> findByParentIdAndIsActiveTrueOrderByDisplayOrderAsc(Long parentId);
    
    // Check if slug exists
    boolean existsBySlug(String slug);
    
    // Check if slug exists excluding current category
    boolean existsBySlugAndIdNot(String slug, Long id);
    
    // Find categories with post count
    @Query("SELECT c, COUNT(pc.post.id) as postCount FROM BlogCategory c " +
           "LEFT JOIN c.postCategories pc " +
           "WHERE c.isActive = true " +
           "GROUP BY c.id " +
           "ORDER BY c.displayOrder ASC")
    List<Object[]> findCategoriesWithPostCount();
}
