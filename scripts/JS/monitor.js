// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const Twitter = require('twitter');
const config = require('./config.js');
const util = require('util')


const T = new Twitter(config);

T.get('application/rate_limit_status', {}, function(err, data, response) {
	if (!err) {
		for (let cat in data.resources) {
			for (let k in data.resources[cat]) {
				let d = data.resources[cat][k]
				let prefix = (d.remaining==d.limit) ? ('  ') : ('* ')
				console.log(prefix + d.remaining + '/' + d.limit + ' calls remaining in ' + cat + ': ' + k + '> ')
			}
		}
		// console.log(util.inspect(data, {showHidden: false, depth: null}))
	} else {
    console.log(err)
  }
})
