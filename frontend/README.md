# MindMeter Frontend

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.0-38B2AC.svg)](https://tailwindcss.com/)
[![i18next](https://img.shields.io/badge/i18next-23.7.16-green.svg)](https://www.i18next.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.5.0-orange.svg)](https://www.chartjs.org/)

## Overview

MindMeter Frontend is a modern React application providing an intelligent mental health assessment platform interface. Built with React 18, Tailwind CSS, and featuring AI chatbot integration, automatic appointment booking, and comprehensive multi-language support.

## Features

### Psychological Assessment Interface

- Interactive test-taking interface for DASS-21/42, BDI, RADS, EPDS, and SAS assessments
- Real-time progress tracking with visual indicators
- Comprehensive result visualization using Chart.js
- Complete test history with trend analysis and comparison
- Export functionality for test results and reports

### AI Chatbot Integration

- OpenAI-powered chatbot with mental health expertise
- Intelligent test recommendations based on user symptoms
- Smart expert matching and suggestions
- Natural language appointment booking
- Multi-language chat support (Vietnamese and English)
- Context-aware conversation flow

### Appointment Management

- Intuitive calendar-based booking interface
- Expert profile browsing and selection
- Real-time availability checking
- Appointment lifecycle management
- Cancellation handling with reason tracking
- WebSocket-based live updates

### User Management

- Role-based dashboards (Admin, Expert, Student)
- Comprehensive profile management with avatar support
- JWT-based secure authentication
- Google OAuth2 social login
- Responsive design optimized for all devices
- Anonymous user support with limited access

### Internationalization

- Full Vietnamese and English language support
- Dynamic language switching without page reload
- Locale-aware date, time, and number formatting
- Intelligent fallback for missing translations
- Persistent language preference

### Data Visualization

- Interactive charts powered by Chart.js and Recharts
- Real-time statistics and metrics
- Excel export functionality for reports
- Trend analysis with historical data comparison
- Responsive charts for all screen sizes

## Technology Stack

### Core Framework

- **React 18.2.0**: Hooks, Context API, Functional Components
- **React Router DOM 7.6.1**: Client-side routing and navigation
- **React Icons 5.5.0**: Comprehensive icon library

### Styling & UI

- **Tailwind CSS 3.3.0**: Utility-first CSS framework
- **Custom Components**: Reusable, accessible UI components
- **Responsive Design**: Mobile-first approach
- **Dark/Light Mode**: Theme switching with persistence

### State Management

- **React Hooks**: useState, useEffect, useContext, useReducer
- **Custom Hooks**: Reusable logic for common operations
- **Local Storage**: Persistent state management
- **Context API**: Global state management

### Internationalization

- **i18next 23.7.16**: Internationalization framework
- **React i18next**: React integration
- **Dynamic Loading**: Runtime language switching
- **Fallback Management**: Graceful missing translation handling

### Data Visualization

- **Chart.js 4.5.0**: Interactive charts and graphs
- **React Chart.js 2**: React wrapper for Chart.js
- **Recharts 3.0.2**: Additional charting capabilities
- **Responsive Charts**: Auto-resizing for all viewports

### HTTP & API

- **Axios 1.9.0**: HTTP client with interceptors
- **Custom authFetch**: Wrapper for authenticated requests
- **Error Handling**: Comprehensive error management
- **Interceptors**: Automatic token management

### Utilities

- **XLSX 0.18.5**: Excel file generation and export
- **React Quill 2.0.0**: Rich text editor
- **Validator.js**: Input validation and sanitization

## Project Structure

```
frontend/
├── public/                    # Static assets
│   ├── index.html            # Main HTML template
│   ├── favicon.ico           # Application icon
│   └── manifest.json         # PWA manifest
├── src/
│   ├── components/           # Reusable components (30+)
│   │   ├── LoginForm.js
│   │   ├── RegisterForm.js
│   │   ├── ForgotPasswordForm.js
│   │   ├── ChatBotModal.js
│   │   ├── AppointmentBookingModal.js
│   │   └── ...
│   ├── pages/               # Page components (33+)
│   │   ├── AdminDashboardPage.js
│   │   ├── ExpertDashboardPage.js
│   │   ├── StudentHomePage.js
│   │   ├── StudentTestPage.js
│   │   ├── ForgotPasswordPage.js
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useTheme.js
│   │   └── ...
│   ├── utils/               # Utility functions
│   ├── services/            # API services
│   │   ├── authService.js
│   │   ├── testService.js
│   │   └── ...
│   ├── locales/             # i18n translations
│   │   ├── en/
│   │   │   ├── translation.json
│   │   │   └── payment.json
│   │   └── vi/
│   │       ├── translation.json
│   │       └── payment.json
│   ├── styles/              # Global styles
│   ├── authFetch.js         # Authenticated HTTP client
│   ├── App.js               # Main app component
│   ├── AppRoutes.js         # Route configuration
│   ├── index.js             # App entry point
│   └── i18n.js              # i18n configuration
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind CSS configuration
├── craco.config.js           # CRACO configuration
├── webpack.config.js         # Webpack configuration
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Backend API running on http://localhost:8080

### Installation

```bash
# Clone repository
git clone https://github.com/KienCuong2004/MindMeter.git
cd MindMeter/frontend

# Install dependencies
npm install

# Start development server
npm start
```

Application will be available at http://localhost:3000

### Environment Configuration

Create `.env` file in the frontend root directory:

```bash
REACT_APP_API_URL=http://localhost:8080
REACT_APP_APP_NAME=MindMeter
```

## Available Scripts

### Development

```bash
# Start development server with hot reload
npm start

# Start with host binding (for network access)
npm run start:host
```

### Building

```bash
# Create production build
npm run build

# Build for specific environment
npm run build:dev
npm run build:prod
```

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint errors automatically
npm run lint:fix

# Format code with Prettier
npm run format
```

## Configuration

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...},
      },
      animation: {...},
    },
  },
  plugins: [],
};
```

### i18n Configuration

```javascript
// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    vi: { translation: viTranslation },
  },
  lng: "vi",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});
