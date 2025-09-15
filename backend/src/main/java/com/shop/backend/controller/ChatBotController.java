package com.shop.backend.controller;

import com.shop.backend.dto.ChatBotRequest;
import com.shop.backend.dto.ChatBotResponse;
import com.shop.backend.service.ChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatBotController {
    @Autowired
    private ChatBotService chatBotService;

    @PostMapping
    public ResponseEntity<ChatBotResponse> chat(@RequestBody ChatBotRequest request) {
        String reply = chatBotService.askOpenAI(request.getMessage());
        return ResponseEntity.ok(new ChatBotResponse(reply));
    }
} 