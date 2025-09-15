package com.shop.backend.repository;

import com.shop.backend.model.DepressionQuestionVi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DepressionQuestionViRepository extends JpaRepository<DepressionQuestionVi, Long> {
    List<DepressionQuestionVi> findByIsActiveTrue();
    List<DepressionQuestionVi> findByTestKey(String testKey);
    List<DepressionQuestionVi> findByTestKeyAndIsActiveTrue(String testKey);
    List<DepressionQuestionVi> findByCategory(String category);
    List<DepressionQuestionVi> findByCategoryAndIsActiveTrue(String category);
    
    @Query("SELECT DISTINCT q.category FROM DepressionQuestionVi q WHERE q.isActive = true")
    List<String> findDistinctCategories();
    
    @Query("SELECT DISTINCT q.testKey FROM DepressionQuestionVi q WHERE q.isActive = true")
    List<String> findDistinctTestKeys();
    
    @Query("SELECT q FROM DepressionQuestionVi q WHERE q.isActive = true ORDER BY q.order ASC")
    List<DepressionQuestionVi> findActiveQuestionsOrderByOrder();
    
    @Query("SELECT q FROM DepressionQuestionVi q WHERE q.testKey = :testKey AND q.order = :order")
    Optional<DepressionQuestionVi> findByTestKeyAndOrder(@Param("testKey") String testKey, @Param("order") Integer order);
}
