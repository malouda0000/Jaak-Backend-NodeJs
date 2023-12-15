const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({     //ccc
    countryName:{type:String,default:null},
    geoCode:{
        north:{type:Number,default:0},
        east:{type:Number,default:0},
        west:{type:Number,default:0},
        south:{type:Number,default:0}
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

ZoneSchema.statics.findAllActive = function() {
    return this.find({ isDeleted: false, isBlocked: false });
  };


const Zone = mongoose.model('Zone', ZoneSchema);
module.exports = Zone;
