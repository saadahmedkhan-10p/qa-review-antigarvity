import { loadEnvConfig } from '@next/env';
import path from 'path';
import nodemailer from 'nodemailer';

// Load environment variables exactly the same way Next.js loads them
loadEnvConfig(process.cwd());

async function main() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    console.log('🔍 Testing SMTP Connection Configuration:');
    console.log(` - Host: ${host}`);
    console.log(` - Port: ${port}`);
    console.log(` - Secure (SSL/TLS): ${secure}`);
    console.log(` - User: ${user || '(NOT SET)'}`);
    console.log(` - Pass: ${pass ? '******** (Length: ' + pass.length + ' chars)' : '(NOT SET)'}`);

    if (!user || !pass) {
        console.error('\n❌ Error: SMTP_USER or SMTP_PASS is missing in your environment file (.env).');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    });

    console.log('\n⏳ Verifying credentials with SMTP server...');

    try {
        await transporter.verify();
        console.log('✅ SMTP connection and authentication SUCCESSFUL!');

        const recipient = process.argv[2] || user;
        console.log(`\n📧 Sending test email to: ${recipient}...`);

        const info = await transporter.sendMail({
            from: `"QA Review Test" <${user}>`,
            to: recipient,
            subject: 'Test Email from QA Review System',
            text: 'This is a test email to verify SMTP configuration.',
            html: '<p>This is a <strong>test email</strong> from QA Review System. Your SMTP configuration is working perfectly! 🎉</p>'
        });

        console.log(`✅ Test email delivered successfully! (Message ID: ${info.messageId})`);
    } catch (error: any) {
        console.error('\n❌ SMTP Verification Failed:');
        console.error(` - Error Code: ${error.code || 'N/A'}`);
        console.error(` - Response: ${error.response || error.message}`);

        if (error.code === 'EAUTH' || error.responseCode === 535) {
            console.log('\n💡 Troubleshooting 535 Authentication Invalid:');
            console.log(' 1. If using Gmail / Google Workspace:');
            console.log('    • Ensure 2-Step Verification is turned ON for the Google account.');
            console.log('    • Generate a new 16-character App Password at: https://myaccount.google.com/apppasswords');
            console.log('    • Set SMTP_PASS to the 16-character App Password (without spaces) in your .env file.');
            console.log(' 2. If using Microsoft 365 / Outlook:');
            console.log('    • Ensure Authenticated SMTP (SMTP AUTH) is enabled for the mailbox in M365 Admin Center.');
            console.log(' 3. Check for trailing spaces or special quote characters in .env:');
            console.log('    • SMTP_USER="your-email@company.com"');
            console.log('    • SMTP_PASS="your-password"');
        }
        process.exit(1);
    }
}

main();
