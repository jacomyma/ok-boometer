// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const config = require('./config.js');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

getOldTweets_to_idList()

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
