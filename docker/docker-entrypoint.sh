#!/bin/bash
if [ -f "/ok-boometer" ]; then
  cd /ok-boomter
  git pull -X theirs
else
  git clone "https://$GIT_USERNAME:$GIT_PASSWORD@github.com/jacomyma/ok-boometer.git"
fi

# Install and set up front-end
cd /ok-boometer
npm install
npm run build
mkdir -p /pk-boometer/app/data

# Install and set up back-end
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
