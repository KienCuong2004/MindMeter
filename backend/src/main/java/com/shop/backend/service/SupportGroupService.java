package com.shop.backend.service;

import com.shop.dto.support.SupportGroupDTO;
import com.shop.dto.support.SupportGroupRequest;
import com.shop.backend.model.*;
import com.shop.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

@Slf4j
@Service
@Transactional
public class SupportGroupService {
    
    @Autowired
    private SupportGroupRepository supportGroupRepository;
    
    @Autowired
    private SupportGroupMemberRepository supportGroupMemberRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public Page<SupportGroupDTO> getAllGroups(Pageable pageable, String userEmail) {
        Page<SupportGroup> groups = supportGroupRepository.findByIsActiveTrueAndIsPublicTrueOrderByCreatedAtDesc(pageable);
        return groups.map(group -> convertToDTO(group, userEmail));
    }
    
    public Page<SupportGroupDTO> getGroupsByCategory(SupportGroup.SupportGroupCategory category, Pageable pageable, String userEmail) {
        Page<SupportGroup> groups = supportGroupRepository.findByCategoryAndIsActiveTrueAndIsPublicTrueOrderByCreatedAtDesc(category, pageable);
        return groups.map(group -> convertToDTO(group, userEmail));
    }
    
    public Page<SupportGroupDTO> searchGroups(String keyword, Pageable pageable, String userEmail) {
        Page<SupportGroup> groups = supportGroupRepository.searchGroups(keyword, pageable);
        return groups.map(group -> convertToDTO(group, userEmail));
    }
    
    public SupportGroupDTO getGroupById(Long id, String userEmail) {
        Optional<SupportGroup> group = supportGroupRepository.findByIdAndIsActiveTrue(id);
        if (group.isPresent()) {
            return convertToDTO(group.get(), userEmail);
        }
        return null;
    }
    
    public Page<SupportGroupDTO> getUserGroups(Long userId, Pageable pageable, String userEmail) {
        Page<SupportGroupMember> memberships = supportGroupMemberRepository.findByUserIdAndIsActiveTrueOrderByJoinedAtDesc(userId, pageable);
        return memberships.map(membership -> convertToDTO(membership.getGroup(), userEmail));
    }
    
