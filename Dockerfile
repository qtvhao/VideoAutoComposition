FROM node:20-bookworm as yarn
COPY yarn.lock package.json ./
RUN yarn install

FROM node:20-bookworm
RUN which python3 && python3 --version || apt-get update && apt-get install -y python3.10 && python3 --version
# FROM python:3.10-bookworm
RUN apt-get update && apt-get install -y \
    python3.11-venv \
    && rm -rf /var/lib/apt/lists/*

# ERROR: Ignored the following versions that require a different python version: 0.10.0 Requires-Python >=3.8; 0.10.1 Requires-Python >=3.8; 0.2.0 Requires-Python >=3.8; 0.3.0 Requires-Python >=3.8; 0.4.0 Requires-Python >=3.8; 0.4.1 Requires-Python >=3.8; 0.5.0 Requires-Python >=3.8; 0.5.1 Requires-Python >=3.8; 0.6.0 Requires-Python >=3.8; 0.7.0 Requires-Python >=3.8; 0.7.1 Requires-Python >=3.8; 0.8.0 Requires-Python >=3.8; 0.9.0 Requires-Python >=3.8; 1.0.0 Requires-Python >=3.8; 1.0.1 Requires-Python >=3.8
# ERROR: Could not find a version that satisfies the requirement faster-whisper~=1.0.1 (from versions: none)
# ERROR: No matching distribution found for faster-whisper~=1.0.1
# Set the working directory
WORKDIR /app
ENV PYTHONPATH="/app"

# Install system dependencies
# RUN apt-get update && apt-get install -y \
#     git \
#     imagemagick \
#     ffmpeg \
#     && rm -rf /var/lib/apt/lists/*

# pip 23.1
# python3.11-venv
RUN python3 -m venv venv && . venv/bin/activate && pip install --upgrade pip
# python -m venv venv
RUN . venv/bin/activate && apt-get update && apt-get install -y \
    git \
    imagemagick \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*
# 
COPY requirements.txt ./
RUN . venv/bin/activate && pip install --no-cache-dir -r requirements.txt

COPY --from=yarn /node_modules /app/node_modules

# RUN . venv/bin/activate && pip install --no-cache-dir celery
RUN cat /etc/ImageMagick-6/policy.xml | sed 's/none/read,write/g'> /etc/ImageMagick-6/policy.xml

# Add font Courier, Arial
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    fonts-dejavu \
    fonts-freefont-ttf \
    fonts-ipafont-gothic \
    fonts-ipafont-mincho \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    && rm -rf /var/lib/apt/lists/*

COPY *.py *.js *.json ./
COPY src src
