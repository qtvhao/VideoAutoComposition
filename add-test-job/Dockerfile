FROM node:20-bookworm
COPY package.json yarn.lock ./
RUN yarn install

COPY . .
