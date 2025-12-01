package com.shop.backend.service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Service để tích hợp Google Calendar API và tạo Google Meet link
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarService {
    
    private static final String APPLICATION_NAME = "MindMeter Appointment System";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String TOKENS_DIRECTORY_PATH = "tokens";
    private static final List<String> SCOPES = Collections.singletonList(CalendarScopes.CALENDAR);
    private static final String CREDENTIALS_FILE_PATH = "/credentials.json";
    
    @Value("${google.calendar.enabled:false}")
    private boolean calendarEnabled;
    
    @Value("${google.calendar.service-account.enabled:false}")
    private boolean serviceAccountEnabled;
    
    @Value("${google.calendar.service-account.email:}")
    private String serviceAccountEmail;
    
    /**
     * Tạo Google Meet link bằng cách tạo event trong Google Calendar
     * 
     * @param summary Tiêu đề cuộc họp
     * @param startTime Thời gian bắt đầu
     * @param endTime Thời gian kết thúc
     * @param timeZone Múi giờ (ví dụ: "Asia/Ho_Chi_Minh")
     * @param description Mô tả cuộc họp
     * @return Google Meet link hoặc null nếu có lỗi
     */
    public String createGoogleMeetLink(String summary, LocalDateTime startTime, LocalDateTime endTime, 
                                       String timeZone, String description) {
        if (!calendarEnabled) {
            log.debug("Google Calendar API is disabled. Using fallback meeting link generation.");
            return null;
        }
        
        try {
            // Kiểm tra xem credentials file có tồn tại không
            InputStream in = GoogleCalendarService.class.getResourceAsStream(CREDENTIALS_FILE_PATH);
            if (in == null) {
                log.warn("Google Calendar credentials file not found at {}. Please follow GOOGLE_CALENDAR_SETUP.md to configure.", CREDENTIALS_FILE_PATH);
                return null;
            }
            in.close();
            
            // Kiểm tra xem đã có token chưa (đã authenticate)
            java.io.File tokenFile = new java.io.File(TOKENS_DIRECTORY_PATH, "StoredCredential");
            if (!tokenFile.exists()) {
                log.warn("Google Calendar OAuth token not found. Please authenticate first. Using fallback link generation.");
                return null;
            }
            
            // Kiểm tra lại một lần nữa để chắc chắn token tồn tại trước khi gọi getCredentials
            // vì getCredentials() sẽ mở browser nếu chưa có token
            if (!tokenFile.exists() || !tokenFile.canRead()) {
                log.warn("Cannot read Google Calendar OAuth token. Using fallback link generation.");
                return null;
            }
            
            final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
            
            // Chỉ gọi getCredentials nếu đã chắc chắn có token
            Credential credential;
            try {
                credential = getCredentials(HTTP_TRANSPORT);
            } catch (Exception e) {
                log.warn("Failed to load Google Calendar credentials: {}. Using fallback link generation.", e.getMessage());
                return null;
            }
            
            Calendar service = new Calendar.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                    .setApplicationName(APPLICATION_NAME)
                    .build();
            
            // Tạo event với Google Meet
            Event event = new Event()
                    .setSummary(summary)
                    .setDescription(description);
            
            // Thời gian bắt đầu và kết thúc
            // Convert LocalDateTime to RFC3339 format for Google Calendar API
            ZonedDateTime zonedStartTime = ZonedDateTime.of(startTime, ZoneId.of(timeZone));
            com.google.api.client.util.DateTime startDateTime = new com.google.api.client.util.DateTime(
                    zonedStartTime.toInstant().toEpochMilli()
            );
            EventDateTime start = new EventDateTime()
                    .setDateTime(startDateTime)
                    .setTimeZone(timeZone);
            event.setStart(start);
            
            ZonedDateTime zonedEndTime = ZonedDateTime.of(endTime, ZoneId.of(timeZone));
            com.google.api.client.util.DateTime endDateTime = new com.google.api.client.util.DateTime(
                    zonedEndTime.toInstant().toEpochMilli()
            );
            EventDateTime end = new EventDateTime()
                    .setDateTime(endDateTime)
                    .setTimeZone(timeZone);
            event.setEnd(end);
            
            // Tạo conference data để Google tự động tạo Meet link
            ConferenceData conferenceData = new ConferenceData();
            CreateConferenceRequest createRequest = new CreateConferenceRequest();
            createRequest.setRequestId(UUID.randomUUID().toString());
            createRequest.setConferenceSolutionKey(new ConferenceSolutionKey().setType("hangoutsMeet"));
            conferenceData.setCreateRequest(createRequest);
            event.setConferenceData(conferenceData);
            
            // Tạo event với conferenceDataVersion=1 để yêu cầu tạo Meet link
            String calendarId = "primary";
            event = service.events()
                    .insert(calendarId, event)
                    .setConferenceDataVersion(1)
                    .execute();
            
            // Lấy Google Meet link từ response
            if (event.getConferenceData() != null 
                    && event.getConferenceData().getEntryPoints() != null
                    && !event.getConferenceData().getEntryPoints().isEmpty()) {
                String meetLink = event.getConferenceData().getEntryPoints().get(0).getUri();
                log.info("Successfully created Google Meet link: {}", meetLink);
                return meetLink;
            } else {
                log.warn("Google Meet link not found in event response");
                return null;
            }
            
        } catch (GeneralSecurityException | IOException e) {
            log.error("Error creating Google Meet link via Calendar API: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Lấy credentials để authenticate với Google Calendar API
     * 
     * @param HTTP_TRANSPORT HTTP transport
     * @return Credential object
     * @throws IOException nếu có lỗi khi đọc credentials
     */
    private Credential getCredentials(final NetHttpTransport HTTP_TRANSPORT) throws IOException {
        // Load client secrets
        InputStream in = GoogleCalendarService.class.getResourceAsStream(CREDENTIALS_FILE_PATH);
        if (in == null) {
            throw new FileNotFoundException("Resource not found: " + CREDENTIALS_FILE_PATH + 
                ". Please download credentials.json from Google Cloud Console and place it in src/main/resources/");
        }
        
        GoogleClientSecrets clientSecrets;
        try {
            // Đọc file với UTF-8 encoding để tránh lỗi malformed JSON
            clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in, StandardCharsets.UTF_8));
        } finally {
            in.close();
        }
        
        // Build flow and trigger user authorization request
        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
                .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(TOKENS_DIRECTORY_PATH)))
                .setAccessType("offline")
                .build();
        
        // Kiểm tra xem đã có token chưa trước khi authorize
        // Nếu chưa có token, authorize() sẽ mở browser và block
        java.io.File tokenFile = new java.io.File(TOKENS_DIRECTORY_PATH, "StoredCredential");
        if (!tokenFile.exists()) {
            throw new IOException("OAuth token not found. Please authenticate first by completing OAuth flow.");
        }
        
        // Load existing credential từ token store
        Credential credential = flow.loadCredential("user");
        if (credential != null && credential.getAccessToken() != null) {
            // Kiểm tra xem token có còn valid không
            if (credential.getExpirationTimeMilliseconds() != null 
                && credential.getExpirationTimeMilliseconds() < System.currentTimeMillis()) {
                // Token đã hết hạn, cần refresh
                if (credential.getRefreshToken() != null) {
                    credential.refreshToken();
                } else {
                    throw new IOException("Token expired and no refresh token available. Please re-authenticate.");
                }
            }
            return credential;
        }
        
        // Nếu không có credential, cần authorize (sẽ mở browser)
        // Nhưng trong trường hợp này, chúng ta không muốn block, nên throw exception
        throw new IOException("No valid credential found. Please authenticate first.");
    }
    
    /**
     * Kiểm tra xem Google Calendar API có được enable không
     */
    public boolean isEnabled() {
        return calendarEnabled;
    }
    
    /**
     * Lấy authorization URL để user authorize Google Calendar API
     * 
     * @return Authorization URL
     * @throws IOException nếu có lỗi
     */
    public String getAuthorizationUrl() throws IOException {
        if (!calendarEnabled) {
            throw new IOException("Google Calendar API is not enabled. Please set google.calendar.enabled=true in application.yml");
        }
        
        try {
            final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
            
            // Load client secrets
            InputStream in = GoogleCalendarService.class.getResourceAsStream(CREDENTIALS_FILE_PATH);
            if (in == null) {
                throw new FileNotFoundException("Google Calendar credentials file not found at " + CREDENTIALS_FILE_PATH + 
                    ". Please download credentials.json from Google Cloud Console and place it in src/main/resources/");
            }
            
            GoogleClientSecrets clientSecrets;
            try {
                clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in, StandardCharsets.UTF_8));
            } finally {
                in.close();
            }
            
            // Build flow
            GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                    HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
                    .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(TOKENS_DIRECTORY_PATH)))
                    .setAccessType("offline")
                    .build();
            
            // Generate authorization URL
            // LocalServerReceiver sẽ tự động handle callback trên port 8888
            // Lấy redirect URI từ credentials.json nếu có, nếu không dùng mặc định
            String redirectUri = "http://localhost:8888/Callback";
            if (clientSecrets.getInstalled() != null 
                && clientSecrets.getInstalled().getRedirectUris() != null 
                && !clientSecrets.getInstalled().getRedirectUris().isEmpty()) {
                // Lấy redirect URI đầu tiên từ credentials.json
                redirectUri = clientSecrets.getInstalled().getRedirectUris().get(0);
                // Nếu redirect URI là "http://localhost" (Desktop app), thay bằng port 8888
                if (redirectUri.equals("http://localhost")) {
                    redirectUri = "http://localhost:8888/Callback";
                }
            }
            
            String authorizationUrl = flow.newAuthorizationUrl()
                    .setRedirectUri(redirectUri)
                    .build();
            
            log.info("Generated authorization URL: {}", authorizationUrl);
            return authorizationUrl;
        } catch (GeneralSecurityException | IOException e) {
            log.error("Error generating authorization URL: {}", e.getMessage(), e);
            throw new IOException("Failed to generate authorization URL: " + e.getMessage(), e);
        }
    }
    
    /**
     * Kiểm tra xem đã authenticate chưa
     * 
     * @return true nếu đã authenticate
     */
    public boolean isAuthenticated() {
        if (!calendarEnabled) {
            return false;
        }
        
        try {
            java.io.File tokenFile = new java.io.File(TOKENS_DIRECTORY_PATH, "StoredCredential");
            if (!tokenFile.exists()) {
                return false;
            }
            
            final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
            Credential credential = getCredentials(HTTP_TRANSPORT);
            return credential != null && credential.getAccessToken() != null;
        } catch (Exception e) {
            log.debug("Error checking authentication status: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Initiate OAuth flow và lưu token
     * Method này sẽ mở browser để user authorize
     * 
     * @return true nếu authenticate thành công
     * @throws IOException nếu có lỗi
     */
    public boolean initiateOAuthFlow() throws IOException {
        if (!calendarEnabled) {
            throw new IOException("Google Calendar API is not enabled");
        }
        
        try {
            final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
            
            // Load client secrets
            InputStream in = GoogleCalendarService.class.getResourceAsStream(CREDENTIALS_FILE_PATH);
            if (in == null) {
                throw new FileNotFoundException("Google Calendar credentials file not found");
            }
            
            GoogleClientSecrets clientSecrets;
            try {
                clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in, StandardCharsets.UTF_8));
            } finally {
                in.close();
            }
            
            // Build flow
            GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                    HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
                    .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(TOKENS_DIRECTORY_PATH)))
                    .setAccessType("offline")
                    .build();
            
            // Use LocalServerReceiver để handle OAuth callback
            LocalServerReceiver receiver = 
                new LocalServerReceiver.Builder()
                    .setPort(8888)
                    .build();
            
            // Use AuthorizationCodeInstalledApp để handle OAuth flow
            AuthorizationCodeInstalledApp authApp = 
                new AuthorizationCodeInstalledApp(flow, receiver);
            
            // Authorize và lưu credential (sẽ mở browser)
            Credential credential = authApp.authorize("user");
            
            log.info("OAuth flow completed successfully. Token saved.");
            return credential != null;
        } catch (GeneralSecurityException | IOException e) {
            log.error("Error initiating OAuth flow: {}", e.getMessage(), e);
            throw new IOException("Failed to initiate OAuth flow: " + e.getMessage(), e);
        }
    }
    
    /**
     * Xóa token cũ để authenticate lại
     */
    public void deleteToken() {
        try {
            java.io.File tokenFile = new java.io.File(TOKENS_DIRECTORY_PATH, "StoredCredential");
            if (tokenFile.exists()) {
                boolean deleted = tokenFile.delete();
                if (deleted) {
                    log.info("Token file deleted successfully");
                } else {
                    log.warn("Failed to delete token file");
                }
            } else {
                log.info("Token file does not exist, nothing to delete");
            }
        } catch (Exception e) {
            log.error("Error deleting token file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete token file: " + e.getMessage(), e);
        }
    }
}

