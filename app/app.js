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
  ns.timeMode = 'all'
  return ns
})

.factory('dataProvider', function(){
  var ns = {}
  ns.loaded = false
  ns.load = function(timeRange) {
    let ms;
    switch (timeRange) {
      case 'hour':
        ms = 1000 * 60 * 60
        break;
      case 'day':
        ms = 1000 * 60 * 60 * 24
        break;
      case 'week':
        ms = 1000 * 60 * 60 * 24 * 7
        break;
      case 'month':
        ms = 1000 * 60 * 60 * 24 * 30
        break;
      case 'year':
        ms = 1000 * 60 * 60 * 24 * 365
        break;
      default:
        ms = Infinity
        break;
    }

    d3.csv("data/okbooming.csv").then(function(data) {
      // Consolidate dates
      data.forEach(function(d){
        d.time = Date.parse(d["Date"])
      })
      var now = new Date()

      ns.data = {
        booming: data.filter(function(d){ return now-d.time <= ms })
      }

      ns.data.booming.sort(function(a,b){return b.time-a.time})

      // Indexes
      ns.data.tweetIndex = {}
      ns.data.usernameIndex = {}
      ns.data.booming.forEach(ns.indexBooming)

      // Aggregate by boomed
      ns.data.topBoomed = d3.nest()
        .key(function(d){ return d["Boomed user ID"] })
        .rollup(function(a){ return a.length })
        .entries(ns.data.booming)
        .map(function(d){
          return {
            id: d.key,
            value: d.value,
            name: ns.data.usernameIndex[d.key]
          }
        })
        .sort(function(a,b){ return b.value-a.value })

      // Aggregate by boomed tweet
      ns.data.topBoomedTweet = d3.nest()
        .key(function(d){ return d["Boomed tweet ID"] })
        .rollup(function(a){ return a.length })
        .entries(ns.data.booming)
        .map(function(d){
          return {
            id: d.key,
            value: d.value
          }
        })
        .sort(function(a,b){ return b.value-a.value })

      // Boomed tweets by boomed
      ns.data.boomedTweetsByUser = d3.nest()
        .key(function(d){ return d["Boomed user ID"] })
        .key(function(d){ return d["Boomed tweet ID"] })
        .rollup(function(a){ return a.length })
        .object(ns.data.booming)

      // Boomed score by boomed
      ns.data.boomedScoreByUser = d3.nest()
        .key(function(d){ return d["Boomed user ID"] })
        .rollup(function(a){ return a.length })
        .object(ns.data.booming)

      window.data = ns.data
      ns.loaded = true
      if (ns.cb) ns.cb(ns.data)
    })
  }
  ns.sortData = function() {
    ns.data.booming.sort(function(a,b){return b.time-a.time})
    ns.data.topBoomed.sort(function(a,b){ return b.value-a.value })
    ns.data.topBoomedTweet.sort(function(a,b){ return b.value-a.value })
  }
  ns.indexBooming = function(d) {
    // Tweet index
    ns.data.tweetIndex[d["Booming tweet ID"]] = d["Booming user ID"]
    ns.data.tweetIndex[d["Boomed tweet ID"]] = d["Boomed user ID"]
    // Username index
    ns.data.usernameIndex[d["Booming user ID"]] = d["Booming user name"]
    ns.data.usernameIndex[d["Boomed user ID"]] = d["Boomed user name"]
  }
  ns.addBoomingToNests = function(d) {
    // Aggregate by boomed
    ns.data.topBoomed.some(function(entry){
      if (entry.id == d["Boomed user ID"]) {
        entry.value++
        return true
      } else return false
    })

    // Aggregate by boomed tweet
    ns.data.topBoomedTweet.some(function(entry){
      if (entry.id == d['Boomed tweet ID']) {
        entry.value++
        return true
      } else return false
    })

    // Boomed tweets by boomed
    let entry = (ns.data.boomedTweetsByUser[d['Boomed user ID']] || {})
    entry[d['Boomed tweet ID']] = (entry[d['Boomed tweet ID']] || 0) + 1
    ns.data.boomedTweetsByUser[d['Boomed user ID']] = entry

    // Boomed score by boomed
    ns.data.boomedScoreByUser[d['Boomed user ID']] = (ns.data.boomedScoreByUser[d['Boomed user ID']] || 0) + 1
  }
  ns.registerNewBooming = function(booming) {
    if (ns.data && ns.data.booming) {
      ns.data.booming.push(booming)
      ns.indexBooming(booming)
      ns.addBoomingToNests(booming)
      ns.sortData()
    }
  }

  ns.onLoad = function(callback){
    ns.cb = callback
    if (ns.loaded) callback(ns.data)
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
    }
  }
})
