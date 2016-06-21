/**
 * Created by blood_000 on 2016-06-08.
**/
var mongoose = require('mongoose');

var EventSchema = new mongoose.Schema({
    time_stamp: { type: Number, default: 0},
    device: {
        _id: String,
        device_id: {type: String, default: '00:00:00:00:00:00'}
    },
    labels: [{ type: String, default: '' }],
    status: { type: Number, default: 0 }
});

mongoose.model('Event', EventSchema);