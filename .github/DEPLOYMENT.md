# Deployment Guide

This document provides instructions for deploying the MindMeter application.

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **Java**: JDK 11 or higher
- **MySQL**: 8.0 or higher
- **npm**: 9.x or higher
- **Maven**: 3.6.x or higher

### Server Requirements

- Ubuntu 20.04 LTS or higher (recommended)
- Minimum 2GB RAM
- Minimum 20GB disk space
- HTTPS certificate (for production)

## GitHub Actions Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

Runs on every push to `master` or `develop` branches and on pull requests.

**Jobs:**

- `frontend-ci`: Lint, test, and build frontend
- `backend-ci`: Test, analyze, and package backend
- `security-scan`: Run security vulnerability scans
- `build-summary`: Generate build status summary

**Triggers:**

```yaml
on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master, develop]
```

### 2. Production Deployment (`deploy-production.yml`)

Deploys the application to production environment.

**Jobs:**

- `deploy-frontend`: Build and deploy frontend to production
- `deploy-backend`: Build and deploy backend to production
- `create-release`: Create GitHub release (on version tags)
- `deployment-summary`: Generate deployment summary

**Triggers:**

```yaml
on:
  push:
    branches: [master]
    tags: ["v*"]
  workflow_dispatch:
```

### 3. Code Quality Checks (`code-quality.yml`)

Runs comprehensive code quality and security checks.

**Jobs:**

- `frontend-quality`: ESLint, Prettier, complexity checks
- `backend-quality`: Checkstyle, SpotBugs, PMD
- `security-audit`: npm audit, OWASP Dependency Check
- `code-coverage`: Frontend and backend test coverage
- `quality-gate`: Quality checks summary

**Triggers:**

```yaml
on:
  pull_request:
    branches: [master, develop]
  schedule:
    - cron: "0 0 * * 0" # Weekly on Sunday
  workflow_dispatch:
```

## Environment Variables

### GitHub Secrets

Configure these secrets in your GitHub repository settings:

#### Required Secrets

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

#### Optional Secrets (for deployment)

- `DEPLOYMENT_URL`: Production frontend URL
- `BACKEND_URL`: Production backend URL
- `SSH_PRIVATE_KEY`: SSH key for server access
- `SERVER_HOST`: Production server hostname
- `SERVER_USER`: Production server username

#### Variables

Configure these variables in GitHub repository settings:

- `REACT_APP_API_URL`: Backend API URL (e.g., `https://api.mindmeter.com`)

### Frontend Environment Variables

Create `.env.production` in `frontend/` directory:

```env
REACT_APP_API_URL=https://api.mindmeter.com
REACT_APP_ENVIRONMENT=production
```

### Backend Environment Variables

Configure `application.yml` or use environment variables:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mindmeter
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
```

## Manual Deployment Steps

### Frontend Deployment

1. **Build the application:**

   ```bash
   cd frontend
   npm ci
   npm run build
   ```

2. **Deploy to web server:**

   ```bash
   # Example: Copy to Nginx web root
   sudo cp -r build/* /var/www/html/mindmeter/
   ```

3. **Configure web server (Nginx example):**

   ```nginx
   server {
       listen 80;
       server_name mindmeter.com;
       root /var/www/html/mindmeter;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Backend Deployment

1. **Build the application:**

   ```bash
   cd backend
   mvn clean package -DskipTests -Pprod
   ```

2. **Deploy JAR file:**

   ```bash
   # Copy JAR to server
   scp target/*.jar user@server:/opt/mindmeter/
   ```

3. **Create systemd service:**

   ```ini
   [Unit]
   Description=MindMeter Backend
   After=syslog.target network.target

   [Service]
   User=mindmeter
   WorkingDirectory=/opt/mindmeter
   ExecStart=/usr/bin/java -jar mindmeter-backend.jar
   StandardOutput=journal
   StandardError=journal
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

4. **Start the service:**
   ```bash
   sudo systemctl start mindmeter
   sudo systemctl enable mindmeter
   ```

## Database Setup

1. **Create database:**

   ```sql
   CREATE DATABASE mindmeter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'mindmeter'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON mindmeter.* TO 'mindmeter'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Run migrations:**
   ```bash
   mysql -u mindmeter -p mindmeter < database/MindMeter.sql
   ```

## Automated Deployment with GitHub Actions

### Setup Steps

1. **Configure GitHub Secrets:**

   - Go to repository Settings → Secrets and variables → Actions
   - Add required secrets listed above

2. **Configure deployment environment:**

   - Go to repository Settings → Environments
   - Create environment named `production`
   - Add protection rules if needed

3. **Trigger deployment:**
   - Push to `master` branch: Automatic deployment
   - Create version tag: Automatic release creation
   - Manual trigger: Go to Actions → Select workflow → Run workflow

### Creating a Release

1. **Tag a version:**

   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **GitHub Actions will:**
   - Build frontend and backend
   - Run all tests
   - Create release artifacts
   - Generate changelog
   - Publish GitHub release

## Monitoring and Logs

### Frontend Logs

- Browser console logs
- Network requests in browser DevTools

### Backend Logs

```bash
# View systemd logs
sudo journalctl -u mindmeter -f

# View application logs
tail -f /opt/mindmeter/logs/application.log
```

### GitHub Actions Logs

- Go to repository → Actions
- Select workflow run to view detailed logs

## Rollback Procedure

### Quick Rollback

```bash
# Frontend
cd /var/www/html/mindmeter
sudo rm -rf *
sudo cp -r /backup/mindmeter-previous/* .

# Backend
sudo systemctl stop mindmeter
cd /opt/mindmeter
cp mindmeter-backend-previous.jar mindmeter-backend.jar
sudo systemctl start mindmeter
```

### Rollback via GitHub

1. Go to repository → Releases
2. Download previous version artifacts
3. Deploy previous version manually

## Troubleshooting

### Build Failures

- Check workflow logs in GitHub Actions
- Verify all dependencies are installed
- Check for failing tests

### Deployment Issues

- Verify server connectivity
- Check environment variables
- Verify database connection
- Check server logs

### Performance Issues

- Check server resources (CPU, RAM, disk)
- Review application logs
- Monitor database queries
- Check network latency

## Support

For deployment issues or questions:

1. Check the logs
2. Review this documentation
3. Check GitHub Issues
4. Contact the development team

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** in production
4. **Regular security updates** for dependencies
5. **Backup database** regularly
6. **Monitor security vulnerabilities** via GitHub Actions
7. **Use strong passwords** for database and admin accounts
8. **Implement rate limiting** for APIs
9. **Enable CORS** properly
10. **Regular security audits**

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review and rotate secrets quarterly
- Database backup daily
- Log rotation weekly
- Security scans weekly (automated)
- Performance monitoring continuous

### Update Procedure

1. Create feature/fix branch
2. Make changes and test locally
3. Create pull request
4. Wait for CI/CD checks to pass
5. Review and merge to develop
6. Test in staging environment
7. Merge to master for production deployment
