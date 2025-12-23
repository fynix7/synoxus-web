#!/bin/bash
# Start Xvfb
Xvfb :99 -screen 0 1920x1080x24 > /dev/null 2>&1 &

# Wait for Xvfb to be ready
sleep 2

# Run the server
python server.py
