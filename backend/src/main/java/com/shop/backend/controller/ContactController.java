package com.shop.backend.controller;

import com.shop.backend.dto.ContactRequest;
import com.shop.backend.service.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin
public class ContactController {
    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public ResponseEntity<?> sendContact(@RequestBody ContactRequest request) {
        contactService.sendContactEmail(request);
        return ResponseEntity.ok().body("Contact message sent successfully");
    }
} 