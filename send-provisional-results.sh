#!/bin/sh
# Cron job script to send provisional race results
# Runs 5 minutes after race ends, checks every 5 minutes on race days

cd /app
echo "[$(date)] Starting provisional results processing..."
node dist/scripts/sendProvisionalResults.js >> /var/log/cron.log 2>&1
echo "[$(date)] Provisional results processing completed"
