FROM node:22-alpine
WORKDIR /app
RUN npm install -g merx-mcp
ENTRYPOINT ["merx-mcp"]
