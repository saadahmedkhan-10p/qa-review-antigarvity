# Application Overview & User Flows

This document provides a technical overview of the QA Review App architecture and the key user journeys across different roles.

## System Architecture

### 🗺️ Navigation & Site Map
Shows the core pages and access paths for the various user roles.

```mermaid
graph TD
    Login[Login Page] --> Auth{Role Based Check}
    
    Auth --> Admin[Admin Dashboard: /admin/reports]
    Auth --> Lead[Lead Dashboard: /lead/dashboard]
    Auth --> Reviewer[Reviewer Dashboard: /reviewer/dashboard]
    Auth --> QA_MGR[QA Manager Dashboard: /qa-manager/dashboard]
    Auth --> PM[PM Dashboard: /pm/dashboard]
    
    Admin --> Projects[Manage Projects]
    Admin --> Users[Manage Users]
    Admin --> Forms[Form Editor]
    Admin --> Reports[Monthly/Detailed Reports]
    
    Reviewer --> Conduct[Conduct Review: /reviews/:id/conduct]
    Reviewer --> History[Review History]
    
    Lead --> ProjectHistory[Project Review View]
    Lead --> Comments[Add Feedback/Comments]
    
    PM --> PMReports[View Reports]
    PM --> PMComments[Add Comments]
```

### 📊 Data Model (Core Entities)

```mermaid
erDiagram
    User ||--o{ Project : leads
    User ||--o{ Project : reviews
    User ||--o{ Project : pm_of
    User ||--o{ Review : conducts
    User ||--o{ Comment : writes
    
    Project ||--o{ Review : has
    Form ||--o{ Review : defines
    
    Review ||--o{ Comment : has
    Review ||--o{ ActivityLog : logs
    
    Project {
        string id
        string name
        string type "MANUAL, WEB_AUTO, etc."
        string status "ACTIVE, CLOSED"
    }
    
    Review {
        string id
        string status "PENDING, SUBMITTED, etc."
        string healthStatus
        json answers
        datetime scheduledDate
        datetime submittedDate
    }
    
    Form {
        string id
        string title
        json questions
        boolean isSprint0
    }
```

### 🔐 User Roles & Dashboards

| Role | Responsibility | Dashboard Path |
| :--- | :--- | :--- |
| **Admin / QA Head** | System & User Mgmt, Full Reporting | `/admin/reports` |
| **QA Manager / Architect** | Project & Review Oversight | `/qa-manager/dashboard` |
| **Review Lead** | Leading Project Review Cycles | `/lead/dashboard` |
| **Reviewer** | Scheduling and Conducting Reviews | `/reviewer/dashboard` |
| **PM / Director** | Monitoring Health & Providing Feedback | `/pm/dashboard` |
| **Contact Person** | Viewing Assigned Project Reports | `/contact-person/dashboard` |

---

### 🔄 Review Lifecycle State Diagram
Describes the state transitions of a Review entity.

```mermaid
stateDiagram-v2
    [*] --> PENDING: Manual/Auto Creation
    PENDING --> SCHEDULED: Reviewer sets Date
    SCHEDULED --> SUBMITTED: Reviewer completes & submits
    
    PENDING --> DEFERRED: Admin/Lead moves
    SCHEDULED --> DEFERRED: Admin/Lead moves
    
    PENDING --> ON_HOLD: Contextual requirement
    SCHEDULED --> ON_HOLD: Contextual requirement
    
    PENDING --> NOT_COMPLETED: Missed Deadline (Admin action)
    SCHEDULED --> NOT_COMPLETED: Missed Deadline (Admin action)

    SUBMITTED --> [*]
    NOT_COMPLETED --> [*]
    DEFERRED --> PENDING: Reactive
```

### 🚀 Master Application Workflow
The comprehensive end-to-end journey of a project review.

```mermaid
flowchart TD
    subgraph Setup ["1. Configuration Phase (Admin)"]
        A1[Create User] --> A2[Define Assessment Form]
        A2 --> A3[Initialize Project]
        A3 --> A4[Assign Lead & Reviewer]
    end

    subgraph Review ["2. Review Lifecycle (Reviewer/Lead)"]
        A4 --> B1(Cycle Triggered)
        B1 --> B2[Reviewer Schedules Date]
        B2 --> B3[Conduct Assessment]
        B3 --> B4{Status Check}
        B4 -- Submitted --> B5[Locked & Visible]
        B4 -- Overdue --> B6[Admin Marks NOT_COMPLETED]
    end

    subgraph Reporting ["3. Oversight & Value (PM/Admin)"]
        B5 --> C1[Lead Provides Feedback]
        B6 --> C1
        C1 --> C2[Health Dashboards Updated]
        C2 --> C3[Monthly Report Generated]
        C3 --> C4([Strategic Decision Making])
    end

    style Setup fill:#f9f,stroke:#333,stroke-width:2px
    style Review fill:#bbf,stroke:#333,stroke-width:2px
    style Reporting fill:#bfb,stroke:#333,stroke-width:2px
```

