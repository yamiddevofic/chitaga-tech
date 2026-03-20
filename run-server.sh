#!/bin/bash
# Auto-restart server if it crashes
cd /home/yamiddev/chitaga-tech

while true; do
    echo "[$(date)] Starting chitaga server on port 4324..."
    npm run server
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE. Restarting in 3 seconds..."
    sleep 3
done
