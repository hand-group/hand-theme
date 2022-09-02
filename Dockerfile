FROM nginx:alpine
COPY ./themes/hand-theme/nginx.conf /etc/nginx/conf.d/default.conf
RUN apk add --no-cache hugo
COPY . /tmp/hugo
WORKDIR /tmp/hugo
RUN hugo
RUN cp -r /tmp/hugo/public/* /usr/share/nginx/html