### 🏊 Detailed Swimlane Workflow
This diagram visualizes the process flow across different roles, highlighting the interactions and handoffs.

```mermaid
graph TD
    subgraph Admin_System [Admin & System]
        direction TB
        A1(Start: Create Project)
        A2[Assign Reviewer & Lead]
        A3[Trigger Review Cycle]
        A4[System: Send Notifications]
        A5[Generate Monthly Reports]
    end

    subgraph Reviewer_Role [Reviewer]
        direction TB
        R1[Receive Notification]
        R2[Schedule Review Date]
        R3[Conduct Assessment]
        R4[Submit Review]
    end

    subgraph QA_Lead [QA Lead / Manager]
        direction TB
        L1[Monitor Review Status]
        L2[Review Submission Details]
        L3{Feedback Required?}
        L4[Add Comments/Feedback]
        L5[Mark Review as Complete/Verify]
    end

    subgraph Stakeholder [Stakeholder: PM/Director]
        direction TB
        S1[View Project Health Dashboard]
        S2[Analyze Risks & Trends]
        S3[Strategic Decision Making]
    end

    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> R1

    R1 --> R2
    R2 --> R3
    R3 --> R4

    R4 --> L1
    L1 --> L2
    L2 --> L3
    
    L3 -- Yes --> L4
    L4 --> L2
    L3 -- No --> L5

    L5 --> A5
    A5 -.-> S1
    S1 --> S2
    S2 --> S3

    style Admin_System fill:#f9f9f9,stroke:#333,stroke-width:2px
    style Reviewer_Role fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    style QA_Lead fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style Stakeholder fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
```

