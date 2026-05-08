# Automated E2E Testing Suite

This suite provides comprehensive coverage of all roles and flows in the QA Review application using Puppeteer and Jest.

## Prerequisites

1.  **Application Running**: The application must be running at `http://localhost:3000`.
    ```bash
    npm run dev
    ```
2.  **Test Data**: Ensure dummy users are seeded.
    ```bash
    npx ts-node scripts/create-dummy-users.ts
    ```

## Running Tests

Run the full suite:
```bash
npm run test:e2e
```

Run a specific test:
```bash
npx jest tests/e2e/auth.test.ts --config jest.e2e.config.js
```

## Coverage

-   **Authentication**: Login for all roles (Admin, Director, Reviewer, QA Manager, PM).
-   **Project Management**: Create and edit projects as an Admin.
-   **Review Lifecycle**: Initiate cycles, conduct/submit reviews as Reviewer, and update as Admin.
-   **Director Oversight**: Access reports and view read-only forms.
-   **Collaboration**: Multi-role commenting interactions.

## Configuration

The configuration is located in `jest.e2e.config.js`. Timeouts are set to 60s to allow for browser automation and navigation.
To see the browser while testing, set `headless: false` in `tests/test-utils.ts`.
