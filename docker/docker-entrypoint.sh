#!/bin/bash

# If folder is not present we create it
if [ ! -f "/ok-boometer" ]; then
  mkdir -p /ok-boometer
fi
cd /ok-boomter

# if folder is not empty, so it's a git repo and we update it
# Otherwise we clone the repo
if [ "$(ls -A /ok-boometer)" ]; then
  git pull -X theirs
else
  git clone "https://$GIT_USERNAME:$GIT_PASSWORD@github.com/jacomyma/ok-boometer.git" .
fi

# Build the frontend app
npm install
npm run build

# Preparation for the data scripts
mkdir -p /ok-boometer/app/data
mkdir -p /ok-boometer/scripts/data/stream
cd /ok-boometer/scripts/JS
cp config.example.js config.js
sed -i "s#FILLME_CONSUMER_KEY#${TWITTER_CONSUMER_KEY}#g" /ok-boometer/scripts/JS/config.js
sed -i "s#FILLME_CONSUMER_SECRET#${TWITTER_CONSUMER_SECRET}#g" /ok-boometer/scripts/JS/config.js
sed -i "s#FILLME_ACCESS_TOKEN_KEY#${TWITTER_ACCESS_TOKEN_KEY}#g" /ok-boometer/scripts/JS/config.js
sed -i "s#FILLME_ACCES_TOKEN_SECRET#${TWITTER_ACCES_TOKEN_SECRET}#g" /ok-boometer/scripts/JS/config.js
npm install
npm install -g pm2

# Run starting scripts
node rebuild_front_data.js
pm2 start stream.js --name live-stream --log log-live-stream.txt --restart-delay 300000
pm2 start recurrent_compute_views.js --name refresh-views --log log-refresh-views.txt --restart-delay 30000

nginx -g 'daemon off;'
