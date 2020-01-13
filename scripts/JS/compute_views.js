const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const d3 = require('d3')
const vc = require('./views_computing.js')

vc.compute_views(()=>{
	console.log('Views computed.')
})
