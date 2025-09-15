package com.shop.backend.repository;

import com.shop.backend.model.DepressionTestAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DepressionTestAnswerRepository extends JpaRepository<DepressionTestAnswer, Long> {
    List<DepressionTestAnswer> findByTestResultId(Long testResultId);
} 