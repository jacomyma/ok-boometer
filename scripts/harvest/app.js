// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

var Twitter = require('twitter');
var config = require('./config.js');
var T = new Twitter(config);

var id_list = [20]

// Set up your search parameters
var params = {
  id: id_list.join(',')
}

T.get('statuses/lookup', params, function(err, data, response) {
  if (!err) {
  	console.log(data)
  } else {
    console.log(err);
  }
})
