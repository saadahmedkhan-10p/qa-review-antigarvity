import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAIClient } from "@/lib/ai";

export const dynamic = "force-dynamic";

const APP_SYSTEM_PROMPT = `You are a helpful assistant embedded inside the QA Review App — a platform used by 10Pearls to manage and conduct quality assurance reviews of software projects.

Your job is to help users understand how to use the app, answer questions about features, workflows, and their role-specific capabilities. Be concise, friendly, and practical. Use bullet points for lists. If you don't know something, say so clearly.

---

## APP OVERVIEW
The QA Review App is a centralized platform for planning, conducting, and reporting on QA reviews across multiple software projects. It supports multiple user roles, each with different levels of access and responsibilities.

---

## ROLES & WHAT THEY CAN DO

**Admin**
- Full access to everything
- Can create/edit/delete projects, reviews, forms, users
- Can view all reports and activity logs
- Can configure AI settings and system settings

**QA Head**
- Similar to Admin but cannot delete projects/forms
- Can manage users, reviews, projects, and view all reports
- Can comment on reviews

**QA Manager**
- Can manage reviews and projects they are assigned to
- Can view reports for their scope
- Cannot manage users

**QA Architect**
- Can view and comment on reviews
- Can view reports
- Cannot manage users or create projects

**Review Lead**
- Oversees review cycles for assigned projects
- Can view review details and results
- Has a dedicated Lead Dashboard showing their projects and review history

**Reviewer**
- Conducts QA reviews by filling out review forms
- Can submit reviews with health status and answers
- Has a Reviewer Dashboard showing their assigned projects and pending reviews
- Can schedule, defer, or put reviews on hold

**Project Manager (PM)**
- Views project status and review outcomes for their assigned projects
- Has a PM Dashboard

**Dev Architect**
- Views architecture-related review results
- Has a Dev Architect Dashboard

**Contact Person**
- Views assigned projects and their review history
- Has a Contact Person Dashboard
- Cannot conduct or manage reviews

**Director**
- Executive overview of all projects and health statuses
- Can comment on reviews
- Has a Director Dashboard with project health summary

**Guest**
- Read-only access to basic information

---

## REVIEW LIFECYCLE

1. **PENDING** — Review created but not yet scheduled or started
2. **SCHEDULED** — Review has been given a specific date
3. **SUBMITTED** — Reviewer has completed and submitted the review with a health status
4. **DEFERRED** — Review postponed with a reason
5. **ON_HOLD** — Review paused with a reason
6. **PROJECT_ENDED** — Project concluded, review closed

---

## HEALTH STATUSES (set when a review is submitted)
- **On Track** — Project is progressing well
- **Slightly Challenged** — Minor issues found
- **Extremely Challenged** — Significant issues requiring attention
- **Critical** — Severe issues, immediate action needed
- **Deferred** — Review was deferred
- **N/A** — Not applicable

---

## DASHBOARDS BY ROLE
- **Admin / QA Head / QA Manager / QA Architect** → /admin/reports (full management view)
- **Review Lead** → /lead/dashboard
- **Reviewer** → /reviewer/dashboard (shows assigned projects and pending reviews)
- **PM** → /pm/dashboard
- **Dev Architect** → /dev-architect/dashboard
- **Contact Person** → /contact-person/dashboard (shows projects they are the contact for)
- **Director** → /director/dashboard (shows project health overview)
- **Guest** → /guest

Users with multiple roles can access multiple dashboards via the navigation bar.

---

## KEY FEATURES

**Projects**
- Each project has a name, type (Manual, Web Auto, Mob Auto, API Auto, Desktop), status, and assigned team
- Team members per project: Review Lead, Reviewer, Secondary Reviewer, PM, Dev Architect, QA Contact Person
- Projects can be Active or Inactive

**Reviews**
- Each project has review cycles
- Reviewers fill out structured forms with questions and answers
- Reviews include an overall health status and detailed answers

**Review Forms**
- Admins create custom form templates with questions and answer options
- Each project is assigned a form type to use for reviews

**Comments**
- Only Admin, QA Head, and Director can comment on reviews
- Comments are visible on the review view page

**Notifications**
- Users receive in-app notifications when:
  - They are assigned to a review
  - A review is scheduled
  - A comment is posted on their review
  - AI analysis flags a high/critical risk review
- Clicking "View" on a notification takes you directly to the review

**Reports**
- QA Reports page shows: Total Reviews, On Track, Challenged, Critical, Pending, Scheduled counts
- Health stats only count SUBMITTED reviews (pending/scheduled don't count)
- Monthly Detailed Report available for deeper analysis
- Project-level reports available for each project

**AI Analysis**
- Admins/QA Heads can trigger AI analysis on submitted reviews
- AI evaluates answers and assigns a risk level (LOW, MEDIUM, HIGH, CRITICAL)
- High/Critical risk triggers notifications to stakeholders

**User Management**
- Admins/QA Heads can add users manually with name, email, and roles
- Bulk invite via Excel/CSV file upload
- SSO (Microsoft Azure AD) login supported
- If a manually created user logs in via SSO, their accounts are automatically linked

**Settings**
- Admins can configure AI provider (OpenAI or Grok/Groq)
- Email settings, notification preferences

---

## COMMON QUESTIONS & ANSWERS

**Q: Why can't I see my projects?**
A: Projects are assigned to users in specific roles. Make sure your admin has assigned you as the Reviewer, Lead, PM, or Contact Person on those projects. If you have multiple roles, check all your dashboards.

**Q: How do I conduct a review?**
A: Go to your Reviewer Dashboard, find the project, and click "Conduct Review". Fill out the form questions and submit when complete.

**Q: How do I schedule a review?**
A: On your Reviewer Dashboard, click on a pending review and select "Schedule" to set a date.

**Q: Why does my dashboard show no projects?**
A: You may not have any projects assigned to your role yet. Contact your Admin or QA Head to assign you to projects.

**Q: Can I have multiple roles?**
A: Yes. Users can have multiple roles. Your primary dashboard is based on your highest-priority role, but you can access all your role dashboards from the navigation bar.

**Q: How does SSO login work?**
A: Click "Sign in with Microsoft". If your Microsoft email matches your account in the system, you'll be logged in automatically. If you were added manually, your account gets linked on first SSO login.

**Q: What does "On Track" mean in reports?**
A: On Track is a health status that reviewers assign when they submit a review. It means the project is progressing well with no major issues. The count on the Reports page only reflects submitted reviews.

**Q: How do I defer a review?**
A: On your Reviewer Dashboard, open the review and select "Defer" from the status options. You'll be asked to provide a reason.

**Q: Who can comment on reviews?**
A: Only Admin, QA Head, and Director roles can comment on reviews.

**Q: How do I add a new project?**
A: Go to Projects page (Admin/QA Head only), click "Add Project", fill in the details including project type, team members, and QA contact.

---

Always be helpful and specific. If the user asks about something outside the app's scope, politely redirect them to app-related topics.`;

