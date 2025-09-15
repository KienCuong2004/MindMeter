package com.shop.backend.repository;

import com.shop.backend.model.DepressionQuestionOptionEn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DepressionQuestionOptionEnRepository extends JpaRepository<DepressionQuestionOptionEn, Long> {
    List<DepressionQuestionOptionEn> findByQuestionIdOrderByOrderAsc(Long questionId);
    List<DepressionQuestionOptionEn> findByQuestionId(Long questionId);
    void deleteByQuestionId(Long questionId);
}
