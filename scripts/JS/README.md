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

It generates two files in ```data```:
* ```got_id_list.csv``` is just the list of ids, and is used by other scripts.
* ```got_id_list_rejected_log.txt``` is a log of the rejected tweets, for monitoring purpose.


### 1.c. Query Twitter for the actual tweets to select actual OK-boomings

The following script queries Twitter to get the data from all the "Get Old Tweets" tweets, then decides, for each tweet, if it is a proper OK-booming or not. It generates a file containing tweet ids that are not OK-boomings, and a series of files containing actual OK-boomings (one file per day).

There are too many tweet ids to harvest at once, and Twitter limits how many tweets you can retrieve over time. For that reason, the script does as many queries as possible. If it crashes before all queries are done, the data will be saved anyways. In that case, **wait 15 minutes (Twitter API's cooldown time) and run the script again**.

In practice, the script works as such. First it loads all it knows about GOT tweets:
* The list of tweet ids to look for, aka file ```data/got_id_list.csv```
* The list of already rejected tweets, aka file ```data/got_boomings_rejected.csv```
* All the files containing previously found boomings in the folder ```data/got_boomings/```

Basically, tweets to harvest and decide are tweets from the id list that are neither in the file of rejected ids nor in any of the files of accepted tweets. It creates a stack of tweets to retrieve, queries the API until Twitter blocks the queries. When all necessary tweet ids are retrieved (or the API blocks), it decides which tweets are actual OK-boomings and updates the data (files of OK-boomings in the folder ```data/got_boomings/``` and the file of non-OK-boomings ```data/got_boomings_rejected.csv```).

Run with:
```
node harvest_id_list.js
```

If the Twitter API has reached its limit, wait 15 minutes and run the script again, until all necessary tweets are retrieved.

## TODO

### 3. Compute views

This script computes the front-end views per time modes (year, month...) from okboomings.

If parses the file ```app/data/ok-booming.csv``` and generates a series of files in ```app/data/```: one file for each view (boomed tweets, boomed users...) and each time range (hour, day, week, month, all time). It also generates "table" files to avoind loading redundant info: ```usernameIndex.csv``` and ```whoTweetedIndex.csv``` (self-explanatory).

The rationale here is to avoid querying a complex database and instead having a few static files to load.

Run with:
```
node compute_views.js
```

This script needs to be executed again if the file ```ok-booming.csv``` is updated. In practice, it is sufficient to run it just once every few minutes.

**Note**: in prod we use ```forever``` to run a similar script called ```recurrent_compute_views.js```. The only difference is that that one runs the process every 5 minutes and auto-dies after a while. Then ```forever``` will spawn it again.


### 4. Listen to the Stream API to update the file live

This script listens to the Twitter API and update the data. It listens to the live stream for any tweet containing 'OK boomer' and decides if it is an OK-booming or not. Every time a new OK-booming is detected, it updates the data three ways:
* It updates the prod file ```live_booming.csv``` which contains only the last OK-boomings. It is used by the Live view.
* It updates the prod file ```ok-boomings.csv``` so that next time ```compute_views.js``` (or its recurrent version) is executed, it takes the last ok-boomings in account
* It updates a daily file in the ```scripts/data/stream/``` folder, so that the data can be later reconstructed by ```harvest_id_list.js``` if necessary.

Run with:
```
node stream.js
```

**Note**: this script auto-dies after a while, because in production ```forever``` will reboot it anyway. It ensure that the script does not get stuck in weird places for unknown reasons for too long.


### Monitor your API use

It may help to run the following script, telling you how many calls you have left (regenerates every 15 minutes).

```
node monitor.js
```
