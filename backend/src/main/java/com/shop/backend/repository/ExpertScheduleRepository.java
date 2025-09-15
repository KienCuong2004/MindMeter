package com.shop.backend.repository;

import com.shop.backend.model.ExpertSchedule;
import com.shop.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpertScheduleRepository extends JpaRepository<ExpertSchedule, Long> {
    
    // Tìm lịch làm việc theo chuyên gia
    List<ExpertSchedule> findByExpertOrderByDayOfWeekAsc(User expert);
    
    // Tìm lịch làm việc theo chuyên gia và ngày trong tuần
    List<ExpertSchedule> findByExpertAndDayOfWeek(User expert, DayOfWeek dayOfWeek);
    
    // Tìm lịch làm việc theo chuyên gia và trạng thái
    List<ExpertSchedule> findByExpertAndIsAvailable(User expert, Boolean isAvailable);
    
    // Tìm lịch làm việc theo chuyên gia, ngày trong tuần và trạng thái
    Optional<ExpertSchedule> findByExpertAndDayOfWeekAndIsAvailable(User expert, DayOfWeek dayOfWeek, Boolean isAvailable);
    
    // Tìm tất cả chuyên gia có lịch làm việc
    @Query("SELECT DISTINCT es.expert FROM ExpertSchedule es WHERE es.isAvailable = true")
    List<User> findAvailableExperts();
    
    // Tìm chuyên gia có lịch làm việc theo ngày cụ thể
    @Query("SELECT es FROM ExpertSchedule es WHERE es.expert.id = :expertId " +
           "AND es.dayOfWeek = :dayOfWeek AND es.isAvailable = true")
    Optional<ExpertSchedule> findAvailableScheduleByExpertAndDay(
        @Param("expertId") Long expertId, @Param("dayOfWeek") DayOfWeek dayOfWeek);
}
