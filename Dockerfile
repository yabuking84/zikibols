# Writable /data volume required: pledges, ATS ids, and 2-of-2 flags live in state.json.
FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* is inlined at build time.
ARG NEXT_PUBLIC_PRIVY_APP_ID=
ARG NEXT_PUBLIC_CAMPAIGN_TREASURY=
ENV NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID
ENV NEXT_PUBLIC_CAMPAIGN_TREASURY=$NEXT_PUBLIC_CAMPAIGN_TREASURY

RUN npm run build \
  && mkdir -p /data \
  && chown node:node /data

USER node
ENV ZIKIBOLS_DATA_PATH=/data/state.json
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["npm", "run", "start"]
