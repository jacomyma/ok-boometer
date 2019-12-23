#!/bin/bash
rm -rf /ok-boometer
cd /
git clone "https://$GIT_USERNAME:$GIT_PASSWORD@github.com/jacomyma/ok-boometer.git"
cd /ok-boometer
npm install
npm run build

cd /ok-boometer/scripts/JS
cp config.example.js config.js
sed -i "s#FILLME_CONSUMER_KEY#${TWITTER_CONSUMER_KEY}#g" /ok-boometer/scripts/JS/config.js
sed -i "s#FILLME_CONSUMER_SECRET#${TWITTER_CONSUMER_SECRET}#g" /ok-boometer/scripts/JS/config.js
sed -i "s#FILLME_ACCESS_TOKEN_KEY#${TWITTER_ACCESS_TOKEN_KEY}#g" /ok-boometer/scripts/JS/config.js
sed -i "s#FILLME_ACCES_TOKEN_SECRET#${TWITTER_ACCES_TOKEN_SECRET}#g" /ok-boometer/scripts/JS/config.js
npm install
npm install -g forever
forever start stream.js

nginx -g 'daemon off;'