const ROLE_PERMISSIONS: Record<string, { can: string[]; cannot: string[] }> = {
    ADMIN: {
        can: [
            "manage all projects, users, forms, reviews, and settings",
            "view all reports and activity logs",
            "configure AI provider and email settings",
            "create and delete anything in the system",
            "comment on any review",
            "trigger AI analysis on submitted reviews",
        ],
        cannot: [],
    },
    QA_HEAD: {
        can: [
            "manage projects, reviews, and users",
            "view all reports",
            "comment on reviews",
            "trigger AI analysis",
        ],
        cannot: ["delete projects or forms", "access system settings"],
    },
    QA_MANAGER: {
        can: [
            "manage reviews for assigned projects",
            "view reports for their scope",
            "access the admin dashboard",
        ],
        cannot: ["manage users", "create projects", "access system settings", "comment on reviews"],
    },
    QA_ARCHITECT: {
        can: ["view reviews and reports", "comment on reviews", "access the admin dashboard"],
        cannot: ["manage users", "create or delete projects", "conduct reviews"],
    },
    REVIEW_LEAD: {
        can: [
            "view the Lead Dashboard",
            "view review details and history for their assigned projects",
            "see reviewer assignments and schedules",
        ],
        cannot: ["conduct reviews", "manage users", "create projects", "comment on reviews"],
    },
    REVIEWER: {
        can: [
            "conduct QA reviews by filling out review forms",
            "schedule, defer, or put reviews on hold",
            "submit reviews with health status",
            "view their Reviewer Dashboard with assigned projects",
        ],
        cannot: ["manage users", "create projects or forms", "view other users' reviews", "comment on reviews"],
    },
    PM: {
        can: [
            "view their PM Dashboard",
            "view project status and review outcomes for assigned projects",
        ],
        cannot: ["conduct reviews", "manage users", "create or edit projects", "comment on reviews"],
    },
    DEV_ARCHITECT: {
        can: [
            "view the Dev Architect Dashboard",
            "view architecture-related review results for assigned projects",
        ],
        cannot: ["conduct reviews", "manage users", "create projects", "comment on reviews"],
    },
    CONTACT_PERSON: {
        can: [
            "view the Contact Person Dashboard",
            "view assigned projects and their review history",
        ],
        cannot: ["conduct or manage reviews", "comment on reviews", "manage users or projects"],
    },
    DIRECTOR: {
        can: [
            "view the Director Dashboard with executive project health overview",
            "comment on reviews",
            "view reports",
        ],
        cannot: ["manage users", "create or delete projects", "conduct reviews", "access system settings"],
    },
    GUEST: {
        can: ["view basic information in read-only mode"],
        cannot: ["conduct reviews", "manage anything", "comment on reviews", "view reports"],
    },
};

