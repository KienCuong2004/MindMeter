package com.shop.backend.repository;

import com.shop.backend.model.Appointment;
import com.shop.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    // Tìm lịch hẹn theo học sinh
    List<Appointment> findByStudentOrderByAppointmentDateDesc(User student);
    
    // Tìm lịch hẹn theo chuyên gia
    List<Appointment> findByExpertOrderByAppointmentDateDesc(User expert);
    
    // Tìm lịch hẹn theo trạng thái
    List<Appointment> findByStatus(Appointment.AppointmentStatus status);
    
    // Tìm lịch hẹn theo học sinh và trạng thái
    List<Appointment> findByStudentAndStatusOrderByAppointmentDateDesc(User student, Appointment.AppointmentStatus status);
    
    // Tìm lịch hẹn theo chuyên gia và trạng thái
    List<Appointment> findByExpertAndStatusOrderByAppointmentDateDesc(User expert, Appointment.AppointmentStatus status);
    
    // Tìm lịch hẹn theo ngày
    List<Appointment> findByAppointmentDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Tìm lịch hẹn theo chuyên gia và ngày
    List<Appointment> findByExpertAndAppointmentDateBetweenOrderByAppointmentDate(
        User expert, LocalDateTime startDate, LocalDateTime endDate);
    
    // Tìm lịch hẹn theo chuyên gia và ngày cụ thể
    List<Appointment> findByExpertAndAppointmentDateBetween(
        User expert, LocalDateTime startDate, LocalDateTime endDate);
    

    
    // Tìm lịch hẹn sắp tới của học sinh
    @Query("SELECT a FROM Appointment a WHERE a.student.id = :studentId " +
           "AND a.appointmentDate >= :now " +
           "AND a.status IN ('PENDING', 'CONFIRMED') " +
           "ORDER BY a.appointmentDate ASC")
    List<Appointment> findUpcomingAppointmentsByStudent(@Param("studentId") Long studentId, 
                                                       @Param("now") LocalDateTime now);
    
    // Tìm lịch hẹn sắp tới của chuyên gia
    @Query("SELECT a FROM Appointment a WHERE a.expert.id = :expertId " +
           "AND a.appointmentDate >= :now " +
           "AND a.status IN ('PENDING', 'CONFIRMED') " +
           "ORDER BY a.appointmentDate ASC")
    List<Appointment> findUpcomingAppointmentsByExpert(@Param("expertId") Long expertId, 
                                                      @Param("now") LocalDateTime now);
    
    // Phân trang lịch hẹn theo học sinh
    Page<Appointment> findByStudent(User student, Pageable pageable);
    
    // Phân trang lịch hẹn theo chuyên gia
    Page<Appointment> findByExpert(User expert, Pageable pageable);
    
    // Tìm lịch hẹn sắp tới trong khoảng thời gian cho reminder
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate >= :startTime " +
           "AND a.appointmentDate <= :endTime " +
           "AND a.status = :status")
    List<Appointment> findUpcomingAppointments(@Param("startTime") LocalDateTime startTime,
                                             @Param("endTime") LocalDateTime endTime,
                                             @Param("status") Appointment.AppointmentStatus status);
}
