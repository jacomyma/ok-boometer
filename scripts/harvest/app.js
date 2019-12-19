// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const Twitter = require('twitter');
const config = require('./config.js');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const T = new Twitter(config);

// getOldTweets_to_idList()
harvest_idList()

function getOldTweets_to_idList() {
	let options = {}
	options.limit = Infinity // For testing purpose

	const outputDirPath = path.join(__dirname, '../data');
	let idListStream = fs.createWriteStream(outputDirPath +'/got_id_list.csv');
	let rejectedStream = fs.createWriteStream(outputDirPath +'/got_rejected_log.txt');

	// Read the GetOldTweets data
	// joining path of directory 
	const directoryPath = path.join(__dirname, '../data/got');
	idListStream.write('id\n')
	// passing directoryPath and callback function
	fs.readdir(directoryPath, function (err, files) {
	  //handling error
	  if (err) {
	  	return console.log('Unable to scan directory: ' + err);
	  } 
		let filesCount = files.length
	  //listing all files using forEach
	  files.forEach(function (file, fi) {
	  	fs.createReadStream(directoryPath +'/'+ file)
			  .pipe(csv({separator:';'}))
			  .on('data', (row) => {
			  	if (options.limit-->0) {
				    // console.log(row)
				  	if (gotTextContentOrdeal(row.text)) {
					  	idListStream.write(row.id+'\n')
					  	// console.log('YES '+row.text)
					  } else {
					  	rejectedStream.write(row.text+'\n')
					  	// console.log('NO  '+row.text)
					  }
			  	}
			  })
			  .on('end', () => {
			  	if (filesCount-- == 0) {
						idListStream.end()
						rejectedStream.end()
			  	}
			    console.log('CSV file successfully processed');
			  })
	  })
	})
}

function harvest_idList() {
	let options = {}
	options.limit = 10 // For testing purpose
	options.batchSize = 100


	let idListBuffer = []
	let okBooming = []
	let batches = []

	const dataDirPath = path.join(__dirname, '../data')
	fs.createReadStream(dataDirPath +'/got_id_list.csv')
		.pipe(csv())
	  .on('data', (row) => {
	  	if (options.limit-->0) {
	  		idListBuffer.push(row.id)
	  	}
	  })
	  .on('end', () => {
	    console.log('File successfully read');

	    // Build batches
	    let batch = []
	    while (idListBuffer.length>0) {
	    	batch.push(idListBuffer.pop())

	    	if (batch.length >= options.batchSize) {
	    		// Flush batch
	    		batches.push(batch)
	    		batch = []
	    	}
	    }
	    // Flush in the end
	    if (batch.length > 0) {
	  		batches.push(batch)
	  		batch = []
	    }

	    queryNextBatch()
	  })

	function queryNextBatch() {
		var batch = batches.pop()
		console.log('batch of '+batch.length)

		var params = {
		  id: batch.join(',')
		}

		T.get('statuses/lookup', params, function(err, data, response) {
		  if (!err) {
		  	data.forEach(t => {
		  		if (tweetObjectOrdeal(t)) {
		  			if (t.is_quote_status) {
		  				okBooming.push({
		  					id_source: t.id_str,
		  					id_target: t.quoted_status_id_str,
		  					user_id_source: t.user.id_str,
		  					user_id_target: t.quoted_status.user.id_str,
		  					user_name_source: t.user.screen_name,
		  					user_name_target: t.quoted_status.user.screen_name,
		  					date: (new Date(t.created_at)).toISOString()
		  				})
		  			} else if (t.in_reply_to_status_id_str) {
		  				okBooming.push({
		  					id_source: t.id_str,
		  					id_target: t.in_reply_to_status_id_str,
		  					user_id_source: t.user.id_str,
		  					user_id_target: t.in_reply_to_user_id_str,
		  					user_name_source: t.user.screen_name,
		  					user_name_target: t.in_reply_to_screen_name,
		  					date: (new Date(t.created_at)).toISOString()
		  				})
		  			}
		  		}
		  	})
		  } else {
		    console.log(err)
		  }
		  if (batches.length > 0) {
				queryNextBatch()
			} else {
				console.log(okBooming)
			}
		})
	}
}

function gotTextContentOrdeal(text){
	if (text == undefined) return false
	if (text.substr(0,3) == "RT ") return false
	if (text.match(/ok.?.?boomer/gi)) {
		// Remove url STUB
		text = text.replace(/https?:\/\/.*/i, '')
		// Remove image
		text = text.replace(/pic\.twitter\.com\/[^ ]*/i, '')
		if (text.length > 20) return false
		else return true
	} else return false
}

function tweetObjectOrdeal(t){
	// Must be a reply or a quote
	if (t.in_reply_to_status_id_str == null && !t.is_quote_status) return false

	var text = t.text

	// Must have text and contain OK boomer (pics and URLs removed)
	if (text == undefined || text.length < 8) return false

	// Must contain OK Boomer
	if (!text.match(/ok.?.?boomer/gi)) return false

	// Remove 1 URL
	text = text.replace(/https?:\/\/[^ ]*/i, '')

	// Remove 1 image
	text = text.replace(/pic\.twitter\.com\/[^ ]*/i, '')

	// Remove mentions
	var oldtext = text
	text = oldtext.replace(/@[^ ]+ ?/gi, '')
	while (text.length < oldtext.length) {
		oldtext = text
		text = oldtext.replace(/@[^ ]+ ?/gi, '')
	}

	// Then, it must not be too short
	if (text.length > 20) return false
	else return true
}