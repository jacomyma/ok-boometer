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
				var now = new Date()

				data = data
					// Remove those too old (>90 sec)
					.filter(function(row){
						var then = new Date(row['Date'])
						return now-then<(10*60000) // 10 minutes
					})
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

						// Wait and throw an avocado
						resetAvocado()
						$timeout(throwAvocado, 600)

					})
				}
			})
  }

	var avocado = document.getElementById('avocado')
  var avocadoLoop
  var throwing = {r:0, speed:50, g:0.0015}
  function throwAvocado() {
  	// Place avocado by reverse-launching
		var tweetDiv = document.getElementsByClassName('tweet-container')[0]
		var rect = tweetDiv.getBoundingClientRect()
		throwing.x = rect.left + Math.random() * (rect.right - rect.left)
		throwing.y = rect.top + Math.random() * (rect.bottom - rect.top)

		// Set up throwing
		throwing.dr = ((Math.random()<0.5)?(+1):(-1))*(0.1+0.4*Math.random())
		throwing.dx = ((Math.random()<0.5)?(+1):(-1))*(0.7+0.3*Math.random())
		throwing.dy = -Math.abs(Math.sin(Math.acos(throwing.dx)))
  	throwing.step = 0
		// Simulate throwing
		while ((throwing.x>=-200 && throwing.x<=(window.innerWidth||1600)+200)) {
			throwing.dy += throwing.speed * throwing.g
	  	throwing.x += throwing.speed * throwing.dx
	  	throwing.y += throwing.speed * throwing.dy
	  	throwing.step++
		}
		throwing.dx = -throwing.dx
		throwing.dy = -throwing.dy

  	// Display
  	avocado.style.display = 'block'
  	avocado.style.left = Math.round(throwing.x - avocado.offsetWidth/2)+'px'
  	avocado.style.top = Math.round(throwing.y - avocado.offsetHeight/2)+'px'

  	avocadoLoop = $interval(updateAvocado, 33)
		$scope.$on('$destroy', function() {
	    // Make sure that the interval is destroyed
	    if (angular.isDefined(avocadoLoop)) {
	      $interval.cancel(avocadoLoop)
	      avocadoLoop = undefined
	    }
	  })
  }

  function resetAvocado() {
  	avocado.style.display = 'none'
  	avocado.src = 'img/avocado-color.svg'
  }

  function updateAvocado() {
  	throwing.dy += throwing.speed * throwing.g
  	throwing.x += throwing.speed * throwing.dx
  	throwing.y += throwing.speed * throwing.dy
  	throwing.r += throwing.speed * throwing.dr
  	throwing.step--
  	// rotate
  	avocado.style.webkitTransform = 'rotate('+throwing.r+'deg)'; 
    avocado.style.mozTransform    = 'rotate('+throwing.r+'deg)'; 
    avocado.style.msTransform     = 'rotate('+throwing.r+'deg)'; 
    avocado.style.oTransform      = 'rotate('+throwing.r+'deg)'; 
    avocado.style.transform       = 'rotate('+throwing.r+'deg)'; 
    // Place
  	avocado.style.left = Math.round(throwing.x - avocado.offsetWidth/2)+'px'
  	avocado.style.top = Math.round(throwing.y - avocado.offsetHeight/2)+'px'
  	// End?
  	if (throwing.step <= 0) {
	  	avocado.src = 'img/crashed-avocado-color.svg'
  		$interval.cancel(avocadoLoop)
	    avocadoLoop = undefined
  	}
  }
	
})
