# GitHub Secrets and Variables Configuration

This document outlines the required secrets and environment variables for the MindMeter GitHub Actions workflows.

## Required Secrets

Add these secrets to your GitHub repository settings (Settings > Secrets and variables > Actions):

### Deployment Configuration

- `DEPLOYMENT_URL` - Production frontend deployment URL (optional)
  - Example: `https://mindmeter.com`
- `BACKEND_URL` - Production backend deployment URL (optional)
  - Example: `https://api.mindmeter.com`
- `SSH_PRIVATE_KEY` - SSH private key for server deployment (optional)
- `SERVER_HOST` - Production server hostname (optional)
- `SERVER_USER` - Production server username (optional)

### Database Configuration

- `DB_HOST` - Database host URL
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

### Third-party Services

- `JWT_SECRET` - JWT signing secret
- `OAUTH_CLIENT_ID` - OAuth client ID for Google authentication
- `OAUTH_CLIENT_SECRET` - OAuth client secret

### Payment Gateways

- `VNPAY_TMN_CODE` - VNPay merchant code
- `VNPAY_SECRET_KEY` - VNPay secret key
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret

### Email Configuration

- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_USERNAME` - Email username
- `EMAIL_PASSWORD` - Email password

### AI Services

- `OPENAI_API_KEY` - OpenAI API key for AI analytics

## Environment Variables for Local Development

Create a `.env` file in the root directory with:

```env
# Backend
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/mindmeter
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=password
JWT_SECRET=your-jwt-secret-here
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret

# Frontend
REACT_APP_API_URL=http://localhost:8080
REACT_APP_ENVIRONMENT=development
```

## Testing Configuration

For GitHub Actions testing, the following test-specific values are used:

```yaml
# MySQL Test Database
MYSQL_ROOT_PASSWORD: root
MYSQL_DATABASE: mindmeter_test
MYSQL_USER: testuser
MYSQL_PASSWORD: testpass

# Test Profile
SPRING_PROFILES_ACTIVE: test
```

## Security Notes

1. Never commit secrets to version control
2. Use GitHub Secrets for sensitive data
3. Rotate secrets regularly
4. Use different secrets for different environments
5. Monitor secret usage in GitHub Actions logs

## GitHub Variables (Non-sensitive)

Add these variables to your GitHub repository (Settings > Secrets and variables > Actions > Variables):

- `REACT_APP_API_URL` - Backend API URL for production builds
  - Example: `https://api.mindmeter.com`
  - For development: `http://localhost:8080`

Note: Variables are not encrypted and can be viewed by anyone with repository access. Only use for non-sensitive configuration.

## Setting up Secrets

1. Go to your repository on GitHub
2. Click on Settings tab
3. In the left sidebar, click "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Add each secret with the exact name specified above
6. Save the secret

## Setting up Variables

1. Go to your repository on GitHub
2. Click on Settings tab
3. In the left sidebar, click "Secrets and variables" > "Actions"
4. Click on "Variables" tab
5. Click "New repository variable"
6. Add each variable with the exact name specified above
7. Save the variable

## Verification

After setting up secrets, you can verify they are working by:

1. Running the workflows manually
2. Checking the workflow logs for any secret-related errors
3. Ensuring environment variables are properly loaded in the application
