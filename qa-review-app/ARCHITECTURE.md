# QA Review App - Architectural Overview

This document describes the modernized architecture of the QA Review application, prepared for professional architectural review. The system has been hardened following industry best practices for security, data integrity, and maintainability.

## 1. Core Principles
- **Separation of Concerns**: Business logic is decoupled from API handlers and UI components via a dedicated Service Layer.
- **Type Safety**: End-to-end type safety using TypeScript, Prisma Enums, and Zod schemas.
- **Security First**: Centralized authentication, declarative RBAC, and secure cookie management.
- **Single Source of Truth**: Unified database schema using native PostgreSQL features (Enums, JSONB/Json).

## 2. Layers

### 2.1. Presentation Layer (Next.js App Router)
- **Pages**: Server components for data fetching and layout.
- **Components**: Functional React components with strict prop typing.
- **Server Actions**: Thin wrappers around the Service Layer that handle `revalidatePath` and UI-specific response formatting.

### 2.2. Service Layer (`src/services/`)
The heart of the application. Services are stateless classes that:
- Execute business logic.
- Perform Zod validation on incoming data.
- Manage database transactions via Prisma.
- Trigger side effects (Logging, Emails).
- **Services**: `ProjectService`, `UserService`, `ReviewService`.

### 2.3. Data Access Layer (Prisma)
- **Schema**: Optimized with native Enums for `Role`, `ProjectType`, `ProjectStatus`, `ReviewStatus`, and `HealthStatus`.
- **Integrity**: Strict relational constraints and cascading deletes where appropriate.
- **Json Types**: Used for complex data like `Review.answers` to support flexible questioning without schema bloat.

### 2.4. Infrastructure & Middleware
- **Security Middleware (`src/middleware.ts`)**: Implements declarative RBAC mapping. Protects both Web and API routes.
- **API Wrapper (`src/lib/apiErrorHandler.ts`)**: Standardizes error handling and authentication for all API endpoints.
- **Activity Logger (`src/lib/activityLogger.ts`)**: Centralized audit logging for compliance.

## 3. Data Flow
1. **Request** hits `middleware.ts` for RBAC check.
2. **Route Handler / Server Action** extracts data.
3. **Service Layer** validates data with **Zod** (`src/lib/schemas/`).
4. **Service Layer** persists via **Prisma**.
5. **Activity Logger** records the event.
6. **Email Utility** triggers notifications if required.

## 4. Key Hardening Steps Taken
- [x] Moved business logic out of API handlers into Services.
- [x] Implemented Zod schemas for all domain models.
- [x] Standardized API responses and error formatting.
- [x] Refactored Database to use relational Enums.
- [x] Hardened JWT session management.

## 5. Future Enhancements
- Integration of a distributed cache (e.g., Redis) for session scaling.
- Implementation of a dedicated Event Bus for asynchronous side effects.
- Enhanced Rate Limiting for API routes.
