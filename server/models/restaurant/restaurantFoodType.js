import mongoose, { Schema } from 'mongoose'
import Constant from '../../constant'

let foodTypeSchema = new Schema({

    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    name_ar: {
        type: String,
        // required: true
    },
    date: {
        type: Number,
        select: false
    },
    status: {
        type: Number,
        default: 1 // 0 for disable, 2 for delete
    }
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

foodTypeSchema.path('name').validate(function (value, done) {

    let qry = { name: new RegExp('^' + value + '$', "i"), status: { $ne: 2 }, restaurantId: this.restaurantId }

    return mongoose.model('FoodType').countDocuments(qry).exec().then(function (count) {
        return !count;
    }).catch(function (err) {
        throw err;
    });
}, Constant.FOODCATEXISTS)

let FoodType = mongoose.model('FoodType', foodTypeSchema)

export default FoodType