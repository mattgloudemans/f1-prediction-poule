#!/bin/sh
# Cron job script to copy missing predictions from last race
# Runs just after predictions lock to give users who forgot a fallback

cd /app
echo "[$(date)] Starting missing predictions copy..."
node dist/scripts/copyMissingPredictions.js >> /var/log/cron.log 2>&1
echo "[$(date)] Missing predictions copy completed"
