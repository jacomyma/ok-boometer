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

.directive('lcdBooMeter', function($timeout, $interval, cache) {
  return {
    restrict: 'E',
    scope: {
      username: '=',
      score: '=',
    },
    templateUrl: 'directive_templates/lcdBooMeter.html',
    link: function($scope, element, attrs, ctrl) {
      var obj = element.find('object')
      var animIntervals = []

      $scope.$watch(function(){
        return cache.timeMode;
      }, function(){
        $scope.animStatus = 'seeking'
        $scope.timeText = ''
        switch(cache.timeMode) {
          case('day'):
            $scope.timeText = 'in one day'
            break;

          case('week'):
            $scope.timeText = 'in one week'
            break;

          case('month'):
            $scope.timeText = 'in one month'
            break;

          case('year'):
            $scope.timeText = 'in one year'
            break;

          case('all'):
            $scope.timeText = 'ever'
            break;
        }
      })

      $scope.$watch('score', function(){
        if ($scope.score !== undefined) {
          $scope.score2 = Math.min((+$scope.score), 9999)
          if ($scope.score2 < 3) {
            $scope.target = 0
          } else if ($scope.score2 < 10) {
            $scope.target = 3
          } else if ($scope.score2 < 33) {
            $scope.target = 10
          } else if ($scope.score2 < 100) {
            $scope.target = 33
          } else if ($scope.score2 < 333) {
            $scope.target = 100
          } else if ($scope.score2 < 1000) {
            $scope.target = 333
          } else if ($scope.score2 < 3333) {
            $scope.target = 1000
          } else if ($scope.score2 < 9999) {
            $scope.target = 3333
          } else {
            $scope.target = 9999
          }
          $scope.lcdScore = "----"
          $scope.animStatus = 'seeking'
        }
      })

      var sprites = [
        "boometer-0",
        "boometer-0-selected",
        "boometer-0-selected-no-splash",
        "boometer-0-splash",
        "boometer-3",
        "boometer-3-selected",
        "boometer-3-selected-no-splash",
        "boometer-3-splash",
        "boometer-10",
        "boometer-10-selected",
        "boometer-10-selected-no-splash",
        "boometer-10-splash",
        "boometer-10-no-splash",
        "boometer-33",
        "boometer-33-selected",
        "boometer-33-selected-no-splash",
        "boometer-33-splash",
        "boometer-33-no-splash",
        "boometer-100",
        "boometer-100-selected",
        "boometer-100-selected-no-splash",
        "boometer-100-splash",
        "boometer-100-no-splash",
        "boometer-333",
        "boometer-333-selected",
        "boometer-333-selected-no-splash",
        "boometer-333-splash",
        "boometer-333-no-splash",
        "boometer-1000",
        "boometer-1000-selected",
        "boometer-1000-selected-no-splash",
        "boometer-1000-splash",
        "boometer-1000-no-splash",
        "boometer-3333",
        "boometer-3333-selected",
        "boometer-3333-selected-no-splash",
        "boometer-3333-splash",
        "boometer-3333-no-splash",
        "boometer-9999",
        "boometer-9999-selected",
        "boometer-9999-selected-no-splash",
        "boometer-9999-splash",
        "boometer-head-1-2",
        "boometer-head-1",
        "boometer-head-2"
      ]

      var initSprites = $interval(function(){
        // We check unti the SVG is loaded
        if (obj[0].contentDocument) {
          if (angular.isDefined(initSprites)) {
            $interval.cancel(initSprites)
            initSprites = undefined
          }
          // Init
          $timeout(function(){
            $scope.$watch('animStatus', applyStatus)
            $scope.animStatus = 'seeking'
          })
        }
      }, 200)
      $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed
        if (angular.isDefined(initSprites)) {
          $interval.cancel(initSprites)
          initSprites = undefined
        }
      })

      function applyStatus(e, os, ns) {
        if (os != ns) {
          animIntervals.forEach(function(promise){
            $interval.cancel(promise)
          })
          sprites.forEach(hideSprite)
          switch ($scope.animStatus) {
            case 'off':
              // Nothing to do, everything off by default
              break;

            case 'error':
              sprites
                .filter(function(){return Math.random()>0.5})
                .forEach(function(sprite){
                  showSprite(sprite)
                })
              break;

            case 'splash':
              $scope.lcdScore = $scope.score2
              var levels = ["0", "3", "10", "33", "100", "333", "1000", "3333", "9999"]
              levels.forEach(function(l){
                if (+l<$scope.target) {
                  showSprite('boometer-'+l)
                  if (l!="0" && l!="3" && l!="9999") {
                    showSprite('boometer-'+l+'-no-splash')
                  }
                }
              })

              showSprite('boometer-'+$scope.target+'')
              showSprite('boometer-'+$scope.target+'-selected')
              showSprite('boometer-'+$scope.target+'-splash')

              showSprite('boometer-head-1-2')
              if ($scope.target == '9999') {
                showSprite('boometer-head-2')
              } else {
                showSprite('boometer-head-1')
              }

              break;

            case 'seeking':
              // Build anim
              var anim = []
              var levels_bnf = ["0", "3", "10", "33", "100", "333", "1000", "3333", "9999", "3333", "1000", "333", "100", "33", "10", "3"]
              var levels = ["0", "3", "10", "33", "100", "333", "1000", "3333", "9999"]
              levels_bnf.forEach(function(l){
                var step = {}
                levels.forEach(function(l2){
                  if (+l2<=+l) {
                    step["boometer-"+l2] = true
                    if (l2!="0" && l2!="3" && l2!="9999") {
                      step["boometer-"+l2+"-no-splash"] = true
                    }
                  } else {
                    step["boometer-"+l2] = false
                    if (l2!="0" && l2!="3" && l2!="9999") {
                      step["boometer-"+l2+"-no-splash"] = false
                    }
                  }
                  if (l2 != l) {
                    step["boometer-"+l2+"-selected"] = false
                    step["boometer-"+l2+"-selected-no-splash"] = false
                  } else {
                    step["boometer-"+l2+"-selected"] = true
                    step["boometer-"+l2+"-selected-no-splash"] = true
                  }
                })
                step["boometer-head-1-2"] = true
                step["boometer-head-1"] = true
                anim.push(step)
              })
              addAnimInterval(anim, 100, function(){
                $scope.animStatus = 'throw'
              })
              break;

            case 'throw':
              if (!$scope.target) {
                $scope.animStatus = 'seeking'
              } else {
                // Build anim
                var anim = []
                var levels = ["0", "3", "10", "33", "100", "333", "1000", "3333", "9999"]
                levels
                .filter(function(l){ return +l <= $scope.target })
                .forEach(function(l){
                  var step = {}
                  levels.forEach(function(l2){
                    if (+l2<=+l) {
                      step["boometer-"+l2] = true
                      if (l2!="0" && l2!="3" && l2!="9999") {
                        step["boometer-"+l2+"-no-splash"] = true
                      }
                    } else {
                      step["boometer-"+l2] = false
                      if (l2!="0" && l2!="3" && l2!="9999") {
                        step["boometer-"+l2+"-no-splash"] = false
                      }
                    }
                    if (l2 != l) {
                      step["boometer-"+l2+"-selected"] = false
                      step["boometer-"+l2+"-selected-no-splash"] = false
                    } else {
                      step["boometer-"+l2+"-selected"] = true
                      step["boometer-"+l2+"-selected-no-splash"] = true
                    }
                  })
                  step["boometer-head-1-2"] = true
                  step["boometer-head-1"] = true
                  anim.push(step)
                })
                addAnimInterval(anim, 50, function(){
                  $scope.animStatus = 'splash'
                })
              }
              break;
            }
        }
      }

      function showAllSprites() {
        sprites.forEach(function(s){
          showSprite(s)
        })
      }

      function hideSprite(s) {
        // console.log(s)
        if (obj[0].contentDocument && obj[0].contentDocument.getElementById(s))
          obj[0].contentDocument.getElementById(s).style.display = "none"
      }

      function showSprite(s) {
        // console.log(s)
        if (obj[0].contentDocument && obj[0].contentDocument.getElementById(s))
          obj[0].contentDocument.getElementById(s).style.display = "inline"
      }

      function addAnimInterval(sequence, delay, onEnd) {
        var sprite
        for(sprite in sequence[0]) {
          if (sequence[0][sprite]) {
            showSprite(sprite)
          } else {
            hideSprite(sprite)
          }
        }

        var count = 0
        var interval = $interval(function(){
          count = count + 1
          var moment = sequence[count%sequence.length]
          for(sprite in moment) {
            if (moment[sprite]) {
              showSprite(sprite)
            } else {
              hideSprite(sprite)
            }
          }
          if (onEnd && count == sequence.length) {
            onEnd()
            if (angular.isDefined(interval)) {
              $interval.cancel(interval)
              interval = undefined
            }
          } else {

          }
        }, delay || 500)
        animIntervals.push(interval)
        $scope.$on('$destroy', function() {
          // Make sure that the interval is destroyed
          if (angular.isDefined(interval)) {
            $interval.cancel(interval)
            interval = undefined
          }
        })
      }
    }
  }
})
