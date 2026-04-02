# QA Review Process Application

A professional Next.js web application for managing QA reviews across multiple projects with role-based access control.

## 🚀 Features

### Multi-Role System
- **Admin**: Manage projects, create review forms, initiate review cycles, view reports
- **Review Lead**: Monitor assigned projects and review schedules
- **Reviewer**: Receive review invites, schedule and conduct reviews

### Core Functionality
1. **Project Management** (Admin)
   - Create and assign projects
   - Assign Review Leads, Reviewers, and Contact Persons
   - View all projects in a centralized dashboard

2. **Dynamic Form Builder** (Admin)
   - Create custom review forms
   - Support for multiple question types:
     - Text input
     - Radio buttons (single choice)
     - Checkboxes (multiple choice)
   - Save forms to database

3. **Review Scheduling System**
   - Monthly review cycles
   - Reviews must be scheduled by the 10th of each month
   - Reviews must be conducted by the 20th of each month
   - Automated status tracking (PENDING → SCHEDULED → SUBMITTED)

4. **Review Workflow** (Reviewer)
   - View assigned projects
   - Schedule review dates
   - Fill out and submit review forms
   - Track review status

5. **Reporting Dashboard** (Admin)
   - View statistics: Total, Submitted, Scheduled, Pending reviews
   - Detailed review log with filtering
   - Export-ready data views

6. **Email Notifications** 📧
   - **User Creation**: Welcome email with account details
   - **Project Assignment**: Notify reviewers and leads
   - **Review Invitations**: Automated invites when cycles start
   - **Review Scheduled**: Confirmation emails with deadlines
   - **Lead Notifications**: Keep leads informed of all activities
   - Works in development mode without SMTP (logs to console)

7. **User Management** (Admin)
   - Create users with different roles
   - View all users in the system
   - Delete users (Admin protected)
   - Automated welcome emails

6. **Review Lead Dashboard**
   - View all assigned projects
   - Monitor review status for each project
   - Track scheduled and submitted dates

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Authentication**: Mock/Simple role-based (easily replaceable)
- **Form Handling**: React Hook Form
- **Date Management**: date-fns

## 📦 Installation

```bash
cd qa-review-app
npm install
```

## 🗄️ Database Setup

```bash
# Initialize and migrate database
$env:DATABASE_URL="file:./dev.db"; npx prisma migrate dev --name init

# Seed initial data
$env:DATABASE_URL="file:./dev.db"; npx prisma db seed
```

## 📧 Email Configuration (Optional)

The app includes automated email notifications. See **[EMAIL_SETUP.md](../EMAIL_SETUP.md)** for detailed instructions.

**Quick Setup:**
1. Copy `.env.example` to `.env.local`
2. Add your SMTP credentials (Gmail, SendGrid, etc.)
3. Restart the dev server

**Development Mode:** If not configured, emails are logged to console instead of being sent.

## 🏃 Running the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## 👥 Test Users

The seed data creates the following test users:

- **Admin**: admin@example.com
- **Review Lead**: lead@example.com
- **Reviewer**: reviewer@example.com

Simply select a role from the dropdown on the login page.

## 📊 Database Schema

### User
- Roles: ADMIN, REVIEW_LEAD, REVIEWER, CONTACT_PERSON
- Stores name, email, role

### Project
- Links to Lead, Reviewer, and Contact Person
- Contains project name and description

### Form
- Stores review form templates
- Questions stored as JSON

### Review
- Links Project, Reviewer, and Form
- Tracks status, scheduled date, submitted date
- Stores answers as JSON

## 🎨 Design Features

- **Professional UI**: Clean, modern interface with Tailwind CSS
- **Responsive Design**: Works on desktop and mobile
- **Navigation Bar**: Role-based navigation with user context
- **Status Badges**: Color-coded status indicators
- **Data Tables**: Sortable, filterable data views
- **Form Validation**: Client and server-side validation

## 📁 Project Structure

```
qa-review-app/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts            # Seed data
│   └── migrations/        # Database migrations
├── src/
│   ├── app/
│   │   ├── actions/       # Server actions
│   │   │   ├── admin.ts
│   │   │   ├── reviewer.ts
│   │   │   └── review.ts
│   │   ├── admin/         # Admin pages
│   │   │   ├── projects/
│   │   │   ├── forms/
│   │   │   └── reports/
│   │   ├── lead/          # Review Lead pages
│   │   ├── reviewer/      # Reviewer pages
│   │   └── reviews/       # Review conduct pages
│   ├── components/        # Reusable components
│   │   └── Navbar.tsx
│   └── context/           # React contexts
│       └── AuthContext.tsx
└── package.json
```

## 🔐 Authentication

Currently uses a simple role-based authentication system for demonstration. To implement real authentication:

1. Replace `AuthContext.tsx` with your auth provider (NextAuth, Clerk, etc.)
2. Update server actions to use session data
3. Add middleware for route protection

## 🚧 Future Enhancements

- Email notifications for review invites
- Calendar integration for scheduling
- Advanced reporting with charts
- Export to PDF/Excel
- File attachments in reviews
- Comment threads on reviews
- Audit logs
- Multi-language support

## 📝 Notes

- The application uses SQLite for simplicity. For production, migrate to PostgreSQL or MySQL.
- Review scheduling validation (10th/20th deadlines) is implemented client-side. Add server-side validation for production.
- The form builder stores questions as JSON. Consider a dedicated Question table for complex querying.

## 🐛 Known Issues

- Form builder UI needs refinement for better UX when adding/removing options
- Date validation for scheduling needs server-side enforcement
- No email notification system (planned feature)

## 📄 License

MIT

## 🤝 Contributing

This is a demonstration project. Feel free to fork and customize for your needs.
