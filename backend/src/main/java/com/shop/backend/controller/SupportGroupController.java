package com.shop.backend.controller;

import com.shop.dto.support.SupportGroupDTO;
import com.shop.dto.support.SupportGroupRequest;
import com.shop.backend.model.SupportGroup;
import com.shop.backend.model.SupportGroupMember;
import com.shop.backend.service.SupportGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/support-groups")
@CrossOrigin(origins = "*")
public class SupportGroupController {
    
    @Autowired
    private SupportGroupService supportGroupService;
    
    @GetMapping
    public ResponseEntity<Page<SupportGroupDTO>> getAllGroups(
            @RequestParam(required = false) SupportGroup.SupportGroupCategory category,
            @RequestParam(required = false) String keyword,
            Pageable pageable,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        
        Page<SupportGroupDTO> groups;
        if (keyword != null && !keyword.isEmpty()) {
            groups = supportGroupService.searchGroups(keyword, pageable, userEmail);
        } else if (category != null) {
            groups = supportGroupService.getGroupsByCategory(category, pageable, userEmail);
        } else {
            groups = supportGroupService.getAllGroups(pageable, userEmail);
        }
        
        return ResponseEntity.ok(groups);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SupportGroupDTO> getGroupById(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        SupportGroupDTO group = supportGroupService.getGroupById(id, userEmail);
        
        if (group != null) {
            return ResponseEntity.ok(group);
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<SupportGroupDTO>> getUserGroups(
            @PathVariable Long userId,
            Pageable pageable,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        Page<SupportGroupDTO> groups = supportGroupService.getUserGroups(userId, pageable, userEmail);
        return ResponseEntity.ok(groups);
    }
    
    @PostMapping
    public ResponseEntity<SupportGroupDTO> createGroup(
            @RequestBody SupportGroupRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            SupportGroupDTO group = supportGroupService.createGroup(request, userEmail);
            return ResponseEntity.ok(group);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SupportGroupDTO> updateGroup(
            @PathVariable Long id,
            @RequestBody SupportGroupRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            SupportGroupDTO group = supportGroupService.updateGroup(id, request, userEmail);
            return ResponseEntity.ok(group);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            supportGroupService.deleteGroup(id, userEmail);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/{id}/join")
    public ResponseEntity<Void> joinGroup(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            supportGroupService.joinGroup(id, userEmail);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            supportGroupService.leaveGroup(id, userEmail);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            supportGroupService.removeMember(groupId, memberId, userEmail);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{groupId}/members/{memberId}/role")
    public ResponseEntity<Void> updateMemberRole(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @RequestParam SupportGroupMember.MemberRole role,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String userEmail = authentication.getName();
        try {
            supportGroupService.updateMemberRole(groupId, memberId, role, userEmail);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

