const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;
const GeofenceModel = new Schema({
    zoneId: { type: Schema.Types.ObjectId, ref: 'Zone' },
    documentImage:{type:String,default:null},
    geofenceNo:{type:Number,default:1000},
    geofenceName:{type:String,default:null},
    geoLongLat: {
		'type': {type: String, enum: 'Polygon', default: 'Polygon'},
		coordinates: {type: Array}
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isDeleted:{
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toObject: {virtuals: true},
    toJSON: {virtuals: true}
});
GeofenceModel.index({'geoLongLat': '2dsphere'});

// GeofenceModel.plugin(autoIncrement.plugin, {
//     model: 'Geofence',
//     field: 'geofenceNo',
//     startAt: 1000,
//     incrementBy: 1
// });
const Geofence = mongoose.model('Geofence', GeofenceModel);
module.exports = Geofence;
