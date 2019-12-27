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

	$scope.load = function(){
		$scope.loaded = false
		dataProvider.load('boomedUsers', true, function(data){
			$scope.boomedScoreByUser = {}
			data.forEach(function(d){
				$scope.boomedScoreByUser[d['id']] = d['score']
			})
			dataProvider.load('usernameIndex', false, function(data){
				$scope.usernameIndex = {}
				data.forEach(function(d){
					$scope.usernameIndex[d['User ID']] = d['User name']
				})
				dataProvider.load('whoTweetedIndex', false, function(data){
					$scope.whoTweetedIndex = {}
					data.forEach(function(d){
						$scope.whoTweetedIndex[d['Tweet ID']] = d['User ID']
					})
					dataProvider.load('boomedTweets', true, function(data){
						$scope.boomedTweets = data.filter(function(d){
							return $scope.whoTweetedIndex[d.id] == $scope.boomedId
						})
						$scope.loaded = true
					})
				})
			})
		})
	}

	$scope.$watch(function(){
    return cache.timeMode;
  }, function(){
		$scope.load()
	})

})
