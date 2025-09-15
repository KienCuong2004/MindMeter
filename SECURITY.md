# 🔒 Security Guide - MindMeter

## ⚠️ IMPORTANT: Never Commit Sensitive Data!

This repository contains sensitive configuration files that should NEVER be committed to version control.

## 🚫 Files That Should NOT Be Committed

- `backend/src/main/resources/application.properties` - Contains real API keys and secrets
- `.env` files - Environment variables
- `*.key` files - Private keys
- `*.pem` files - Certificates
- `secrets.json` - Secret configurations

## ✅ Safe Files to Commit

- `backend/src/main/resources/application.properties.template` - Template without secrets
- `backend/env.example` - Example environment variables
- Configuration templates

## 🔧 Setup Instructions

### 1. Fill in Your Secrets

Edit the copied files with your actual API keys and secrets.

### 2. Verify .gitignore

Ensure these files are in your .gitignore:

```
backend/src/main/resources/application.properties
backend/.env
frontend/.env
```

## 🚨 Security Checklist

- [ ] No API keys in committed files
- [ ] No database passwords in committed files
- [ ] No JWT secrets in committed files
- [ ] No OAuth2 credentials in committed files
- [ ] No Stripe keys in committed files
- [ ] No OpenAI API keys in committed files

## 🔐 Environment Variables

Set these environment variables in your system:

```bash
# Database
export DB_USERNAME=your_username
export DB_PASSWORD=your_password

# JWT
export JWT_SECRET=your_jwt_secret

# Email
export EMAIL_USERNAME=your_email
export EMAIL_PASSWORD=your_app_password

# Google OAuth2
export GOOGLE_CLIENT_ID=your_client_id
export GOOGLE_CLIENT_SECRET=your_client_secret

# Stripe
export STRIPE_API_KEY_TEST=your_stripe_key
export STRIPE_PUBLIC_KEY_TEST=your_stripe_public_key
export STRIPE_WEBHOOK_SECRET_TEST=your_webhook_secret

# OpenAI
export OPENAI_API_KEY=your_openai_key
```

## 🆘 If You Accidentally Committed Secrets

1. **IMMEDIATELY** revoke/rotate all exposed keys
2. Remove the commit from history:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch backend/src/main/resources/application.properties' \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push to remote:
   ```bash
   git push origin --force --all
   ```
4. Notify team members to update their local repositories

## 📞 Security Contact

If you discover a security vulnerability, please contact the development team immediately.
