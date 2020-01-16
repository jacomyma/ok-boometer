# OK Boometer

A website that counts how many times someone has received *OK Boomer* on Twitter.

## Install front-end

### Install the dependencies & build the code

```
# This will install the deps & build the code for production
npm install

# To rebuild the code manually
npm run build
```

Note: **in order to keep data up to date, you need to set up the scripts as well** (see below).


### Dev commands

```
# Just watch the files & retranspile (e.g. when serving app with Apache)
npm run watch

# Watch the files & serve the application on localhost:3000
npm run dev
```


## Launch the back-end scripts

The website is in the app folder. Additional scripts can be found in the ```scripts/JS/``` folder. It has additional explanations on how to install and run the scripts. But one script in particular is important: live streaming script, that keeps the data up to date.


### Set up script environment

```
# Open the script folder
cd scripts/JS/

# Install dependencies
npm install
```

The environment requires config.
```
# use "copy" instead of "cp" under Windows powershell
cp config.example.js config.js
```
Edit ```config.js``` to fill your Twitter API credentials. You may also change the function used to filter the "OK Boomer" tweets. You will need your own access to the [Twitter API](https://apps.twitter.com/app/new), there are plenty of tutorials on how to do this online.


### Launch the live stream

The live stream uses [PM2](https://www.npmjs.com/package/pm2) to run the script as a deamon.

```
# Start the deamon
pm2 start stream.js --name live-stream --log log-live-stream.txt --restart-delay 300000

# Restart it
pm2 restart live-stream

# Stop it
pm2 stop live-stream
# note: it does not delete it. So you can start it again:
pm2 start live-stream

# Delete it
pm2 delete live-stream
```


### Launch script to update views

It works exactly like for the live stream, with a slightly different setting (30s delay instead of 5min):

```
pm2 start recurrent_compute_views.js --name refresh-views --log log-refresh-views.txt --restart-delay 30000
```


## Server configuration

* You need to only serve the ```app/``` folder
* The file ```app/data/live_booming.csv``` must be set as "never cached".

## Docker

You need to build the image :

```
$> docker build -t okboomer:latest .
```

And then you can create a container from the previous created image :

```
$> docker run --name okboomer -d -p 80:80  \
  --env GIT_USERNAME="XXX" \
  --env GIT_PASSWORD="XXXX" \
  --env TWITTER_CONSUMER_KEY="XXXX" \
  --env TWITTER_CONSUMER_SECRET="XXXX" \
  --env TWITTER_ACCESS_TOKEN_KEY="XXXX" \
  --env TWITTER_ACCESS_TOKEN_SECRET="XXXX" \
  --volume=$HOME/ok-boometer:/ok-boometer
  okboomer:latest
```
