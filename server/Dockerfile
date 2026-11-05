FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY index.js ./
COPY routes ./routes
COPY mocks ./mocks
ENV PORT=8787
ENV MOCK_CONNECTORS=1
EXPOSE 8787
CMD ["node", "index.js"]
