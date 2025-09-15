package com.shop.backend.repository;

import com.shop.backend.model.BlogPostCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogPostCategoryRepository extends JpaRepository<BlogPostCategory, Long> {
    
    // Find categories by post
    List<BlogPostCategory> findByPostId(Long postId);
    
    // Find posts by category
    List<BlogPostCategory> findByCategoryId(Long categoryId);
    
    // Delete by post
    void deleteByPostId(Long postId);
    
    // Delete by category
    void deleteByCategoryId(Long categoryId);
}
