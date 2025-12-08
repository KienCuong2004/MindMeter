package com.shop.backend.repository;

import com.shop.backend.model.PeerMatchPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PeerMatchPreferencesRepository extends JpaRepository<PeerMatchPreferences, Long> {
    
    Optional<PeerMatchPreferences> findByUserId(Long userId);
    
    boolean existsByUserId(Long userId);
    
    // Find users with matching enabled
    List<PeerMatchPreferences> findByMatchingEnabledTrue();
}

