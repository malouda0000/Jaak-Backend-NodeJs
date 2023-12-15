const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const subAdminModel = new Schema({
    zoneId: { type: Schema.Types.ObjectId, ref: 'Zone' },
    geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence' },
    subAdminImage:{type:String,default:null},
    firstName : { type : String},
    lastName : { type : String},
    phone : {type : String},
    email : {type : String},
    address : {type : String},
    password : {type : String},
    role : {type : String, default : "gfSubAdmin"},
    authToken: {
        type: String,
        select: false,
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
const subAdmin = mongoose.model('zoneSubAdmin', subAdminModel);
module.exports = subAdmin;
