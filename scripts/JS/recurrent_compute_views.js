const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const d3 = require('d3')
const vc = require('./views_computing.js')

const maxTime = 1000 * 60 * 33 // Streaming lasts for 33 minutes

var t = setInterval(vc.compute_views, 5 * 60 * 1000); // Every 5 minutes

// Auto-stop (forever will reboot the script even if uncaught errors)
setTimeout(function(){
	let now = new Date()
	console.log('Terminate stream because its time has been reached ('+Math.round(maxTime/60000)+' minutes). '+now.toISOString())
	process.exit()
}, maxTime)
