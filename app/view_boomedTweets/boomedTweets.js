'use strict';

angular.module('okboometer.view_boomedTweets', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/boomedTweets', {
    templateUrl: 'view_boomedTweets/boomedTweets.html',
    controller: 'BoomedTweetsCtrl'
  })
})

.controller('BoomedTweetsCtrl', function($scope, $timeout, dataProvider, $routeParams, cache) {
	
	$scope.currentNavItem = "BoomedTweets"
	$scope.data
	$scope.loaded = false

	dataProvider.onLoad(function(data){
		$timeout(function(){
			$scope.data = data
			$scope.loaded = true
		})
	})

	$scope.$watch(function(){
    return cache.timeMode;
  }, function(){
		$timeout(function(){
			dataProvider.load(cache.timeMode)
		})
	})
	
})
