package com.shop.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "appointment_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "setting_key", nullable = false, unique = true)
    private String settingKey;
    
    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;
    
    @Column(name = "setting_type")
    private String settingType; // "STRING", "INTEGER", "BOOLEAN", "JSON"
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at")
    @CreationTimestamp
    private java.time.LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private java.time.LocalDateTime updatedAt;
}
