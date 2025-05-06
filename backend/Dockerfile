FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV FLASK_ENV=production \
    FLASK_APP=app.py \
    DATABASE_URL=sqlite:///agri_risk.db \
    REDIS_URL=redis://redis:6379/0 \
    SECRET_KEY=$(openssl rand -hex 32) \
    JWT_SECRET_KEY=$(openssl rand -hex 32)

# Expose port
EXPOSE 5000

# Start Gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
