#!/bin/sh
# Cron job script to sync driver standings
# Runs the TypeScript sync script using Node

cd /app
echo "[$(date)] Starting driver standings sync..."
node dist/scripts/syncDriverStandings.js >> /var/log/cron.log 2>&1
echo "[$(date)] Driver standings sync completed"
