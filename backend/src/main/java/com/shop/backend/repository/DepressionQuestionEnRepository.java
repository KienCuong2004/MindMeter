package com.shop.backend.repository;

import com.shop.backend.model.DepressionQuestionEn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DepressionQuestionEnRepository extends JpaRepository<DepressionQuestionEn, Long> {
    List<DepressionQuestionEn> findByIsActiveTrue();
    List<DepressionQuestionEn> findByTestKey(String testKey);
    List<DepressionQuestionEn> findByTestKeyAndIsActiveTrue(String testKey);
    List<DepressionQuestionEn> findByCategory(String category);
    List<DepressionQuestionEn> findByCategoryAndIsActiveTrue(String category);
    
    @Query("SELECT DISTINCT q.category FROM DepressionQuestionEn q WHERE q.isActive = true")
    List<String> findDistinctCategories();
    
    @Query("SELECT DISTINCT q.testKey FROM DepressionQuestionEn q WHERE q.isActive = true")
    List<String> findDistinctTestKeys();
    
    @Query("SELECT q FROM DepressionQuestionEn q WHERE q.isActive = true ORDER BY q.order ASC")
    List<DepressionQuestionEn> findActiveQuestionsOrderByOrder();
    
    @Query("SELECT q FROM DepressionQuestionEn q WHERE q.testKey = :testKey AND q.order = :order")
    Optional<DepressionQuestionEn> findByTestKeyAndOrder(@Param("testKey") String testKey, @Param("order") Integer order);
}