[View Detailed Swimlane Workflow on Mermaid Live Editor](https://mermaid.live/edit#base64:eyJjb2RlIjoiZ3JhcGggVERcbiAgICBzdWJncmFwaCBBZG1pbl9TeXN0ZW0gW0FkbWluICYgU3lzdGVtXVxuICAgICAgICBkaXJlY3Rpb24gVEJcbiAgICAgICAgQTEoU3RhcnQ6IENyZWF0ZSBQcm9qZWN0KVxuICAgICAgICBBMltBc3NpZ24gUmV2aWV3ZXIgJiBMZWFkXVxuICAgICAgICBBM1tUcmlnZ2VyIFJldmlldyBDeWNsZV1cbiAgICAgICAgQTRbU3lzdGVtOiBTZW5kIE5vdGlmaWNhdGlvbnNdXG4gICAgICAgIEE1W0dlbmVyYXRlIE1vbnRobHkgUmVwb3J0c11cbiAgICBlbmRcblxuICAgIHN1YmdyYXBoIFJldmlld2VyX1JvbGUgW1Jldmlld2VyXVxuICAgICAgICBkaXJlY3Rpb24gVEJcbiAgICAgICAgUjFbUmVjZWl2ZSBOb3RpZmljYXRpb25dXG4gICAgICAgIFIyW1NjaGVkdWxlIFJldmlldyBEYXRlXVxuICAgICAgICBSM1tDb25kdWN0IEFzc2Vzc21lbnRdXG4gICAgICAgIFI0W1N1Ym1pdCBSZXZpZXddXG4gICAgZW5kXG5cbiAgICBzdWJncmFwaCBRQV9MZWFkIFtRQSBMZWFkIC8gTWFuYWdlcl1cbiAgICAgICAgZGlyZWN0aW9uIFRCXG4gICAgICAgIEwxW01vbml0b3IgUmV2aWV3IFN0YXR1c11cbiAgICAgICAgTDJbUmV2aWV3IFN1Ym1pc3Npb24gRGV0YWlsc11cbiAgICAgICAgTDN7RmVlZGJhY2sgUmVxdWlyZWQ/fVxuICAgICAgICBMNFtBZGQgQ29tbWVudHMvRmVlZGJhY2tdXG4gICAgICAgIEw1W01hcmsgUmV2aWV3IGFzIENvbXBsZXRlL1ZlcmlmeV1cbiAgICBlbmRcblxuICAgIHN1YmdyYXBoIFN0YWtlaG9sZGVyIFtTdGFrZWhvbGRlcjogUE0vRGlyZWN0b3JdXG4gICAgICAgIGRpcmVjdGlvbiBUQlxuICAgICAgICBTMVtWaWV3IFByb2plY3QgSGVhbHRoIERhc2hib2FyZF1cbiAgICAgICAgUzJbQW5hbHl6ZSBSaXNrcyAmIFRyZW5kc11cbiAgICAgICAgUzNbU3RyYXRlZ2ljIERlY2lzaW9uIE1ha2luZ11cbiAgICBlbmRcblxuICAgIEExIC0tPiBBMlxuICAgIEEyIC0tPiBBM1xuICAgIEEzIC0tPiBBNFxuICAgIEE0IC0tPiBSMVxuXG4gICAgUjEgLS0+IFIyXG4gICAgUjIgLS0+IFIzXG4gICAgUjMgLS0+IFI0XG5cbiAgICBSNCAtLT4gTDFcbiAgICBMMSAtLT4gTDJcbiAgICBMMiAtLT4gTDNcbiAgICBcbiAgICBMMyAtLSBZZXMgLS0+IEw0XG4gICAgTDQgLS0+IEwyXG4gICAgTDMgLS0gTm8gLS0+IEw1XG5cbiAgICBMNSAtLT4gQTVcbiAgICBBNSAtLi0+IFMxXG4gICAgUzEgLS0+IFMyXG4gICAgUzIgLS0+IFMzXG5cbiAgICBzdHlsZSBBZG1pbl9TeXN0ZW0gZmlsbDojZjlmOWY5LHN0cm9rZTojMzMzLHN0cm9rZS13aWR0aDoycHhcbiAgICBzdHlsZSBSZXZpZXdlcl9Sb2xlIGZpbGw6I2UxZjVmZSxzdHJva2U6IzAyNzdiZCxzdHJva2Utd2lkdGg6MnB4XG4gICAgc3R5bGUgUUFfTGVhZCBmaWxsOiNlOGY1ZTksc3Ryb2tlOiMyZTdkMzIsc3Ryb2tlLXdpZHRoOjJweFxuICAgIHN0eWxlIFN0YWtlaG9sZGVyIGZpbGw6I2ZmZjNlMCxzdHJva2U6I2VmNmMwMCxzdHJva2Utd2lkdGg6MnB4IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOnRydWV9)

### 🛣️ End-to-End Review Sequence
Shows the interaction between different actors in the system.

```mermaid
sequenceDiagram
    participant A as Admin
    participant R as Reviewer
    participant DB as Database
    participant E as Email Service

    A->>DB: Assign Reviewer to Project
    DB-->>A: Project Updated
    A->>E: Trigger Bulk Invites
    E-->>R: "You are assigned a Review"
    R->>DB: Set Scheduled Date
    R->>DB: Conduct Review (Answers, Health, Obs)
    R->>DB: Submit Review
    DB->>A: Status -> SUBMITTED
    DB->>E: Notify PM/Lead
```

---

---

## Role-Specific User Flows

### 👨‍💼 Admin / QA Head Workflow
Focus: Governance, Setup, and System Maintenance.

```mermaid
graph TD
    Start([Start]) --> Login[Login /admin/reports]
    Login --> ManageUsers[Manage Users: Invite/Roles]
    Login --> ManageForms[Edit Assessment Forms: JSON]
    Login --> ManageProjects[Create/Close Projects & Assign Leads]
    
    ManageProjects --> ReviewCycles[Create/Trigger Review Cycles]
    ReviewCycles --> Audit[Monitor Activity Logs]
    Audit --> ReportGen[Export Monthly/Individual PDF Reports]
    ReportGen --> End([End])
```

### 🔍 Reviewer Workflow
Focus: Actioning assignments and technical assessments.

```mermaid
graph TD
    Start([Start]) --> Email[Receive Assignment Email]
    Email --> Login[Login /reviewer/dashboard]
    Login --> Schedule[Set Scheduled Date for Review]
    Schedule --> Conduct[Conduct Review: Answer Form]
    
    Conduct --> Assessments[Fill: Observations & Recommendations]
    Assessments --> HealthScore[Set Project Health Status]
    HealthScore --> Submit[Submit Review]
    Submit --> ViewHist[View Past Submission History]
    ViewHist --> End([End])
```

### 👔 Lead / QA Manager Workflow
Focus: Quality oversight, team management, and closure.

```mermaid
graph TD
    Start([Start]) --> Login[Login /lead/dashboard]
    Login --> Track[Track Active Project Reviews]
    Track --> ReviewDetails[View Submitted Review Details]
    
    ReviewDetails --> Feedback[Add Feedback & Follow-up Comments]
    Feedback --> Adjust[Mark Review as Overdue/Not Completed if missed]
    Adjust --> Stakeholders[Communicate with PM/Directors]
    Stakeholders --> End([End])
```

### 🤝 Stakeholder Workflow (PM / Director / Architect)
Focus: Visibility, alignment, and strategic feedback.

```mermaid
graph TD
    Start([Start]) --> Login[Login /pm/dashboard or /director/dashboard]
    Login --> Overview[View High-level Health Dashboard]
    Overview --> Detail[Drill down into Project Reports]
    
    Detail --> Impact[Provide Strategic Comments/Inputs]
    Impact --> Decision[Make Project Decisions based on QA health]
    Decision --> End([End])
```

---

## Technical Details
