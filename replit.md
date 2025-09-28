# ProTracker Freelancer Hub

## Overview

ProTracker is a comprehensive freelance management application designed for independent professionals to track time, manage clients and projects, handle invoicing, and generate business insights. The application provides a complete suite of tools including time tracking with built-in timers, project management, expense tracking, invoice generation with PDF export, AI-powered contract generation, and detailed reporting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application is built as a single-page React application using TypeScript with a component-based architecture. The main App component serves as the central state container using React Context API for global state management. The UI is built with Tailwind CSS for styling and uses a modular component system with reusable UI components located in the `components/ui/` directory.

**Key Design Decisions:**
- React Context API chosen over Redux for simpler state management in a medium-sized application
- TypeScript provides type safety and better developer experience
- Tailwind CSS enables rapid UI development with consistent design system
- Component composition pattern for reusable UI elements

### State Management
Global application state is managed through React Context with custom hooks for data persistence. The application uses localStorage as the primary data storage mechanism with a sophisticated data manager utility that handles data versioning, integrity checks, and automatic backups.

**Key Features:**
- Centralized state management via AppContext
- Custom hooks for localStorage persistence with error handling
- Data integrity validation with checksums
- Automatic backup system with configurable intervals
- Data migration support for version updates

### Data Architecture
The application follows a relational data model with clear entity relationships:

**Core Entities:**
- **Clients**: Customer information and billing details
- **Projects**: Associated with clients, containing hourly rates and project phases
- **Time Entries**: Linked to projects with billable/non-billable tracking
- **Invoices**: Generated from billable time entries with payment tracking
- **Expenses**: Project-related costs with receipt management
- **Phases**: Project subdivisions for better organization

**Data Relationships:**
- One-to-many relationships between clients and projects
- Projects can have multiple phases and time entries
- Time entries can be converted to invoice line items
- Comprehensive audit trail for all financial transactions

### PDF Generation System
Invoice PDF generation is implemented using jsPDF and html2canvas libraries. The system renders invoices in HTML format and converts them to PDF documents with professional formatting including company branding, itemized billing, and payment terms.

### Time Tracking System
Advanced time tracking functionality includes:
- Real-time timer with pause/resume capabilities
- Manual time entry creation and editing
- Project phase assignment for detailed tracking
- Template system for recurring time entries
- Comprehensive filtering and search capabilities

### AI Integration
The application integrates with Google's Gemini AI API for intelligent features:
- Automated contract generation based on project details
- Business insight analysis from time tracking data
- Expense categorization suggestions
- Pricing recommendations based on historical data

## External Dependencies

### Core Dependencies
- **React 19.1.1**: Frontend framework for component-based UI development
- **TypeScript**: Type safety and enhanced developer experience
- **Vite**: Build tool and development server for fast iteration
- **Tailwind CSS**: Utility-first CSS framework for responsive design

### UI and Styling
- **Lucide React**: Icon library providing consistent iconography
- **Tailwind Typography**: Enhanced typography styles for content-heavy sections

### PDF and Document Generation
- **jsPDF**: Client-side PDF generation for invoices and reports
- **html2canvas**: HTML to canvas conversion for PDF rendering
- **PostCSS**: CSS processing for optimized stylesheets

### AI and External Services
- **@google/genai**: Google Gemini AI integration for contract generation and business insights
- **@replit/object-storage**: Cloud storage solution for data persistence and backups

### Development and Testing
- **Jest**: Testing framework with jsdom environment for React component testing
- **Testing Library**: React testing utilities for user-centric test approaches
- **TypeScript Compiler**: Type checking and compilation support

### Data Management
The application uses a custom data manager utility built on top of localStorage with plans for future database integration. The architecture supports easy migration to external databases while maintaining backward compatibility with local storage.

**Storage Strategy:**
- Primary: Browser localStorage with automatic data validation
- Backup: Replit Object Storage for cloud persistence
- Future: Database integration ready (architecture supports Drizzle ORM)
- Data integrity: Checksum validation and version control