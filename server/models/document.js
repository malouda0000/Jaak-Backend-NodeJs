import { stubFalse } from 'lodash';
import mongoose, {
    Schema
} from 'mongoose'
import Constant from "../constant";

let documentSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    imageType: {
        type: Number,
        enum: [Constant.IMAGE_TYPE.BOTH, Constant.IMAGE_TYPE.FRONT],
        default: Constant.IMAGE_TYPE.FRONT
    },
    userType: {
        type: Number,
        enum: [Constant.USER_TYPE.DRIVER, Constant.USER_TYPE.MERCHANT],
        default: Constant.USER_TYPE.DRIVER
    },
    isExpiryDate : {
        type : Boolean,
        default : false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true,
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});

let Document = mongoose.model('Document', documentSchema)

export default Document