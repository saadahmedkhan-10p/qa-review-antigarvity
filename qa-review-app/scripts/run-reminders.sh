#!/bin/bash
# Monthly QA Review Reminder Script
# Called by system cron — bypasses SSL curl issues by running tsx directly
# 
# Crontab entry (runs daily at 9am UTC = 2pm PKT):
#   0 9 * * * /var/www/qa-review/qa-review-app/scripts/run-reminders.sh >> /var/log/qa-review-reminders.log 2>&1

APP_DIR="/var/www/qa-review/qa-review-app"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S UTC')]"

echo ""
echo "========================================"
echo "$LOG_PREFIX Running QA Review Reminders"
echo "========================================"

cd "$APP_DIR" || {
    echo "$LOG_PREFIX ERROR: Could not cd into $APP_DIR"
    exit 1
}

# Load nvm/node if needed (adjust path to match your server's node installation)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Run the reminder script
npx tsx scripts/trigger-reminders.ts AUTO

EXIT_CODE=$?
echo "$LOG_PREFIX Finished with exit code: $EXIT_CODE"
exit $EXIT_CODE
