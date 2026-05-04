# QA Review Intelligence Platform

A comprehensive quality assurance review management system built with Next.js, tailored for enterprise QA teams. It features dynamic review form building, role-based access control, AI-powered review analysis, and robust activity auditing.

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Admins, QA Heads, QA Managers, QA Architects, Review Leads, Reviewers, PMs, Dev Architects, Contact Persons, and Directors.
*   **Dynamic Form Builder:** Admins can create and customize review forms with various question types (Text, Checkbox, Select, Radio, Number) tailored to different project types (Manual, Automation, API, etc.).
*   **AI-Powered Analysis:** Integration with OpenAI (GPT-4o) to automatically generate comprehensive summaries, identify critical risks, and suggest actionable improvements based on reviewer input and project health.
*   **Comprehensive Audit Trails:** Every major action (logging in, creating forms, submitting reviews, etc.) is logged securely for compliance and tracking.
*   **Advanced Reporting:** Filterable dashboards, CSV exports, and dynamic data tables with sorting and pagination for efficient project oversight.
*   **Secure Authentication:** Custom JWT-based session management using `jose` and `bcryptjs`.

## 🛠 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
*   **Database:** PostgreSQL (hosted on [Neon](https://neon.tech/))
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **AI Integration:** [OpenAI API](https://openai.com/api/)
*   **Authentication:** Custom JWT with `jose`
*   **Charting:** [Recharts](https://recharts.org/)

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd qa-review-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add the following keys:

```env
# Database connection string (PostgreSQL)
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

### 4. Initialize the Database
Push the Prisma schema to your configured database. (Note: We use `db push` instead of migrations for flexible schema prototyping).
```bash
npx prisma generate
npx prisma db push
```

### 5. Seed Initial Data
Create an initial Admin user (or QA Head) to access the system:
```bash
npx tsx scripts/create-qa-head.ts
```

### 6. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤖 Configuring AI Features
To enable AI Analysis generation:
1. Log in to the application as an **Admin**.
2. Navigate to **Settings** (`/admin/settings`) using the navigation bar.
3. Enter your **OpenAI API Key** and click Save.
4. Reviewers and Admins will now see a "Generate AI Analysis" button when conducting or editing a review.

## 🚀 Deployment (Vercel)

This application is optimized for deployment on [Vercel](https://vercel.com).

1. Push your code to a Git repository.
2. Import the project into Vercel.
3. In the Vercel project settings, set the following **Environment Variables**:
    *   `DATABASE_URL` (Points to your production PostgreSQL DB)
    *   `JWT_SECRET` (A strong, securely generated string)
4. The custom `vercel.json` ensures the correct build step is run (`npx prisma db push`) to provision database tables automatically on the first deployment.

## 🔒 Security Best Practices
*   **Never commit `.env` files.**
*   The `JWT_SECRET` must be kept entirely secret. If compromised, change it immediately (this will invalidate all current user sessions).
*   API keys (like OpenAI) are stored securely in the database, not in flat configuration files or environment variables, allowing dynamic updates by Administrators.

---
*Built with ❤️ by the QA Team*
