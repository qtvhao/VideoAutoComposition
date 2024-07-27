#FROM ghcr.io/qtvhao/debian:main as yarn
#COPY yarn.lock package.json ./
#RUN . venv/bin/activate && . /root/.nvm/nvm.sh && yarn install

FROM ghcr.io/qtvhao/pymovie:main


ENV PYTHONPATH="/app"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    imagemagick \
    ffmpeg \
    && apt-get clean \
    && apt-get autoremove -y \
    && apt-get autoclean -y \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
# python -m venv venv
COPY requirements.txt ./
RUN . venv/bin/activate && pip install --no-cache-dir -r requirements.txt

#COPY --from=yarn /app/node_modules /app/node_modules

RUN cat /etc/ImageMagick-6/policy.xml | sed 's/none/read,write/g'> /etc/ImageMagick-6/policy.xml

COPY *.py *.js *.json ./
COPY src src
RUN . venv/bin/activate && python3 test.py
