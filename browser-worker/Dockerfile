FROM mcr.microsoft.com/playwright:v1.62.0-noble

WORKDIR /app

RUN npm init -y && \
    npm install --omit=dev express@5.1.0 playwright@1.62.0

COPY server.js .

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "server.js"]