```

### Proxy Configuration

```json
// package.json
{
  "proxy": "http://localhost:8080"
}
```

## Component Development

### Creating Components

```jsx
import React from "react";
import { useTranslation } from "react-i18next";

const Button = ({
  children,
  variant = "primary",
  onClick,
  disabled = false,
}) => {
  const { t } = useTranslation();

  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
```

### Using i18n

```jsx
import { useTranslation } from "react-i18next";

const MyComponent = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  return (
    <div>
      <h1>{t("welcome.title")}</h1>
      <p>{t("welcome.description")}</p>
      <button onClick={() => changeLanguage("vi")}>Vietnamese</button>
      <button onClick={() => changeLanguage("en")}>English</button>
    </div>
  );
};
```

### Using authFetch

```javascript
import { authFetch } from "./authFetch";

const fetchUserData = async () => {
  try {
    const response = await authFetch("/api/user/profile");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};
```

## Testing

### Component Testing

```jsx
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "./Button";

describe("Button Component", () => {
  test("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  test("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDisabled();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test Button.test.js

# Run tests in CI mode
npm run test:ci
```

## Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# Output directory: build/
# Contains optimized, minified files ready for deployment
```

### Deployment Platforms

**Netlify**

```bash
# Build command
npm run build

# Publish directory
build
```

**Vercel**

```bash
# Vercel will auto-detect React app
# Just connect GitHub repository
```

**AWS S3 + CloudFront**

```bash
# Build locally
npm run build

# Upload build/ directory to S3 bucket
aws s3 sync build/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

**Docker**

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Security Considerations

- Never commit `.env` files with sensitive data
- Validate all user inputs on both client and server
- Use HTTPS in production environments
- Implement proper CORS configuration
- Sanitize user-generated content (XSS prevention)
- Use Content Security Policy (CSP) headers
- Keep dependencies updated regularly
- Implement rate limiting for API requests

## Performance Optimization

- Code splitting with React.lazy() and Suspense
- Image optimization with WebP format and lazy loading
- Minimize bundle size with tree shaking
- Use memoization (useMemo, useCallback) for expensive operations
- Implement virtual scrolling for large lists
- Optimize re-renders with React.memo()
- Use production build for deployment
- Enable gzip/brotli compression

## Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes and commit: `git commit -m 'feat: add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Create Pull Request

### Code Standards

- **ESLint**: Follow configured rules
- **Prettier**: Use for code formatting
- **Component Structure**: Use functional components with hooks
- **Naming**: Use PascalCase for components, camelCase for functions
- **Documentation**: Document complex logic and components

## Troubleshooting

### Build Fails with Memory Error

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Dependencies Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### i18n Not Working

```bash
# Verify translation files exist
ls -la src/locales/en/
ls -la src/locales/vi/

# Check i18n configuration
cat src/i18n.js

# Clear browser cache and localStorage
```

### Proxy Issues

```bash
# Ensure backend is running on port 8080
# Check proxy configuration in package.json
# Restart development server
npm start
```

## Additional Resources

- [React Documentation](https://reactjs.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [i18next Documentation](https://www.i18next.com/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [React Router Documentation](https://reactrouter.com/)

## Support

- **Issues**: [GitHub Issues](https://github.com/KienCuong2004/MindMeter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/KienCuong2004/MindMeter/discussions)
- **Documentation**: Project wiki and inline code comments

---

**MindMeter Frontend** - Modern React application for mental health assessment and support.

**Version**: 1.0.0  
**Last Updated**: 2025-01-18
