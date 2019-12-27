'use strict';

// Requiring module's CSS
require('angular-material/angular-material.min.css');

// Requiring angular-related modules that will spit things in the global scope
require('angular');
require('angular-animate');
require('angular-aria');
require('angular-material');
require('angular-route');

// Making some modules global for the custom scripts to consume
var d3 = require('d3');
window.d3 = d3;

// Requiring own modules
require('./view_home/home.js');
require('./view_boomed/boomed.js');
require('./view_boomedTweets/boomedTweets.js');
require('./view_live/live.js');
require('./view_about/about.js');

// Declare app level module which depends on views, and components
angular.module('graphrecipes', [
  'ngRoute',
  'ngMaterial',
  'okboometer.view_home',
  'okboometer.view_boomed',
  'okboometer.view_boomedTweets',
  'okboometer.view_live',
  'okboometer.view_about',
])
.config(function($routeProvider, $mdThemingProvider) {
  $routeProvider.otherwise({redirectTo: '/'});

  // Material theme
  $mdThemingProvider.theme('default')
    .primaryPalette('light-green', {
      'default': '600',   // by default use shade 400 from the pink palette for primary intentions
      'hue-1': '100',     // use shade 100 for the <code>md-hue-1</code> class
      'hue-2': '600',     // use shade 600 for the <code>md-hue-2</code> class
      'hue-3': 'A100'     // use shade A100 for the <code>md-hue-3</code> class
    })
    .accentPalette('yellow', {
      'default': '300'
    })
    .warnPalette('orange')
    .backgroundPalette('grey', {
      'default': '800'
    })
    .dark();
})

// Filters
.filter('number', function() {
  return function(d) {
    return +d
  }
})
.filter('percent', function() {
  return function(d) {
    return Math.round(+d*100)+'%'
  }
})

// Services
.factory('cache', function(){
  var ns = {}
  ns.seenBoomings = {}
  ns.timeMode = 'week'
  return ns
})

.factory('dataProvider', function(cache, $timeout){
  var ns = {}
  ns.cache = {}
  ns.load = function(file, useTimeSuffix, callback) {
    var suffix = ''
    if (useTimeSuffix) {
      suffix = '_' + cache.timeMode
      if (suffix == '_all') { suffix = '' }
    }
    var filename = file+suffix
    if (ns.cache[filename]) {
      $timeout(function(){
        callback(ns.cache[filename])
      })
    }
    d3.csv("data/"+filename+".csv").then(function(data) {
      $timeout(function(){
        callback(data)
      })
    })
  }

  return ns
})


// Directives

.directive('okBoometerHeader', function($timeout, cache) {
  return {
    restrict: 'E',
    scope: {
    },
    templateUrl: 'directive_templates/header.html',
    link: function($scope, el, attrs) {
      $scope.timeMode = cache.timeMode
      $scope.$watch('timeMode', function(){
        cache.timeMode = $scope.timeMode
      })
    }
  }
})

.directive('tweet', function($timeout) {
  return {
    restrict: 'E',
    scope: {
      tweetId: '=',
    },
    templateUrl: 'directive_templates/tweet.html',
    link: function($scope, el, attrs) {
      $scope.$watch('tweetId', function(){
        loadWidget()
      })

      function loadWidget() {
        document.getElementById('tweet-'+$scope.tweetId).innerHTML = ''
        document.getElementById('tweet-placeholder-'+$scope.tweetId).style.display = true
        $timeout(function(){
          $timeout(function(){
            twttr.widgets.createTweet($scope.tweetId, document.getElementById('tweet-'+$scope.tweetId), {theme:'dark'})
              .then(function(){
                document.getElementById('tweet-placeholder-'+$scope.tweetId).style.display = 'none'
                checkMissingTweet()
              })
          })
        })
      }

      function checkMissingTweet() {
        // TODO
      }
    }
  }
})

.directive('lcdMeter', function($timeout) {
  return {
    restrict: 'E',
    scope: {
      score: '=',
    },
    templateUrl: 'directive_templates/lcdMeter.html',
    link: function($scope, el, attrs) {
      $scope.$watch('score', function(){
        $scope.score2 = Math.min((+$scope.score), 9999)
      })
    }
  }
})
