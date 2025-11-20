package com.shop.backend.repository;

import com.shop.backend.model.Appointment;
import com.shop.backend.model.AppointmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentHistoryRepository extends JpaRepository<AppointmentHistory, Long> {
    
    /**
     * Tìm tất cả lịch sử thay đổi của một lịch hẹn, sắp xếp theo thời gian giảm dần
     */
    List<AppointmentHistory> findByAppointmentOrderByChangedAtDesc(Appointment appointment);
    
    /**
     * Tìm lịch sử thay đổi theo ID lịch hẹn
     */
    @Query("SELECT h FROM AppointmentHistory h WHERE h.appointment.id = :appointmentId ORDER BY h.changedAt DESC")
    List<AppointmentHistory> findByAppointmentIdOrderByChangedAtDesc(@Param("appointmentId") Long appointmentId);
    
    /**
     * Tìm lịch sử thay đổi theo hành động
     */
    List<AppointmentHistory> findByActionOrderByChangedAtDesc(AppointmentHistory.HistoryAction action);
    
    /**
     * Tìm lịch sử thay đổi theo người thực hiện
     */
    @Query("SELECT h FROM AppointmentHistory h WHERE h.changedBy.id = :userId ORDER BY h.changedAt DESC")
    List<AppointmentHistory> findByChangedByOrderByChangedAtDesc(@Param("userId") Long userId);
}

