'use strict';

angular.module('okboometer.view_about', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider.when('/about', {
    templateUrl: 'view_about/about.html',
    controller: 'AboutCtrl'
  })
})

.controller('AboutCtrl', function($scope, $timeout, dataProvider) {
	
	$scope.currentNavItem = "About"

})
