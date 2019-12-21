// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const Twitter = require('twitter');
const config = require('./config.js');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


const liveDirPath = path.join(__dirname, '../../app/data');
const backupDirPath = path.join(__dirname, '../data/stream');
const liveFile = liveDirPath+'/live_booming.csv'

const T = new Twitter(config);
const searchQuery = 'ok boomer'
let minute = (new Date()).getMinutes()

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

// Recreate live file
fs.writeFile(liveFile, csvStringifier.getHeaderString(), function (err) {
  if (err) throw err;
})

var stream = T.stream('statuses/filter', {track: searchQuery});
stream.on('data', function(t) {
	console.log('\nPotential OK-Booming detected https://twitter.com/x/status/'+t.id_str)
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
			console.log('...rejected (incomplete data).')
		}
		if (row) {
			console.log('...VALID '+t.text)
			recordRow(row)
		}
	} else {
		console.log('...rejected (criteria not met). '+t.text)
	}
});
 
stream.on('error', function(error) {
  throw error;
});
 
function recordRow(row) {
	// Add row to the live data
	fs.appendFile(liveDirPath +'/okbooming.csv', row, function (err) {
	  if (err) throw err;
	});

	// Add row to the backup data
	// The file is daily, so we check if we need to create a new file.
	let backupFile = backupDirPath+'/'+((new Date()).toDateString())+'.csv'
	if (!fs.existsSync(backupFile)) {
    // file does not exist
	  fs.writeFile(backupFile, csvStringifier.getHeaderString(), function (err) {
		  if (err) throw err;
		  fs.appendFile(backupFile, row, function (err) {
			  if (err) throw err;
			})
		})
  } else {
	  fs.appendFile(backupFile, row, function (err) {
		  if (err) throw err;
		})
  }

  // Add row to the live data instant buffer
	let currentMinute = (new Date()).getMinutes()
  if (minute != currentMinute || !fs.existsSync(liveFile)) {
  	minute = currentMinute
  	let now = new Date()
  	// before recreating file, let's retrieve its content
  	let csvData = []
  	fs.createReadStream(liveFile)
			.pipe(csv())
		  .on('data', (row) => {
		  	// We add the row if its time is recent enough
		  	let then = new Date(row["Date"])
		  	if (now-then<10*60000) { // 10 minutes
			  	csvData.push(row)
		  	}
		  })
		  .on('end', () => {
		    // recreate file
		    const csvWriter = createCsvWriter({
				  path: liveFile,
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
		    csvWriter
				  .writeRecords(csvData)
				  .then(()=>{
				  	fs.appendFile(liveFile, row, function (err) {
						  if (err) throw err;
						})
				  })
		  })
  } else {
  	// Add row
  	fs.appendFile(liveFile, row, function (err) {
		  if (err) throw err;
		});
  }
}
