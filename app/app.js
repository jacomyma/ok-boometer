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

// Declare app level module which depends on views, and components
angular.module('graphrecipes', [
  'ngRoute',
  'ngMaterial',
  'okboometer.view_home',
])
.config(function($routeProvider, $mdThemingProvider) {
  $routeProvider.otherwise({redirectTo: '/'});

  // Material theme
  $mdThemingProvider.theme('default')
    .primaryPalette('teal', {
      'default': '400',   // by default use shade 400 from the pink palette for primary intentions
      'hue-1': '100',     // use shade 100 for the <code>md-hue-1</code> class
      'hue-2': '600',     // use shade 600 for the <code>md-hue-2</code> class
      'hue-3': 'A100'     // use shade A100 for the <code>md-hue-3</code> class
    })
    .accentPalette('blue', {
      'default': '300'
    })
    .warnPalette('pink')
    .backgroundPalette('blue-grey', {
      'default': '100',
      'hue-1': '50'
    })
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
  ns.recipes = {}
  return ns
})

.factory('dataProvider', function(){
  var ns = {}
  ns.loaded = false
  d3.csv("data/okbooming.csv").then(function(data) {
    ns.data = {okbooming: data}

    // Aggregate by boomed
    ns.data.topBoomedList = d3.nest()
      .key(function(d){ return d["Boomed user ID"] })
      .rollup(function(a){ return a.length })
      .entries(ns.data.okbooming)
      .sort(function(a,b){ return b.value-a.value})

    ns.loaded = true
    if (ns.cb) ns.cb(ns.data)
  })
  ns.onLoad = function(callback){
    if (ns.loaded) callback(ns.data)
    else ns.cb = callback
  }
  return ns
})


// Directives

