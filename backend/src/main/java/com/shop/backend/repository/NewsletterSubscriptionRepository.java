package com.shop.backend.repository;

import com.shop.backend.model.NewsletterSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewsletterSubscriptionRepository extends JpaRepository<NewsletterSubscription, Long> {
    
    Optional<NewsletterSubscription> findByEmail(String email);
    
    List<NewsletterSubscription> findByIsActiveTrueAndIsVerifiedTrue();
    
    Optional<NewsletterSubscription> findByVerificationToken(String token);
    
    long countByIsActiveTrueAndIsVerifiedTrue();
}

