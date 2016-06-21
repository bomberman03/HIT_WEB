/**
 * Created by blood_000 on 2016-06-08.
 */
var mongoose = require('mongoose');

var EventSchema = new mongoose.Schema({
    device_id: { type: String, default: '00:00:00:00:00:00', unique: true}
});

mongoose.model('Device', EventSchema);