# Deployment Guide for Railway

This guide outlines the steps to deploy the QA Review Application to [Railway](https://railway.app/).

## Prerequisites

1.  **GitHub Account**: Ensure you have a GitHub account and the project is pushed to a repository.
2.  **Railway Account**: Sign up for an account at [railway.app](https://railway.app/).

## Step 1: Prepare the Project

We have already updated `package.json` to include a `postinstall` script that runs `prisma generate`. This ensures the Prisma client is generated during the build process.

## Step 2: Create a New Project on Railway

1.  Log in to your Railway dashboard.
2.  Click **+ New Project**.
3.  Select **Deploy from GitHub repo**.
4.  Select your repository (`qa-review-app` or whatever you named it).
5.  Click **Deploy Now**.

## Step 3: Add a Database

1.  In your project view on Railway, click **+ New** (or right-click the canvas).
2.  Select **Database** -> **PostgreSQL**.
3.  This will create a PostgreSQL instance.

## Step 4: Configure Environment Variables

1.  Click on your application service (the one connected to GitHub).
2.  Go to the **Variables** tab.
3.  You need to add the environment variables defined in your `.env` file.
    *   **DATABASE_URL**: Railway usually provides this automatically if you link the database, but you might need to reference the PostgreSQL service variable (e.g., `${POSTGRES_URL}`).
    *   **NEXTAUTH_SECRET**: Generate a strong secret (you can use `openssl rand -base64 32` in your terminal to generate one).
    *   **NEXTAUTH_URL**: Set this to your Railway deployment URL (e.g., `https://your-app-name.up.railway.app`). *Note: You might need to deploy once to get the domain, or set a custom domain first.*
    *   **SMTP_HOST**, **SMTP_PORT**, **SMTP_USER**, **SMTP_PASS**, **SMTP_FROM**: Add your email service credentials.

## Step 5: Database Migration

Railway deployments are ephemeral, so you should run migrations to ensure the database schema is up to date.

1.  Go to the **Settings** tab of your application service.
2.  Under **Deploy** > **Build Command**, it should default to `npm run build`.
3.  We need to run migrations *before* the app starts or during the build. A common pattern is to add a start command that runs migrations.
4.  Update the **Start Command** to:
    ```bash
    npx prisma migrate deploy && npm start
    ```
    *This ensures that every time the app starts, it applies any pending migrations to the production database.*

## Step 6: Verify Deployment

1.  Once the variables are set and the start command is updated, Railway should trigger a redeploy.
2.  Check the **Deployments** tab to see the build and deploy logs.
3.  Once active, click the provided URL to access your application.
4.  Log in with your credentials (you may need to seed the database or create an initial admin user manually if not seeded).

### Seeding the Database (Optional)

If you need to seed the database with initial data:
1.  You can run the seed script locally pointing to the remote database (by updating your local `.env` temporarily).
2.  Or, add a command to run the seed script in the Railway console.

## Troubleshooting

*   **Build Failed**: Check the logs. Common issues are missing dependencies or type errors.
*   **Database Connection Error**: Ensure `DATABASE_URL` is correct and the PostgreSQL service is running.
*   **Prisma Client Error**: Ensure `prisma generate` ran successfully (the `postinstall` script should handle this).
