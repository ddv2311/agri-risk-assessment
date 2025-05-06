#!/bin/bash

# Set environment variables
export FLASK_ENV=production
export FLASK_APP=app.py
export DATABASE_URL=sqlite:///agri_risk.db
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=$(openssl rand -hex 32)
export JWT_SECRET_KEY=$(openssl rand -hex 32)

# Start Gunicorn with 4 worker processes
exec gunicorn -w 4 -b 0.0.0.0:5000 --access-logfile - --error-logfile - app:app
