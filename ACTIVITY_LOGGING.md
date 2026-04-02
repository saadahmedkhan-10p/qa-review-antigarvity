# Activity Logging System

## Overview

The Activity Logging system tracks all user actions across the QA Review application. This provides administrators with a comprehensive audit trail for security, compliance, and troubleshooting purposes.

## Features

- **Comprehensive Tracking**: Logs all major user actions including logins, CRUD operations, and report views
- **Detailed Information**: Captures user details, action type, affected entity, IP address, and user agent
- **Powerful Filtering**: Filter logs by user, action type, entity, and date range
- **Search Functionality**: Search across user names, emails, actions, and entities
- **Export Capability**: Export filtered logs to CSV for external analysis
- **Pagination**: Handle large volumes of logs efficiently

## Database Schema

The `ActivityLog` model includes:
- `id`: Unique identifier
- `userId`: ID of the user who performed the action (nullable for system actions)
- `userName`: Denormalized user name for faster querying
- `userEmail`: Denormalized user email
- `action`: Type of action performed (e.g., LOGIN, CREATE_PROJECT)
- `entity`: Type of entity affected (e.g., Project, Review, User)
- `entityId`: ID of the affected entity
- `details`: JSON string with additional context
- `ipAddress`: User's IP address
- `userAgent`: Browser/client information
- `createdAt`: Timestamp of the action

## Available Actions

### Authentication
- `LOGIN` - User logged in
- `LOGOUT` - User logged out

### Projects
- `CREATE_PROJECT` - New project created
- `UPDATE_PROJECT` - Project updated
- `DELETE_PROJECT` - Project deleted

### Reviews
- `CREATE_REVIEW` - New review created
- `UPDATE_REVIEW` - Review updated
- `SUBMIT_REVIEW` - Review submitted
- `DELETE_REVIEW` - Review deleted

### Users
- `CREATE_USER` - New user created
- `UPDATE_USER` - User updated
- `DELETE_USER` - User deleted

### Comments
- `CREATE_COMMENT` - Comment added
- `DELETE_COMMENT` - Comment deleted

### Forms
- `CREATE_FORM` - Form created
- `UPDATE_FORM` - Form updated
- `DELETE_FORM` - Form deleted

### Contact Persons
- `CREATE_CONTACT` - Contact person created
- `UPDATE_CONTACT` - Contact person updated
- `DELETE_CONTACT` - Contact person deleted
- `BULK_IMPORT_CONTACTS` - Bulk contact import performed

### Reports
- `VIEW_REPORT` - Report viewed
- `EXPORT_REPORT` - Report exported

## How to Log Activities

### Basic Usage

```typescript
import { logActivity } from '@/lib/activityLogger';

// Log a simple action
await logActivity({
  userId: user.id,
  userName: user.name,
  userEmail: user.email,
  action: 'LOGIN',
});
```

### With Entity Information

```typescript
await logActivity({
  userId: user.id,
  userName: user.name,
  userEmail: user.email,
  action: 'CREATE_PROJECT',
  entity: 'Project',
  entityId: project.id,
  details: {
    projectName: project.name,
    leadId: project.leadId,
  },
});
```

### With Request Information

```typescript
import { headers } from 'next/headers';

const headersList = headers();
const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');
const userAgent = headersList.get('user-agent');

await logActivity({
  userId: user.id,
  userName: user.name,
  userEmail: user.email,
  action: 'UPDATE_USER',
  entity: 'User',
  entityId: targetUser.id,
  details: {
    updatedFields: ['name', 'roles'],
  },
  ipAddress,
  userAgent,
});
```

## Accessing Activity Logs

### Admin Interface

1. Log in as an administrator
2. Navigate to **Activity Logs** in the admin menu
3. Use filters to narrow down results:
   - **Search**: Filter by user name, email, action, or entity
   - **Action**: Select specific action type
   - **Entity**: Filter by entity type
   - **Date Range**: Set start and end dates
4. Click **Export CSV** to download filtered results

### API Access

```typescript
// GET /api/admin/activity-logs
const response = await fetch('/api/admin/activity-logs?action=LOGIN&limit=50');
const { logs, total } = await response.json();
```

Query parameters:
- `userId`: Filter by user ID
- `action`: Filter by action type
- `entity`: Filter by entity type
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)

## Implementation Examples

### Example 1: Log Project Creation

```typescript
// In src/app/actions/admin.ts
export async function createProject(formData: FormData) {
  const session = await getServerSession();
  
  const project = await prisma.project.create({
    data: {
      name: formData.get('name') as string,
      // ... other fields
    },
  });

  await logActivity({
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    action: 'CREATE_PROJECT',
    entity: 'Project',
    entityId: project.id,
    details: {
      projectName: project.name,
      description: project.description,
    },
  });

  return project;
}
```

### Example 2: Log Review Submission

```typescript
// In src/app/actions/reviewer.ts
export async function submitReview(reviewId: string, answers: any) {
  const session = await getServerSession();
  
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: 'SUBMITTED',
      submittedDate: new Date(),
      answers: JSON.stringify(answers),
    },
    include: { project: true },
  });

  await logActivity({
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    action: 'SUBMIT_REVIEW',
    entity: 'Review',
    entityId: review.id,
    details: {
      projectName: review.project.name,
      formId: review.formId,
    },
  });

  return review;
}
```

## Best Practices

1. **Always Log Critical Actions**: Ensure all create, update, and delete operations are logged
2. **Include Relevant Details**: Add context in the `details` field to help with troubleshooting
3. **Don't Log Sensitive Data**: Avoid logging passwords, tokens, or other sensitive information
4. **Handle Errors Gracefully**: The `logActivity` function catches errors internally to prevent logging failures from breaking the application
5. **Use Consistent Action Names**: Follow the naming convention established in the `ActivityAction` type

## Performance Considerations

- Activity logs are indexed on `userId`, `action`, `entity`, and `createdAt` for fast queries
- The logging function is non-blocking and won't slow down user operations
- Consider archiving old logs periodically to maintain performance

## Security

- Only administrators can view activity logs
- The API route checks for admin role before returning data
- Logs cannot be modified or deleted through the UI (database-level operations only)

## Future Enhancements

Potential improvements to consider:
- Real-time log streaming for monitoring
- Automated alerts for suspicious activities
- Log retention policies and automatic archiving
- Advanced analytics and reporting
- Integration with external SIEM systems
