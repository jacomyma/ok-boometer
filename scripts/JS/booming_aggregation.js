// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const Twitter = require('twitter');
const config = require('./config.js');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

module.exports = {
	aggregate_boomings: aggregate_boomings
}

const T = new Twitter(config);

function aggregate_boomings(callback) {
	let index = {}
	let boomingFiles = []
	let streamingFiles = []

	// - Load the id list to query (from Get Old Tweets)
	loadGOTData(()=>{
	// - Load the id list known from the live stream
		loadStreamData(()=>{
	// - If it's all retrieved, write ok-booming
			if (!Object.values(index).some(d=>{return d.toQuery})) {
				console.log("ready to write ok-booming")
				writeOKBooming(callback)
			} else {
				console.log(Object.values(index).filter(d=>{return d.toQuery}).length+ ' to query')
			}
		})
	})

	function writeOKBooming(callback) {
		const outputDirPath = path.join(__dirname, '..','..','app','data');
		// Create folder if it does not exist
		if (!fs.existsSync(outputDirPath)){
	    fs.mkdirSync(outputDirPath);
		}
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
		  .then(()=>{
		  	console.log('The OK Booming CSV file was written successfully')
		  	if (callback) {
		  		callback()
		  	}
		  });

	}

	function loadStreamData(callback) {
		const directoryPath = path.join(__dirname, '..', 'data', 'stream_boomings');
		// Create folder if it does not exist
		if (!fs.existsSync(directoryPath)){
	    fs.mkdirSync(directoryPath);
		}
		let streamingTweets = 0
		fs.readdir(directoryPath, function (err, files) {
		  //handling error
		  if (err) {
		  	return console.log('Unable to scan directory: ' + err);
		  } 
			let filesCount = files.length
			console.log(filesCount+' files to parse')
		  //listing all files using forEach
		  files.forEach(function (file, fi) {
		  	streamingFiles.push(path.join(directoryPath, file))
		  })
		  parseNextStreamingFile(callback)
		})

		function parseNextStreamingFile(callback) {
			if (streamingFiles.length > 0) {
				let file = streamingFiles.pop()
				fs.createReadStream(file)
					.pipe(csv())
				  .on('data', (row) => {
				  	index[row['Booming tweet ID']] = row
				  	streamingTweets++
				  })
		  	  .on('end', () => {
				    console.log('CSV file '+file+' successfully processed');
				    parseNextStreamingFile(callback)
				  })
			} else {
				console.log(streamingTweets + ' OK-boomings retrieved from files in the stream_boomings/ folder.')
				callback()
			}
		}
	}

	function loadGOTData(callback) {
		const directoryPath = path.join(__dirname, '..', 'data', 'got_boomings');
		// Create folder if it does not exist
		if (!fs.existsSync(directoryPath)){
	    fs.mkdirSync(directoryPath);
		}
		let boomingTweets = 0
		fs.readdir(directoryPath, function (err, files) {
		  //handling error
		  if (err) {
		  	return console.log('Unable to scan directory: ' + err);
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

}