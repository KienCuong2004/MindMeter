# Docker Setup Guide - MindMeter

This guide explains how to run MindMeter using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose 2.0+
- At least 4GB RAM available for Docker
- 10GB free disk space

## Quick Start

### Development Environment

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd MindMeter
   ```

2. **Copy environment file**:

   ```bash
   cp docker-compose.env.example .env
   ```

3. **Edit `.env` file** with your configuration:

   - Database credentials
   - JWT secret (use a strong random string)
   - Email credentials (Gmail App Password)
   - OAuth2 credentials
   - API keys (OpenAI, PayPal, VNPay)

4. **Start all services**:

   ```bash
   docker-compose up -d
   ```

5. **Check logs**:

   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   docker-compose logs -f mysql
   ```

6. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - MySQL: localhost:3306

### Production Environment

1. **Copy environment file**:

   ```bash
   cp docker-compose.env.example .env
   ```

2. **Update `.env` with production values**:

   - Use strong passwords
   - Set `SPRING_PROFILES_ACTIVE=prod`
   - Set `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`
   - Configure SSL certificates in `nginx/ssl/`
   - Update `FRONTEND_URL` and `BACKEND_URL` with your domain

3. **Setup SSL certificates**:

   ```bash
   mkdir -p nginx/ssl
   # Copy your SSL certificates:
   # nginx/ssl/cert.pem
   # nginx/ssl/key.pem
   ```

4. **Start production stack**:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Access the application**:
   - Frontend: https://your-domain.com
   - Backend API: https://your-domain.com/api

## Docker Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Restart a specific service
docker-compose restart backend

# View logs
docker-compose logs -f [service-name]

# Execute command in container
docker-compose exec backend bash
docker-compose exec mysql mysql -u mindmeter -p mindmeter
```

### Database Operations

```bash
# Backup database
docker-compose exec mysql mysqldump -u mindmeter -p mindmeter > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u mindmeter -p mindmeter < backup.sql

# Access MySQL shell
docker-compose exec mysql mysql -u mindmeter -p mindmeter
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Check backend health
curl http://localhost:8080/actuator/health

# Check frontend health
curl http://localhost:3000/health
```

## Service Details

### Backend Service

- **Port**: 8080
- **Image**: Built from `backend/Dockerfile`
- **Health Check**: http://localhost:8080/actuator/health
- **Volumes**:
  - `backend_uploads`: File uploads (avatars, blog images)
  - `backend_logs`: Application logs (production only)

### Frontend Service

- **Port**: 3000 (dev) / 80 (prod via nginx)
- **Image**: Built from `frontend/Dockerfile`
- **Health Check**: http://localhost:3000/health
- **Build**: Multi-stage build with Nginx serving static files

### MySQL Service

- **Port**: 3306
- **Image**: mysql:8.0
- **Volumes**:
  - `mysql_data`: Database files
  - `./database/MindMeter.sql`: Initialization script

### Nginx (Production Only)

- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Image**: nginx:alpine
- **SSL**: Configured in `nginx/ssl/`
- **Features**:
  - Reverse proxy
  - Rate limiting
  - SSL/TLS termination
  - Security headers

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs [service-name]

# Check if ports are in use
netstat -ano | findstr :8080
netstat -ano | findstr :3306

# Remove and recreate containers
docker-compose down
docker-compose up -d --force-recreate
```

### Database connection issues

```bash
# Check if MySQL is healthy
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Test connection
docker-compose exec backend ping mysql
```

### Build failures

```bash
# Clean build (no cache)
docker-compose build --no-cache

# Remove old images
docker system prune -a

# Check disk space
docker system df
```

### Permission issues (Linux/Mac)

```bash
# Fix upload directory permissions
docker-compose exec backend chown -R spring:spring /app/uploads
```

## Development Tips

1. **Hot Reload**: For development, mount source code as volumes:

   ```yaml
   volumes:
     - ./backend/src:/app/src
     - ./frontend/src:/app/src
   ```

2. **Database migrations**: The database is initialized from `database/MindMeter.sql` on first start.

3. **Environment variables**: Use `.env` file for all configuration. Never commit this file.

4. **Debugging**:

   ```bash
   # Shell into backend container
   docker-compose exec backend sh

   # Check application properties
   docker-compose exec backend env | grep SPRING
   ```

## Production Deployment

### Before Deployment

1. ✅ Set strong passwords in `.env`
2. ✅ Configure SSL certificates
3. ✅ Set `SPRING_PROFILES_ACTIVE=prod`
4. ✅ Update domain names in environment variables
5. ✅ Configure backup strategy for MySQL volumes
6. ✅ Set up monitoring and logging
7. ✅ Review resource limits in `docker-compose.prod.yml`

### Deployment Steps

1. **Build and push images** (if using registry):

   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker tag mindmeter-backend:latest your-registry/mindmeter-backend:latest
   docker tag mindmeter-frontend:latest your-registry/mindmeter-frontend:latest
   docker push your-registry/mindmeter-backend:latest
   docker push your-registry/mindmeter-frontend:latest
   ```

2. **Start services**:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Monitor startup**:

   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

4. **Verify health**:
   ```bash
   curl https://your-domain.com/health
   curl https://your-domain.com/api/actuator/health
   ```

### Backup Strategy

```bash
# Daily database backup
docker-compose exec mysql mysqldump -u mindmeter -p mindmeter | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup uploads
docker run --rm -v mindmeter_backend_uploads_prod:/data -v $(pwd):/backup alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz /data
```

## Resource Requirements

### Development

- **CPU**: 2 cores minimum
- **RAM**: 4GB minimum
- **Disk**: 10GB free space

### Production

- **CPU**: 4 cores recommended
- **RAM**: 8GB recommended
- **Disk**: 50GB+ for data and logs
- **Network**: Stable connection for external APIs

## Security Notes

1. **Never commit `.env` file** - it contains secrets
2. **Use strong passwords** - especially for MySQL root
3. **Rotate JWT secrets** regularly in production
4. **Keep images updated** - regularly pull security updates
5. **Use SSL in production** - configure certificates properly
6. **Restrict network access** - use firewalls appropriately
7. **Monitor logs** - set up log aggregation and alerting

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MySQL Docker Hub](https://hub.docker.com/_/mysql)
