package com.shop.backend.repository;

import com.shop.backend.model.ExpertBreak;
import com.shop.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ExpertBreakRepository extends JpaRepository<ExpertBreak, Long> {
    
    // Tìm thời gian nghỉ theo chuyên gia
    List<ExpertBreak> findByExpertOrderByBreakDateAsc(User expert);
    
    // Tìm thời gian nghỉ theo chuyên gia và ngày
    List<ExpertBreak> findByExpertAndBreakDate(User expert, LocalDate breakDate);
    
    // Tìm thời gian nghỉ theo chuyên gia và khoảng thời gian
    List<ExpertBreak> findByExpertAndBreakDateBetween(User expert, LocalDate startDate, LocalDate endDate);
    
    // Tìm thời gian nghỉ theo chuyên gia, ngày và khoảng thời gian
    @Query("SELECT eb FROM ExpertBreak eb WHERE eb.expert.id = :expertId " +
           "AND eb.breakDate = :breakDate " +
           "AND ((eb.startTime <= :startTime AND eb.endTime > :startTime) " +
           "OR (eb.startTime < :endTime AND eb.endTime >= :endTime) " +
           "OR (eb.startTime >= :startTime AND eb.endTime <= :endTime))")
    List<ExpertBreak> findConflictingBreaks(@Param("expertId") Long expertId,
                                           @Param("breakDate") LocalDate breakDate,
                                           @Param("startTime") LocalTime startTime,
                                           @Param("endTime") LocalTime endTime);
    
    // Tìm thời gian nghỉ định kỳ
    List<ExpertBreak> findByExpertAndIsRecurringTrue(User expert);
}
