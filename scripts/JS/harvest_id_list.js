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
	let index = {}
	let batches = []

	// - Load the id list to query (from Get Old Tweets)
	loadGOTIdList(()=>{
	// - Load the id list known from the live stream
		loadStreamData(()=>{
	// - Load the file containing the state of the process
	//     (indeed it will probably be necessary to launch it
	//		 several times due to Twitter API limitations)
			loadState(()=>{
	// - Determine which tweets must be retrieved
	// - Retrieve them
				retrieveTweets(()=>{
	// - Update the state file
					updateStateFile(()=>{
	// - If it's all retrieved, write ok-booming
						if (!Object.values(index).some(d=>{return d.toQuery})) {
							console.log("ready to write ok-booming")
							writeOKBooming()
						} else {
							console.log(Object.values(index).filter(d=>{return d.toQuery}).length+ ' to query')
						}
					})
				})
			})
		})
	})

	function writeOKBooming() {
		const outputDirPath = path.join(__dirname, '..','..','app','data');
		const csvWriter = createCsvWriter({
		  path: path.join(outputDirPath, 'okbooming.csv'),
		  alwaysQuote: true,
		  header: [
		    {id: 'Date', title: 'Date'},
		    {id: 'Booming tweet ID', title: 'Booming tweet ID'},
		    {id: 'Booming user ID', title: 'Booming user ID'},
		    {id: 'Booming user name', title: 'Booming user name'},
		    {id: 'Boomed tweet ID', title: 'Boomed tweet ID'},
		    {id: 'Boomed user ID', title: 'Boomed user ID'},
		    {id: 'Boomed user name', title: 'Boomed user name'}
		  ]
		});
		csvWriter
		  .writeRecords(Object.values(index).filter(d=>{
		  	return d.Date && d['Boomed tweet ID']
		  }))
		  .then(()=> console.log('The OK Booming CSV file was written successfully'));

	}

	function updateStateFile(callback) {
		const dataDirPath = path.join(__dirname, '..', 'data')
		const file = path.join(dataDirPath,'ok-booming-state.csv')
		const csvWriter = createCsvWriter({
		  path: file,
		  alwaysQuote: true,
		  header: [
		    {id: 'Date', title: 'Date'},
		    {id: 'Booming tweet ID', title: 'Booming tweet ID'},
		    {id: 'Booming user ID', title: 'Booming user ID'},
		    {id: 'Booming user name', title: 'Booming user name'},
		    {id: 'Boomed tweet ID', title: 'Boomed tweet ID'},
		    {id: 'Boomed user ID', title: 'Boomed user ID'},
		    {id: 'Boomed user name', title: 'Boomed user name'},
		    {id: 'toQuery', title: 'toQuery'},
		  ]
		});
		// console.log(Object.values(index))
		csvWriter
		  .writeRecords(Object.values(index))
		  .then(()=>{
		  	console.log('The OK Booming State CSV file was written successfully')
		  	callback()
		  })
		  .catch(function(error) {
			  console.error(error);
			})
	}
	
	function retrieveTweets(callback) {
		let options = {}
		options.limit = Infinity // For testing purpose
		options.batchSize = 100

		let idListBuffer = []
		for (let id in index) {
			if (index[id].toQuery) {
				idListBuffer.push(id)
			}
		}

    // Build batches
    let batch = []
    while (idListBuffer.length>0 && options.limit-->0) {
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
    
    console.log(batches.length + ' batches to query.')
    if (batches.length>0) {
	    queryNextBatch(batches, callback)
	  } else {
	  	callback()
	  }
	}

	function queryNextBatch(batches, callback) {
		let batch = batches.pop()
		console.log('Querying batch of '+batch.length+'.')

		let params = {
		  id: batch.join(',')
		}

		T.get('statuses/lookup', params, function(err, data, response) {
		  if (!err) {
		  	batch.forEach(id=>{
		  		index[id].toQuery = false
		  	})
		  	data.forEach(t => {
		  		if (config.tweetObjectOrdeal(t)) {
		  			if (t.is_quote_status) {
		  				if (t.quoted_status && t.quoted_status.user) {
			  				index[t.id_str] = {
			  					'Booming tweet ID': t.id_str,
			  					'Boomed tweet ID': t.quoted_status_id_str,
			  					'Booming user ID': t.user.id_str,
			  					'Boomed user ID': t.quoted_status.user.id_str,
			  					'Booming user name': t.user.screen_name,
			  					'Boomed user name': t.quoted_status.user.screen_name,
			  					'Date': (new Date(t.created_at)).toISOString(),
			  					toQuery: false
			  				}
		  				}
		  			} else if (t.in_reply_to_status_id_str) {
		  				index[t.id_str] = {
		  					'Booming tweet ID': t.id_str,
		  					'Boomed tweet ID': t.in_reply_to_status_id_str,
		  					'Booming user ID': t.user.id_str,
		  					'Boomed user ID': t.in_reply_to_user_id_str,
		  					'Booming user name': t.user.screen_name,
		  					'Boomed user name': t.in_reply_to_screen_name,
		  					'Date': (new Date(t.created_at)).toISOString(),
		  					toQuery: false
		  				}
		  			} else {
		  				index[t.id_str] = (index[t.id_str] || {})
		  				index[t.id_str].toQuery = false
		  			}
		  		} else {
		  			index[t.id_str] = (index[t.id_str] || {})
		  			index[t.id_str].toQuery = false
		  		}
		  	})
		  	if (batches.length > 0) {
					queryNextBatch(batches, callback)
				} else {
			    console.log('All batches done!')
					callback()
				}
		  } else {
		    console.log(err)
		    console.log('Re-run the script later for completion.')
				callback()
		  }
		})
	}

	function loadState(callback) {
		const dataDirPath = path.join(__dirname, '..', 'data')
		const file = path.join(dataDirPath,'ok-booming-state.csv')
		if (!fs.existsSync(file)) {
	    console.log('no file ok-booming-state.csv found (this is fine)');
	    callback()
		} else {
			fs.createReadStream(file)
				.pipe(csv())
			  .on('data', (row) => {
			  	row.toQuery = row.toQuery=='true'
			  	index[row['Booming tweet ID']] = row
			  })
	  	  .on('end', () => {
			    console.log('ok-booming-state.csv successfully read');
			    callback()
			  })
  	}
	}

	function loadStreamData(callback) {
		const directoryPath = path.join(__dirname, '..', 'data', 'stream');
		fs.readdir(directoryPath, function (err, files) {
		  //handling error
		  if (err) {
		  	return console.log('Unable to scan directory: ' + err);
		  } 
			let filesCount = files.length
			console.log(filesCount+' files to parse')
		  //listing all files using forEach
		  files.forEach(function (file, fi) {
		  	fs.createReadStream(path.join(directoryPath, file))
					.pipe(csv())
				  .on('data', (row) => {
				  	row.toQuery = false
				  	index[row['Booming tweet ID']] = row
				  })
		  	  .on('end', () => {
				    console.log(file+' successfully read');
		  	  	if (--filesCount == 0) {
					    callback()
				  	}
				  })
		  })
		})
	}

	function loadGOTIdList(callback) {
		const dataDirPath = path.join(__dirname, '..', 'data')
		fs.createReadStream(path.join(dataDirPath,'got_id_list.csv'))
			.pipe(csv())
		  .on('data', (row) => {
		  	index[row.id] = {toQuery:true, 'Booming tweet ID':row.id}
		  })
  	  .on('end', () => {
		    console.log('got_id_list.csv successfully read');
		    callback()
		  })
	}

}
