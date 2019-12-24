// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const Twitter = require('twitter');
const config = require('./config.js');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const T = new Twitter(config);

harvest_idList()

function harvest_idList() {
	let options = {}
	options.limit = Infinity // For testing purpose
	options.batchSize = 100

	let idListBuffer = []
	let okBooming = []
	let batches = []

	const dataDirPath = path.join(__dirname, '..', 'data')
	fs.createReadStream(path.join(dataDirPath,'got_id_list.csv'))
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
		console.log('batch of '+batch.length+' - ' + okBooming.length + ' OK Boomings recorded so far.')

		var params = {
		  id: batch.join(',')
		}

		T.get('statuses/lookup', params, function(err, data, response) {
		  if (!err) {
		  	data.forEach(t => {
		  		if (config.tweetObjectOrdeal(t)) {
		  			if (t.is_quote_status) {
		  				if (t.quoted_status && t.quoted_status.user) {
			  				okBooming.push({
			  					id_source: t.id_str,
			  					id_target: t.quoted_status_id_str,
			  					user_id_source: t.user.id_str,
			  					user_id_target: t.quoted_status.user.id_str,
			  					user_name_source: t.user.screen_name,
			  					user_name_target: t.quoted_status.user.screen_name,
			  					date: (new Date(t.created_at)).toISOString()
			  				})
		  				}
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
				agregateWithStreamData()
			}
		})
	}

	function agregateWithStreamData() {
		// Finalize

		// TODO: integrate the results from the stream (scripts/data/stream/)
		//	- load them too
		//	- index everything by booming ID (i.e. remove doublons)
		//	- sort
		//	- write CSV (as before)

		const outputDirPath = path.join(__dirname, '../../app/data');
		const csvWriter = createCsvWriter({
		  path: outputDirPath +'/okbooming.csv',
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
		});
		csvWriter
		  .writeRecords(okBooming)
		  .then(()=> console.log('The OK Booming CSV file was written successfully'));
	}
}
