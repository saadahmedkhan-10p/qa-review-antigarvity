# Deployment Guide for Vercel

This guide outlines the steps to deploy the QA Review Application to [Vercel](https://vercel.com/).

## Prerequisites

1. **Vercel Account**: Sign up for a free account at [vercel.com](https://vercel.com/).
2. **Vercel CLI**: Already installed (`vercel` command available).
3. **PostgreSQL Database**: You'll need a PostgreSQL database. We recommend [Neon](https://neon.tech/) or [Supabase](https://supabase.com/) (both have generous free tiers).

## Step 1: Set Up PostgreSQL Database

### Option A: Neon (Recommended - Serverless PostgreSQL)
1. Go to [neon.tech](https://neon.tech/) and sign up.
2. Create a new project.
3. Copy the connection string (it will look like: `postgresql://user:password@host/database?sslmode=require`).

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com/) and sign up.
2. Create a new project.
3. Go to **Settings** → **Database** and copy the connection string (use the "Connection pooling" URL for better performance).

### Option C: Vercel Postgres
1. In your Vercel dashboard, go to **Storage** → **Create Database** → **Postgres**.
2. Follow the prompts to create a database.
3. Copy the connection string.

## Step 2: Update Local Environment

We've already updated `prisma/schema.prisma` to use PostgreSQL instead of SQLite.

Create a new `.env.production` file (or update `.env.local`) with your production database URL:

```env
DATABASE_URL="your-postgresql-connection-string-here"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://your-app.vercel.app"
```

## Step 3: Deploy to Vercel

Run the deployment command:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No
- **Project name?** qa-review-app (or your preferred name)
- **Directory?** ./ (current directory)
- **Override settings?** No

This will create a preview deployment.

## Step 4: Configure Environment Variables

After the initial deployment, you need to add environment variables:

```bash
vercel env add DATABASE_URL
```

When prompted:
- Paste your PostgreSQL connection string
- Select **Production**, **Preview**, and **Development**

Repeat for other variables:

```bash
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

For `NEXTAUTH_URL`, use your Vercel deployment URL (e.g., `https://qa-review-app.vercel.app`).

### Optional: Email Configuration

If you want email functionality:

```bash
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASS
vercel env add SMTP_FROM
```

## Step 5: Run Database Migrations

You need to run Prisma migrations on your production database. You can do this locally:

1. Temporarily update your local `.env` with the production `DATABASE_URL`.
2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Seed the database (if needed):
   ```bash
   npx prisma db seed
   ```
4. Restore your local `.env` to use the development database.

**Important**: The `postinstall` script in `package.json` will automatically run `prisma generate` during deployment.

## Step 6: Deploy to Production

Once environment variables are set and migrations are complete:

```bash
vercel --prod
```

This will deploy to your production domain.

## Step 7: Verify Deployment

1. Visit your deployment URL (shown in the terminal).
2. Try logging in with your credentials.
3. Check that all features work correctly.

## Automatic Deployments (Optional)

To enable automatic deployments on every git push:

1. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/yourusername/qa-review-app.git
   git push -u origin main
   ```

2. In the Vercel dashboard:
   - Go to your project
   - Click **Settings** → **Git**
   - Connect your GitHub repository

Now every push to `main` will trigger a production deployment, and pull requests will get preview deployments.

## Troubleshooting

### Build Errors
- Check the build logs in the Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript types are correct

### Database Connection Issues
- Ensure `DATABASE_URL` is set correctly
- Check that the database allows connections from Vercel's IP ranges
- For Neon/Supabase, ensure SSL mode is enabled

### Prisma Client Errors
- The `postinstall` script should handle this, but if issues persist, you can add a build command override in `vercel.json`

## Custom Domain (Optional)

To add a custom domain:
1. Go to your project in Vercel dashboard
2. Click **Settings** → **Domains**
3. Add your domain and follow DNS configuration instructions

## Notes

- Vercel's free tier is very generous and should be sufficient for most use cases
- The app will automatically scale based on traffic
- Vercel provides excellent analytics and monitoring
- Preview deployments are created for every git branch
