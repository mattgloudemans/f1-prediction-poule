#!/bin/sh
set -e

echo "Starting F1 Prediction Poule application..."

# Create log file for cron
touch /var/log/cron.log

# Start cron in background
echo "Starting cron daemon..."
crond -l 2 -f &

# Start the Node.js application
echo "Starting Node.js server..."
exec npm start
