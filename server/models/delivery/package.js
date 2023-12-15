// const mongoose = require('mongoose');
import mongoose, { Schema } from "mongoose";


// const packageSchema = new Schema({
//     userId: { type: schema.Types.ObjectId, ref: "User"},
//     packageItem : {type : 'string'},
//     quantity: { type: Number, default: 1 },
//     weight : {type : Number, default:0},                // In Grams
//     length: {type: Number, default: 0},                 // In Centimeters
//     width: { type: Number, default: 0},                 // In Centimeters
//     height : { type: Number, default: 0},               // In Centimeters
//     description: { type: String, default: ""},
//     packageType: { type: Schema.Types.ObjectId, ref: "PackageType" },
//     additionalDetails: { type: String, default: ""},
//     status : {type : Number, default: 0},                 
//     isDeleted : {type: Boolean, default: false}
// }, { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } });

// let packages = mongoose.model("packages", packageSchema);
module.exports = packages;