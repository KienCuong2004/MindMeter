package com.shop.dto.support;

import com.shop.backend.model.SupportGroup;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportGroupDTO {
    private Long id;
    private String name;
    private String description;
    private Long creatorId;
    private String creatorName;
    private SupportGroup.SupportGroupCategory category;
    private Integer maxMembers;
    private Integer memberCount;
    private Boolean isPublic;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isMember;
    private String memberRole;
}

