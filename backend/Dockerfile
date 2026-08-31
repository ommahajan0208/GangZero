FROM python:3.10-slim

# Build-time args for Kaggle credentials (passed in via Render environment)
ARG KAGGLE_USERNAME
ARG KAGGLE_KEY

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies + unzip for the Kaggle dataset
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from the backend folder
COPY backend/requirements.txt ./backend/requirements.txt

# Install python dependencies + kaggle CLI
RUN pip install --no-cache-dir -r backend/requirements.txt kaggle

# Download the Elliptic dataset from Kaggle into the correct location
RUN mkdir -p /app/data/elliptic_bitcoin_dataset && \
    mkdir -p /root/.kaggle && \
    echo "{\"username\":\"${KAGGLE_USERNAME}\",\"key\":\"${KAGGLE_KEY}\"}" > /root/.kaggle/kaggle.json && \
    chmod 600 /root/.kaggle/kaggle.json && \
    kaggle datasets download -d ellipticco/elliptic-data-set -p /tmp/kaggle --unzip && \
    mv /tmp/kaggle/elliptic_bitcoin_dataset/*.csv /app/data/elliptic_bitcoin_dataset/ && \
    rm -rf /tmp/kaggle && \
    rm /root/.kaggle/kaggle.json

# Copy the rest of the application code (backend, weights, precomputed, etc.)
COPY . .

# Set the working directory to the backend so relative paths (like ../data) work
WORKDIR /app/backend

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
