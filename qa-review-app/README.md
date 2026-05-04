# QA Review Intelligence Platform

A professional Next.js web application for managing QA reviews across multiple projects with role-based access control and AI-driven analysis.

## 🚀 Features

### Multi-Role System
- **Admin**: Manage projects, create dynamic review forms, initiate review cycles, view reports, and configure AI settings.
- **QA Roles (Head, Manager, Architect)**: High-level oversight and management capabilities.
- **Review Lead**: Monitor assigned projects and review schedules.
- **Reviewer**: Receive review invites, schedule and conduct reviews with AI assistance.
- **Other Stakeholders**: PMs, Dev Architects, Contact Persons, and Directors have targeted visibility into project health.

### Core Functionality
1. **Project Management** (Admin)
   - Create and assign projects.
   - Assign Review Leads, Reviewers, and Contact Persons.
   - View all projects in a centralized dashboard.

2. **Dynamic Form Builder** (Admin)
   - Create custom review forms tailored to project types (Manual, Automation, API, Desktop).
   - Support for multiple question types (Text, Radio, Checkboxes, Number, Select).
   - Save and manage active forms.

3. **Review Scheduling System**
   - Monthly review cycles with structured deadlines (e.g., scheduled by the 10th, conducted by the 20th).
   - Automated status tracking (PENDING → SCHEDULED → SUBMITTED).

4. **AI-Powered Review Workflow** (Reviewer/Admin)
   - View assigned projects and schedule review dates.
   - Conduct reviews using dynamic forms.
   - **AI Analysis Integration:** Instantly generate comprehensive risk assessments, summaries, and recommended actions using OpenAI (GPT-4o) based on review answers and project health.

5. **Reporting & Auditing Dashboard** (Admin)
   - View statistics: Total, Submitted, Scheduled, Pending reviews.
   - Detailed, sortable, and filterable review log with CSV export capabilities.
   - **Activity Logs:** Secure, comprehensive audit trails of all system actions (without exposing PII like emails).

6. **Email Notifications** 📧
   - Welcome emails with account details and password reset tokens.
   - Project assignment notifications for reviewers and leads.
   - Works in development mode without SMTP (logs securely to console).

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: PostgreSQL (hosted on Neon) with Prisma ORM
- **Authentication**: Custom Secure JWT session management (`jose` & `bcryptjs`)
- **AI Integration**: OpenAI API (GPT-4o)
- **Charting**: Recharts

## 📦 Installation

```bash
git clone <repository-url>
cd qa-review-app
npm install
```

## 🗄️ Database & Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database connection string (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Generate a strong 32+ character random string for JWT session encryption
JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars-long"

# SMTP Configuration for Email Notifications (Optional for local dev)
SMTP_HOST="smtp.yourprovider.com"
SMTP_PORT="587"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourdomain.com"
```

Initialize the database schema:
```bash
npx prisma generate
npx prisma db push
```

## 🤖 Configuring AI Features
1. Log in as an **Admin**.
2. Navigate to the **Settings** page (`/admin/settings`).
3. Enter your **OpenAI API Key** and click Save to enable AI Analysis across the application.

## 🏃 Running the Application

Start the development server:
```bash
npm run dev
```
Visit `http://localhost:3000`

## 👥 Test Users

To quickly set up an initial admin account, run the setup script:
```bash
npx tsx scripts/create-qa-head.ts
```
This will create a user with the `QA_HEAD` and `ADMIN` roles, allowing you to log in and configure the rest of the system.

## 🚀 Deployment (Vercel)

This application is fully optimized for **Vercel**:
1. Import your repository into Vercel.
2. Add your `DATABASE_URL` and `JWT_SECRET` in the Vercel Environment Variables settings.
3. The custom `vercel.json` ensures the correct build step is run (`npx prisma db push --accept-data-loss`) to provision database tables automatically.

## 📊 Database Schema

### User
- Roles: ADMIN, QA_HEAD, REVIEW_LEAD, REVIEWER, CONTACT_PERSON, etc.
- Stores name, email, secure hashed password.

### Project
- Links to Lead, Reviewers, and PMs.
- Contains project name, type, and active status.

### Form & Questions
- Stores review form templates with dynamic JSON structures.

### Review
- Links Project, Reviewer, and Form.
- Tracks scheduling, health status, and stores the newly generated **AI Analysis**.

### SystemSettings
- Secure, singleton table managing external configurations (e.g., OpenAI API Key).

### ActivityLog
- Comprehensive audit trail tracking user actions and entity changes.

## 🎨 Design Features

- **Professional UI**: Clean, modern interface with Tailwind CSS and responsive layouts.
- **Dynamic Dashboards**: Role-specific views ensuring data privacy and workflow efficiency.
- **Interactive Reports**: Sortable data tables with immediate CSV export functionality.

## 📄 License
MIT
