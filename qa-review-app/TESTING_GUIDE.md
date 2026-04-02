# 🧪 QA Review System - Testing Guide

This guide provides instructions on how to test the entire application, including user roles, functionalities, and UI features.

## 🔐 Test Users

The database has been seeded with the following users. All users have the password: **`password123`**

| Role | Email | Description |
|------|-------|-------------|
| **Admin** | `admin@example.com` | Full system access. Can manage users, projects, forms. |
| **QA Manager** | `qa.manager@example.com` | Manages QA process, views dashboards, assigns reviews. |
| **QA Architect** | `qa.architect@example.com` | Creates and manages review forms/checklists. |
| **Review Lead** | `review.lead@example.com` | Oversees reviews, provides feedback to reviewers. |
| **Reviewer** | `reviewer@example.com` | Conducts reviews. |
| **Reviewer 2** | `reviewer2@example.com` | Another reviewer for testing multiple users. |
| **Project Manager** | `pm@example.com` | Views project status and reports. |
| **Dev Architect** | `dev.architect@example.com` | Technical contact for projects. |
| **Director** | `director@example.com` | Executive view of all projects and metrics. |

---

## 🚀 How to Test "Each and Everything"

### 1. UI & Assets Check 🎨
- **Logo**: Verify the new modern logo appears in the top left of the Navbar.
- **Favicon**: Check the browser tab for the new favicon.
- **Theme**: Toggle the Dark/Light mode button in the navbar. Ensure all text and backgrounds switch correctly.
- **Responsive**: Resize the browser window to mobile size. Check if the navbar collapses (if implemented) or adjusts.

### 2. Role-Based Functionality 👥

#### **Admin Flow** (`admin@example.com`)
1.  **Login**: Go to `/login` and sign in.
2.  **Projects**: Navigate to `/admin/projects`. Create a new project. Edit an existing one.
3.  **Users**: Go to `/admin/users`. Try the **Bulk Invite** feature (upload a CSV or type emails).
4.  **Forms**: Go to `/admin/forms`. Create a new form or edit the "Standard Code Quality Review".
5.  **Reports**: Go to `/admin/reports`. Export a report as PDF or Excel.

#### **QA Architect Flow** (`qa.architect@example.com`)
1.  **Dashboard**: Check `/qa-architect/dashboard`. Verify stats.
2.  **Forms**: Create a new version of a form. Add new questions.

#### **Reviewer Flow** (`reviewer@example.com`)
1.  **Dashboard**: Check `/reviewer/dashboard`. You should see "Pending Reviews".
2.  **Conduct Review**: Click "Start Review" on a pending review.
    - Fill out the form.
    - Save as draft (if available) or Submit.
    - Verify the status changes to "SUBMITTED".

#### **Review Lead Flow** (`review.lead@example.com`)
1.  **Dashboard**: Check `/lead/dashboard`.
2.  **View Review**: Open a submitted review.
3.  **Comments**: Add a comment to the review (e.g., "Good catch on the security issue").
4.  **Verify**: Log in as the Reviewer again to see the comment.

#### **Manager/Director Flow** (`qa.manager@example.com`, `director@example.com`)
1.  **Dashboards**: Check their respective dashboards for high-level metrics.
2.  **Drill-down**: Click on a project to see detailed review history.

### 3. Global Search 🔍
- Press **`Cmd+K`** (Mac) or **`Ctrl+K`** (Windows).
- Type "Project" or "Reviewer".
- Use arrow keys to navigate and Enter to select.
- Verify it takes you to the correct page.

### 4. Comments System 💬
- Go to any submitted review (e.g., `/reviews/[id]/view`).
- Scroll to the bottom.
- Add a comment.
- Verify it appears instantly with your name and timestamp.

---

## 🛠️ Automated Testing

We have set up a unit testing framework using Jest.

### Running Tests
To run the automated test suite:

```bash
npm test
```

This will run tests for:
- Global Search component
- Utility functions
- (Add more as you build)

### Database Reset
If you want to reset the data to the initial state:

```bash
npx prisma db seed
```
