# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.5] - 2025-10-07

### Added

- Beautiful custom modal for blog post deletion with Tailwind CSS
- Text button "Xóa bài viết" / "Delete Post" instead of trash icon
- Responsive modal design with dark mode support
- Loading states with spinner animation for delete operations
- Translation keys for delete button and warning messages

### Changed

- Replaced ugly browser `confirm()` dialog with custom modal
- Improved UX with proper disabled states and hover effects
- Enhanced accessibility with better button styling

### Fixed

- ESLint warnings for unused imports and variables
- Undefined variable errors in comment count management
- Modal close button positioning and styling

## [0.4.4] - 2025-10-06

### Fixed

- Blog bookmark state synchronization between list and detail pages
- "Saved Articles" count not updating in navigation
- Bookmark icon not reflecting saved state on detail page

## [0.4.3] - 2025-10-06

### Fixed

- Blog like state synchronization between list and detail pages
- Like icon not showing red color on detail page after liking on list page
- Like count synchronization issues

## [0.4.2] - 2025-10-05

### Added

- Modern glassmorphism design for homepage tour
- Improved tour UI with purple/violet gradient theme
- Better typography and spacing
- Mobile responsive design for tour modal

### Changed

- Removed close button from tour for better UX
- Centered text and buttons in tour modal
- Enhanced button styling with no text wrapping

## [0.4.1] - 2025-10-05

### Fixed

- Anonymous user redirect to login page issue
- Anonymous user role assignment (STUDENT → ANONYMOUS)
- 401 Unauthorized errors for anonymous users
- Anonymous account creation flow

## [0.4.0] - 2025-10-05

### Added

- Anonymous user support for psychological tests
- Anonymous account creation with temporary token
- Anonymous user role and permissions
- Anonymous test history tracking

## [0.3.0] - 2025-10-04

### Added

- Blog post management system
- Comment system with edit/delete functionality
- Like and bookmark features for blog posts
- Admin panel for blog post approval

### Changed

- Improved blog post UI/UX design
- Enhanced comment section with user permissions
- Better responsive design for blog pages

## [0.2.0] - 2025-10-03

### Added

- Psychological test system (DASS-21, DASS-42, RADS, BDI, EPDS, SAS)
- Test result tracking and history
- Expert consultation booking system
- User dashboard with test results

## [0.1.5] - 2025-10-02

### Added

- User authentication system
- Role-based access control (Student, Expert, Admin)
- User profile management
- Password reset functionality

## [0.1.4] - 2025-10-01

### Added

- Internationalization support (Vietnamese/English)
- Theme switching (Light/Dark mode)
- Responsive design for mobile devices
- Navigation improvements

## [0.1.3] - 2025-09-30

### Added

- Dashboard header and footer components
- User session management
- Protected routes implementation
- Basic error handling

## [0.1.2] - 2025-09-29

### Added

- Spring Boot backend API
- MySQL database integration
- JWT authentication
- RESTful API endpoints

## [0.1.1] - 2025-09-28

### Added

- React frontend application
- Basic routing with React Router
- Component structure setup
- Tailwind CSS styling

## [0.1.0] - 2025-09-27

### Added

- Initial project setup
- Git repository initialization
- Basic project structure
- README documentation

---

## Legend

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities
