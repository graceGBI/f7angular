/*jslint browser: true*/
/*global console, Demo, angular, Framework7*/

var $$ = Dom7;

// Init angular
var Demo = {};

Demo.config = {
};

$$(document).on('DOMContentLoaded', function() {
    console.log("Starting it !");
    Demo.fw7 = {
        app: new Framework7({
            pushState: true,
            swipePanel: 'left',
            animateNavBackIcon: true,//iOS only
            material: true,
            statusbarOverlay: false,
            modalTitle: "Pharma Intercare",
            //preprocess: function (content, url, next) {
                //console.log("prépro");
            //},
            //preroute: function (view, options) {
                //console.log("preroute");
            //}
        }),
        options: {
            dynamicNavbar: true,//iOS only
            domCache: true
        },
        views: []
    }
    app.events();
});
Demo.angular = angular.module('Demo', ['ngSanitize',
                                        'ngRoute']);

/*angular.config(function($routeProvider) {
    $routeProvider
        .when('/monCompte', {
            templateUrl: 'pages/monCompte.html',
            /*controller: 'controller/MonCompteController.js'*/
       /* })
        .when('/about', {
            templateUrl: 'pages/about.html'
        })
        .otherwise({
            redirectTo: '/about'
        });
});*/

Demo.angular.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/monCompte', {
            templateUrl: 'pages/monCompte.html'
        })
        .when('/about', {
            templateUrl: 'pages/about.html'
        })
        .otherwise({
            redirectTo: '/about'
        });
}]);

/*

angular.module('Demo').filter('newline', function($sce) {
    return function(text) {
        text = text.replace(/\n/g, '<br />');
        return $sce.trustAsHtml(text);
    }
});

Demo.angular.config(['$compileProvider', function ($compileProvider) {
    //console.log("compiled");
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension):/);
}]);

Demo.angular.config(function($compileProvider) {
    var imgSrcSanitizationWhitelist = /^\s*(https?|ftp|file):|data:image\//;
    $compileProvider.imgSrcSanitizationWhitelist(imgSrcSanitizationWhitelist);
    //console.log("compiled");
});

*/