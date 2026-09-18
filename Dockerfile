FROM node:24-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive --network-timeout 120000
COPY . .
RUN yarn build
FROM nginx:1.29-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://host.docker.internal:8000
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
