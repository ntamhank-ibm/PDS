var myApp = angular.module("pds", ['ngRoute']); 

myApp.config(
	[ '$routeProvider', '$locationProvider', function($routeProvider,$locationProvider) {
        $locationProvider.hashPrefix('/pds/');
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false,
            rewriteLinks: true
        });
		$routeProvider.when('/', {
			templateUrl : '/static/js/views/home.html',
			controller : 'HomeController'		 
		}).when('/faq', {
            templateUrl : '/static/js/views/faq.html',
            controller : 'FAQController'
        }).when('/stats', {
            templateUrl : '/static/js/views/stats.html',
            controller : 'StatsController'
        }).otherwise({
			redirectTo : '/'
		});
	} ]
);