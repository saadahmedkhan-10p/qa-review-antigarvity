import nodemailer from 'nodemailer';

// H-07: HTML-escape helper — prevents HTML injection in email templates
function esc(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/\r/g, "")
        .replace(/\n/g, "");
}

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://qa-review-app.vercel.app').replace(/\/$/, '');

// Global wrapper for all emails
function emailWrapper(title: string, innerHtml: string): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f5f7; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 32px 40px; background-color: #ffffff; border-bottom: 1px solid #f3f4f6;">
                            <img src="${APP_URL}/app-logo.png" alt="10Pearls" width="140" style="display: block; width: 140px; max-width: 100%; height: auto;">
                        </td>
                    </tr>
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px; color: #374151; font-size: 16px; line-height: 24px;">
                            ${innerHtml}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #f3f4f6;">
                            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">This is an automated message from the QA Review System.</p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">&copy; ${new Date().getFullYear()} 10Pearls. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Reusable UI components for emails
const UI = {
    h2: (text: string) => `<h2 style="margin-top: 0; margin-bottom: 24px; color: #111827; font-size: 24px; font-weight: 600;">${text}</h2>`,
    p: (text: string) => `<p style="margin-top: 0; margin-bottom: 16px;">${text}</p>`,
    strong: (text: string) => `<strong>${text}</strong>`,
    button: (href: string, text: string) => `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px; margin-bottom: 16px;">
            <tr>
                <td align="center">
                    <a href="${href}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; transition: background-color 0.2s;">
                        ${text}
                    </a>
                </td>
            </tr>
        </table>
    `,
    alertBox: (content: string, type: 'warning' | 'error' | 'info' = 'warning') => {
        const colors = {
            warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
            error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
            info: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
        };
        const c = colors[type];
        return `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${c.bg}; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid ${c.border};">
            <tr>
                <td style="padding: 16px 20px;">
                    <div style="margin: 0; color: ${c.text}; font-size: 15px;">${content}</div>
                </td>
            </tr>
        </table>`;
    },
    highlightBox: (content: string) => `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
            <tr>
                <td style="padding: 24px;">
                    ${content}
                </td>
            </tr>
        </table>
    `
};

