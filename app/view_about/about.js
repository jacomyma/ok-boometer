'use strict';

angular.module('okboometer.view_about', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/about', {
    templateUrl: 'view_about/about.html',
    controller: 'AboutCtrl'
  })
  $routeProvider.when('/about/:timeMode', {
    templateUrl: 'view_about/about.html',
    controller: 'AboutCtrl'
  })
})

.controller('AboutCtrl', function($scope, $timeout, dataProvider, $routeParams, cache, $location) {
	
	$scope.currentNavItem = "About"
	if ($routeParams.timeMode) {
		cache.timeMode = decodeURIComponent($routeParams.timeMode)
	}
	$scope.$watch(function(){
    return cache.timeMode;
  }, function(){
  	$location.path('/about/'+cache.timeMode)
	})
})
