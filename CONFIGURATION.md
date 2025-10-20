# MindMeter Configuration Guide

## Overview

MindMeter has been refactored to use configuration variables instead of hardcoded URLs, making it easier to deploy across different environments.

## Backend Configuration

### Application URLs

All URLs are now configurable in `application.yml`:

```yaml
app:
  # Frontend URLs
  frontend:
    url: http://localhost:3000
    base-url: http://localhost:3000
    # Additional development ports
    dev-ports:
      - http://localhost:3001
    # Production domains
    production-domains:
      - https://your-production-domain.com

  # Backend URLs
  backend:
    url: http://localhost:8080
    base-url: http://localhost:8080

  # API Configuration
  api:
    base-url: http://localhost:8080/api

  # OAuth Configuration
  oauth:
    google:
      redirect-uri: http://localhost:8080/login/oauth2/code/google

  # Payment Configuration
  payment:
    paypal:
      cancel-url: http://localhost:3000/payment/paypal?canceled=true
      return-url: http://localhost:3000/payment/paypal?success=true
    vnpay:
      return-url: http://localhost:3000/payment/vnpay/return
      ipn-url: http://localhost:8080/api/payment/vnpay/ipn
```

### For Production Deployment

Update the URLs in `application.yml`:

```yaml
app:
  frontend:
    url: https://your-frontend-domain.com
    base-url: https://your-frontend-domain.com
    # Additional development ports (empty for production)
    dev-ports: []
    # Production domains
    production-domains:
      - https://your-frontend-domain.com
      - https://www.your-frontend-domain.com

  backend:
    url: https://your-backend-domain.com
    base-url: https://your-backend-domain.com

  api:
    base-url: https://your-backend-domain.com/api

  oauth:
    google:
      redirect-uri: https://your-backend-domain.com/login/oauth2/code/google

  payment:
    paypal:
      cancel-url: https://your-frontend-domain.com/payment/paypal?canceled=true
      return-url: https://your-frontend-domain.com/payment/paypal?success=true
    vnpay:
      return-url: https://your-frontend-domain.com/payment/vnpay/return
      ipn-url: https://your-backend-domain.com/api/payment/vnpay/ipn
```

## Frontend Configuration

### Environment Variables

Frontend uses environment variables for API configuration:

```bash
# .env.local file
REACT_APP_API_URL=http://localhost:8080
```

### For Production Deployment

Create `.env.production` or update your build environment:

```bash
REACT_APP_API_URL=https://your-backend-domain.com
```

### Package.json Proxy

The proxy in `package.json` is still needed for development:

```json
{
  "proxy": "http://localhost:8080"
}
```

## Deployment Checklist

### Backend

- [ ] Update `app.frontend.url` in `application.yml`
- [ ] Update `app.backend.url` in `application.yml`
- [ ] Update OAuth redirect URIs
- [ ] Update payment return URLs
- [ ] Update VNPay IPN URL

### Frontend

- [ ] Set `REACT_APP_API_URL` environment variable
- [ ] Update proxy in `package.json` if needed for development

## Benefits

1. **Easy Deployment**: Change URLs in one place instead of multiple files
2. **Environment Flexibility**: Different URLs for development, staging, production
3. **Maintainability**: Centralized configuration management
4. **Security**: No hardcoded URLs in source code

## Migration Notes

- All hardcoded `localhost:3000` and `localhost:8080` URLs have been replaced with configuration variables
- Backend uses Spring Boot's `@Value` annotation to inject configuration
- Frontend uses `process.env.REACT_APP_API_URL` with fallback to localhost for development
- Configuration examples are provided in `application.yml.example`

## Files Modified

### Backend

- `application.yml` - Main configuration file
- `application.yml.example` - Configuration template
- All controllers with `@CrossOrigin` annotations
- Security configuration
- Payment services (PayPal, VNPay)
- Blog service for image URLs

### Frontend

- All API service files
- Authentication components
- Payment-related components
- AI statistics service

This refactoring makes MindMeter much more deployment-friendly and maintainable! 🚀
