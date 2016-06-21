/**
 * Created by blood_000 on 2016-06-20.
 */
app.controller('HomeCtrl', [
    '$timeout',
    '$scope',
    '$state',
    'auth',
    function($timeout, $scope, $state, auth) {
        $scope.user = {};

        $(document).ready(function() {
            $.material.init();
        });

        $scope.initForm = function(flag){
            if(flag || $scope.error != undefined){
                $scope.error = undefined;
                $scope.user.username = "";
                $scope.user.password = "";
            }
        };

        $scope.register = function(){
            auth.register($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('main');
            });
        };

        $scope.logIn = function(){
            auth.logIn($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('main');
            });
        };

        $scope.catchEnter = function(modal_id){
            if( event.keyCode == 13) {
                if(modal_id == 0){
                    $timeout(function() {
                        angular.element(document.getElementById('login_but')).triggerHandler('click');
                    }, 0);
                } else {
                    $timeout(function() {
                        angular.element(document.getElementById('register_but')).triggerHandler('click');
                    }, 0);
                }
            }
        };
    }
]);
