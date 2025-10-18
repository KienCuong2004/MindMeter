# Security Policy - MindMeter

## Critical: Never Commit Sensitive Data

This repository contains sensitive configuration files that must NEVER be committed to version control.

## Files That Should NOT Be Committed

- `backend/src/main/resources/application.properties` - Contains API keys, database credentials, and secrets
- `.env` files - Environment variables
- `*.key` files - Private keys
- `*.pem` files - SSL/TLS certificates
- `secrets.json` - Secret configurations

## Safe Files to Commit

- `backend/src/main/resources/application.properties.example` - Template without secrets
- `backend/env.example` - Example environment variables
- Configuration templates with placeholder values

## Setup Instructions

### 1. Configure Application Properties

Copy the example file and fill in your actual credentials:

```bash
cp backend/src/main/resources/application.properties.example backend/src/main/resources/application.properties
```

Edit `application.properties` with your actual values for:

- Database credentials
- JWT secret keys
- Email server credentials
- OAuth2 client secrets
- Payment gateway API keys (PayPal, VNPay)
- OpenAI API keys

### 2. Verify .gitignore

Ensure these patterns are in your `.gitignore`:

```gitignore
# Sensitive configuration files
backend/src/main/resources/application.properties
backend/.env
frontend/.env

# Private keys and certificates
*.key
*.pem
**/secrets.json

# Environment-specific configs
application-prod.properties
application-dev.properties
```

## Security Checklist

Before committing, verify:

- [ ] No database passwords in committed files
- [ ] No JWT secrets in committed files
- [ ] No OAuth2 credentials (Google Client ID/Secret) in committed files
- [ ] No PayPal API keys in committed files
- [ ] No VNPay merchant credentials in committed files
- [ ] No OpenAI API keys in committed files
- [ ] No email server passwords in committed files

## Required Environment Variables

Set these environment variables in your system or deployment platform:

### Database Configuration

```bash
DB_URL=jdbc:mysql://localhost:3306/mindmeter
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password
```

### Authentication & Security

```bash
JWT_SECRET=your_256_bit_secret_key
JWT_EXPIRATION=86400000
```

### Email Service (Gmail SMTP)

```bash
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_specific_password
```

### Google OAuth2

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
```

### Payment Gateways

```bash
# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# VNPay
VNPAY_TMN_CODE=your_vnpay_terminal_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/vnpay/return
```

### AI Service

```bash
OPENAI_API_KEY=sk-proj-your_openai_api_key
```

## If You Accidentally Committed Secrets

### Immediate Actions Required

1. **Immediately revoke/rotate all exposed credentials**

   - Regenerate all API keys
   - Change all passwords
   - Update OAuth2 client secrets
   - Rotate JWT secrets

2. **Remove the commit from Git history**

   Using git-filter-repo (recommended):

   ```bash
   git filter-repo --path backend/src/main/resources/application.properties --invert-paths
   ```

   Or using BFG Repo-Cleaner:

   ```bash
   bfg --delete-files application.properties
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **Force push to remote**

   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

4. **Notify team members**
   - Alert all contributors about the security incident
   - Request team members to rebase their local branches
   - Share new credentials through secure channels

## Security Best Practices

### Development

- Use environment variables for all sensitive data
- Never hardcode credentials in source code
- Use `.env.example` files to document required variables
- Regularly rotate API keys and secrets

### Production

- Use secure secret management services (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- Enable audit logging for secret access
- Implement least privilege access control
- Use HTTPS for all production deployments
- Enable rate limiting on APIs
- Implement proper input validation and sanitization

### Code Reviews

- Review all commits for accidentally committed secrets
- Use automated tools to scan for secrets (git-secrets, trufflehog)
- Set up pre-commit hooks to prevent secret commits

## Reporting Security Vulnerabilities

If you discover a security vulnerability in MindMeter:

1. **Do NOT** create a public GitHub issue
2. Email the development team directly with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested remediation (if any)
3. Allow reasonable time for the team to address the issue before public disclosure

## Security Contact

For security-related inquiries, please contact the development team through private channels.

---

**Last Updated**: 2025-01-18  
**Security Policy Version**: 1.0
