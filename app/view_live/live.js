'use strict';

angular.module('okboometer.view_live', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/live', {
    templateUrl: 'view_live/live.html',
    controller: 'LiveCtrl'
  })
})

.controller('LiveCtrl', function($scope, $timeout, dataProvider, $interval, cache) {
	
	$scope.currentNavItem = "Live"
	$scope.loaded = true

	// Set up initial loop
	var liveLoop
	$timeout(function(){
		liveLoop = $interval(updateLive, 10000)
		$scope.$on('$destroy', function() {
	    // Make sure that the interval is destroyed
	    if (angular.isDefined(liveLoop)) {
	      $interval.cancel(liveLoop)
	      liveLoop = undefined
	    }
	  })
	  updateLive()
	}, 500)

  function updateLive() {
		// Load the live file
		d3.csv("data/live_booming.csv?date="+(new Date()))
			.then(function(data) {
				console.log(data)
				var now = new Date()

				data = data
					// Remove those too old (>90 sec)
					/*.filter(function(row){
						var then = new Date(row['Date'])
						return now-then<(90000) // 90 seconds
					})*/
					// Compare with memory to remove the already used ones
					.filter(function(row){
						return !cache.seenBoomings[row['Booming tweet ID']]
					})

				// Consolidate time
				data.forEach(function(row){
						row.time = Date.parse(row['Date'])/1000
					})

				// Sort by time
				data.sort(function(a, b){ return b.time - a.time  })


				if (data.length>0) {
					$timeout(function(){
						// Take the most recent
						$scope.booming = data[0]

						// remember it
						cache.seenBoomings[$scope.booming['Booming tweet ID']] = true
					})
				}

				// Load it

				// Wait

				// Throw an avocado

				// Load the booming tweet over it


			})




  }
	
})
