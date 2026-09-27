FROM node:24-alpine
WORKDIR /app
COPY package.json registry.mjs server.mjs ./
ENV HOST=0.0.0.0
ENV PORT=8080
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
