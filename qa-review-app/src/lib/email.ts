import nodemailer from 'nodemailer';

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

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://qa-review-app.vercel.app').replace(/\/$/, '');

// Email templates
export const emailTemplates = {
  userCreated: (name: string, email: string, role: string, setupToken?: string) => ({
    subject: 'Welcome to QA Review System - Set Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to QA Review System!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account has been created successfully.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Role:</strong> ${role.replace('_', ' ')}</p>
        </div>
        ${setupToken ? `
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <p style="color: #92400E; margin: 0;"><strong>⚠️ Action Required:</strong> Please set your password to activate your account.</p>
        </div>
        <p>Click the button below to set your password. This link will expire in 24 hours.</p>
        <a href="${APP_URL}/set-password?token=${setupToken}" 
           style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Set Your Password
        </a>
        ` : `
        <p>You can now log in to the QA Review System using your email address.</p>
        <a href="${APP_URL}" 
           style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Login to Dashboard
        </a>
        `}
        <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
          If you have any questions, please contact your administrator.
        </p>
      </div>
    `,
  }),

  projectAssigned: (reviewerName: string, projectName: string, leadName: string, contactName: string, secondaryReviewerName?: string) => ({
    subject: `New Project Assignment: ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Project Assignment</h2>
        <p>Hello <strong>${reviewerName}</strong>,</p>
        <p>You have been assigned as a reviewer for a new project.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${projectName}</h3>
          <p><strong>Primary Reviewer:</strong> ${reviewerName}</p>
          ${secondaryReviewerName ? `<p><strong>Secondary Reviewer:</strong> ${secondaryReviewerName}</p>` : ''}
          <p><strong>Review Lead:</strong> ${leadName}</p>
          <p><strong>Contact Person:</strong> ${contactName}</p>
        </div>
        <p>You will receive review invitations for this project when review cycles are initiated.</p>
        <a href="${APP_URL}/reviewer/dashboard" 
           style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Dashboard
        </a>
      </div>
    `,
  }),

  reviewInvite: (reviewerName: string, projectName: string, formTitle: string, deadline: string, secondaryReviewerName?: string, isSecondary?: boolean, isLead?: boolean) => ({
    subject: `A monthly QA review assignment request for ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">A monthly QA review assignment request for ${projectName}</h2>
        <p>Hello <strong>${reviewerName}</strong>,</p>
        <p>${isLead ? 'A new review cycle has been initiated for a project you lead.' : isSecondary ? 'A new review cycle has been initiated where you are assigned as an observer/secondary reviewer.' : 'A new review cycle has been initiated for your project.'}</p>
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <h3 style="margin-top: 0; color: #92400E;">${projectName}</h3>
          <p><strong>Review Form:</strong> ${formTitle}</p>
          ${(!isSecondary && !isLead) ? `
          <p style="color: #92400E;"><strong>⚠️ Important Deadlines:</strong></p>
          <ul style="color: #92400E;">
            <li>Schedule by: <strong>10th of the month</strong></li>
            <li>Complete by: <strong>20th of the month</strong></li>
          </ul>
          ` : isLead ? '<p style="color: #92400E;">You can monitor the progress of this review from your dashboard.</p>' : '<p style="color: #92400E;">Please observe and support the primary reviewer as needed.</p>'}
          <p style="margin-top: 10px; font-size: 13px;"><strong>Collaborators:</strong> ${reviewerName}${secondaryReviewerName ? `, ${secondaryReviewerName}` : ''}</p>
        </div>
        <p>${(isSecondary || isLead) ? 'Please log in to view the project dashboard.' : 'Please log in to schedule and conduct your review.'}</p>
        <a href="${APP_URL}/${isLead ? 'lead' : 'reviewer'}/dashboard" 
           style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          ${(isSecondary || isLead) ? 'View Dashboard' : 'Schedule Review'}
        </a>
      </div>
    `,
  }),

  reviewScheduled: (reviewerName: string, projectName: string, scheduledDate: string) => ({
    subject: `Review Scheduled: ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Review Scheduled Successfully</h2>
        <p>Hello <strong>${reviewerName}</strong>,</p>
        <p>Your review has been scheduled successfully.</p>
        <div style="background-color: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
          <h3 style="margin-top: 0; color: #065F46;">${projectName}</h3>
          <p><strong>Scheduled Date:</strong> ${scheduledDate}</p>
          <p style="color: #065F46;">Remember to complete the review by the <strong>20th of the month</strong>.</p>
        </div>
        <a href="${APP_URL}/reviewer/dashboard" 
           style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Dashboard
        </a>
      </div>
    `,
  }),

  leadNotification: (leadName: string, projectName: string, reviewerName: string, action: string) => ({
    subject: `Project Update: ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Project Update</h2>
        <p>Hello <strong>${leadName}</strong>,</p>
        <p>${action}</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${projectName}</h3>
          <p><strong>Reviewer:</strong> ${reviewerName}</p>
        </div>
        <a href="${APP_URL}/lead/dashboard" 
           style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Dashboard
        </a>
      </div>
    `,
  }),

  reminderScheduling: (reviewerName: string, projectName: string, secondaryReviewerName?: string, isSecondary?: boolean) => ({
    subject: isSecondary ? `Update: Review Scheduling for ${projectName}` : `Reminder: Schedule Review for ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">${isSecondary ? 'Review Scheduling Update' : 'Action Required: Schedule Review'}</h2>
        <p>Hello <strong>${reviewerName}</strong>,</p>
        <p>${isSecondary ? `The QA review for <strong>${projectName}</strong> is currently being scheduled by the primary reviewer.` : `This is a reminder to schedule your QA review for <strong>${projectName}</strong> for this month.`}</p>
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <h3 style="margin-top: 0; color: #92400E;">${projectName}</h3>
          ${!isSecondary ? '<p>Please schedule your review as soon as possible.</p>' : ''}
          <p style="color: #92400E;"><strong>Deadline for scheduling: 10th of the month</strong></p>
          ${secondaryReviewerName ? `<p style="font-size: 12px; color: #92400E; margin-top: 8px;">Cc: ${secondaryReviewerName}</p>` : ''}
        </div>
        <a href="${APP_URL}/reviewer/dashboard" 
           style="display: inline-block; background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Dashboard
        </a>
      </div>
    `,
  }),

  reminderSubmission: (reviewerName: string, projectName: string, secondaryReviewerName?: string) => ({
    subject: `Reminder: Submit Review for ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">Action Required: Submit Review</h2>
        <p>Hello <strong>${reviewerName}</strong>,</p>
        <p>This is a reminder to submit your QA review for <strong>${projectName}</strong>.</p>
        <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
          <h3 style="margin-top: 0; color: #991B1B;">${projectName}</h3>
          <p>The review deadline is approaching.</p>
          <p style="color: #991B1B;"><strong>Deadline for submission: 20th of the month</strong></p>
          ${secondaryReviewerName ? `<p style="font-size: 12px; color: #991B1B; margin-top: 8px;">Cc: ${secondaryReviewerName}</p>` : ''}
        </div>
        <a href="${APP_URL}/reviewer/dashboard" 
           style="display: inline-block; background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Submit Review
        </a>
      </div>
    `,
  }),

  passwordReset: (name: string, resetToken: string) => ({
    subject: 'Reset Your Password - QA Review System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Password Reset Request</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset the password for your QA Review System account.</p>
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <p style="color: #92400E; margin: 0;"><strong>⚠️ Security Note:</strong> If you did not make this request, you can safely ignore this email.</p>
        </div>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${APP_URL}/set-password?token=${resetToken}" 
           style="display: inline-block; background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Reset Password
        </a>
        <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
          For security reasons, this link is only valid for 1 hour.
        </p>
      </div>
    `,
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
