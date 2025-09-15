package com.shop.backend.repository;

import com.shop.backend.model.BlogPostTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogPostTagRepository extends JpaRepository<BlogPostTag, Long> {
    
    // Find tags by post
    List<BlogPostTag> findByPostId(Long postId);
    
    // Find posts by tag
    List<BlogPostTag> findByTagId(Long tagId);
    
    // Delete by post
    void deleteByPostId(Long postId);
    
    // Delete by tag
    void deleteByTagId(Long tagId);
}
