# MindMeter - Mental Health Assessment Platform

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.0-green.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.3-38B2AC.svg)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)

## Overview

MindMeter is a comprehensive mental health assessment platform designed for students and psychological experts. The application integrates intelligent AI chatbot capabilities, automatic appointment booking, professional psychological assessment tools, and secure payment processing.

## Core Features

### Psychological Assessment System

- **DASS-21/DASS-42**: Depression, Anxiety, and Stress Scale assessment
- **BDI (Beck Depression Inventory)**: Depression assessment using Beck scale
- **RADS (Reynolds Adolescent Depression Scale)**: Adolescent depression screening
- **EPDS (Edinburgh Postnatal Depression Scale)**: Postpartum depression assessment
- **SAS (Self-Rating Anxiety Scale)**: Anxiety level assessment using Zung scale

### AI-Powered Chatbot

- 24/7 OpenAI-powered chatbot with mental health specialization
- Natural language appointment booking
- Intelligent test recommendations based on user symptoms
- Advanced NLP for intent recognition
- Expert matching and recommendations

### Appointment Management

- Natural language appointment creation
- Expert schedule management with conflict detection
- Time slot optimization and availability checking
- Complete appointment lifecycle management
- Structured cancellation handling with reason tracking

### Multi-Role User System

- **Admin Dashboard**: User management, system statistics, test results, announcements
- **Expert Dashboard**: Schedule management, student tracking, appointment handling
- **Student Dashboard**: Test taking, appointment booking, progress tracking
- Profile management with avatar support
- Anonymous user support with limited access

### Payment Integration

- **PayPal**: Secure payment processing for international transactions
- **VNPay**: Vietnamese payment gateway integration
- Subscription tiers: FREE, PLUS, PRO
- Complete payment history and transaction tracking
- Secure webhook handling for payment confirmation

### Authentication & Security

- JWT-based authentication with secure token management
- Google OAuth2 social login integration
- Role-based authorization (Admin, Expert, Student)
- Email verification with OTP system
- Password reset with secure OTP delivery
- CORS configuration and security headers

### Internationalization

- Full Vietnamese and English language support
- Dynamic language switching without page reload
- Locale-specific date, time, and number formatting
- Intelligent fallback handling for missing translations

### Testing & Quality Assurance

- 37+ comprehensive unit tests
- Integration testing for authentication and APIs
- Service layer testing (OtpService, PasswordGeneratorService, CurrencyService)
- JUnit 5, Mockito, and Spring Boot Test framework
- Automated testing in CI/CD pipeline

## Technology Stack

### Frontend

- React 18.2.0 with Hooks and Context API
- Tailwind CSS 3.3.3 for styling
- React Router DOM 7.6.1 for routing
- Chart.js 4.5.0 and Recharts 3.0.2 for data visualization
- i18next 23.7.16 for internationalization
- Axios 1.9.0 for HTTP requests
- XLSX 0.18.5 for Excel export
- React Icons 5.5.0
- React Quill 2.0.0 for rich text editing

### Backend

- Spring Boot 3.5.0
- Java 17 LTS
- Spring Security for authentication and authorization
- Spring Data JPA with Hibernate ORM
- MySQL 8.0 with HikariCP connection pooling
- JWT for token-based authentication
- Lombok for code reduction
- Spring Mail for email services
- Google OAuth2 for social authentication
- JUnit 5 and Mockito for testing

### DevOps & Tools

- Maven for Java dependency management
- npm for frontend package management
- Git for version control
- VS Code and IntelliJ IDEA for development
- Postman for API testing

## Project Structure

```
MindMeter/
├── frontend/                   # React 18.2.0 application
│   ├── src/
│   │   ├── components/        # 30+ reusable UI components
│   │   ├── pages/             # 33+ page components
│   │   ├── services/          # API services
│   │   ├── locales/           # i18n translations (en/vi)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   └── App.js             # Main application
│   ├── package.json
│   └── tailwind.config.js
├── backend/                    # Spring Boot 3.5.0 application
│   ├── src/main/java/com/shop/backend/
│   │   ├── controller/        # 16+ REST API controllers
│   │   ├── service/           # 20+ business logic services
│   │   ├── repository/        # Data access layer
│   │   ├── entity/            # JPA entities
│   │   ├── dto/               # Data transfer objects
│   │   ├── security/          # Security configuration
│   │   └── config/            # Application configuration
│   ├── src/test/java/         # Unit and integration tests
│   ├── pom.xml
│   └── uploads/               # File uploads (avatars)
├── database/                   # Database scripts
│   └── MindMeter.sql          # Optimized MySQL schema
├── SECURITY.md                 # Security guidelines
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # Apache License 2.0
└── README.md                   # This file
```

## Installation and Setup

### System Requirements

- Java 17 or higher
- Node.js 18 or higher
- MySQL 8.0 or higher
- Maven 3.8 or higher

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy application properties template
cp src/main/resources/application.properties.example src/main/resources/application.properties

# Edit application.properties with your database credentials and API keys
# Configure: MySQL, JWT, Email (Gmail), OAuth2, PayPal, VNPay, OpenAI

# Build and run
mvn clean install
mvn spring-boot:run
```

Backend will start on `http://localhost:8080`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will start on `http://localhost:3000`

### Database Setup

```bash
# Create MySQL database
CREATE DATABASE mindmeter;

# Option 1: Let Spring Boot auto-create tables (development)
# Set in application.properties: spring.jpa.hibernate.ddl-auto=create

# Option 2: Use optimized schema with indexes (production)
mysql -u root -p mindmeter < database/MindMeter.sql
```

