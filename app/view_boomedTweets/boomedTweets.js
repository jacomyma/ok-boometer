'use strict';

angular.module('okboometer.view_boomedTweets', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/boomedTweets', {
    redirectTo: '/boomedTweets/day'
  })
  $routeProvider.when('/boomedTweets/:timeMode', {
    templateUrl: 'view_boomedTweets/boomedTweets.html',
    controller: 'BoomedTweetsCtrl'
  })
})

.controller('BoomedTweetsCtrl', function($scope, $timeout, dataProvider, $routeParams, cache, $location) {
	
	$scope.currentNavItem = "BoomedTweets"
	$scope.data
	$scope.loaded = false
	if ($routeParams.timeMode) {
		cache.timeMode = decodeURIComponent($routeParams.timeMode)
	}

	$scope.load = function(){
		$scope.loaded = false
		dataProvider.load('boomedTweets', true, function(data){
			$scope.boomedTweets = data
			$scope.loaded = true
		})
	}

	$scope.load()
	$scope.$watch(function(){
    return cache.timeMode;
  }, function(){
  	$location.path('/boomedTweets/'+cache.timeMode)
	})
	
})
