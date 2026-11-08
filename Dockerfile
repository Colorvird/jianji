FROM node:24-alpine

WORKDIR /app

COPY package.json ./
COPY server.js schema.sql ./
COPY src ./src
COPY index.html styles.css app.js occupancy.js favicon.svg manifest.webmanifest ./

ENV PORT=8787
ENV HOST=0.0.0.0
ENV OCR_PROVIDER=ocrspace
EXPOSE 8787
VOLUME ["/app/data"]

CMD ["node", "server.js"]
