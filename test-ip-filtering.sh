#!/bin/bash

# IP Filtering System Test Script
# This script tests all IP filtering endpoints

BASE_URL="http://localhost:8080"
ADMIN_TOKEN="your-admin-jwt-token-here"  # Replace with actual admin token

echo "🛡️ Testing IP Filtering System"
echo "================================"

# Test 1: Get Statistics
echo "📊 Test 1: Get IP Filtering Statistics"
curl -X GET "$BASE_URL/api/admin/security/ip-filtering/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 2: Test IP Address (should be allowed)
echo "🔍 Test 2: Test Valid IP Address"
curl -X POST "$BASE_URL/api/admin/security/ip-filtering/test-ip" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.1"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 3: Test Suspicious IP (should be blocked)
echo "⚠️ Test 3: Test Suspicious IP Address"
curl -X POST "$BASE_URL/api/admin/security/ip-filtering/test-ip" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "127.0.0.1"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 4: Add IP to Blacklist
echo "🚫 Test 4: Add IP to Blacklist"
curl -X POST "$BASE_URL/api/admin/security/ip-filtering/blacklist" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.100"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 5: Add IP to Whitelist
echo "✅ Test 5: Add IP to Whitelist"
curl -X POST "$BASE_URL/api/admin/security/ip-filtering/whitelist" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.1"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 6: Mark IP as Suspicious
echo "⚠️ Test 6: Mark IP as Suspicious"
curl -X POST "$BASE_URL/api/admin/security/ip-filtering/suspicious" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.200"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 7: Get Blacklisted IPs
echo "📋 Test 7: Get Blacklisted IPs"
curl -X GET "$BASE_URL/api/admin/security/ip-filtering/blacklist" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 8: Get Whitelisted IPs
echo "📋 Test 8: Get Whitelisted IPs"
curl -X GET "$BASE_URL/api/admin/security/ip-filtering/whitelist" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 9: Get Suspicious IPs
echo "📋 Test 9: Get Suspicious IPs"
curl -X GET "$BASE_URL/api/admin/security/ip-filtering/suspicious" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 10: Test Blocked IP Access
echo "🚫 Test 10: Test Blocked IP Access (should return 403)"
curl -X GET "$BASE_URL/api/payment/create-checkout-session" \
  -H "X-Forwarded-For: 10.0.0.100" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "✅ IP Filtering System Tests Completed!"
