package com.shop.backend.repository;

import com.shop.backend.model.DepressionQuestionOptionVi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DepressionQuestionOptionViRepository extends JpaRepository<DepressionQuestionOptionVi, Long> {
    List<DepressionQuestionOptionVi> findByQuestionIdOrderByOrderAsc(Long questionId);
    List<DepressionQuestionOptionVi> findByQuestionId(Long questionId);
    void deleteByQuestionId(Long questionId);
}
