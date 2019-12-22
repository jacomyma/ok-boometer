'use strict';

angular.module('okboometer.view_home', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'view_home/home.html',
    controller: 'HomeCtrl'
  })
})

.controller('HomeCtrl', function($scope, $timeout, dataProvider, cache) {
	
	$scope.currentNavItem = "Boomed"
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
