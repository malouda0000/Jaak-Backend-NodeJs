import mongoose, { Schema } from 'mongoose'

let documentSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    driverId: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
        required: true
    },
    documentId : {
        type : Schema.Types.ObjectId,
        ref : "Document"
    },
    // image: {
    //     type: String,
    //     required: true
    // },
    frontImage:{
        type : String,
        default : ""
    },
    backImage:{
        type : String,
        default : ""
    },
    date: {
        type: Number,
        select: false
    },
    status: {
        type: Number,
        default: 0 // 0 for pending, 1 for accepted, 2 for rejected
    },
    expiryDate:{
        type : Date
    }
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });


let DriverDocument = mongoose.model('DriverDocument', documentSchema)

export default DriverDocument