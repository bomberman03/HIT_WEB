/**
 * Created by blood_000 on 2016-05-24.
 */

app.factory('auth', ['$http', '$window', function($http, $window){

    var auth = {};

    auth.saveToken = function(token){
        $window.localStorage['hit-token'] = token;
    };

    auth.getToken = function() {
        return $window.localStorage['hit-token'];
    };

    auth.isLoggedIn = function() {
        var token = auth.getToken();
        if(token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.exp = Date.now() / 1000;
        } else {
            return false;
        }
    };

    auth.currentUser = function() {
        if(auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload;
        }
    };

    auth.register = function(user) {
        return $http.post('/register', user).success(function(data) {
            auth.saveToken(data.token);
        });
    };

    auth.logIn = function(user) {
        return $http.post('/login', user).success(function(data) {
            auth.saveToken(data.token);
        });
    };

    auth.logOut = function() {
        $window.localStorage.removeItem('hit-token');
        $window.location.href="/";
    };

    return auth;
}]);

