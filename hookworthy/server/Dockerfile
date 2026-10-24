# Hookworthy: the app + server in one small image.
FROM node:22-alpine
WORKDIR /app
COPY index.html core.js sw.js manifest.webmanifest ./
COPY assets ./assets
COPY fonts ./fonts
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY server ./server
ENV HOST=0.0.0.0 PORT=8787 HW_DATA_DIR=/data
VOLUME /data
EXPOSE 8787
CMD ["node", "server/server.mjs"]
