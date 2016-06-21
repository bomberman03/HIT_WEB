/**
 * Created by blood_000 on 2016-05-24.
 */
app.controller('MainCtrl', [
    '$scope',
    '$state',
    'trains',
    'auth',
    function($scope, $state, trains, auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;

        $scope.trains = trains.trains;

        var buckets = 9,
            colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"];

        $(document).ready(function () {
            $.material.init();
            var el = document.getElementsByClassName("modal-backdrop");
            if(el.length > 0) document.body.removeChild(el[0]);
            $("#trace_li").attr("class", "active");
            $("#train_li").attr("class", "");
            console.log($scope.trains);
        });

        $scope.getTimeFormat = function(start_time)
        {
            var d = new Date(start_time);
            return d.getFullYear() + "년 " + d.getMonth() + "월 " + d.getDate() + "일"
        };

        $scope.addChart = function(id, data){
            $("#but" + id).remove();
            var meta_data = [];
            for(var i=0; i<60; i++){
                for(var j=0; j<3; j++){
                    var val = 0;
                    if(data[j][i] != undefined) val = data[j][i];
                    meta_data.push({
                        day: j+1,
                        hour: i+1,
                        value: val
                    })
                }
            }
            var width = $("#chart" + id).width(),
                gridSize = Math.floor(width / 60),
                height = gridSize * 9;
            var graph = d3.select("#chart" + id).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + 10 + "," + 0 + ")");
            var colorScale = d3.scale.quantile()
                .domain([0, buckets - 1])
                .range(colors);
            var cards = graph.selectAll(".hour")
                .data(meta_data, function(d) {return d.day+':'+d.hour;});
            cards.append("title");
            cards.enter().append("rect")
                .attr("x", function(d) { return (d.hour - 1) * gridSize; })
                .attr("y", function(d) { return (d.day - 1) * gridSize * 3; })
                .attr("class", "hour bordered")
                .attr("width", gridSize - 3)
                .attr("height", gridSize * 3 - 3)
                .style("fill", colors[0]);
            cards.transition().duration(300)
                .style("fill", function(d) { return colorScale(d.value); });
            cards.select("title").text(function(d) { return d.value; });
            cards.exit().remove();
        };

        $scope.getHitIndex = function(status, labels){
            var ret = 0;
            for(; ret<labels.length; ret++){
                if(status & ( 1 << ret )) break;
            }
            return ret;
        };

        $scope.getEvents = function(train){
            trains.getEvents(train.device.device_id, train.start_time, train.end_time, function(data){
                var meta_data = [[],[],[]];
                for(var i=0; i<data.length; i++){
                    var event = data[i];
                    var pos = $scope.getHitIndex(event.status, event.labels);
                    var idx = Math.floor((event.time_stamp - train.start_time) / 1000);
                    console.log(pos);
                    console.log(idx);
                    if(pos > 2) continue;
                    if(meta_data[pos][idx] == undefined) meta_data[pos][idx] = 1;
                    else meta_data[pos][idx]++;
                }
                $scope.addChart(train._id, meta_data);
            });
        };

        $scope.getPercent = function(result, val){
            var sum = 0;
            for(var i=0; i<result.length; i++){
                sum += result[i];
            }
            return Math.floor((val / sum) * 100);
        };
    }
]);