# QA Review System - Enhancement Implementation Plan

## Overview
This document outlines the implementation plan for three major enhancements to the QA Review System.

---

## 1. New Role System with Dashboards

### Current Roles
- ADMIN
- REVIEW_LEAD
- REVIEWER
- CONTACT_PERSON

### New Roles to Add
1. **PM (Project Manager)** - View/Comment only
2. **QA_MANAGER** - All actions
3. **DEV_ARCHITECT** - View/Comment only
4. **DIRECTOR** - View/Comment only
5. **QA_ARCHITECT** - All actions

### Implementation Steps

#### 1.1 Update Database Schema
- [x] Update `User` model to support new roles
- [ ] Add migration for existing users
- [ ] Update seed data with sample users for each role

#### 1.2 Update Authentication & Authorization
- [ ] Update role type definitions in `src/types/roles.ts`
- [ ] Update `AuthContext` to handle new roles
- [ ] Create permission helper functions:
  - `canViewReviews(role)` - All roles
  - `canCommentOnReviews(role)` - PM, DEV_ARCHITECT, DIRECTOR
  - `canManageReviews(role)` - QA_MANAGER, QA_ARCHITECT, ADMIN
  - `canManageProjects(role)` - QA_MANAGER, QA_ARCHITECT, ADMIN
  - `canManageUsers(role)` - ADMIN only

#### 1.3 Create Role-Specific Dashboards
- [ ] **PM Dashboard** (`/pm/dashboard`)
  - View all projects they're assigned to
  - View review status
  - Add comments to reviews
  - Read-only access to review details

- [ ] **QA Manager Dashboard** (`/qa-manager/dashboard`)
  - Full access to all QA operations
  - Manage projects and reviews
  - Assign reviewers
  - View reports and analytics
  - Approve/reject reviews

- [ ] **Dev Architect Dashboard** (`/dev-architect/dashboard`)
  - View projects relevant to architecture
  - View review findings
  - Add technical comments
  - Read-only access

- [ ] **Director Dashboard** (`/director/dashboard`)
  - High-level overview of all projects
  - View summary reports
  - Add strategic comments
  - Read-only access to all reviews

- [ ] **QA Architect Dashboard** (`/qa-architect/dashboard`)
  - Full QA operations access
  - Define review standards
  - Manage review forms
  - Oversee all reviews
  - Analytics and reporting

#### 1.4 Update UI Components
- [ ] Update `UsersTable` to show new roles with appropriate badges
- [ ] Update `Navbar` to show role-appropriate navigation
- [ ] Create role-based routing in middleware
- [ ] Update user creation/edit forms to include new roles

---

## 2. Bulk User Invite Feature

### Requirements
- Allow admins to invite multiple users at once
- Support CSV upload or manual entry
- Send invitation emails to all users
- Track invitation status

### Implementation Steps

#### 2.1 Create Bulk Invite UI
- [ ] Create `/admin/users/bulk-invite` page
- [ ] Add CSV upload component
- [ ] Add manual entry form (textarea with email list)
- [ ] Preview table showing parsed users
- [ ] Validation for email format and duplicates

#### 2.2 Backend Processing
- [ ] Create API endpoint `/api/users/bulk-invite`
- [ ] CSV parsing utility
- [ ] Batch user creation logic
- [ ] Email queue for sending invitations
- [ ] Error handling for failed invites

#### 2.3 Email Templates
- [ ] Update invitation email template
- [ ] Include role-specific welcome messages
- [ ] Add instructions for first login

#### 2.4 Tracking & Reporting
- [ ] Show invitation status (sent, accepted, pending)
- [ ] Resend option for failed invitations
- [ ] Bulk invite history log

---

## 3. Enhanced Reporting Features

### 3.1 Project-Based Reports

#### Features
- [ ] Individual project report page (`/reports/project/[id]`)
- [ ] Show all reviews for a specific project
- [ ] Filter by date range, status, reviewer
- [ ] Visual charts:
  - Review completion timeline
  - Status distribution (pie chart)
  - Reviewer performance
  - Issue severity breakdown

#### Implementation
- [ ] Create project report page component
- [ ] Add data aggregation queries
- [ ] Integrate chart library (recharts or chart.js)
- [ ] Add filters and search functionality
- [ ] Export functionality (see 3.3)

### 3.2 Monthly Reports

#### Features
- [ ] Monthly summary dashboard (`/reports/monthly`)
- [ ] Select month/year
- [ ] Aggregate data:
  - Total reviews conducted
  - Reviews by status
  - Reviews by project
  - Reviews by reviewer
  - Average completion time
  - Top issues found

#### Implementation
- [ ] Create monthly report page
- [ ] Add date range selector
- [ ] Create aggregation queries
- [ ] Visual charts and graphs
- [ ] Comparison with previous months
- [ ] Export functionality

### 3.3 Export Options

#### Supported Formats
- [ ] **PDF** - Formatted report with charts
- [ ] **Excel** - Detailed data with multiple sheets
- [ ] **CSV** - Raw data export

#### Implementation
- [ ] Install export libraries:
  - `jspdf` + `jspdf-autotable` for PDF
  - `xlsx` for Excel
  - Native CSV generation
- [ ] Create export utility functions
- [ ] Add export buttons to all report pages
- [ ] Include filters in exported data
- [ ] Add company branding to PDF exports

#### Export Features
- [ ] Project reports export
- [ ] Monthly reports export
- [ ] Custom date range exports
- [ ] Filtered data exports
- [ ] Include charts in PDF exports

---

## Implementation Priority

### Phase 1 (High Priority)
1. Update role system and permissions
2. Create basic dashboards for new roles
3. Bulk user invite feature

### Phase 2 (Medium Priority)
1. Project-based reports
2. Monthly reports
3. Basic export (CSV)

### Phase 3 (Enhancement)
1. Advanced charts and visualizations
2. PDF and Excel export
3. Advanced filtering and analytics

---

## Technical Considerations

### Database Changes
- Roles are stored as JSON array in User model (already supports multiple roles)
- No schema changes needed for roles
- May need new tables for:
  - Comments on reviews
  - Invitation tracking
  - Report templates

### Security
- Implement role-based access control (RBAC)
- Validate permissions on both client and server
- Audit log for sensitive operations

### Performance
- Implement caching for report data
- Optimize queries for large datasets
- Consider pagination for bulk operations

### Testing
- Unit tests for permission helpers
- Integration tests for new dashboards
- E2E tests for bulk invite flow
- Test export functionality with sample data

---

## Next Steps

1. Review and approve this plan
2. Prioritize features
3. Begin implementation with Phase 1
4. Iterate and gather feedback

