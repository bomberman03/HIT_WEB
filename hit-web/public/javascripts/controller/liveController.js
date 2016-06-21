/**
 * Created by blood_000 on 2016-06-12.
 */
var socket_ip = '192.168.0.38';

app.controller('LiveCtrl', [
    '$scope',
    '$state',
    'hits',
    'auth',
    function($scope, $state, hits, auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
        
        $scope.device_id = $state.params.id;
        $scope.socket = io.connect('http://' + socket_ip + ':8080', {query: 'id=' + $scope.device_id});
        $scope.hit_arr = [1,1,1];
        $scope.events = hits.events;
        $scope.data = [];
        $scope.meta_data = [0,0,0];

        var second = 1000;
        var interval = 0;
        var top_margin = 50;
        var svg, body;
        var left_spot, left_line, left_data;
        var center_spot, center_line, center_data;
        var right_spot, right_line, right_data;

        var graph;
        var width, gridSize, height;
        var buckets = 9,
            colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"];

        $scope.updateTime = function(){
            $scope.last_time = $scope.train.end_time - Date.now();
            if($scope.last_time < 0) $scope.last_time = 0;
            var d = new Date($scope.last_time);
            $scope.$apply(function(){
                $scope.last_time_string = d.getMinutes() +  " 분 " + d.getSeconds() + " 초 " + d.getMilliseconds();
                $scope.last_percent = Math.floor(($scope.last_time / ($scope.train.end_time - $scope.train.start_time)) * 100);
            });
            $scope.cur_idx = Math.floor(60 - ($scope.last_time) / 1000);
            if($scope.cur_idx != $scope.prev_idx){
                $scope.prev_idx = $scope.cur_idx;
                for(var i=0; i<3; i++){
                    $scope.data.push({
                        day: i+1,
                        hour:$scope.prev_idx,
                        value: $scope.meta_data[i]
                    });
                    $scope.meta_data[i] = 0;
                }
                $scope.update();
            }
            if($scope.last_time == 0) $scope.stopTrain();
        };
        $scope.getHitIndex = function(status, labels){
            var ret = 0;
            for(; ret<labels.length; ret++){
                if(status & ( 1 << ret )) break;
            }
            return ret;
        };
        $scope.initSpotCircle = function(cx, cy) {
            cy += top_margin;
            return {
                circle: svg.append('circle')
                    .attr('cx', cx)
                    .attr('cy', cy)
                    .attr('r', 5)
            }
        };
        $scope.initDataCircle = function(cx, cy, label) {
            cy += top_margin;
            return {
                outer_circle:  svg.append('circle')
                    .attr('cx', cx)
                    .attr('cy', cy)
                    .attr('r', 0),
                inner_circle:  svg.append('circle')
                    .attr('cx', cx)
                    .attr('cy', cy)
                    .attr('r', 0)
                    .style({
                        fill: "white"
                    }),
                hit_text: svg.append('text')
                    .attr("text-anchor", "middle")
                    .attr('x', cx)
                    .attr('y', cy)
                    .attr('class', 'NanumBrush')
                    .attr('font-size', 0)
                    .text('0 hit'),
                percent_text: svg.append('text')
                    .attr("text-anchor", "middle")
                    .attr('x', cx)
                    .attr('y', cy)
                    .attr('class', 'NanumBrush')
                    .attr('font-size', 0)
                    .text('33%'),
                label: svg.append('text')
                    .attr("text-anchor", "middle")
                    .attr('x', cx)
                    .attr('y', cy)
                    .attr('class', 'NanumBrush')
                    .attr('font-size', 0)
                    .text(label)
            };
        };
        $scope.initLine = function(x1, y1){
            return {
                line: svg.append('line')
                    .attr('x1', x1)
                    .attr('x2', x1)
                    .attr('y1', y1)
                    .attr('y2', y1)
                    .style({
                        stroke: "#000000"
                    })
            }
        };
        $scope.updateDataCircle = function(circle, cx, cy, v){
            cy += top_margin;
            var sum = $scope.hit_arr[0] + $scope.hit_arr[1] + $scope.hit_arr[2];
            var r = 50 + (70 * (v / sum));
            var ratio = r / 50;
            var elastic_time = 250;
            var linear_time = 250;

            circle.outer_circle
                .transition().ease('elastic').duration(elastic_time).attr({
                cx : cx,
                cy : cy,
                r: r * 1.2
            }).style({fill:'red'})
                .transition().duration(linear_time).attr({
                cx : cx,
                cy : cy,
                r: r
            }).style({fill:'black'});

            circle.inner_circle
                .transition().ease('elastic').duration(elastic_time).attr({
                cx: cx,
                cy: cy,
                r: (r * 0.8) * 1.2
            }).transition().duration(linear_time).attr({
                cx: cx,
                cy: cy,
                r: r * 0.8
            });

            circle.hit_text.text(v + ' hit');
            circle.hit_text
                .transition().ease('elastic').duration(elastic_time).attr({
                x: cx,
                y: cy + (5 * ratio),
                'font-size': (r - (20 * ratio)) * 1.2
            }).transition().duration(linear_time).attr({
                x: cx,
                y: cy + (5 * ratio),
                'font-size': (r - (20 * ratio))
            });

            circle.percent_text.text(Math.floor((v * 100)/sum) + ' %');
            circle.percent_text
                .transition().ease('elastic').duration(elastic_time).attr({
                x: cx,
                y: cy + (25 * ratio),
                'font-size': (r - ( 30 * ratio)) * 1.2
            }).transition().duration(linear_time).attr({
                x: cx,
                y: cy + (25 * ratio),
                'font-size': r - ( 30 * ratio)
            });

            circle.label.transition().duration(elastic_time + linear_time).attr({
                x: cx,
                y: cy - r - (10 * ratio),
                'font-size': 25
            });
        };
        $scope.updateLine = function(line, x1, x2, y1, y2){
            line.line.transition().duration(1000).attr({
                x1: x1,
                x2: x2,
                y1: y1,
                y2: y2
            })
        };
        $scope.updateCircle = function(select){
            if(select==undefined || select==0) {
                $scope.updateDataCircle(left_data, (($scope.svg_width - $scope.body_width) / 2) - 100, ($scope.svg_height / 2) + 15, $scope.hit_arr[0]);
                $scope.updateLine(left_line, left_spot.circle.attr('cx'),
                    left_data.outer_circle.attr('cx'),
                    left_spot.circle.attr('cy'),
                    left_data.outer_circle.attr('cy'));
            }
            if(select==undefined || select==1) {
                $scope.updateDataCircle(center_data, (($scope.svg_width - $scope.body_width) / 2) + 300, 90, $scope.hit_arr[1]);
                $scope.updateLine(center_line, center_spot.circle.attr('cx'),
                    center_data.outer_circle.attr('cx'),
                    center_spot.circle.attr('cy'),
                    center_data.outer_circle.attr('cy'));
            }
            if(select==undefined || select==2) {
                $scope.updateDataCircle(right_data, (($scope.svg_width - $scope.body_width) / 2) + 370, ($scope.svg_height / 2) + 100, $scope.hit_arr[2]);
                $scope.updateLine(right_line, right_spot.circle.attr('cx'),
                    right_data.outer_circle.attr('cx'),
                    right_spot.circle.attr('cy'),
                    right_data.outer_circle.attr('cy'));
            }
        };
        $scope.update = function(){
            var colorScale = d3.scale.quantile()
                .domain([0, buckets - 1])
                .range(colors);
            var cards = graph.selectAll(".hour")
                .data($scope.data, function(d) {return d.day+':'+d.hour;});
            cards.append("title");
            cards.enter().append("rect")
                .attr("x", function(d) { return (d.hour - 1) * gridSize; })
                .attr("y", function(d) { return (d.day - 1) * gridSize; })
                .attr("class", "hour bordered")
                .attr("width", gridSize - 3)
                .attr("height", gridSize - 3)
                .style("fill", colors[0]);
            cards.transition().duration(300)
                .style("fill", function(d) { return colorScale(d.value); });
            cards.select("title").text(function(d) { return d.value; });
            cards.exit().remove();
        };
        $scope.init = function(){
            $scope.prev_idx = 0;
            $scope.cur_idx = 0;
            var now = Date.now();
            $scope.train = {
                id: '',
                device: '',
                start_time: now,
                end_time: now + 60 * second,
                isTrain: false
            };
            $scope.last_time = $scope.train.end_time - Date.now();
            var d = new Date($scope.last_time);
            $scope.last_time_string = d.getMinutes() +  " 분 " + d.getSeconds() + " 초 " + d.getMilliseconds();
            $scope.last_percent = Math.floor(($scope.last_time / ($scope.train.end_time - $scope.train.start_time)) * 100);
            $scope.hit_arr = [1,1,1];
            $scope.events = [];
            $scope.data = [];
            $scope.meta_data = [0,0,0];
            for(var i=0; i<hits.events.length; i++){
                $scope.hit_arr[$scope.getHitIndex(hits.events[i].status, hits.events[i].labels)]++;
            }
            $("#trace_li").attr("class", "");
            $("#train_li").attr("class", "active");
            $scope.body_width = 284;
            $scope.body_height = 500;

            $scope.svg_width = $('.chart').width();
            $scope.svg_height = $scope.body_height + top_margin;

            if(svg == null) {
                svg = d3.select(".chart")
                    .append("svg")
                    .attr('width', $scope.svg_width)
                    .attr('height', $scope.svg_height);

                body = svg.append('svg:image')
                    .attr('xlink:href', 'images/body.png')
                    .attr('x', ($scope.svg_width - $scope.body_width) / 2)
                    .attr('y', top_margin)
                    .attr('width', $scope.body_width)
                    .attr('height', $scope.body_height);

                left_spot = $scope.initSpotCircle(($scope.svg_width / 2) - 40, ($scope.svg_height / 2), 5);
                left_line = $scope.initLine(left_spot.circle.attr('cx'),
                    left_spot.circle.attr('cy'));
                left_data = $scope.initDataCircle((($scope.svg_width - $scope.body_width) / 2) - 100, ($scope.svg_height / 2) + 15, '왼쪽 가슴');

                center_spot = $scope.initSpotCircle(($scope.svg_width / 2), ($scope.svg_height / 2) - 20, 5);
                center_line = $scope.initLine(center_spot.circle.attr('cx'),
                    center_spot.circle.attr('cy'));
                center_data = $scope.initDataCircle((($scope.svg_width - $scope.body_width) / 2) + 300, 90, '중앙 가슴');

                right_spot = $scope.initSpotCircle(($scope.svg_width / 2) + 40, ($scope.svg_height / 2) + 10, 5);
                right_line = $scope.initLine(right_spot.circle.attr('cx'),
                    right_spot.circle.attr('cy'));
                right_data = $scope.initDataCircle((($scope.svg_width - $scope.body_width) / 2) + 370, ($scope.svg_height / 2) + 100, '오른쪽 가슴');
            }
            $scope.updateCircle();
            width = $scope.svg_width,
            gridSize = Math.floor(width / 60),
            height = gridSize * 3;
            if(graph == null) {
                graph = d3.select(".graph").append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + 0 + "," + 0 + ")");
            }
            $scope.update();
        };
        $scope.prependEvent = function(event){
            console.log(event);
            console.log($scope.train.isTrain);
            if($scope.train.isTrain) {
                $scope.$apply(function () {
                    $scope.events.unshift(event);
                });
                var idx = $scope.getHitIndex(event.status, event.labels);
                $scope.hit_arr[idx]++;
                $scope.meta_data[idx]++;
                $scope.updateCircle(idx);
            }
        };
        $(document).ready(function() {
            $.material.init();
            console.log($scope.device_id);
            $scope.socket.on($scope.device_id, function (data) {
                console.log(data);
                $scope.prependEvent(data);
            });
            $scope.init();
            $scope.updateTime();
        });
        $(window).resize(function(){
            $scope.svg_width = $('.chart').width();
            svg.attr('width', $scope.svg_width);
            body.attr('x', ($scope.svg_width - $scope.body_width) / 2);
            left_spot.circle.attr({
                cx: ($scope.svg_width / 2) - 40,
                cy: ($scope.svg_height / 2)
            });
            center_spot.circle.attr({
                cx: ($scope.svg_width / 2),
                cy: ($scope.svg_height / 2) - 20
            });
            right_spot.circle.attr({
                cx: ($scope.svg_width / 2) + 40,
                cy: ($scope.svg_height / 2) + 10
            });
            $scope.updateCircle();
        });
        $scope.$on("$destroy", function(){
            $scope.socket.disconnect();
            $scope.socket.off($scope.device_id);
        });
        $scope.getDate = function(time_stamp){
            return (new Date(time_stamp)).toLocaleTimeString();
        };
        $scope.getHitLabel = function(status, labels){
            var ret = labels[0];
            for(var i=0; i<labels.length; i++){
                if(status & ( 1 << i )) {
                    ret = labels[i];
                    break;
                }
            }
            return ret;
        };
        $scope.startTrain = function(){
            hits.postTrain($scope.device_id, function(data){
                $scope.train = data;
                interval = setInterval($scope.updateTime, 100)
            });
        };
        $scope.stopTrain = function(){
            hits.stopTrain($scope.train._id, $scope.hit_arr, function(data){
                $scope.train = data;
                clearInterval(interval);
                jQuery("#resultModal").modal("show");
            });
        };
        $scope.finish = function(){
            $state.go('main');
        };
    }
]);