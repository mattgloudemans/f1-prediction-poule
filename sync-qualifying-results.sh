#!/bin/sh
# Cron job script to sync qualifying results
# Runs hourly on Fri/Sat to pick up qualifying data after sessions end

cd /app
echo "[$(date)] Starting qualifying results sync..."
node dist/scripts/syncQualifyingResults.js >> /var/log/cron.log 2>&1
echo "[$(date)] Qualifying results sync completed"
