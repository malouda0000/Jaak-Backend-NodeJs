const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const GeofenceSchema = new mongoose.Schema({
    zoneId: { type: ObjectId, ref: 'Zone' },
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


const Geofence = mongoose.model('Geofence', GeofenceSchema);
module.exports = Geofence;
