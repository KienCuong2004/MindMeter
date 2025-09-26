# 🧪 IP Filtering System - Manual Testing Guide

## Prerequisites

1. Backend server running on `http://localhost:8080`
2. Frontend server running on `http://localhost:3000`
3. Admin user logged in with JWT token

## Test Scenarios

### 1. Backend API Tests

#### Test 1.1: Get Statistics

```bash
curl -X GET "http://localhost:8080/api/admin/security/ip-filtering/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result:**

```json
{
  "enabled": true,
  "blacklistedCount": 0,
  "whitelistedCount": 0,
  "suspiciousCount": 0,
  "torExitNodesCount": 3,
  "allowedCountries": [
    "VN",
    "US",
    "GB",
    "CA",
    "AU",
    "DE",
    "FR",
    "JP",
    "KR",
    "SG"
  ],
  "blockedCountries": ["CN", "RU", "KP", "IR"]
}
```

#### Test 1.2: Test IP Address

```bash
curl -X POST "http://localhost:8080/api/admin/security/ip-filtering/test-ip" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.1"}'
```

**Expected Result:**

```json
{
  "ip": "192.168.1.1",
  "isBlocked": false,
  "reason": "IP is allowed"
}
```

#### Test 1.3: Test Suspicious IP

```bash
curl -X POST "http://localhost:8080/api/admin/security/ip-filtering/test-ip" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "127.0.0.1"}'
```

**Expected Result:**

```json
{
  "ip": "127.0.0.1",
  "isBlocked": true,
  "reason": "IP is blocked"
}
```

### 2. IP Management Tests

#### Test 2.1: Add IP to Blacklist

```bash
curl -X POST "http://localhost:8080/api/admin/security/ip-filtering/blacklist" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.100"}'
```

#### Test 2.2: Add IP to Whitelist

```bash
curl -X POST "http://localhost:8080/api/admin/security/ip-filtering/whitelist" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.1"}'
```

#### Test 2.3: Mark IP as Suspicious

```bash
curl -X POST "http://localhost:8080/api/admin/security/ip-filtering/suspicious" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.200"}'
```

### 3. Request Blocking Tests

#### Test 3.1: Test Blocked IP Access

```bash
curl -X GET "http://localhost:8080/api/payment/create-checkout-session" \
  -H "X-Forwarded-For: 10.0.0.100" \
  -H "Content-Type: application/json"
```

**Expected Result:** HTTP 403 Forbidden

#### Test 3.2: Test Allowed IP Access

```bash
curl -X GET "http://localhost:8080/api/payment/create-checkout-session" \
  -H "X-Forwarded-For: 203.0.113.1" \
  -H "Content-Type: application/json"
```

**Expected Result:** HTTP 200 OK (or appropriate response)

### 4. Frontend Dashboard Tests

#### Test 4.1: Access Dashboard

1. Navigate to `http://localhost:3000/test-ip-filtering`
2. Verify dashboard loads without errors
3. Check statistics display correctly

#### Test 4.2: Add IP to List

1. Select "Blacklist" from dropdown
2. Enter IP: `10.0.0.200`
3. Click "Add" button
4. Verify IP appears in blacklisted list

#### Test 4.3: Test IP Address

1. Enter IP: `10.0.0.200` in test field
2. Click "Test" button
3. Verify result shows "IP is blocked"

#### Test 4.4: Remove IP from List

1. Find IP `10.0.0.200` in blacklisted list
2. Click trash icon
3. Verify IP is removed from list

### 5. Security Headers Tests

#### Test 5.1: Check Security Headers

```bash
curl -I "http://localhost:8080/api/admin/security/ip-filtering/stats"
```

**Expected Headers:**

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
Referrer-Policy: strict-origin-when-cross-origin
```

### 6. Error Handling Tests

#### Test 6.1: Invalid IP Format

```bash
curl -X POST "http://localhost:8080/api/admin/security/ip-filtering/test-ip" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "invalid-ip-format"}'
```

**Expected Result:** IP should be blocked

#### Test 6.2: Empty IP

```bash
curl -X POST "http://localhost:8080/api/admin/security/ip-filtering/test-ip" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": ""}'
```

**Expected Result:** IP should be blocked

#### Test 6.3: Null IP

```bash
curl -X POST "http://localhost:8080/api/admin/security/ip-filtering/test-ip" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": null}'
```

**Expected Result:** IP should be blocked

### 7. Performance Tests

#### Test 7.1: Concurrent Requests

```bash
# Test multiple concurrent requests
for i in {1..10}; do
  curl -X POST "http://localhost:8080/api/admin/security/ip-filtering/test-ip" \
    -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"ip": "192.168.1.'$i'"}' &
done
wait
```

#### Test 7.2: Large IP List

1. Add 100 IPs to blacklist
2. Test response time for statistics endpoint
3. Verify system performance

### 8. Integration Tests

#### Test 8.1: Rate Limiting + IP Filtering

1. Add IP to blacklist
2. Make multiple requests from that IP
3. Verify IP filtering blocks before rate limiting

#### Test 8.2: Admin Access

1. Test admin endpoints with valid admin token
2. Test admin endpoints with invalid token
3. Verify proper authorization

## Test Checklist

- [ ] Statistics endpoint returns correct data
- [ ] IP testing works for valid IPs
- [ ] IP testing blocks suspicious IPs
- [ ] Blacklist management works
- [ ] Whitelist management works
- [ ] Suspicious IP marking works
- [ ] Request blocking works correctly
- [ ] Security headers are present
- [ ] Error handling works properly
- [ ] Frontend dashboard functions correctly
- [ ] Performance is acceptable
- [ ] Integration with rate limiting works

## Troubleshooting

### Common Issues

1. **403 Forbidden on Admin Endpoints**

   - Check JWT token is valid
   - Verify user has ADMIN role

2. **IP Not Being Blocked**

   - Check IP filtering is enabled
   - Verify IP is in blacklist
   - Check interceptor order

3. **Frontend Dashboard Not Loading**

   - Check backend is running
   - Verify CORS configuration
   - Check browser console for errors

4. **Security Headers Missing**
   - Verify SecurityHeadersConfig is loaded
   - Check Spring Security configuration

### Debug Commands

```bash
# Check if backend is running
curl -I http://localhost:8080/api/health

# Check IP filtering status
curl -X GET "http://localhost:8080/api/admin/security/ip-filtering/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test specific IP
curl -X POST "http://localhost:8080/api/admin/security/ip-filtering/test-ip" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "YOUR_TEST_IP"}'
```

## Success Criteria

✅ All API endpoints return expected responses
✅ IP filtering blocks malicious IPs
✅ IP filtering allows legitimate IPs
✅ Frontend dashboard is functional
✅ Security headers are present
✅ Error handling works properly
✅ Performance is acceptable
✅ Integration works correctly
