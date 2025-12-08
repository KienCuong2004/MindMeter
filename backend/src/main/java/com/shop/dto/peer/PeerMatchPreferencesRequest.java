package com.shop.dto.peer;

import com.shop.backend.model.PeerMatchPreferences;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PeerMatchPreferencesRequest {
    private Integer ageRangeMin;
    private Integer ageRangeMax;
    private PeerMatchPreferences.PreferredGender preferredGender;
    private PeerMatchPreferences.PreferredLanguage preferredLanguage;
    private String interests;
    private Boolean matchingEnabled;
}

