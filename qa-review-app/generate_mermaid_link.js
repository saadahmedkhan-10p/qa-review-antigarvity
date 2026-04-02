
const diagram = `graph TD
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
    style Stakeholder fill:#fff3e0,stroke:#ef6c00,stroke-width:2px`;

const state = {
    code: diagram,
    mermaid: { "theme": "default" },
    autoSync: true,
    updateDiagram: true
};

const json = JSON.stringify(state);
const buffer = Buffer.from(json);
const base64 = buffer.toString('base64');

const url = `https://mermaid.live/edit#base64:${base64}`;
const fs = require('fs');
fs.writeFileSync('link.txt', url);
console.log('Link written to link.txt');
