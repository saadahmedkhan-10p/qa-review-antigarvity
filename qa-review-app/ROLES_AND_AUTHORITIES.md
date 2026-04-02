# 🛡️ Roles and Authorities

This document outlines the roles available in the QA Review System, their responsibilities, dashboard access, and specific permissions.

## 👑 Role Hierarchy & Permissions

The system uses a role-based access control (RBAC) model. Users can have multiple roles, but their **Primary Role** determines their dashboard landing page.

### 1. ADMIN
*   **Label:** Admin
*   **Description:** Full system access.
*   **Dashboard:** `/admin/projects`
*   **Badge Color:** Purple
*   **Permissions:**
    *   ✅ View Reviews
    *   ✅ Comment on Reviews
    *   ✅ Manage Reviews (Delete, etc.)
    *   ✅ Manage Projects (Create, Edit, Delete)
    *   ✅ Manage Users (Invite, Edit, Delete)
    *   ✅ Manage Forms (Create, Edit)
    *   ✅ View Reports
    *   ✅ Export Reports

### 2. QA_MANAGER
*   **Label:** QA Manager
*   **Description:** Manage all QA operations.
*   **Dashboard:** `/qa-manager/dashboard`
*   **Badge Color:** Indigo
*   **Permissions:**
    *   ✅ View Reviews
    *   ✅ Comment on Reviews
    *   ✅ Manage Reviews
    *   ✅ Manage Projects
    *   ❌ Manage Users
    *   ✅ Manage Forms
    *   ✅ View Reports
    *   ✅ Export Reports

### 3. QA_ARCHITECT
*   **Label:** QA Architect
*   **Description:** Define QA standards and oversee reviews.
*   **Dashboard:** `/qa-architect/dashboard`
*   **Badge Color:** Blue
*   **Permissions:**
    *   ✅ View Reviews
    *   ✅ Comment on Reviews
    *   ✅ Manage Reviews
    *   ✅ Manage Projects
    *   ❌ Manage Users
    *   ✅ Manage Forms
    *   ✅ View Reports
    *   ✅ Export Reports

### 4. REVIEW_LEAD
*   **Label:** Review Lead
*   **Description:** Lead review processes.
*   **Dashboard:** `/lead/dashboard`
*   **Badge Color:** Cyan
*   **Permissions:**
    *   ✅ View Reviews
    *   ✅ Comment on Reviews
    *   ✅ Manage Reviews
    *   ❌ Manage Projects
    *   ❌ Manage Users
    *   ❌ Manage Forms
    *   ✅ View Reports
    *   ❌ Export Reports

### 5. REVIEWER
*   **Label:** Reviewer
*   **Description:** Conduct reviews.
*   **Dashboard:** `/reviewer/dashboard`
*   **Badge Color:** Green
*   **Permissions:**
    *   ✅ View Reviews
    *   ✅ Comment on Reviews
    *   ❌ Manage Reviews
    *   ❌ Manage Projects
    *   ❌ Manage Users
    *   ❌ Manage Forms
    *   ❌ View Reports
    *   ❌ Export Reports

### 6. PM (Project Manager)
*   **Label:** Project Manager
*   **Description:** View and comment on reviews for their projects.
*   **Dashboard:** `/pm/dashboard`
*   **Badge Color:** Orange
*   **Permissions:**
    *   ✅ View Reviews
    *   ✅ Comment on Reviews
    *   ❌ Manage Reviews
    *   ❌ Manage Projects
    *   ❌ Manage Users
    *   ❌ Manage Forms
    *   ✅ View Reports
    *   ❌ Export Reports

### 7. DEV_ARCHITECT
*   **Label:** Dev Architect
*   **Description:** View and provide technical comments.
*   **Dashboard:** `/dev-architect/dashboard`
*   **Badge Color:** Teal
*   **Permissions:**
    *   ✅ View Reviews
    *   ✅ Comment on Reviews
    *   ❌ Manage Reviews
    *   ❌ Manage Projects
    *   ❌ Manage Users
    *   ❌ Manage Forms
    *   ✅ View Reports
    *   ❌ Export Reports

### 8. DIRECTOR
*   **Label:** Director
*   **Description:** Executive oversight and strategic comments.
*   **Dashboard:** `/director/dashboard`
*   **Badge Color:** Rose
*   **Permissions:**
    *   ✅ View Reviews
    *   ✅ Comment on Reviews
    *   ❌ Manage Reviews
    *   ❌ Manage Projects
    *   ❌ Manage Users
    *   ❌ Manage Forms
    *   ✅ View Reports
    *   ✅ Export Reports

### 9. CONTACT_PERSON
*   **Label:** Contact Person
*   **Description:** Project contact point.
*   **Dashboard:** `/contact/dashboard`
*   **Badge Color:** Gray
*   **Permissions:**
    *   ✅ View Reviews
    *   ❌ Comment on Reviews
    *   ❌ Manage Reviews
    *   ❌ Manage Projects
    *   ❌ Manage Users
    *   ❌ Manage Forms
    *   ❌ View Reports
    *   ❌ Export Reports

---

## 📊 Permission Matrix

| Permission | ADMIN | QA_MGR | QA_ARCH | LEAD | REVIEWER | PM | DEV_ARCH | DIRECTOR | CONTACT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **View Reviews** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Comment** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Manage Reviews** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Manage Projects** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Manage Forms** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Reports** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Export Reports** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 🔑 Permission Definitions

*   **View Reviews:** Access to view review details and status.
*   **Comment on Reviews:** Ability to add comments to reviews.
*   **Manage Reviews:** Ability to delete or re-assign reviews.
*   **Manage Projects:** Create, edit, and delete projects.
*   **Manage Users:** Invite new users, edit roles, and delete users.
*   **Manage Forms:** Create and edit review forms/checklists.
*   **View Reports:** Access to analytics and reporting dashboards.
*   **Export Reports:** Ability to download reports as PDF or Excel.
