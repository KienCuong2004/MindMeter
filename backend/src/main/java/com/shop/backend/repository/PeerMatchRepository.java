package com.shop.backend.repository;

import com.shop.backend.model.PeerMatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PeerMatchRepository extends JpaRepository<PeerMatch, Long> {
    
    // Find matches for a user (as user1 or user2) with status filter
    @EntityGraph(attributePaths = {"user1", "user2"})
    @Query("SELECT m FROM PeerMatch m WHERE (m.user1.id = :userId OR m.user2.id = :userId) " +
           "AND m.status = :status ORDER BY m.matchedAt DESC")
    Page<PeerMatch> findMatchesByUserId(@Param("userId") Long userId, 
                                        @Param("status") PeerMatch.MatchStatus status, 
                                        Pageable pageable);
    
    // Find all matches for a user (as user1 or user2) without status filter
    @EntityGraph(attributePaths = {"user1", "user2"})
    @Query("SELECT m FROM PeerMatch m WHERE (m.user1.id = :userId OR m.user2.id = :userId) " +
           "ORDER BY m.matchedAt DESC")
    Page<PeerMatch> findAllMatchesByUserId(@Param("userId") Long userId, 
                                           Pageable pageable);
    
    // Find active matches for a user
    @EntityGraph(attributePaths = {"user1", "user2"})
    @Query("SELECT m FROM PeerMatch m WHERE (m.user1.id = :userId OR m.user2.id = :userId) " +
           "AND m.status = 'ACTIVE' ORDER BY m.matchedAt DESC")
    List<PeerMatch> findActiveMatchesByUserId(@Param("userId") Long userId);
    
    // Find pending matches for a user
    @EntityGraph(attributePaths = {"user1", "user2"})
    @Query("SELECT m FROM PeerMatch m WHERE (m.user1.id = :userId OR m.user2.id = :userId) " +
           "AND m.status = 'PENDING' ORDER BY m.matchedAt DESC")
    List<PeerMatch> findPendingMatchesByUserId(@Param("userId") Long userId);
    
    // Check if two users are already matched
    @Query("SELECT m FROM PeerMatch m WHERE " +
           "((m.user1.id = :user1Id AND m.user2.id = :user2Id) OR " +
           "(m.user1.id = :user2Id AND m.user2.id = :user1Id)) " +
           "AND m.status IN ('PENDING', 'ACCEPTED', 'ACTIVE')")
    Optional<PeerMatch> findExistingMatch(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
    
    // Count matches by status for a user
    @Query("SELECT COUNT(m) FROM PeerMatch m WHERE (m.user1.id = :userId OR m.user2.id = :userId) " +
           "AND m.status = :status")
    long countMatchesByUserIdAndStatus(@Param("userId") Long userId, @Param("status") PeerMatch.MatchStatus status);
}

