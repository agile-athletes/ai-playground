FROM docker.io/node:lts-slim AS build
WORKDIR /app
COPY package-lock.json package.json .
RUN npm install 
COPY . .
RUN npm run build

FROM busybox:latest
RUN adduser -D static
USER static
WORKDIR /home/static
COPY --from=build /app/build .
CMD ["busybox", "httpd", "-f", "-v", "-p", "3000"]
