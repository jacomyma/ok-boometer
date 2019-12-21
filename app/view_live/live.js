'use strict';

angular.module('okboometer.view_live', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/live', {
    templateUrl: 'view_live/live.html',
    controller: 'LiveCtrl'
  })
})

.controller('LiveCtrl', function($scope, $timeout, dataProvider) {
	
	$scope.currentNavItem = "Live"
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
