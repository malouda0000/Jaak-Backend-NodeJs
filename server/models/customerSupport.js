import mongoose, { Schema } from 'mongoose'
let customerSupportSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    Reason: {
        type: String,
        default: "",
    },
    Desciption: {
        type: String,
        default: "",
    },
    status: {
        type: Boolean,
        default: false
    },
    screenShot: {
        type: String
    }
},
    { timestamps: true }
);
let CustomerSupport = mongoose.model('CustomerSupport', customerSupportSchema)

export default CustomerSupport