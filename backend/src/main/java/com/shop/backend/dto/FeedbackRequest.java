package com.shop.backend.dto;

public class FeedbackRequest {
    private String feedback;
    private String email;

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
} 