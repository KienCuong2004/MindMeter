package com.shop.backend.repository;

import com.shop.backend.model.ExpertNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpertNoteRepository extends JpaRepository<ExpertNote, Long> {
    List<ExpertNote> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<ExpertNote> findByExpertIdOrderByCreatedAtDesc(Long expertId);
    List<ExpertNote> findByStudentIdAndExpertIdOrderByCreatedAtDesc(Long studentId, Long expertId);
} 