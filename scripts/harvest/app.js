// See https://codeburst.io/build-a-simple-twitter-bot-with-node-js-in-just-38-lines-of-code-ed92db9eb078

const Twitter = require('twitter');
const config = require('./config.js');
const path = require('path');
const fs = require('fs');

// Read the GetOldTweets data
//joining path of directory 
const directoryPath = path.join(__dirname, '../data/got');
//passing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        console.log(file); 
    });
});

const T = new Twitter(config);

/*
var id_list = [20]

// Set up your search parameters
var params = {
  id: id_list.join(',')
}

T.get('statuses/lookup', params, function(err, data, response) {
  if (!err) {
  	console.log(data)
  } else {
    console.log(err);
  }
})
*/