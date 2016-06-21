/**
 * Created by blood_000 on 2016-06-21.
 */
app.factory('trains', ['$http', function($http){
    var o = {
        trains: []
    };
    o.getAll = function(){
        return $http.get('/trains').success(function(data){
            angular.copy(data, o.trains);
        });
    };
    o.getEvents = function(device_id, start_time, end_time, callback){
        $http.get('/devices/' + device_id + "/events?lt=" + (end_time+1) + "&gt=" + (start_time-1)).success(function(data){
            callback(data);
        });
    };
    return o;
}]);