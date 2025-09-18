package com.shop.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CurrencyServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private CurrencyService currencyService;

    @BeforeEach
    void setUp() {
        // Set the API key using reflection
        ReflectionTestUtils.setField(currencyService, "currencyApiKey", "test-api-key");
    }

    @Test
    void getUsdToVndRate_ShouldReturnRate_WhenApiCallSuccessful() {
        // Given
        Map<String, Object> rates = new HashMap<>();
        rates.put("VND", 24000.0);
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("rates", rates);
        
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.getForEntity(anyString(), eq(Map.class))).thenReturn(responseEntity);

        // When
        double rate = currencyService.getUsdToVndRate();

        // Then
        assertEquals(24000.0, rate, 0.01);
        verify(restTemplate).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void getUsdToVndRate_ShouldReturnDefaultRate_WhenApiCallFails() {
        // Given
        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
            .thenThrow(new RuntimeException("API call failed"));

        // When
        double rate = currencyService.getUsdToVndRate();

        // Then
        assertEquals(24000.0, rate, 0.01); // Default fallback rate
        verify(restTemplate).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void getUsdToVndRate_ShouldReturnDefaultRate_WhenResponseIsNull() {
        // Given
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(null, HttpStatus.OK);
        when(restTemplate.getForEntity(anyString(), eq(Map.class))).thenReturn(responseEntity);

        // When
        double rate = currencyService.getUsdToVndRate();

        // Then
        assertEquals(24000.0, rate, 0.01); // Default fallback rate
        verify(restTemplate).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void getUsdToVndRate_ShouldReturnDefaultRate_WhenRatesNotFound() {
        // Given
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("rates", null);
        
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.getForEntity(anyString(), eq(Map.class))).thenReturn(responseEntity);

        // When
        double rate = currencyService.getUsdToVndRate();

        // Then
        assertEquals(24000.0, rate, 0.01); // Default fallback rate
        verify(restTemplate).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void getUsdToVndRate_ShouldReturnDefaultRate_WhenVndRateNotFound() {
        // Given
        Map<String, Object> rates = new HashMap<>();
        rates.put("EUR", 0.85);
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("rates", rates);
        
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.getForEntity(anyString(), eq(Map.class))).thenReturn(responseEntity);

        // When
        double rate = currencyService.getUsdToVndRate();

        // Then
        assertEquals(24000.0, rate, 0.01); // Default fallback rate
        verify(restTemplate).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void getUsdToVndRate_ShouldReturnDefaultRate_WhenResponseNot2xx() {
        // Given
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        when(restTemplate.getForEntity(anyString(), eq(Map.class))).thenReturn(responseEntity);

        // When
        double rate = currencyService.getUsdToVndRate();

        // Then
        assertEquals(24000.0, rate, 0.01); // Default fallback rate
        verify(restTemplate).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void getUsdToVndRate_ShouldHandleDifferentNumberTypes() {
        // Given
        Map<String, Object> rates = new HashMap<>();
        rates.put("VND", 24000); // Integer instead of Double
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("rates", rates);
        
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.getForEntity(anyString(), eq(Map.class))).thenReturn(responseEntity);

        // When
        double rate = currencyService.getUsdToVndRate();

        // Then
        assertEquals(24000.0, rate, 0.01);
        verify(restTemplate).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void getUsdToVndRate_ShouldHandleFloatNumberTypes() {
        // Given
        Map<String, Object> rates = new HashMap<>();
        rates.put("VND", 24000.5f); // Float instead of Double
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("rates", rates);
        
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.getForEntity(anyString(), eq(Map.class))).thenReturn(responseEntity);

        // When
        double rate = currencyService.getUsdToVndRate();

        // Then
        assertEquals(24000.5, rate, 0.01);
        verify(restTemplate).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void getUsdToVndRate_ShouldReturnDefaultRate_WhenVndRateIsNotNumber() {
        // Given
        Map<String, Object> rates = new HashMap<>();
        rates.put("VND", "invalid_rate");
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("rates", rates);
        
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.getForEntity(anyString(), eq(Map.class))).thenReturn(responseEntity);

        // When
        double rate = currencyService.getUsdToVndRate();

        // Then
        assertEquals(24000.0, rate, 0.01); // Default fallback rate
        verify(restTemplate).getForEntity(anyString(), eq(Map.class));
    }

    @Test
    void getUsdToVndRate_ShouldCallCorrectApiUrl() {
        // Given
        Map<String, Object> rates = new HashMap<>();
        rates.put("VND", 24000.0);
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("rates", rates);
        
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.getForEntity(anyString(), eq(Map.class))).thenReturn(responseEntity);

        // When
        currencyService.getUsdToVndRate();

        // Then
        verify(restTemplate).getForEntity(
            eq("http://api.exchangerate-api.com/v4/latest/USD"),
            eq(Map.class)
        );
    }
}
