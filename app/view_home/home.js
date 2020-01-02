'use strict';

angular.module('okboometer.view_home', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/', {
    redirectTo: '/boomed/day'
  })
  $routeProvider.when('/boomed/:timeMode', {
    templateUrl: 'view_home/home.html',
    controller: 'HomeCtrl'
  })
})

.controller('HomeCtrl', function($scope, $timeout, dataProvider, $routeParams, cache, $location) {
	
	$scope.currentNavItem = "Boomed"
	$scope.data
	$scope.loaded = false
	if ($routeParams.timeMode) {
		cache.timeMode = decodeURIComponent($routeParams.timeMode)
		$scope.timeMode = cache.timeMode
	}


	$scope.load = function(){
		$scope.loaded = false
		dataProvider.load('boomedUsers', true, function(data){
			$scope.boomedUsers = data
			dataProvider.load('usernameIndex', false, function(data){
				$scope.usernameIndex = {}
				data.forEach(function(d){
					$scope.usernameIndex[d['User ID']] = d['User name']
				})
				$scope.boomedUsers.forEach(function(d){
					d.name = $scope.usernameIndex[d.id] || ' <unknown>'
				})
				$scope.loaded = true
			})
		})
	}

	$scope.load()
	$scope.$watch(function(){
    return cache.timeMode;
  }, function(){
  	$scope.timeMode = cache.timeMode
  	$location.path('/boomed/'+cache.timeMode)
	})
})
