FROM nginx:latest

ENV GIT_USERNAME=""
ENV GIT_PASSWORD=""
ENV TWITTER_CONSUMER_KEY=""
ENV TWITTER_CONSUMER_SECRET=""
ENV TWITTER_ACCESS_TOKEN_KEY=""
ENV TWITTER_ACCES_TOKEN_SECRET=""

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN ["chmod", "+x", "/docker-entrypoint.sh"]
RUN apt-get update && apt-get -y install npm git vim procps
RUN npm i npm@latest -g

EXPOSE 80

ENTRYPOINT ["/bin/bash", "/docker-entrypoint.sh"]
