// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const Twitter = require('twitter');
const config = require('./config.js');
const path = require('path');
const fs = require('fs');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

const T = new Twitter(config);
const searchQuery = 'okboomer OR "ok boomer" OR okboomers OR "ok boomers"'
const outputDirPath = path.join(__dirname, '../../app/data');

const csvStringifier = createCsvStringifier({
  alwaysQuote: true,
  header: [
    {id: 'date', title: 'Date'},
    {id: 'id_source', title: 'Booming tweet ID'},
    {id: 'user_id_source', title: 'Booming user ID'},
    {id: 'user_name_source', title: 'Booming user name'},
    {id: 'id_target', title: 'Boomed tweet ID'},
    {id: 'user_id_target', title: 'Boomed user ID'},
    {id: 'user_name_target', title: 'Boomed user name'}
  ]
})

// test() // Write once in the file to check proper CSV row is added

var stream = T.stream('statuses/filter', {track: searchQuery});
stream.on('data', function(t) {
	console.log('Potential OK-Booming detected')
	if (config.tweetObjectOrdeal(t)) {
		let row
		if (t.is_quote_status) {
			if (t.quoted_status && t.quoted_status.user) {
				row = csvStringifier.stringifyRecords([{
					id_source: t.id_str,
					id_target: t.quoted_status_id_str,
					user_id_source: t.user.id_str,
					user_id_target: t.quoted_status.user.id_str,
					user_name_source: t.user.screen_name,
					user_name_target: t.quoted_status.user.screen_name,
					date: (new Date(t.created_at)).toISOString()
				}])
			}
		} else if (t.in_reply_to_status_id_str) {
			row = csvStringifier.stringifyRecords([{
				id_source: t.id_str,
				id_target: t.in_reply_to_status_id_str,
				user_id_source: t.user.id_str,
				user_id_target: t.in_reply_to_user_id_str,
				user_name_source: t.user.screen_name,
				user_name_target: t.in_reply_to_screen_name,
				date: (new Date(t.created_at)).toISOString()
			}])
		} else {
			console.log('...rejected (incomplete data). https://twitter.com/x/status/'+t.id_str)
		}
		if (row) {
			console.log('...valid! https://twitter.com/x/status/'+t.id_str+' '+t.text)
			// Add row to the data
			fs.appendFile(outputDirPath +'/okbooming.csv', row, function (err) {
			  if (err) throw err;
			  console.log('...data updated');
			});
		}
	} else {
		console.log('...rejected (criteria not met). https://twitter.com/x/status/'+t.id_str+' '+t.text)
	}
});
 
stream.on('error', function(error) {
  throw error;
});
 
// TEST
function test() {
	let row = csvStringifier.stringifyRecords([{
		id_source: 'AAA',
		id_target: 'BBB',
		user_id_source: 'CCC',
		user_id_target: 'DDD',
		user_name_source: 'EEE',
		user_name_target: 'FFF',
		date: 'GGG'
	}])
	// Add row to the data
	fs.appendFile(outputDirPath +'/okbooming.csv', row, function (err) {
	  if (err) throw err;
	  console.log('...file updated');
	});
}