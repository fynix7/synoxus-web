FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    xvfb \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers and dependencies
# We use 'chromium' which is the default for p.chromium.launch()
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy application code
COPY . .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Environment variables
ENV DISPLAY=:99
ENV PYTHONUNBUFFERED=1

ENTRYPOINT ["./entrypoint.sh"]
