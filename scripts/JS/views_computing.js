const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const d3 = require('d3')

module.exports = {
	compute_views: compute_views
}

function compute_views(callback){
	const timeRanges = [
		{id:'_hour', duration: 1000 * 60 * 60},
		{id:'_day', duration: 1000 * 60 * 60 * 24},
		{id:'_week', duration: 1000 * 60 * 60 * 24 * 7},
		{id:'_month', duration: 1000 * 60 * 60 * 24 * 30},
		{id:'_year', duration: 1000 * 60 * 60 * 24 * 365},
		{id:'', duration:Infinity}
	]
	const dataDirPath = path.join(__dirname, '..','..','app','data');
	// Create folder if it does not exist
	if (!fs.existsSync(dataDirPath)){
	  fs.mkdirSync(dataDirPath);
	}
	const file = path.join(dataDirPath, 'okbooming.csv')
	let usernameIndex = {}
	let whoTweetedIndex = {}
	let boomings = []
	let boomingByTweet = {}
	fs.createReadStream(file)
		.pipe(csv())
	  .on('data', (d) => {
	  	boomingByTweet[d['Boomed tweet ID']] = (boomingByTweet[d['Boomed tweet ID']] || 0) + 1
	  	d.time = Date.parse(d['Date'])
	  	boomings.push(d)
	  })
	  .on('end', () => {
	    console.log('okbooming file read');

	    // Booming absolution: we just forget the tweets
	    // that are not boomed enough
	    boomings = boomings.filter(d=>{
	    	return boomingByTweet[d['Boomed tweet ID']] >= 3 // OK-booming threshold
	    })
	    boomings.forEach(d=>{
		  	usernameIndex[d['Booming user ID']] = d['Booming user name']
		  	usernameIndex[d['Boomed user ID']] = d['Boomed user name']
		  	whoTweetedIndex[d['Booming tweet ID']] = d['Booming user ID']
		  	whoTweetedIndex[d['Boomed tweet ID']] = d['Boomed user ID']
	    })

	    writeBoomings(boomings, ()=>{
		    writeTopBoomed(boomings, ()=>{
			    writeTopBoomedTweets(boomings, ()=>{
				    writeUsernameIndex(usernameIndex, ()=>{
					    writeWhoTweetedIndex(whoTweetedIndex, ()=>{
						    if (callback) {
						    	callback()
						    }
					    })
				    })
			    })
		    })
	    })
	  })

	function writeWhoTweetedIndex(whoTweetedIndex, callback){
		const dataDirPath = path.join(__dirname, '..','..','app','data')
		// Create folder if it does not exist
		if (!fs.existsSync(dataDirPath)){
		  fs.mkdirSync(dataDirPath);
		}
		let file = 'whoTweetedIndex.csv'
		var data = []
		for (id in whoTweetedIndex){
			data.push({
				'Tweet ID': id,
				'User ID': whoTweetedIndex[id]
			})
		}
		const csvWriter = createCsvWriter({
		  path: path.join(dataDirPath, file),
		  alwaysQuote: true,
		  header: [
		    {id: 'Tweet ID', title: 'Tweet ID'},
		    {id: 'User ID', title: 'User ID'}
		  ]
		})
		csvWriter
		  .writeRecords(data)
		  .then(()=>{
		  	console.log(file+' was written successfully')
		  	if (callback) {
		    	callback()
		    }
		  })
		  .catch(function(error) {
			  console.error(error)
			})
	}

	function writeUsernameIndex(usernameIndex, callback){
		const dataDirPath = path.join(__dirname, '..','..','app','data')
		// Create folder if it does not exist
		if (!fs.existsSync(dataDirPath)){
		  fs.mkdirSync(dataDirPath);
		}
		let file = 'usernameIndex.csv'
		var data = []
		for (id in usernameIndex){
			data.push({
				'User ID': id,
				'User name': usernameIndex[id]
			})
		}
		const csvWriter = createCsvWriter({
		  path: path.join(dataDirPath, file),
		  alwaysQuote: true,
		  header: [
		    {id: 'User ID', title: 'User ID'},
		    {id: 'User name', title: 'User name'}
		  ]
		})
		csvWriter
		  .writeRecords(data)
		  .then(()=>{
		  	console.log(file+' was written successfully')
		  	if (callback) {
		    	callback()
		    }
		  })
		  .catch(function(error) {
			  console.error(error)
			})
	}

	function writeTopBoomedTweets(boomings, callback){
		const dataDirPath = path.join(__dirname, '..','..','app','data')
		// Create folder if it does not exist
		if (!fs.existsSync(dataDirPath)){
		  fs.mkdirSync(dataDirPath);
		}
		const now = new Date()
		let remainingTimeRanges = timeRanges.slice(0)
		writeNext(callback)
		function writeNext(callback) {
			if (remainingTimeRanges.length <=0 ) {
				if (callback) { callback() }
			} else {
				const tr = remainingTimeRanges.pop()
				let data = d3.nest()
					.key(function(d){ return d["Boomed tweet ID"] })
	        .rollup(function(a){ return a.length })
	        .entries(boomings.filter(d=>{
					  	return now-d.time <= tr.duration
					  }))
	        .map(function(d){
	          return {
	            id: d.key,
	            score: d.value
	          }
	        })
	        .sort(function(a,b){ return b.score-a.score })
				let file = 'boomedTweets'+tr.id+'.csv'
				const csvWriter = createCsvWriter({
				  path: path.join(dataDirPath, file),
				  alwaysQuote: true,
				  header: [
				    {id: 'id', title: 'id'},
				    {id: 'score', title: 'score'}
				  ]
				})
				csvWriter
				  .writeRecords(data)
				  .then(()=>{
				  	console.log(file+' was written successfully')
				  	writeNext(callback)
				  })
				  .catch(function(error) {
					  console.error(error)
					})
			}
		}
	}

	function writeTopBoomed(boomings, callback){
		const dataDirPath = path.join(__dirname, '..','..','app','data')
		// Create folder if it does not exist
		if (!fs.existsSync(dataDirPath)){
		  fs.mkdirSync(dataDirPath);
		}
		const now = new Date()
		let remainingTimeRanges = timeRanges.slice(0)
		writeNext(callback)
		function writeNext(callback) {
			if (remainingTimeRanges.length <=0 ) {
				if (callback) { callback() }
			} else {
				const tr = remainingTimeRanges.pop()
				let data = d3.nest()
		      .key(function(d){ return d["Boomed user ID"] })
		      .rollup(function(a){ return a.length })
		      .entries(boomings.filter(d=>{
					  	return now-d.time <= tr.duration
					  }))
		      .map(function(d){
		        return {
		          id: d.key,
		          score: d.value
		        }
		      })
		      .sort(function(a,b){ return b.score-a.score })
				let file = 'boomedUsers'+tr.id+'.csv'
				const csvWriter = createCsvWriter({
				  path: path.join(dataDirPath, file),
				  alwaysQuote: true,
				  header: [
				    {id: 'id', title: 'id'},
				    {id: 'score', title: 'score'}
				  ]
				})
				csvWriter
				  .writeRecords(data)
				  .then(()=>{
				  	console.log(file+' was written successfully')
				  	writeNext(callback)
				  })
				  .catch(function(error) {
					  console.error(error)
					})
		  }
		}
	}

	function writeBoomings(boomings, callback){
		const dataDirPath = path.join(__dirname, '..','..','app','data')
		// Create folder if it does not exist
		if (!fs.existsSync(dataDirPath)){
		  fs.mkdirSync(dataDirPath);
		}
		const now = new Date()
		let remainingTimeRanges = timeRanges.slice(0)
		writeNext(callback)
		function writeNext(callback) {
			if (remainingTimeRanges.length <=0 ) {
				if (callback) { callback() }
			} else {
				const tr = remainingTimeRanges.pop()
				let file = 'boomings'+tr.id+'.csv'
				const csvWriter = createCsvWriter({
				  path: path.join(dataDirPath, file),
				  alwaysQuote: true,
				  header: [
				    {id: 'Date', title: 'Date'},
				    {id: 'Booming tweet ID', title: 'Booming tweet ID'},
				    {id: 'Boomed tweet ID', title: 'Boomed tweet ID'}
				  ]
				})
				csvWriter
				  .writeRecords(boomings.filter(d=>{
				  	return now-d.time <= tr.duration
				  }))
				  .then(()=>{
				  	console.log(file+' was written successfully')
				  	writeNext(callback)
				  })
				  .catch(function(error) {
					  console.error(error)
					})
			}
		}
	}
}