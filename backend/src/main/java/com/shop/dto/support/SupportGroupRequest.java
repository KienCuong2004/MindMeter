package com.shop.dto.support;

import com.shop.backend.model.SupportGroup;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportGroupRequest {
    private String name;
    private String description;
    private SupportGroup.SupportGroupCategory category;
    private Integer maxMembers;
    private Boolean isPublic;
}

