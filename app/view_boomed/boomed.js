'use strict';

angular.module('okboometer.view_boomed', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/boomed/:boomed', {
    templateUrl: 'view_boomed/boomed.html',
    controller: 'BoomedCtrl'
  })
})

.controller('BoomedCtrl', function($scope, $timeout, dataProvider, $routeParams, cache) {
	
	$scope.data
	$scope.loaded = false
	$scope.boomedId = decodeURIComponent($routeParams.boomed)

	dataProvider.onLoad(function(data){
		$timeout(function(){
			$scope.data = data
			$scope.loaded = true

			$scope.boomedTweets = Object.keys($scope.data.boomedTweetsByUser[$scope.boomedId])
				.sort(function(a, b){
					return $scope.data.boomedTweetsByUser[$scope.boomedId][b] - $scope.data.boomedTweetsByUser[$scope.boomedId][a]
				})
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
