// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const config = require('./config.js');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const d3 = require('d3')

getOldTweets_to_idList()

function getOldTweets_to_idList() {
	let options = {}
	options.limit = Infinity // For testing purpose

	const outputDirPath = path.join(__dirname, '..', 'data');
	let idListStream = fs.createWriteStream(path.join(outputDirPath, 'got_id_list.csv'));
	let rejectedStream = fs.createWriteStream(path.join(outputDirPath, 'got_rejected_log.txt'));

  const csv = d3.dsvFormat(";")

	// Read the GetOldTweets data
	// joining path of directory 
	const directoryPath = path.join(__dirname, '..', 'data', 'got');
	idListStream.write('id\n')
	// passing directoryPath and callback function
	fs.readdir(directoryPath, function (err, files) {
	  //handling error
	  if (err) {
	  	return console.log('Unable to scan directory: ' + err);
	  } 
		let filesCount = files.length
		console.log(filesCount+' files to parse')
	  //listing all files using forEach
	  files.forEach(function (file, fi) {
	  	// The way GetOldTweets works, it writes one line per tweet,
	  	// even if some of those lines are not well formatted. So we cannot
	  	// trustfully parse the CSVs. We must look at each line, try
	  	// to read it as a CSV line, and just forget it if it does not work.
	  	const instream = fs.createReadStream(path.join(directoryPath, file))
	  	instream.on('end', () => {
			  	if (--filesCount == 0) {
						idListStream.end()
						rejectedStream.end()
			  	}
			    console.log('CSV file successfully processed');
			  })
	  	const readInterface = readline.createInterface({
		    input: instream,
		    // output: process.stdout,
		    console: false
			});
			readInterface
				.on('line', line => {
					let [row] = csv.parseRows(line)
					if (row.length != 10) {
						// console.log("Row parsed with wrong length ("+row.length+")")
					} else {
						let date = row[1]
						let txt = row[4]
						let id = row[8]
						txt = txt
				    	.replace(/([^ ]*[\/\.][^ ]*) ([^ ]*[\/\.][^ ]*)/gi, '$1$2')
				    	.replace(/([^ ]*[\/\.][^ ]*) ([^ ]*[\/\.][^ ]*)/gi, '$1$2')
				    	.replace(/([^ ]*[\/\.][^ ]*) ([^ ]*[\/\.][^ ]*)/gi, '$1$2')
				  	if (gotTextContentOrdeal(txt)) {
					  	idListStream.write(id+'\n')
					  	// console.log('YES '+txt)
					  } else {
					  	rejectedStream.write(date+' '+txt+'\n')
					  	// console.log('NO  '+txt)
					  }
					}
				})
	  })
	})
}

function gotTextContentOrdeal(text){
	if (text == undefined) return false
	if (text.substr(0,3) == "RT ") return false
	if (text.match(/ok.?.?.?boomer/gi)) {
		// Remove url STUB
		text = text.replace(/https?:\/\/.*/i, '')
		// Remove image
		text = text.replace(/pic\.twitter\.com\/[^ ]*/i, '')
		if (text.length > 20) return false
		else return true
	} else return false
}
