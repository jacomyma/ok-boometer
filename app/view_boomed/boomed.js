'use strict';

angular.module('okboometer.view_boomed', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/boomed/:boomed', {
    templateUrl: 'view_boomed/boomed.html',
    controller: 'BoomedCtrl'
  })
})

.controller('BoomedCtrl', function($scope, $timeout, dataProvider, $routeParams) {
	
	$scope.data
	$scope.loaded = false
	$scope.boomedId = decodeURIComponent($routeParams.boomed)

	dataProvider.onLoad(function(data){
		$timeout(function(){
			console.log(data)
			$scope.data = data
			$scope.loaded = true

			$scope.boomedTweets = Object.keys($scope.data.boomedTweetsByUser[$scope.boomedId])
				.sort(function(a, b){
					return $scope.data.boomedTweetsByUser[$scope.boomedId][b] - $scope.data.boomedTweetsByUser[$scope.boomedId][a]
				})
		})
	})
	
})
