// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

var Twitter = require('twitter');
var config = require('./config.js');
var T = new Twitter(config);

// Set up your search parameters
var params = {
  q: '#nodejs',
  count: 10,
  result_type: 'recent',
  lang: 'en'
}

T.get('search/tweets', params, function(err, data, response) {
  if (!err) {
    // This is where the magic will happen
    for (let i = 0; i < data.statuses.length; i++) {
      // Get the tweet Id from the returned data
      let id = { id: data.statuses[i].id_str }
      console.log('id', id)
    }
  } else {
    console.log(err);
  }
})