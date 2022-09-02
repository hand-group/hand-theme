FROM node:18.5.0-alpine AS builder
COPY . /tmp/hugo
WORKDIR /tmp/hugo
RUN npm install
RUN npm run tw-build
RUN apk add --no-cache hugo
RUN hugo

FROM nginx
COPY ./themes/hand-theme/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /tmp/hugo/public/ /usr/share/nginx/html/