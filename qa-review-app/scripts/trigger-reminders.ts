import { ReminderService } from '../src/services/reminderService';
import { pruneActivityLogs } from '../src/lib/activityLogger';

async function main() {
    const args = process.argv.slice(2);
    const forceType = (args[0]?.toUpperCase() as 'SCHEDULING' | 'SUBMISSION' | 'AUTO') || 'AUTO';

    console.log(`⏰ Triggering Monthly Reminders (Type: ${forceType})...`);

    const result = await ReminderService.processReminders(forceType);

    console.log('\n📊 Reminder Execution Results:');
    console.log(` - Success: ${result.success}`);
    console.log(` - Detected Type: ${result.type}`);
    console.log(` - Evaluation Date: ${result.today}`);
    console.log(` - Emails Sent: ${result.emailsSent}`);
    console.log(` - Notifications Created: ${result.notificationsCreated}`);

    if (result.details && result.details.length > 0) {
        console.log('\n📋 Project Details:');
        result.details.forEach(d => {
            console.log(`   • [${d.projectName}] Reviewer: ${d.reviewer} | Email Sent: ${d.emailSent} ${d.error ? `(Error: ${d.error})` : ''}`);
        });
    } else {
        console.log(' - No projects needed reminders at this time.');
    }

    // Also run activity log pruning
    try {
        const prune = await pruneActivityLogs(40);
        console.log(`\n🧹 Activity logs older than 40 days pruned: ${prune.deletedCount} deleted`);
    } catch (e) {
        console.error('Error pruning logs:', e);
    }

    console.log('\n🎉 Completed successfully!');
    process.exit(0);
}

main().catch(err => {
    console.error('Failed to run reminders:', err);
    process.exit(1);
});
