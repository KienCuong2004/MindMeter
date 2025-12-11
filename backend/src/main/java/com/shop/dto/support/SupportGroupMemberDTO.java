package com.shop.dto.support;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportGroupMemberDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userAvatar;
    private String role;
    private LocalDateTime joinedAt;
}

