/**
 * Created by blood_000 on 2016-06-08.
 */
var mongoose = require('mongoose');

var TrainSchema = new mongoose.Schema({
    device: {
        _id: String,
        device_id: {type: String, default: '00:00:00:00:00:00'}
    },
    start_time: { type: Number, default: 0},
    end_time: { type: Number, default: 0},
    isTrain: { type: Boolean, default: true },
    result: [{type:Number, default: 0}]
});

TrainSchema.methods.stopTrain = function(result, cb) {
    this.end_time = Date.now();
    this.isTrain = false;
    this.result = result;
    this.save(cb);
};

mongoose.model('Train', TrainSchema);