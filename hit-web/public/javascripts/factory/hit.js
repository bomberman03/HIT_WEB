/**
 * Created by blood_000 on 2016-05-24.
 */
app.factory('hits', ['$http', function($http){
    var o = {
        dual: []
    };
    o.getAll = function(){
        return [];
    };
    return o;
}]);