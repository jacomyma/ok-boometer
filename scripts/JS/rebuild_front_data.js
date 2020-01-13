const ba = require('./booming_aggregation.js')
const vc = require('./views_computing.js')

ba.aggregate_boomings(()=>{
	console.log('OK-boomings aggregated.')
	vc.compute_views(()=>{
		console.log('Views computed.')
	})
})


