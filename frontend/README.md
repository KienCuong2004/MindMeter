# 🧠 MindMeter Frontend

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.0-38B2AC.svg)](https://tailwindcss.com/)
[![i18next](https://img.shields.io/badge/i18next-23.7.16-green.svg)](https://www.i18next.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.5.0-orange.svg)](https://www.chartjs.org/)

## 📋 Overview

**MindMeter Frontend** is a modern React application that provides an intelligent mental health assessment platform. Built with React 18, Tailwind CSS, and advanced features like AI chatbot integration, automatic appointment booking, and multi-language support.

## ✨ Features

### 🧪 Psychological Assessment Interface

- **Interactive Test Taking**: Beautiful, responsive interface for DASS-21/42, BDI, RADS, EPDS, and SAS tests
- **Real-time Progress**: Visual progress indicators and question navigation
- **Result Visualization**: Comprehensive charts and detailed analysis of test results
- **Test History**: Complete history of all taken tests with trend analysis

### 🤖 AI Chatbot Integration

- **Intelligent Conversations**: OpenAI-powered chatbot with mental health expertise
- **Automatic Test Recommendations**: AI suggests appropriate tests based on user symptoms
- **Smart Expert Suggestions**: Recommends suitable psychological experts
- **Automatic Appointment Booking**: Process booking requests through natural language
- **Multi-language Support**: Chat in Vietnamese or English

### 📅 Appointment Management

- **Smart Booking Interface**: Intuitive calendar and time slot selection
- **Expert Profiles**: Browse and select from available psychological experts
- **Automatic Scheduling**: AI-powered appointment suggestions
- **Cancellation Handling**: Beautiful modals for managing appointments
- **Real-time Updates**: Live status updates and notifications

### 👥 User Management

- **Role-based Dashboards**: Customized interfaces for Admin, Expert, and Student roles
- **Profile Management**: Comprehensive user profile editing and management
- **Authentication**: Secure JWT-based authentication system
- **Responsive Design**: Optimized for all devices and screen sizes

### 🌐 Internationalization (i18n)

- **Vietnamese & English**: Full language support with smooth switching
- **Dynamic Content**: All text, dates, and formats localized
- **Fallback System**: Intelligent fallback to English for missing translations
- **Locale-aware Formatting**: Dates, times, and numbers formatted according to language

### 📊 Advanced Analytics

- **Interactive Charts**: Chart.js powered visualizations
- **Real-time Statistics**: Live updates of user activity and test results
- **Data Export**: Excel export functionality for reports
- **Trend Analysis**: Historical data visualization and comparison

## 🛠️ Technology Stack

### Core Framework

- **React 18.2.0**: Latest React with Hooks, Context API, and Functional Components
- **React Router**: Client-side routing and navigation
- **React Icons**: Comprehensive icon library

### Styling & UI

- **Tailwind CSS 3.3.0**: Utility-first CSS framework
- **Custom Components**: Reusable, accessible UI components
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Dark/Light Mode**: Theme switching with state persistence

### State Management

- **React Hooks**: useState, useEffect, useContext, useReducer
- **Custom Hooks**: Reusable logic for common operations
- **Local Storage**: Persistent state management
- **Context API**: Global state management

### Internationalization

- **i18next**: Powerful internationalization framework
- **React i18next**: React integration for i18next
- **Dynamic Loading**: Language switching without page reload
- **Fallback Management**: Graceful handling of missing translations

### Data Visualization

- **Chart.js**: Interactive charts and graphs
- **React Chart.js**: React wrapper for Chart.js
- **Responsive Charts**: Auto-resizing charts for all screen sizes
- **Custom Themes**: Consistent styling with application theme

### HTTP & API

- **Axios**: HTTP client with interceptors
- **Custom Fetch Wrapper**: authFetch for authenticated requests
- **Error Handling**: Comprehensive error management
- **Request/Response Interceptors**: Automatic token management

### Utilities

- **XLSX**: Excel file generation and export
- **Date-fns**: Date manipulation and formatting
- **Lodash**: Utility functions for data manipulation
- **Validator.js**: Input validation and sanitization

## 📁 Project Structure

```
frontend/
├── public/                    # Static assets
│   ├── index.html            # Main HTML template
│   ├── favicon.ico           # App icon
│   └── manifest.json         # PWA manifest
├── src/
│   ├── components/           # Reusable components
│   │   ├── common/          # Shared components
│   │   ├── forms/           # Form components
│   │   ├── modals/          # Modal components
│   │   └── layout/          # Layout components
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   ├── expert/          # Expert pages
│   │   ├── student/         # Student pages
│   │   └── auth/            # Authentication pages
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── services/            # API services
│   ├── contexts/            # React contexts
│   ├── locales/             # i18n translations
│   │   ├── en/             # English translations
│   │   └── vi/             # Vietnamese translations
│   ├── styles/              # Global styles
│   ├── App.js               # Main app component
│   ├── index.js             # App entry point
│   └── i18n.js              # i18n configuration
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind CSS configuration
├── jsconfig.json             # JavaScript configuration
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Git** for version control
- **Backend API** running (see main project README)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/MindMeter.git
   cd MindMeter/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the frontend directory:

   ```bash
   REACT_APP_API_URL=http://localhost:8080/api
   REACT_APP_OPENAI_API_KEY=your_openai_key
   REACT_APP_APP_NAME=MindMeter
   ```

4. **Start development server**

   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

## 📱 Available Scripts

### Development

- **`npm start`**: Start development server with hot reload
- **`npm run dev`**: Alias for npm start
- **`npm run build:dev`**: Build for development environment

### Testing

- **`npm test`**: Run tests in watch mode
- **`npm run test:coverage`**: Run tests with coverage report
- **`npm run test:ci`**: Run tests for CI/CD pipeline

### Building

- **`npm run build`**: Build for production
- **`npm run build:analyze`**: Build with bundle analysis
- **`npm run build:preview`**: Preview production build locally

### Code Quality

- **`npm run lint`**: Run ESLint
- **`npm run lint:fix`**: Fix ESLint errors automatically
- **`npm run format`**: Format code with Prettier
- **`npm run type-check`**: Run TypeScript type checking

## 🔧 Configuration

### Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          // ... custom color palette
        },
      },
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
  fallbackLng: "en",
  debug: process.env.NODE_ENV === "development",
  interpolation: {
    escapeValue: false,
  },
});
```

### Environment Variables

```bash
# Development
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_OPENAI_API_KEY=your_development_key

# Production
REACT_APP_API_URL=https://api.mindmeter.com
REACT_APP_OPENAI_API_KEY=your_production_key
```

## 🎨 Component Development

### Creating New Components

```jsx
// src/components/common/Button.js
import React from "react";
import { useTranslation } from "react-i18next";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  ...props
}) => {
  const { t } = useTranslation();

  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
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
  };

  return (
    <div>
      <h1>{t("welcome.title")}</h1>
      <p>{t("welcome.description")}</p>
      <button onClick={() => changeLanguage("vi")}>
        {t("language.vietnamese")}
      </button>
      <button onClick={() => changeLanguage("en")}>
        {t("language.english")}
      </button>
    </div>
  );
};
```

## 🧪 Testing

### Component Testing

```jsx
// src/components/__tests__/Button.test.js
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../Button";

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
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## 🚀 Deployment

### Production Build

```bash
# Create production build
npm run build

# The build folder contains optimized files ready for deployment
```

### Environment-Specific Builds

```bash
# Development build
npm run build:dev

# Staging build
npm run build:staging

# Production build
npm run build:prod
```

### Deployment Options

- **Netlify**: Drag and drop build folder
- **Vercel**: Connect GitHub repository
- **AWS S3**: Upload build folder to S3 bucket
- **Docker**: Use provided Dockerfile

## 🔒 Security Considerations

- **Environment Variables**: Never commit sensitive keys
- **Input Validation**: Validate all user inputs
- **XSS Prevention**: Use proper escaping and sanitization
- **CORS Configuration**: Configure backend CORS properly
- **HTTPS**: Always use HTTPS in production

## 📊 Performance Optimization

- **Code Splitting**: Lazy load components and routes
- **Bundle Analysis**: Monitor bundle size with webpack-bundle-analyzer
- **Image Optimization**: Use WebP format and lazy loading
- **Caching**: Implement proper caching strategies
- **Tree Shaking**: Remove unused code from production builds

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Create a Pull Request

### Code Standards

- **ESLint**: Follow configured ESLint rules
- **Prettier**: Use Prettier for code formatting
- **Component Structure**: Follow established component patterns
- **Naming Conventions**: Use consistent naming for files and components
- **Documentation**: Document complex components and functions

## 🐛 Troubleshooting

### Common Issues

**Build fails with memory error**

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Dependencies installation issues**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**i18n not working**

```bash
# Check if translation files exist
ls src/locales/

# Verify i18n configuration
cat src/i18n.js
```

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [i18next Documentation](https://www.i18next.com/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Create React App Documentation](https://create-react-app.dev/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/MindMeter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/MindMeter/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-username/MindMeter/wiki)

---

**MindMeter Frontend** - Built with ❤️ using React, Tailwind CSS, and modern web technologies for better mental health support. 🧠✨