    public SupportGroupDTO createGroup(SupportGroupRequest request, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        SupportGroup group = new SupportGroup();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setCreator(creator);
        group.setCategory(request.getCategory() != null ? request.getCategory() : SupportGroup.SupportGroupCategory.GENERAL);
        group.setMaxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 50);
        group.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : true);
        group.setIsActive(true);
        group.setMemberCount(0);
        
        group = supportGroupRepository.save(group);
        
        // Add creator as admin member
        SupportGroupMember creatorMember = new SupportGroupMember();
        creatorMember.setGroup(group);
        creatorMember.setUser(creator);
        creatorMember.setRole(SupportGroupMember.MemberRole.ADMIN);
        creatorMember.setIsActive(true);
        supportGroupMemberRepository.save(creatorMember);
        
        updateGroupMemberCount(group.getId());
        
        return convertToDTO(group, creatorEmail);
    }
    
    public SupportGroupDTO updateGroup(Long id, SupportGroupRequest request, String userEmail) {
        SupportGroup group = supportGroupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is admin or creator
        if (!group.getCreator().getId().equals(user.getId())) {
            Optional<SupportGroupMember> member = supportGroupMemberRepository.findByGroupIdAndUserIdAndIsActiveTrue(id, user.getId());
            if (member.isEmpty() || member.get().getRole() != SupportGroupMember.MemberRole.ADMIN) {
                throw new RuntimeException("Unauthorized to update this group");
            }
        }
        
        if (request.getName() != null) {
            group.setName(request.getName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            group.setCategory(request.getCategory());
        }
        if (request.getMaxMembers() != null) {
            group.setMaxMembers(request.getMaxMembers());
        }
        if (request.getIsPublic() != null) {
            group.setIsPublic(request.getIsPublic());
        }
        
        group = supportGroupRepository.save(group);
        return convertToDTO(group, userEmail);
    }
    
    public void joinGroup(Long groupId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        SupportGroup group = supportGroupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        if (!group.getIsActive()) {
            throw new RuntimeException("Group is not active");
        }
        
        // Check if already a member
        Optional<SupportGroupMember> existingMember = supportGroupMemberRepository.findByGroupIdAndUserIdAndIsActiveTrue(groupId, user.getId());
        if (existingMember.isPresent()) {
            throw new RuntimeException("User is already a member of this group");
        }
        
        // Check if group is full
        if (group.getMemberCount() >= group.getMaxMembers()) {
            throw new RuntimeException("Group is full");
        }
        
        SupportGroupMember member = new SupportGroupMember();
        member.setGroup(group);
        member.setUser(user);
        member.setRole(SupportGroupMember.MemberRole.MEMBER);
        member.setIsActive(true);
        supportGroupMemberRepository.save(member);
        
        updateGroupMemberCount(groupId);
    }
    
    public void leaveGroup(Long groupId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        SupportGroup group = supportGroupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Creator cannot leave
        if (group.getCreator().getId().equals(user.getId())) {
            throw new RuntimeException("Group creator cannot leave the group");
        }
        
        Optional<SupportGroupMember> member = supportGroupMemberRepository.findByGroupIdAndUserIdAndIsActiveTrue(groupId, user.getId());
        if (member.isEmpty()) {
            throw new RuntimeException("User is not a member of this group");
        }
        
        SupportGroupMember m = member.get();
        m.setIsActive(false);
        supportGroupMemberRepository.save(m);
        
        updateGroupMemberCount(groupId);
    }
    
    public void removeMember(Long groupId, Long memberId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        SupportGroup group = supportGroupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Check if user is admin or creator
        if (!group.getCreator().getId().equals(user.getId())) {
            Optional<SupportGroupMember> adminMember = supportGroupMemberRepository.findByGroupIdAndUserIdAndIsActiveTrue(groupId, user.getId());
            if (adminMember.isEmpty() || adminMember.get().getRole() != SupportGroupMember.MemberRole.ADMIN) {
                throw new RuntimeException("Unauthorized to remove members");
            }
        }
        
        SupportGroupMember member = supportGroupMemberRepository.findById(memberId)
            .orElseThrow(() -> new RuntimeException("Member not found"));
        
        if (!member.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("Member does not belong to this group");
        }
        
        // Cannot remove creator
        if (member.getUser().getId().equals(group.getCreator().getId())) {
            throw new RuntimeException("Cannot remove group creator");
        }
        
        member.setIsActive(false);
        supportGroupMemberRepository.save(member);
        
        updateGroupMemberCount(groupId);
    }
    
    public void updateMemberRole(Long groupId, Long memberId, SupportGroupMember.MemberRole role, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        SupportGroup group = supportGroupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Only creator can update roles
        if (!group.getCreator().getId().equals(user.getId())) {
            throw new RuntimeException("Only group creator can update member roles");
        }
        
        SupportGroupMember member = supportGroupMemberRepository.findById(memberId)
            .orElseThrow(() -> new RuntimeException("Member not found"));
        
        if (!member.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("Member does not belong to this group");
        }
        
        member.setRole(role);
        supportGroupMemberRepository.save(member);
    }
    
    public void deleteGroup(Long id, String userEmail) {
        SupportGroup group = supportGroupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!group.getCreator().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this group");
        }
        
        group.setIsActive(false);
        supportGroupRepository.save(group);
    }
    
    // Helper methods
    private SupportGroupDTO convertToDTO(SupportGroup group, String userEmail) {
        SupportGroupDTO dto = new SupportGroupDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setCreatorId(group.getCreator().getId());
        dto.setCreatorName(group.getCreator().getFirstName() + " " + group.getCreator().getLastName());
        dto.setCategory(group.getCategory());
        dto.setMaxMembers(group.getMaxMembers());
        dto.setMemberCount(group.getMemberCount());
        dto.setIsPublic(group.getIsPublic());
        dto.setIsActive(group.getIsActive());
        dto.setCreatedAt(group.getCreatedAt());
        dto.setUpdatedAt(group.getUpdatedAt());
        
        // Check if user is a member
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                Optional<SupportGroupMember> member = supportGroupMemberRepository.findByGroupIdAndUserIdAndIsActiveTrue(group.getId(), user.getId());
                if (member.isPresent()) {
                    dto.setIsMember(true);
                    dto.setMemberRole(member.get().getRole().name());
                } else {
                    dto.setIsMember(false);
                }
            }
        }
        
        return dto;
    }
    
    private void updateGroupMemberCount(Long groupId) {
        SupportGroup group = supportGroupRepository.findById(groupId).orElseThrow();
        long count = supportGroupMemberRepository.countByGroupIdAndIsActiveTrue(groupId);
        group.setMemberCount((int) count);
        supportGroupRepository.save(group);
    }
}

