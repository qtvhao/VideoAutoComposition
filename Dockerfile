FROM ghcr.io/qtvhao/debian:main as yarn
COPY yarn.lock package.json ./
RUN yarn install

FROM ghcr.io/qtvhao/debian:main


ENV PYTHONPATH="/app"

# Install system dependencies
# RUN apt-get update && apt-get install -y \
#     git \
#     imagemagick \
#     ffmpeg \
#     && rm -rf /var/lib/apt/lists/*
# python -m venv venv
COPY requirements.txt ./
RUN . venv/bin/activate && pip install --no-cache-dir -r requirements.txt

COPY --from=yarn /node_modules /app/node_modules

RUN cat /etc/ImageMagick-6/policy.xml | sed 's/none/read,write/g'> /etc/ImageMagick-6/policy.xml

COPY *.py *.js *.json ./
COPY src src
