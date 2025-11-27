#!/bin/sh
# Cron job script to process final race results and calculate points
# Runs 24 hours after race to allow for disqualifications/penalties

cd /app
echo "[$(date)] Starting final results processing..."
node dist/scripts/processFinalResults.js >> /var/log/cron.log 2>&1
echo "[$(date)] Final results processing completed"
