package com.shop.dto.success;

import com.shop.backend.model.SuccessStory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuccessStoryRequest {
    private String title;
    private String content;
    private SuccessStory.StoryCategory category;
    private String tags;
    private Boolean isAnonymous;
}

