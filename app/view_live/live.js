'use strict';

angular.module('okboometer.view_live', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/live', {
    templateUrl: 'view_live/live.html',
    controller: 'LiveCtrl'
  })
  $routeProvider.when('/live/:timeMode', {
    templateUrl: 'view_live/live.html',
    controller: 'LiveCtrl'
  })
})

.controller('LiveCtrl', function($scope, $timeout, dataProvider, $interval, $routeParams, cache, $location) {
	
	$scope.currentNavItem = "Live"
	$scope.loaded = true
	if ($routeParams.timeMode) {
		cache.timeMode = decodeURIComponent($routeParams.timeMode)
	}
	$scope.$watch(function(){
    return cache.timeMode;
  }, function(){
  	$location.path('/live/'+cache.timeMode)
	})

	// Set up initial loop
	var liveLoop
	var initialTrig = $timeout(function(){
		liveLoop = $interval(updateLive, 7000)
		
	  updateLive()
	}, 500)

	var throwingTrig
  function updateLive() {
		// Load the live file
		d3.csv("data/live_booming.csv?date="+(new Date()))
			.then(function(data) {
				var now = new Date()

				data = data
					// Remove empty ones
					.filter(function(row){
						if (row['Date']) return true
						else return false
					})
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

						// Remember it
						cache.seenBoomings[$scope.booming['Booming tweet ID']] = true

						// Add to data
						// dataProvider.registerNewBooming($scope.booming)

						// Update notif text
						document.getElementById('avocado-notification-username').textContent = '@'+$scope.booming['Booming user name']

						// Wait and throw an avocado
						resetAvocado()
						throwingTrig = $timeout(throwAvocado, 1200)

					})
				}
			})
  }

	var avocado = document.getElementById('avocado')
	var avocadoNotif = document.getElementById('avocado-notification')
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
  	// console.log(avocado.style.left+' '+avocado.style.top)
  	// End?
  	if (throwing.step <= 0) {
	  	avocado.src = 'img/crashed-avocado-color.svg'

	  	avocadoNotif.style.left = (throwing.x - 140)+'px'
	  	avocadoNotif.style.top = (throwing.y - 120)+'px'
	  	avocadoNotif.classList.remove('fade-out')
	  	$timeout(function(){
		  	avocadoNotif.classList.add('fade-out')
	  	}, 100)

  		$interval.cancel(avocadoLoop)
	    avocadoLoop = undefined
  	}
  }

  // Display avocado notif only here
	avocadoNotif.style.display = 'block'

	// Destroy delayed triggers
	$scope.$on('$destroy', function() {
    if (angular.isDefined(liveLoop)) {
      $interval.cancel(liveLoop)
      liveLoop = undefined
    }
    
    avocadoNotif.style.display = 'none'
		avocadoNotif.classList.remove('fade-out')

		resetAvocado()
    // Make sure that the interval is destroyed
    if (angular.isDefined(avocadoLoop)) {
      $interval.cancel(avocadoLoop)
      avocadoLoop = undefined
    }

    if (angular.isDefined(initialTrig)) {
      $timeout.cancel(initialTrig)
      initialTrig = undefined
    }
    if (angular.isDefined(throwingTrig)) {
      $timeout.cancel(throwingTrig)
      throwingTrig = undefined
    }
  })
	
})
