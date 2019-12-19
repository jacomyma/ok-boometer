## How to use

### Get old tweets
We assume old tweets have been collected using *[Get Old Tweets](https://github.com/Jefferson-Henrique/GetOldTweets-python)* using a query of this kind:
```
python Exporter.py --since 2019-12-17 --until 2019-12-18 --querysearch "ok boomer"
```
You may get one or more file, because the process is unstable and you may have to retry several times and progress time range after time range. It's fine. All the files must be stored in ```/data/got/```.

### Set up the Node environment

The scripts have dependencies. Install them first from the JS folder.

```
npm install
```


### Set up the Twitter API config

Copy ```config.example.js``` as ```config.js```, and edit it to fill your Twitter API credentials. You may also change the function used to filter the "OK Boomer" tweets. You will need your own access to the [Twitter API](https://apps.twitter.com/app/new), there are plenty of tutorials on how to do this online.


### 1. Get an ID list from the Get Old Tweets list of scraped tweets

The tweets harvested by *Get Old Tweets* are not all proper OK Booming tweets, and we do not know if they were in response to another tweet or just someone saying "OK Boomer". But we have the ```id``` of the tweet so we can query the Twitter API. But first we need to extract the list of ids.

Run this script:

```
node got_to_id_list.js
```

It generates two files in ```scripts/data```:
* ```got_id_list.csv``` is just the list of ids
* ```got_rejected_log.txt``` is a log of the rejected tweets, for monitoring purpose.


### 2. Get metadata from the list if tweet IDs by querying the Twitter API

That is where you need the Twitter API config. You also need the ```got_id_list.csv``` file.
Just run the following script:

```
node harvest_id_list.js
```

It queries the API and generates the ```okbooming.csv``` file in the ```app/data/``` folder. This file contains which user has OK-Boomed whom and when, including the tweet ids of both the OK-Booming and the OK-Boomed.

### 3. Listen to the Stream API to update the file live

```
node stream.js
```

### Monitor your API use

It may help to run the following script. It tells you how many calls you have left (regenerates every 15 minutes).

```
node monitor.js
```
