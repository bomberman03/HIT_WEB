/**
 * Created by blood_000 on 2016-06-21.
 */
app.factory('devices', ['$http', function($http){
    var o = {
        devices: []
    };
    o.getAll = function(stateParams){
        return $http.get('/devices').success(function(data){
            angular.copy(data, o.devices);
        });
    };
    return o;
}]);