# How to use

## Set up

### Set up the Node environment

The scripts have dependencies. Install them first from the JS folder.

```
npm install
```


### Set up the Twitter API config

Copy ```config.example.js``` into ```config.js```, and edit it to fill your Twitter API credentials. You may also change the function used to filter the "OK Boomer" tweets. You will need your own access to the [Twitter API](https://apps.twitter.com/app/new), there are plenty of tutorials on how to do this online.


## 1. Get older data by scraping Twitter with "Get Old Tweets"

### 1.a. Get old tweets

Install and use *[Get Old Tweets](https://github.com/Jefferson-Henrique/GetOldTweets-python)* by yourself using a query of this kind:

```
python Exporter.py --since 2020-01-01 --until 2020-01-07 --querysearch "ok boomer"
```

You may get one or more files, because the process is unstable and you may have to retry several times and progress time range after time range. I recommend day by day. It's fine. All the files must be stored in ```data/got_raw/```.


### 1.b. Get an ID list from the Get Old Tweets list of scraped tweets

The tweets harvested by *Get Old Tweets* are not all proper OK Booming tweets, and we do not know if they were in response to another tweet or just someone saying "OK Boomer", or if they just talk about OK Boomer for whatever reason. But we have the ```id``` of the tweet so we can query the Twitter API to look at it and decide if it is an OK-booming. But first we need to extract the list of ids. This script is already discarding obviously non-OK-booming tweets, but it remains too inclusive (it favors false positives over fals negatives). The reason is that Get Old Tweets provides some content, but as it is scraped from the web, it is quite dirty and we cannot take accurate decision on that basis.

Run this script:

```
node got_to_id_list.js
```

It generates two files in ```scripts/data/```:
* ```got_id_list.csv``` is just the list of ids, and is used by other scripts.
* ```got_id_list_rejected_log.txt``` is a log of the rejected tweets, for monitoring purpose.


### 1.c. Query Twitter for the actual tweets to select actual OK-boomings

The following script queries Twitter to get the data from all the "Get Old Tweets" tweets, then decides, for each tweet, if it is a proper OK-booming or not. It generates a file containing tweet ids that are not OK-boomings, and a series of files containing actual OK-boomings (one file per day).

There are too many tweet ids to harvest at once, and Twitter limits how many tweets you can retrieve over time. For that reason, the script does as many queries as possible. If it crashes before all queries are done, the data will be saved anyways. In that case, **wait 15 minutes (Twitter API's cooldown time) and run the script again**.

In practice, the script works as such. First it loads all it knows about GOT tweets:
* The list of tweet ids to look for, aka file ```scripts/data/got_id_list.csv```
* The list of already rejected tweets, aka file ```app/data-src/got_boomings_rejected.csv```
* All the files containing previously found boomings in the folder ```app/data-src/got_boomings/```

Basically, tweets to harvest and decide are tweets from the id list that are neither in the file of rejected ids nor in any of the files of accepted tweets. It creates a stack of tweets to retrieve, queries the API until Twitter blocks the queries. When all necessary tweet ids are retrieved (or the API blocks), it decides which tweets are actual OK-boomings and updates the data (files of OK-boomings in the folder ```app/data-src/got_boomings/``` and the file of non-OK-boomings ```app/data-src/got_boomings_rejected.csv```).

Run with:
```
node harvest_got_id_list.js
```

If the Twitter API has reached its limit, wait 15 minutes and run the script again, until all necessary tweets are retrieved.


## 2. Merge stream data and GetOldTweets data into okboomings.csv

The first time there will only be data from GetOldTweets; but after a while, the streaming (see below) will add its own data. The idea is that GetOldTweets provides data for when you cannot listen, and the streaming from Twitter API provides data in a more sustainable way. Ideally, when in production, all recent data has been provided by the streaming. GetOldTweet can nevertheless be used to fix missing data, for instance if the streaming goes down for some reason.

Run with:
```
node aggregate_okboomings.js
```

This script scans the contents of the folders ```app/data-src/got_boomings/``` and ```app/data-src/stream_boomings/```, and generates an aggregated version as the file ```app/data/okbooming.csv```. This file contains all the data used by the front-end, but the front-end does not load it directly because it is too big. Another script (```compute_views.js```) is in charge of breaking it down into smaller files dedicated to each views. Internet users can download it, though.

**Note**: this script is not the only one to write ```app/data/okbooming.csv```. The streaming also does it.


## 3. Compute views

This script computes the front-end views per time modes (year, month...) from okboomings.

If parses the file ```app/data/okbooming.csv``` and generates a series of files in ```app/data/```: one file for each view (boomed tweets, boomed users...) and each time range (hour, day, week, month, all time). It also generates "table" files to avoind loading redundant info: ```usernameIndex.csv``` and ```whoTweetedIndex.csv``` (self-explanatory).

The rationale here is to avoid querying a complex database and instead having a few static files to load.

Run with:
```
node compute_views.js
```

This script needs to be executed again if the file ```okbooming.csv``` is updated. In practice, it is sufficient to run it just once every few minutes.

**Note**: in prod we use ```pm2``` (Process Manager 2) to run a similar script called ```recurrent_compute_views.js```. The only difference is that that one runs the process every 5 minutes and auto-dies after a while. Then ```pm2``` will spawn it again.


## 4. Listen to the Stream API to update the file live

This script listens to the Twitter API and update the data. It listens to the live stream for any tweet containing 'OK boomer' and decides if it is an OK-booming or not. Every time a new OK-booming is detected, it updates the data three ways:
* It updates the prod file ```live_booming.csv``` which contains only the last OK-boomings. It is used by the Live view.
* It updates the prod file ```okbooming.csv``` so that next time ```compute_views.js``` (or its recurrent version) is executed, it takes the last ok-boomings in account
* It updates a daily file in the ```app/data-src/stream_boomings/``` folder, so that the data can be later reconstructed by ```aggregate_okboomings.js``` if necessary.

Run with:
```
node stream.js
```

**Note**: this script auto-dies after a while, because in production ```pm2``` will reboot it anyway. It ensure that the script does not get stuck in weird places for unknown reasons for too long.


## Monitor your API use

It may help to run the following script, telling you how many calls you have left (regenerates every 15 minutes).

```
node monitor.js
```

# Production site

To set up a public website, it's important to understand the data lifecycle.


## What is committed or not in the repository

Not all data is committed in the repository, for both legal and size reasons. The original GetOldTweets data cannot be shared for legal reasons related to the Twitter terms of use. In short, they contain the content of tweets that may since have been deleted. The OK-boomings can be shared though, because they are basically just tweet ids. However the file ```app/data/okbooming.csv``` is too big to be committed to the repository. But it does not matter because all it contains is also contained in the files from the folders ```app/data-src/got_boomings/``` and ```app/data-src/stream_boomings/```. So at the end of the day:

* Raw GetOldTweets content is NOT committed (```scripts/data/got_raw/```)
* The list of IDs from GetOldTweets IS committed (```scripts/data/got_id_list.csv```)
* The log of rejected tweets from ```got_to_id_list.js``` is NOT committed (```scripts/data/got_id_list_rejected_log.txt```)
* The list of IDs from GetOldTweets that are not OK-boomings IS committed (```app/data-src/got_boomings_rejected.csv```)
* Boomings from GetOldTweets ARE committed (```app/data-src/got_boomings/```)
* Boomings from Twitter API streaming ARE committed (```app/data-src/stream_boomings/```)
* The prod data in the app folder is NOT committed (```app/data/```)


## Data lifecycle

There are two pathways for the data: one for setup, one for production. And there are bridges between them.


### Initial setup

* Get data from GetOldTweets, retrieve data from Twitter, and build the OK-boomings in ```app/data-src/got_boomings/``` (steps 1.a. -> 1.c.)
* Generate the prod file ```app/data/okbooming.csv``` (step 2.)
* Compute views (step 3.)


### In prod

The pm2 script will stream data from Twitter and regularly update the view.

* The streaming script updates ```app/data/live_booming.csv``` and ```app/data/okbooming.csv``` to keep prod up to date
* The views are regularly recomputed from ```app/data/okbooming.csv``` (step 3.)
* The streaming script *also backup* found OK-boomings into the ```app/data-src/stream_boomings/``` folder. This is used to restart production.


### Restarting the production site

When restarting prod, it is not necessary to harvest GetOldTweets again. The boomings are already there. The new boomings from the stream have also been added in their folder.

* Generate the prod file ```app/data/okbooming.csv``` (step 2.) This time, it will also add the previously downloaded OK-boomings from the streaming, in the ```app/data-src/stream_boomings/``` folder.
* *THEN,* Compute views (step 3.)

Since computing the views must be done only after the OK-Boomings are aggregated, a dedicated script does the tasks in the right order. Just run:
```
node rebuild_front_data.js
```

### Backuping data offline

To backup data offline, the important files to download are those in ```app/data-src/```. In particular the folder ```stream_boomings/```, which contains the data obtained from the live streaming.

Indeed, it makes sense to run the GetOldTweets scripts offline, since they only serve as an archive of older OK-Boomings. But the prod site needs to have the live streaming running at any time, while a general purpose computer will probably not be streaming data from Twitter all the time. So it makes sense that the prod site contains the better streaming data.


### Fixing holes in streaming data

If for a given period the data has not been properly harvested, the way to fix the data is to add the corresponding GetOldTweets data. The idea is to run the harvesting for the given period and add the file to the ```scripts/data/got_raw``` folder. Then it is necessary to run steps 1.b and 1.c, and then restart the production site with ```rebuild_front_data.js```.