// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const Twitter = require('twitter');
const config = require('./config.js');
const path = require('path');
const fs = require('fs');

const T = new Twitter(config);
const searchQuery = 'okboomer OR "ok boomer" OR okboomers OR "ok boomers"'

var stream = T.stream('statuses/filter', {track: searchQuery});
stream.on('data', function(t) {
	if (config.tweetObjectOrdeal(t)) {
	  console.log(event);
	}
});
 
stream.on('error', function(error) {
  throw error;
});
 
