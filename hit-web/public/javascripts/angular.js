/**
 * Created by blood_000 on 2016-05-24.
 */
var app = angular.module('mcnCoffee', ['ui.router']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'HomeCtrl',
                onEnter: ['$state', 'auth', function($state, auth) {
                    if( auth.isLoggedIn()) {
                        $state.go('main');
                    }
                }]
            })
            .state('main', {
                url: '/main',
                templateUrl: '/main.html',
                controller: 'MainCtrl',
                onEnter: ['$state', 'auth', function($state, auth) {
                    if( !auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }],
                resolve: {
                    post: ['trains', function(trains) {
                        return trains.getAll();
                    }]
                }
            })
            .state('device', {
                url: '/device',
                templateUrl: '/device.html',
                controller: 'DeviceCtrl',
                onEnter: ['$state', 'auth', function($state, auth) {
                    if( !auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }],
                resolve: {
                    post: ['devices', function(devices) {
                        return devices.getAll();
                    }]
                }
            })
            .state('live', {
                url: '/live/{id}',
                templateUrl: '/live.html',
                controller: 'LiveCtrl',
                onEnter: ['$state', 'auth', function($state, auth) {
                    if( !auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }]
            });
        $urlRouterProvider.otherwise('home');
    }]);