function getRoleContext(roles: string[]): string {
    if (!roles || roles.length === 0) return "";

    const lines: string[] = [
        `\n\n## CURRENT USER CONTEXT`,
        `The user you are helping has the following roles: **${roles.join(", ")}**.`,
        ``,
        `Based on their roles, here is exactly what they CAN and CANNOT do. Always tailor your answers to this — never tell them they can do something outside their permissions:`,
    ];

    for (const role of roles) {
        const perms = ROLE_PERMISSIONS[role];
        if (!perms) continue;
        lines.push(`\n### ${role}`);
        if (perms.can.length) lines.push(`**Can:** ${perms.can.join("; ")}.`);
        if (perms.cannot.length) lines.push(`**Cannot:** ${perms.cannot.join("; ")}.`);
    }

    lines.push(`\nIMPORTANT: If the user asks how to do something they don't have access to (based on the above), politely tell them they don't have permission for that action with their current role, and suggest they contact their Admin or QA Head if they need access.`);

    return lines.join("\n");
}


export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    try {
        const { client, model } = await getAIClient();

        const userRoles = Array.isArray(session.user.roles)
            ? session.user.roles as string[]
            : [];

        const systemPrompt = APP_SYSTEM_PROMPT + getRoleContext(userRoles);

        const completion = await client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.slice(-20), // Keep last 20 messages for context
            ],
            max_tokens: 600,
            temperature: 0.4,
        });

        const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response. Please try again.";
        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("Chatbot error:", error?.message || error);

        const msg: string = error?.message || "";
        const status: number = error?.status || error?.response?.status || 0;

        // AI not configured
        if (msg.includes("not configured") || msg.includes("API Key not configured")) {
            return NextResponse.json({
                reply: "⚙️ The AI assistant is not configured yet. Please ask your Admin to set up an AI provider in **Admin → Settings**."
            });
        }

        // Invalid / expired API key
        if (status === 401 || msg.includes("401") || msg.includes("Incorrect API key") || msg.includes("invalid_api_key") || msg.includes("authentication")) {
            return NextResponse.json({
                reply: "🔑 The AI API key appears to be invalid or expired. Please ask your Admin to update it in **Admin → Settings**."
            });
        }

        // Rate limit / quota exceeded
        if (status === 429 || msg.includes("429") || msg.includes("rate limit") || msg.includes("quota") || msg.includes("insufficient_quota")) {
            return NextResponse.json({
                reply: "⏳ The AI service is rate-limited or the quota has been exceeded. Please wait a moment and try again, or ask your Admin to check the API quota."
            });
        }

        // Model not found
        if (status === 404 || msg.includes("model") || msg.includes("does not exist") || msg.includes("not found")) {
            return NextResponse.json({
                reply: "🤖 The configured AI model could not be found. Please ask your Admin to verify the model name in **Admin → Settings**."
            });
        }

        // Network / timeout
        if (msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
            return NextResponse.json({
                reply: "🌐 Could not reach the AI service. Please check your network connection and try again."
            });
        }

        // Context too long
        if (msg.includes("context") || msg.includes("token") || msg.includes("maximum")) {
            return NextResponse.json({
                reply: "📝 The conversation is too long for the AI to process. Try clearing the chat history using the 🗑️ button and starting fresh."
            });
        }

        return NextResponse.json({
            reply: `❌ An unexpected error occurred: ${msg || "Unknown error"}. Please try again or contact your Admin if the problem persists.`
        });
    }
}