export const emailTemplates = {
  userCreated: (name: string, email: string, role: string, setupToken?: string) => ({
    subject: 'Welcome to QA Review System',
    html: emailWrapper('Welcome to QA Review System', `
      ${UI.h2('Welcome to QA Review System!')}
      ${UI.p(`Hello ${UI.strong(esc(name))},`)}
      ${UI.p('Your account has been created successfully.')}
      
      ${UI.highlightBox(`
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Account Details</p>
        <p style="margin: 0 0 4px 0; font-size: 16px;"><strong>Email:</strong> ${esc(email)}</p>
        <p style="margin: 0; font-size: 16px;"><strong>Role:</strong> ${esc(role.replace(/_/g, ' '))}</p>
      `)}

      ${setupToken ? `
        ${UI.alertBox('<strong>⚠️ Action Required:</strong> Please set your password to activate your account.', 'warning')}
        ${UI.p('Click the button below to set your password. This link will expire in 24 hours.')}
        ${UI.button(`${APP_URL}/set-password?token=${encodeURIComponent(setupToken)}`, 'Set Your Password')}
      ` : `
        ${UI.p('You can now log in to the QA Review System using your email address.')}
        ${UI.button(APP_URL, 'Login to Dashboard')}
      `}
    `),
  }),

  projectAssigned: (recipientName: string, projectName: string, leadName: string, contactName: string, primaryReviewerName: string, secondaryReviewerName?: string) => ({
    subject: `New Project Assignment: ${esc(projectName)}`,
    html: emailWrapper('New Project Assignment', `
      ${UI.h2('New Project Assignment')}
      ${UI.p(`Hello ${UI.strong(esc(recipientName))},`)}
      ${UI.p('You have been assigned as a reviewer for a new project.')}
      
      ${UI.highlightBox(`
        <h3 style="margin-top: 0; margin-bottom: 16px; color: #111827;">${esc(projectName)}</h3>
        <p style="margin: 0 0 8px 0;"><strong>Primary Reviewer:</strong> ${esc(primaryReviewerName)}</p>
        ${secondaryReviewerName ? `<p style="margin: 0 0 8px 0;"><strong>Secondary Reviewer:</strong> ${esc(secondaryReviewerName)}</p>` : ''}
        <p style="margin: 0 0 8px 0;"><strong>Review Lead:</strong> ${esc(leadName)}</p>
        <p style="margin: 0;"><strong>Contact Person:</strong> ${esc(contactName)}</p>
      `)}
      
      ${UI.p('You will receive review invitations for this project when review cycles are initiated.')}
      ${UI.button(`${APP_URL}/reviewer/dashboard`, 'View Dashboard')}
    `),
  }),

  reviewInvite: (reviewerName: string, projectName: string, formTitle: string, deadline: string, secondaryReviewerName?: string, isSecondary?: boolean, isLead?: boolean) => ({
    subject: `A monthly QA review assignment request for ${esc(projectName)}`,
    html: emailWrapper(`Review Assignment: ${esc(projectName)}`, `
      ${UI.h2(`Review Request: ${esc(projectName)}`)}
      ${UI.p(`Hello ${UI.strong(esc(reviewerName))},`)}
      ${UI.p(isLead ? 'A new review cycle has been initiated for a project you lead.' : isSecondary ? 'A new review cycle has been initiated where you are assigned as an observer/secondary reviewer.' : 'A new review cycle has been initiated for your project.')}
      
      ${UI.alertBox(`
        <h3 style="margin-top: 0; margin-bottom: 12px;">${esc(projectName)}</h3>
        <p style="margin: 0 0 12px 0;"><strong>Review Form:</strong> ${esc(formTitle)}</p>
        ${(!isSecondary && !isLead) ? `
          <p style="margin: 0 0 8px 0;"><strong>⚠️ Important Deadlines:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 4px;">Schedule by: <strong>10th of the month</strong></li>
            <li>Complete by: <strong>20th of the month</strong></li>
          </ul>
        ` : isLead ? '<p style="margin: 0;">You can monitor the progress of this review from your dashboard.</p>' : '<p style="margin: 0;">Please observe and support the primary reviewer as needed.</p>'}
        <p style="margin: 16px 0 0 0; font-size: 14px;"><strong>Collaborators:</strong> ${esc(reviewerName)}${secondaryReviewerName ? `, ${esc(secondaryReviewerName)}` : ''}</p>
      `, (!isSecondary && !isLead) ? 'warning' : 'info')}
      
      ${UI.p((isSecondary || isLead) ? 'Please log in to view the project dashboard.' : 'Please log in to schedule and conduct your review.')}
      ${UI.button(`${APP_URL}/${isLead ? 'lead' : 'reviewer'}/dashboard`, (isSecondary || isLead) ? 'View Dashboard' : 'Schedule Review')}
    `),
  }),

  reviewScheduled: (reviewerName: string, projectName: string, scheduledDate: string) => ({
    subject: `Review Scheduled: ${esc(projectName)}`,
    html: emailWrapper(`Review Scheduled: ${esc(projectName)}`, `
      ${UI.h2('Review Scheduled Successfully')}
      ${UI.p(`Hello ${UI.strong(esc(reviewerName))},`)}
      ${UI.p('Your review has been scheduled successfully.')}
      
      ${UI.alertBox(`
        <h3 style="margin-top: 0; margin-bottom: 12px;">${esc(projectName)}</h3>
        <p style="margin: 0 0 8px 0;"><strong>Scheduled Date:</strong> ${esc(scheduledDate)}</p>
        <p style="margin: 0;">Remember to complete the review by the <strong>20th of the month</strong>.</p>
      `, 'info')}
      
      ${UI.button(`${APP_URL}/reviewer/dashboard`, 'View Dashboard')}
    `),
  }),

  leadNotification: (leadName: string, projectName: string, reviewerName: string, action: string) => ({
    subject: `Project Update: ${esc(projectName)}`,
    html: emailWrapper(`Project Update: ${esc(projectName)}`, `
      ${UI.h2('Project Update')}
      ${UI.p(`Hello ${UI.strong(esc(leadName))},`)}
      ${UI.p(esc(action))}
      
      ${UI.highlightBox(`
        <h3 style="margin-top: 0; margin-bottom: 12px;">${esc(projectName)}</h3>
        <p style="margin: 0;"><strong>Reviewer:</strong> ${esc(reviewerName)}</p>
      `)}
      
      ${UI.button(`${APP_URL}/lead/dashboard`, 'View Dashboard')}
    `),
  }),

  reminderScheduling: (reviewerName: string, projectName: string, secondaryReviewerName?: string, isSecondary?: boolean) => ({
    subject: isSecondary ? `Update: Review Scheduling for ${esc(projectName)}` : `Reminder: Schedule Review for ${esc(projectName)}`,
    html: emailWrapper(isSecondary ? 'Review Scheduling Update' : 'Action Required: Schedule Review', `
      ${UI.h2(isSecondary ? 'Review Scheduling Update' : 'Action Required: Schedule Review')}
      ${UI.p(`Hello ${UI.strong(esc(reviewerName))},`)}
      ${UI.p(isSecondary ? `The QA review for <strong>${esc(projectName)}</strong> is currently being scheduled by the primary reviewer.` : `This is a reminder to schedule your QA review for <strong>${esc(projectName)}</strong> for this month.`)}
      
      ${UI.alertBox(`
        <h3 style="margin-top: 0; margin-bottom: 12px;">${esc(projectName)}</h3>
        ${!isSecondary ? '<p style="margin: 0 0 8px 0;">Please schedule your review as soon as possible.</p>' : ''}
        <p style="margin: 0;"><strong>Deadline for scheduling: 10th of the month</strong></p>
        ${secondaryReviewerName ? `<p style="margin: 12px 0 0 0; font-size: 13px;">Cc: ${esc(secondaryReviewerName)}</p>` : ''}
      `, 'warning')}
      
      ${UI.button(`${APP_URL}/reviewer/dashboard`, 'View Dashboard')}
    `),
  }),

  reminderSubmission: (reviewerName: string, projectName: string, secondaryReviewerName?: string) => ({
    subject: `Reminder: Submit Review for ${esc(projectName)}`,
    html: emailWrapper(`Reminder: Submit Review for ${esc(projectName)}`, `
      ${UI.h2('Action Required: Submit Review')}
      ${UI.p(`Hello ${UI.strong(esc(reviewerName))},`)}
      ${UI.p(`This is a reminder to submit your QA review for <strong>${esc(projectName)}</strong>.`)}
      
      ${UI.alertBox(`
        <h3 style="margin-top: 0; margin-bottom: 12px;">${esc(projectName)}</h3>
        <p style="margin: 0 0 8px 0;">The review deadline is approaching.</p>
        <p style="margin: 0;"><strong>Deadline for submission: 20th of the month</strong></p>
        ${secondaryReviewerName ? `<p style="margin: 12px 0 0 0; font-size: 13px;">Cc: ${esc(secondaryReviewerName)}</p>` : ''}
      `, 'error')}
      
      ${UI.button(`${APP_URL}/reviewer/dashboard`, 'Submit Review')}
    `),
  }),

  passwordReset: (name: string, resetToken: string) => ({
    subject: 'Reset Your Password - QA Review System',
    html: emailWrapper('Password Reset Request', `
      ${UI.h2('Password Reset Request')}
      ${UI.p(`Hello ${UI.strong(esc(name))},`)}
      ${UI.p('We received a request to reset the password for your QA Review System account.')}
      
      ${UI.alertBox('<strong>⚠️ Security Note:</strong> If you did not make this request, you can safely ignore this email.', 'warning')}
      
      ${UI.p('Click the button below to reset your password. This link will expire in 1 hour.')}
      ${UI.button(`${APP_URL}/set-password?token=${encodeURIComponent(resetToken)}`, 'Reset Password')}
    `),
  }),

  mentionNotification: (targetName: string, authorName: string, comment: string, reviewId: string) => ({
    subject: `You were mentioned in a QA Review`,
    html: emailWrapper('New Mention in QA Review', `
      ${UI.h2('New Mention')}
      ${UI.p(`Hello ${UI.strong(esc(targetName))},`)}
      ${UI.p(`<strong>${esc(authorName)}</strong> tagged you in a comment:`)}
      
      ${UI.highlightBox(`
        <p style="margin: 0; font-style: italic; color: #4B5563; border-left: 3px solid #2563eb; padding-left: 16px;">"${esc(comment)}"</p>
      `)}
      
      ${UI.button(`${APP_URL}/reviews/${reviewId}`, 'View Comment')}
    `),
  }),

  aiAlert: (name: string, projectName: string, riskLevel: string, riskScore: number, actionItems: string[], reviewId: string) => ({
    subject: `⚠️ AI Risk Alert: ${esc(projectName)} [${riskLevel}]`,
    html: emailWrapper(`AI Risk Evaluation: ${riskLevel}`, `
      ${UI.h2(`AI Risk Evaluation: ${riskLevel}`)}
      ${UI.p(`Hello ${UI.strong(esc(name))},`)}
      ${UI.p(`The AI Analysis Engine has flagged a high-risk project state for <strong>${esc(projectName)}</strong>.`)}
      
      ${UI.alertBox(`
        <p style="margin: 0 0 8px 0;"><strong>Risk Score:</strong> ${riskScore}/10</p>
        <p style="margin: 0 0 16px 0;"><strong>Status:</strong> ${riskLevel}</p>
        <p style="margin: 0 0 8px 0;"><strong>Action Items:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          ${actionItems.map(item => `<li style="margin-bottom: 4px;">${esc(item)}</li>`).join('')}
        </ul>
      `, 'error')}
      
      ${UI.button(`${APP_URL}/reviews/${reviewId}`, 'Investigate Review')}
    `),
  }),

  roleChanged: (name: string, oldRoles: string[], newRoles: string[]) => ({
    subject: '🔔 Your Role Has Been Updated - QA Review System',
    html: emailWrapper('Role Updated', `
      ${UI.h2('Role Updated')}
      ${UI.p(`Hello ${UI.strong(esc(name))},`)}
      ${UI.p('An administrator has updated your role in the <strong>QA Review System</strong>. Here is a summary of the change:')}
      
      ${UI.highlightBox(`
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Previous Role</p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #ef4444; font-weight: 500;">
          ${oldRoles.length > 0 ? oldRoles.map(r => esc(r.replace(/_/g, ' '))).join(', ') : 'No roles assigned'}
        </p>
        
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">New Role</p>
        <p style="margin: 0; font-size: 18px; color: #10b981; font-weight: 600;">
          ${newRoles.length > 0 ? newRoles.map(r => esc(r.replace(/_/g, ' '))).join(', ') : 'No roles assigned'}
        </p>
      `)}
      
      ${UI.alertBox('<strong>Action Required:</strong> To see your new role and access your updated dashboard, please <strong>log out and log back in</strong>.', 'warning')}
      
      ${UI.button(`${APP_URL}/login`, 'Log In Now')}
      
      <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">If you believe this change was made in error, please contact your system administrator.</p>
    `),
  }),

  ssoWelcome: (name: string, email: string) => ({
    subject: 'Welcome to QA Review System - Account Created',
    html: emailWrapper('Welcome to QA Review System', `
      ${UI.h2('Welcome to QA Review System!')}
      ${UI.p(`Hello ${UI.strong(esc(name))},`)}
      ${UI.p('Your account has been successfully created using your <strong>Microsoft account</strong>.')}

      ${UI.highlightBox(`
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Account Details</p>
        <p style="margin: 0 0 4px 0; font-size: 16px;"><strong>Email:</strong> ${esc(email)}</p>
        <p style="margin: 0; font-size: 16px;"><strong>Status:</strong> Pending Role Assignment</p>
      `)}

      ${UI.alertBox('<strong>Next Step:</strong> Your account is currently awaiting a role assignment from an administrator. You will receive another email once your role has been configured and you are ready to get started.', 'warning')}

      ${UI.p('In the meantime, you can log in to view your account status.')}
      ${UI.button(`${APP_URL}/login`, 'View My Account')}
    `),
  }),

  ssoAdminNotification: (adminName: string, newUserName: string, newUserEmail: string) => ({
    subject: `👤 New SSO User Needs Role Assignment: ${esc(newUserName)}`,
    html: emailWrapper('New SSO User Registration', `
      ${UI.h2('New User Signed In via SSO')}
      ${UI.p(`Hello ${UI.strong(esc(adminName))},`)}
      ${UI.p('A new user has signed into the QA Review System for the first time using their Microsoft account. Their account has been created with a <strong>Guest</strong> role and is awaiting your review.')}

      ${UI.highlightBox(`
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">New User Details</p>
        <p style="margin: 0 0 4px 0; font-size: 16px;"><strong>Name:</strong> ${esc(newUserName)}</p>
        <p style="margin: 0 0 4px 0; font-size: 16px;"><strong>Email:</strong> ${esc(newUserEmail)}</p>
        <p style="margin: 0; font-size: 16px;"><strong>Current Role:</strong> <span style="color: #f59e0b; font-weight: 600;">Guest (No Access)</span></p>
      `)}

      ${UI.alertBox('<strong>Action Required:</strong> Please log in to the admin panel and assign an appropriate role to this user so they can start using the system.', 'warning')}

      ${UI.button(`${APP_URL}/admin/users`, 'Go to User Management')}
    `),
  }),
};

// Send email function
export async function sendEmail(to: string, template: { subject: string; html: string }) {
  try {
    // In development, log emails instead of sending
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      console.log('📧 Email would be sent to:', to);
      console.log('Subject:', template.subject);
      console.log('---');
      return { success: true, mode: 'development' };
    }

    const info = await transporter.sendMail({
      from: `"QA Review System" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error };
  }
}
