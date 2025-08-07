# InstaShop Review Platform

## Overview

InstaShop Review is a full-stack web application that allows users to review and discover Instagram-based businesses. The platform enables users to share their shopping experiences with Instagram stores, helping build a community-driven review system for social commerce.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Authentication**: Passport.js with local strategy and session-based auth
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Storage**: Connect-pg-simple for PostgreSQL session store
- **Development**: tsx for TypeScript execution

### Database Design
- **Primary Database**: PostgreSQL (via Neon Database)
- **Schema Management**: Drizzle Kit for migrations
- **Key Tables**:
  - `users`: User accounts with Instagram handles
  - `brands`: Instagram business profiles with categories
  - `reviews`: User reviews with ratings and optional images
  - `categories`: Business categorization system
  - `contact_messages`: Contact form submissions

## Key Components

### Authentication System
- Local username/password authentication with comprehensive validation
- Session-based user management with persistent cookies
- "Remember Me" functionality with extended session duration
- Password hashing using Node.js crypto (scrypt)
- Protected routes requiring authentication
- Session persistence: 7 days default, 30 days with "Remember Me"

### Review System
- Users can review Instagram brands
- Star rating system (1-5 stars)
- Text reviews with optional image uploads
- One review per user per brand constraint

### Brand Management
- Brand registration with Instagram handle verification
- **Admin approval system**: All brand submissions require admin approval before going live
- Three-tier brand status: pending, approved, rejected
- Category-based organization
- Search functionality across approved brands only
- Brand profile pages with aggregated reviews

### User Interface
- Responsive design with mobile-first approach
- Professional theme with purple/pink gradient branding
- Component-based architecture using shadcn/ui
- Form validation and error handling
- Toast notifications for user feedback

## Data Flow

1. **User Registration/Login**: Users authenticate with username/password, sessions stored in PostgreSQL
2. **Brand Submission**: Users submit brand details (name, Instagram handle, category, description, logo) with "pending" status
3. **Admin Review**: Admin users can view pending submissions in dedicated admin panel and approve/reject brands
4. **Brand Discovery**: Users browse only approved brands by category or search functionality
5. **Review Creation**: Authenticated users can submit reviews for approved brands they've shopped with
6. **Review Display**: Reviews are aggregated and displayed on approved brand pages
7. **Contact System**: Anonymous contact form for user inquiries

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Database ORM and query builder
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **wouter**: Lightweight React router
- **passport**: Authentication middleware

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Optional Integrations
- **@sendgrid/mail**: Email service integration (configured but not fully implemented)
- **@notionhq/client**: Notion API integration (available but unused)

## Deployment Strategy

### Replit Configuration
- **Environment**: Node.js 20 runtime
- **Development**: `npm run dev` for local development with hot reload
- **Production**: `npm run build && npm run start` for production builds
- **Port Configuration**: Internal port 5000, external port 80
- **Auto-scaling**: Configured for Replit's autoscale deployment

### Build Process
1. Frontend: Vite builds React app to `dist/public`
2. Backend: ESBuild bundles server code to `dist/index.js`
3. Static files served from `dist/public` in production
4. Database migrations managed via Drizzle Kit

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key

## Changelog
- August 6, 2025: Implemented admin approval system for brand submissions - all new brands require admin approval before appearing on platform
- August 6, 2025: Added comprehensive admin panel at /admin route with pending brand review interface
- August 6, 2025: Updated brand submission workflow to show pending status and approval notifications
- August 6, 2025: Enhanced navigation with admin panel links for admin users
- August 4, 2025: Added session persistence and "Remember Me" functionality for enhanced user experience
- August 4, 2025: Implemented comprehensive security validations for all forms with real-time feedback
- August 4, 2025: Added logo upload functionality (JPG/JPEG format) and brand descriptions
- August 4, 2025: Enhanced UI with loading animations and smooth transitions
- June 20, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.