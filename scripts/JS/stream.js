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
const initialTime = new Date()
const maxTime = 1000 * 60 * 60 // Streaming lasts for 1 hour

// Throttle
const defaultThrottle = 30 * 1000 // 30 second
let throttle = defaultThrottle
let throttleDecay = setInterval(function(){
	// Continuously decay the throttle to default
	throttle = Math.max(defaultThrottle, throttle - 10*1000) // Decay: 10 seconds
	console.log('throttle: '+Math.round(throttle/1000)+' seconds')
}, 60*1000) // Every minute

console.log('\n# Init stream at '+initialTime.toISOString()+' with a duration of '+Math.round(maxTime/60000)+' minutes')

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
  if (err) throw 'Recreate live file fail ['+(new Date()).toISOString()+'] '+error
})

liveStream()

function liveStream() {
	let stream = T.stream('statuses/filter', {track: searchQuery});
	stream.on('data', function(t) {
		// console.log('\nPotential OK-Booming detected https://twitter.com/x/status/'+t.id_str)
		let now = new Date()
		if (now - initialTime>maxTime) {
			console.log('Terminate stream because its time has been reached ('+Math.round(maxTime/60000)+' minutes). '+now.toISOString())
			process.exit()
		}
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
				// console.log('...rejected (incomplete data).')
			}
			if (row) {
				// console.log('...VALID '+t.text)
				recordRow(row)
			}
		} else {
			// console.log('...rejected (criteria not met). '+t.text)
		}
	}).on('error', function(error, a, b) {
		if (error.name == 'SyntaxError' && error.message == 'Unexpected token E in JSON at position 0') {
			// This error is Twitter API trying to parse a JSON that is actually the error message
			// from Twitter, i.e. "Exceeded connection limit for user"
			// We ignore it.
		} else {
			console.log('Live stream fail. Restart in '+Math.round(throttle/1000)+' seconds')
			setTimeout(liveStream, throttle)
			throttle *= 2
		}
	  // throw 'Stream fail ['+(new Date()).toISOString()+'] '+error;
	})
}
 
function recordRow(row) {
	// Add row to the live data
	fs.appendFile(liveDirPath +'/okbooming.csv', row, function (err) {
	  if (err) throw 'Append to okbooming.csv fail ['+(new Date()).toISOString()+'] '+err
	});

	// Add row to the backup data
	// The file is daily, so we check if we need to create a new file.
	let backupFile = backupDirPath+'/'+((new Date()).toDateString())+'.csv'
	if (!fs.existsSync(backupFile)) {
    // file does not exist
	  fs.writeFile(backupFile, csvStringifier.getHeaderString(), function (err) {
		  if (err) throw 'Write backup file fail ['+(new Date()).toISOString()+'] '+err
		  fs.appendFile(backupFile, row, function (err) {
			  if (err) throw 'Append to backup file (header) fail ['+(new Date()).toISOString()+'] '+err
			})
		})
  } else {
	  fs.appendFile(backupFile, row, function (err) {
		  if (err) throw 'Append to backup file fail ['+(new Date()).toISOString()+'] '+err
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
		  .on('error', function(error) {
			  throw 'Read live file fail ['+(new Date()).toISOString()+'] '+error
			})
  } else {
  	// Add row
  	fs.appendFile(liveFile, row, function (err) {
		  if (err) throw 'Append to live file fail ['+(new Date()).toISOString()+'] '+err
		});
  }
}
