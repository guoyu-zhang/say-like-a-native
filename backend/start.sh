#!/bin/bash

# Production startup script for EC2
# Make sure to install dependencies first: pip install -r requirements.txt

# Set production environment
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Start the FastAPI server with uvicorn
# Bind to all interfaces (0.0.0.0) so it's accessible from outside EC2
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4