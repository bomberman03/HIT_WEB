/**
 * Created by blood_000 on 2016-06-21.
 */
app.controller('DeviceCtrl', [
    '$scope',
    '$state',
    'devices',
    'auth',
    function($scope, $state, devices, auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;

        $scope.devices = devices.devices;

        $(document).ready(function () {
            $.material.init();
            $("#trace_li").attr("class", "");
            $("#train_li").attr("class", "active");
        });
    }
]);