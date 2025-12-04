package com.shop.backend.dto;

import lombok.Data;

@Data
public class NewsletterSubscriptionDTO {
    private String email;
    private String firstName;
    private String lastName;
}

