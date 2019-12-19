'use strict';

angular.module('okboometer.view_home', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'view_home/home.html',
    controller: 'HomeCtrl'
  })
})

.controller('HomeCtrl', function($scope, $timeout, dataProvider) {
	dataProvider.onLoad(function(data){
		console.log(data.topBoomedList)
	})
	
})
