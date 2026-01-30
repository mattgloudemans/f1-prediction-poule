#!/bin/sh
cd /app
node dist/scripts/resetYearlyPoints.js >> /var/log/cron.log 2>&1
