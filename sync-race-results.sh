#!/bin/sh
# Cron job script to sync race results and calculate points
# Runs the TypeScript sync script using Node

cd /app
echo "[$(date)] Starting race results sync..."
node dist/scripts/syncRaceResults.js >> /var/log/cron.log 2>&1
echo "[$(date)] Race results sync completed"
