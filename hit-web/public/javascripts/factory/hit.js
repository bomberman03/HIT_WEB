/**
 * Created by blood_000 on 2016-05-24.
 */
app.factory('hits', ['$http', function($http){
    var o = {
        events: []
    };
    o.getAll = function(stateParams){
        return $http.get('/devices/' + stateParams + '/events').success(function(data){
            angular.copy(data, o.events);
        });
    };
    o.postTrain = function(device, callback){
        return $http.post('/devices/' + device + '/trains').success(function(data){
            callback(data);
        });
    };
    o.stopTrain = function(train, result, callback){
        console.log(result);
        return $http.put('/trains/' + train, JSON.stringify(result)).then(function(data){
            callback(data);
        });
    };
    return o;
}]);