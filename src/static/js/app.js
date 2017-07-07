var myApp = angular.module("pds", ['ngRoute']); 

myApp.config(
	[ '$routeProvider', function($routeProvider) {
		$routeProvider.when('/', {
			templateUrl : '/static/js/views/home.html',
			controller : 'HomeController'		 
		}).when('/faq', {
            templateUrl : '/static/js/views/faq.html',
            controller : 'FAQController'
        }).otherwise({
			redirectTo : '/'
		});
	} ]
);