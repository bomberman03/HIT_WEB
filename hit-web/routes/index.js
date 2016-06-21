var http = require('http');
var express = require('express');
var router = express.Router();

var passport = require('passport');

var mongoose = require('mongoose');
var User = mongoose.model('User');

var Event = mongoose.model('Event');
var Device = mongoose.model('Device');
var Train = mongoose.model('Train');

var socket_ip = '192.168.0.38';
var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://52.192.56.55');

client.on('connect', function () {
    client.subscribe('register');
    client.subscribe('event');
});

client.on('message', function (topic, message) {
    if(topic == 'register'){
        res = JSON.stringify({
            'message': 'register successful',
            'status': 1
        });
        client.publish(message, res);
    }
    if(topic == 'event'){
        console.log(message);
        var json_data = JSON.parse(message);
        var req = http.request({
            host: 'localhost',
            path: '/devices/' + json_data['device_id'] + '/events',
            port: '3000',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(message)
            }
        }, function(response) {
        });
        req.write(message);
        req.end();
    }
});

var app = express();
var socket_http = http.createServer(app);
var io = require('socket.io')(socket_http);
socket_http.listen(8080, socket_ip);
io.on('connection', function (socket) {
    var id = socket.handshake.query.id;
    socket.on(id, function(data){
        io.emit(id, {
            data: data
        });
    });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Punch Line' });
});

router.post('/register', function(req, res, next){
    if(!req.body.username || !req.body.password){ 
        return res.status(400).json({message: '모든 입력을 해주세요'});
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password);

    user.save(function (err){
        if(err){
            if(err.code == 11000) return res.status(400).json({message: '중복된 아이디입니다.'});
            else return res.status(400).json({message: '처리 중 문제가 발생했습니다.'});
        }

        return res.json({token: user.generateJWT()})
    });
});

router.post('/login', function(req, res, next){
    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    passport.authenticate('local', function(err, user, info){
        if(err){ return next(err); }

        if(user){
            return res.json({token: user.generateJWT()});
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

router.get('/devices', function(req, res, next){
    Device.find({}, function(err, devices){
        if(err) return next(err);
        res.json(devices);
    });
});

router.get('/devices/:device', function(req, res){
    res.json(req.device);
});

router.delete('/devices/:device', function(req, res){
    Device.remove({device_id: req.device.device_id}, function(err){
        if(err) return next(err);
        return res.status(200).json({
            message: '삭제가 정상적으로 처리되었습니다.'
        });
    });
});

router.param('device', function(req, res, next, id){
    Device.findOne({device_id: id}, function(err, device){
        if (err) {
            return next(err);
        }
        if (!device) {
            device =  new Device({ device_id: id});
            device.save(function(err, device){
                if(err) return next(err);
                req.device = device;
                return next();
            });
        } else {
            req.device = device;
            return next();
        }
    });
});

router.post('/devices', function(req, res, next){
    var device = new Device(req.body);
    device.save(function(err, device){
        if(err) return next(err);
        res.json(device);
    });
});

router.get('/devices/:device/events', function(req, res, next){
    var lt = req.query.lt;
    var gt = req.query.gt;
    var query = { 'device._id' : req.device.id };
    if(lt != undefined && gt != undefined){
        query = {
            'device._id' : req.device.id,
            'time_stamp' : { $gt: +gt, $lt: +lt }
        };
    }
    console.log(query);
    Event.find(query, function(err, events){
        if(err) return next(err);
        res.json(events);
    });
});

router.post('/devices/:device/events', function(req, res, next){
    var keys = Object.keys(req.body);
    var json_data = JSON.parse(keys[0]);
    json_data['device'] = req.device;
    var event = new Event(json_data);
    event.save(function(err, event){
        if(err){ return next(err); }
        res.json(event);
        io.emit(event.device.device_id, event);
    });
});

router.get('/trains', function(req, res, next){
    Train.find({}, function(err, trains){
        if(err) { return next(err); }
        res.json(trains);
    });
});

router.get('/trains/:train', function(req, res, next){
    res.json(req.train);
});

router.post('/devices/:device/trains', function(req, res, next){
    var d = Date.now();
    var train = new Train({
        device: req.device,
        start_time: d,
        end_time: d + 60 * 1000
    });
    train.save(function(err, train){
        if(err){ return next(err); }
        res.json(train);
    });
});

router.put('/trains/:train', function(req, res){
    console.log(req.body);
    req.train.stopTrain(req.body, function(err, train){
       res.json(train);
    });
});

router.param('train', function(req, res, next, id){
    var query = Train.findById(id);
    query.exec(function (err, train){
        if (err) { return next(err); }
        if (!train) { return next(new Error('can\'t find order')); }
        req.train = train;
        return next();
    });
});

router.delete('/trains', function(req, res, next){
    Train.remove({}, function(err){
        if(err) return next(err);
        return res.status(200).json({
            message: '삭제가 정상적으로 처리되었습니다.'
        });
    });
});

router.delete('/events', function(req, res, next){
    Event.remove({}, function(err){
        if(err) return next(err);
        return res.status(200).json({
            message: '삭제가 정상적으로 처리되었습니다.'
        });
    });
});

module.exports = router;
