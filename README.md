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

The live stream uses [Forever](https://www.npmjs.com/package/forever) to run the script as a deamon.
```
# Start the deamon
forever start --spinSleepTime 30000 --minUptime 300000 stream.js

# If you need to stop it:
forever stopall
```

For maintenance, use the following commands:
```
# List running scripts to check if stream is running:
forever list

# Stop the script
forever stopall

# Relaunch the script
forever restartall

# Find the logs
forever logs
```

## Server configuration

* You need to only serve the ```app/``` folder
* The file ```app/data/live_booming.csv``` must be set as "never cached".
