const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ZoneModel = new Schema({
    countryName:{type:String,default:null},
    documentImage:{type:String,default:null},
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
const Zone = mongoose.model('Zone', ZoneModel);
module.exports = Zone;
