package com.shop.backend.repository;

import com.shop.backend.model.SystemAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SystemAnnouncementRepository extends JpaRepository<SystemAnnouncement, Long> {
    List<SystemAnnouncement> findByIsActiveTrueOrderByCreatedAtDesc();
    List<SystemAnnouncement> findByAnnouncementType(SystemAnnouncement.AnnouncementType announcementType);
    List<SystemAnnouncement> findByIsActiveAndAnnouncementType(Boolean isActive, SystemAnnouncement.AnnouncementType announcementType);
} 