## Configuration

### Backend Configuration (application.properties)

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/mindmeter
spring.datasource.username=your_username
spring.datasource.password=your_password

# HikariCP Connection Pool
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000

# JWT
jwt.secret=your_256_bit_secret_key
jwt.expiration=86400000

# Email (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password

# Google OAuth2
spring.security.oauth2.client.registration.google.client-id=your_client_id
spring.security.oauth2.client.registration.google.client-secret=your_client_secret

# PayPal
paypal.client.id=your_paypal_client_id
paypal.client.secret=your_paypal_client_secret
paypal.mode=sandbox

# VNPay
vnpay.tmnCode=your_vnpay_terminal_code
vnpay.hashSecret=your_vnpay_hash_secret
vnpay.url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnpay.returnUrl=http://localhost:3000/payment/vnpay/return

# OpenAI API
openai.api.key=sk-proj-your_openai_api_key
```

### Frontend Configuration (.env)

```bash
REACT_APP_API_URL=http://localhost:8080
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## API Endpoints

### Authentication & User Management

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/forgot-password/request-otp` - Request password reset OTP
- `POST /api/auth/forgot-password/verify-otp` - Verify OTP and reset password

### Psychological Tests

- `GET /api/depression-tests` - Get available tests
- `POST /api/depression-tests/submit` - Submit test responses
- `GET /api/depression-tests/history` - Get test history
- `GET /api/depression-tests/results/{id}` - Get specific test result
- `GET /api/depression-tests/questions` - Get test questions

### Appointments

- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Cancel appointment
- `GET /api/expert-schedules` - Get expert availability

### AI Chatbot

- `POST /api/chatbot/message` - Send message to chatbot
- `POST /api/auto-booking` - Create appointment through AI
- `GET /api/chatbot/history` - Get chat history

### Payments

- `POST /api/payment/paypal/create` - Create PayPal payment
- `POST /api/payment/paypal/capture` - Capture PayPal payment
- `POST /api/payment/vnpay/create` - Create VNPay payment
- `GET /api/payment/vnpay/return` - VNPay payment return callback
- `GET /api/payment/history` - Get payment history

### Admin Management

- `GET /api/admin/users` - Get all users (Admin only)
- `GET /api/admin/statistics` - Get system statistics (Admin only)
- `GET /api/admin/test-results` - Get all test results (Admin only)
- `POST /api/admin/announcements` - Create announcements (Admin only)

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=OtpServiceTest

# Run tests with coverage report
mvn test jacoco:report
```

### Frontend Tests

```bash
cd frontend

# Run tests in watch mode
npm test

# Run tests with coverage
npm run test:coverage
```

## Security Features

- JWT token-based authentication with secure secret keys
- Role-based access control (RBAC) for Admin, Expert, Student
- Input validation and sanitization on all endpoints
- SQL injection protection through JPA parameterized queries
- CORS configuration with allowed origins
- OAuth2 integration for Google social login
- Password hashing with BCrypt
- OTP-based password reset with expiration
- Email verification for new accounts
- Secure file upload for avatars
- CSRF protection
- Rate limiting on authentication endpoints

## Deployment

### Production Build

```bash
# Backend
cd backend
mvn clean package -Pprod

# Frontend
cd frontend
npm run build
```

### Environment Configuration

For production deployment, configure:

- Database connection with production credentials
- JWT secret with strong 256-bit key
- Email server with production SMTP
- OAuth2 with production credentials
- PayPal/VNPay with production API keys
- OpenAI with production API key
- CORS with production frontend URL
- HTTPS/SSL certificates

### HikariCP Configuration

Development:

```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
```

Production:

```properties
spring.datasource.hikari.maximum-pool-size=50
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.connection-timeout=60000
```

## Performance Optimizations

- HikariCP connection pooling for database access
- 47+ MySQL indexes for query optimization
- React lazy loading for code splitting
- Image optimization and lazy loading
- Caching strategies for API responses
- Database query optimization with JPA
- WebSocket for real-time notifications
- Environment-specific configurations

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Coding Standards

- Java: Follow Spring Boot conventions and checkstyle rules
- JavaScript: Use ESLint and Prettier for code formatting
- Git: Use conventional commit messages (feat, fix, docs, refactor, test)
- Testing: Write unit tests for new features

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

### License Summary

- Commercial use: Allowed
- Modification: Allowed
- Distribution: Allowed
- Patent use: Granted
- Private use: Allowed
- Liability: Limited
- Warranty: None

## Support

- Documentation: See inline code documentation and wiki
- Issues: Report bugs via [GitHub Issues](https://github.com/KienCuong2004/MindMeter/issues)
- Security: Review [SECURITY.md](SECURITY.md) for security policies

## Key Highlights

- High-performance HikariCP connection pooling
- Comprehensive psychological assessment tools
- AI-powered chatbot with OpenAI integration
- Dual payment gateway support (PayPal + VNPay)
- Full internationalization (English + Vietnamese)
- Production-ready with monitoring and security
- Role-based access control system
- Real-time WebSocket notifications
- Responsive modern UI with dark mode
- Extensive test coverage (37+ unit tests)

---

**MindMeter** - Mental health assessment platform built with React, Spring Boot, and modern web technologies.

**Version**: 1.0.0  
**Last Updated**: 2025-01-18
