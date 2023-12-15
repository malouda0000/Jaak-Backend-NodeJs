import mongoose, {
    Schema
} from 'mongoose'

let addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        select: false,
        required: true
    },
    address: {
        type: String
    },
    location: {
        type: String,
        required: true
    },
    cordinates: {
        type: [Number]
    },
    zipcode: {
        type: String
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    countryCode: {
        type: String
    },
    phone: {
        type: String
    },
    landMark: {
        type: String,
        default: ''
    },
    date: {
        type: Number,
        select: false
    },
    isPreffered: {
        type: Number,
        default: 1
    },
    isDeleted: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        default: 1,
        select: false
    },
    addressType: {
        type: String,
        enum: ['WORK', 'HOME', 'OTHER']
    },
    bulidingNo: {
        type: String
    },
    completeAddress: {
        type: String,
    }
}, {
    timestamps: true,
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});

addressSchema.index({
    'cordinates': "2dsphere"
})

let Address = mongoose.model('Address', addressSchema)

export default Address