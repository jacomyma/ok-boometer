'use strict';

angular.module('okboometer.view_boomedTweets', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/boomedTweets', {
    templateUrl: 'view_boomedTweets/boomedTweets.html',
    controller: 'BoomedTweetsCtrl'
  })
})

.controller('BoomedTweetsCtrl', function($scope, $timeout, dataProvider, $routeParams) {
	
	$scope.currentNavItem = "BoomedTweets"
	$scope.data
	$scope.loaded = false

	dataProvider.onLoad(function(data){
		$timeout(function(){
			console.log(data)
			$scope.data = data
			$scope.loaded = true
		})
	})
	
})
