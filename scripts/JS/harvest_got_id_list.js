// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const Twitter = require('twitter');
const config = require('./config.js');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const d3 = require('d3')

const T = new Twitter(config);

harvest_gotIdList()

function harvest_gotIdList() {
	let index = {}
	let batches = []
	let boomingFiles = []
	let boomingData = []

	// - Load the id list to query (from Get Old Tweets)
	loadGOTIdList(()=>{
	// - Load the files containing already harvested GOT tweets
	//   that ARE NOT OK-boomings
		loadGOTRejectedBoomings(()=>{
	// - Load the files containing already harvested GOT tweets
	//   that ARE OK-boomings
			loadGOTBoomings(()=>{
	// - Determine which tweets must be retrieved
	// - Retrieve them
				retrieveTweets(()=>{
	// - Update GOT Booming data
					updateGOTBoomingFiles(()=>{
	// - If it's all retrieved, write ok-booming
						if (!Object.values(index).some(d=>{return d.toQuery})) {
							console.log("All GetOldTweet tweets successfully harvested")
						} else {
							console.log(Object.values(index).filter(d=>{return d.toQuery}).length+ ' to query')
						}
					})
				})
			})
		})
	})

function updateGOTBoomingFiles(callback) {
		// Update rejected data
		const dataDirPath = path.join(__dirname, '..', '..', 'app', 'data-src')
		// Create folder if it does not exist
		if (!fs.existsSync(dataDirPath)){
	    fs.mkdirSync(dataDirPath);
		}
		const file = path.join(dataDirPath,'got_boomings_rejected.csv')
		const csvWriter = createCsvWriter({
		  path: file,
		  alwaysQuote: true,
		  header: [
		    {id: 'Booming tweet ID', title: 'Booming tweet ID'},
		  ]
		});
		// console.log(Object.values(index))
		csvWriter
		  .writeRecords(
		  	Object.values(index)
		  		.filter(d => {
		  			return d.isBooming === false
		  					|| (d.isBooming===undefined && d.toQuery===false) // Tweet deleted
		  		})
		  )
		  .then(()=>{
		  	console.log('got_boomings_rejected.csv was written successfully')
		  	updateAcceptedFiles(callback)
		  })
		  .catch(function(error) {
			  console.error(error);
			})

		function updateAcceptedFiles(callback){
			// Nest values by date
		  boomingData = d3.nest()
				.key(function(d){ return d.Date.substr(0, 10) })
        // .rollup(function(a){ return a.length })
        .entries(
        	Object.values(index).filter(d => {
			  			return d.isBooming === true
			  		})
		  		)
      writeNextAcceptedFile(callback)
		}

		function writeNextAcceptedFile(callback) {
			if (boomingData.length > 0) {
				const data = boomingData.pop()
				const dataDirPath = path.join(__dirname, '..', '..', 'app', 'data-src', 'got_boomings')
				// Create folder if it does not exist
				if (!fs.existsSync(dataDirPath)){
			    fs.mkdirSync(dataDirPath);
				}
				const file = path.join(dataDirPath, data.key+'.csv')
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
				  ]
				});
				// console.log(Object.values(index))
				csvWriter
				  .writeRecords(data.values)
				  .then(()=>{
				  	console.log(file+' was written successfully')
				  	writeNextAcceptedFile(callback)
				  })
				  .catch(function(error) {
					  console.error(error);
					})
			} else {
				callback()
			}
		}
	}
	
	function retrieveTweets(callback) {
		let options = {}
		options.limit = Infinity // For testing purpose
		options.batchSize = 100

		let idListBuffer = []
		/*console.log(
			'=> TOTAL',
			Object.values(index).length
		)
		console.log(
			'=> toQuery===true',
			Object.values(index).filter(d=>d.toQuery===true).length
		)
		console.log(
			'=> toQuery===false',
			Object.values(index).filter(d=>d.toQuery===false).length
		)
		console.log(
			'=> toQuery===undefined',
			Object.values(index).filter(d=>d.toQuery===undefined).length
		)
		console.log(
			'=> isBooming===true',
			Object.values(index).filter(d=>d.isBooming===true).length
		)
		console.log(
			'=> isBooming===false',
			Object.values(index).filter(d=>d.isBooming===false).length
		)
		console.log(
			'=> isBooming===undefined',
			Object.values(index).filter(d=>d.isBooming===undefined).length
		)*/
		for (let id in index) {
			if (index[id].toQuery === true || index[id].isBooming === undefined) {
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
			  					toQuery: false,
			  					isBooming: true
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
		  					toQuery: false,
		  					isBooming: true
		  				}
		  			} else {
		  				index[t.id_str] = (index[t.id_str] || {})
		  				index[t.id_str].toQuery = false
		  				index[t.id_str].isBooming = false
		  			}
		  		} else {
		  			index[t.id_str] = (index[t.id_str] || {})
		  			index[t.id_str].toQuery = false
		  			index[t.id_str].isBooming = false
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

	function loadGOTIdList(callback) {
		const dataDirPath = path.join(__dirname, '..', 'data')
		fs.createReadStream(path.join(dataDirPath,'got_id_list.csv'))
			.pipe(csv())
		  .on('data', (row) => {
		  	index[row.id] = {toQuery: true, 'Booming tweet ID':row.id}
		  })
  	  .on('end', () => {
		    console.log('got_id_list.csv successfully read. '+Object.keys(index).length+' tweets to look for.');
		    callback()
		  })
	}

	function loadGOTBoomings(callback) {
		const directoryPath = path.join(__dirname, '..', '..', 'app', 'data-src', 'got_boomings');
		let boomingTweets = 0
		fs.readdir(directoryPath, function (err, files) {
		  //handling error
		  if (err) {
		  	return console.log('Unable to scan directory: ' + err);
		  	callback()
		  } 
			let filesCount = files.length
			console.log(filesCount+' files to parse')
		  //listing all files using forEach
		  files.forEach(function (file, fi) {
		  	boomingFiles.push(path.join(directoryPath, file))
		  })
		  parseNextBoomingFile(callback)
		})

		function parseNextBoomingFile(callback) {
			if (boomingFiles.length > 0) {
				let file = boomingFiles.pop()
				fs.createReadStream(file)
					.pipe(csv())
				  .on('data', (row) => {
				  	 // retro-compatibility 1/2
				  	if (row['toQuery']) {
				  		row['toQuery'] = row['toQuery']=='true'
				  	} else {
				  		row['toQuery'] = false
				  	}
				  	// retro-compatibility 2/2
				  	if (row['Date']) {
					  	row['isBooming'] = true
				  	} else {
				  		row['isBooming'] = false
				  	}

				  	index[row['Booming tweet ID']] = row
				  	boomingTweets++
				  })
		  	  .on('end', () => {
				    console.log('CSV file '+file+' successfully processed');
				    parseNextBoomingFile(callback)
				  })
			} else {
				console.log(boomingTweets + ' OK-boomings retrieved from files in the got_boomings/ folder.')
				callback()
			}
		}
	}

	function loadGOTRejectedBoomings(callback) {
		const dataDirPath = path.join(__dirname, '..', '..', 'app', 'data-src')
		const file = path.join(dataDirPath,'got_boomings_rejected.csv')
		let rejectedTweets = 0
		if (!fs.existsSync(file)) {
	    console.log('no file got_boomings_rejected.csv found (this is fine)');
	    callback()
		} else {
			fs.createReadStream(file)
				.pipe(csv())
			  .on('data', (row) => {
			  	index[row['Booming tweet ID']] = {toQuery:false, isBooming: false, 'Booming tweet ID':row['Booming tweet ID']}
			  	rejectedTweets++
			  })
	  	  .on('end', () => {
			    console.log('got_boomings_rejected.csv successfully read. ' + rejectedTweets + ' non-OK-booming tweets retrieved.');
			    callback()
			  })
		}
	}

}
