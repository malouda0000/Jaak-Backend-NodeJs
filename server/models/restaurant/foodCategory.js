import mongoose, { Schema } from 'mongoose'
import Constant from '../../constant'

let foodCategorySchema = new Schema({

    name: {
        type: String,
        required: true
    },
    name_ar: {
        type: String,
        // required: true
    },
    image: {
        type: String,
        required: true
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

foodCategorySchema.path('name').validate((value, done) => {

    let qry = { name: new RegExp('^' + value + '$', "i"), status: { $ne: 2 } }

    return mongoose.model('FoodCategory').countDocuments(qry).exec().then(function (count) {
        return !count;
    }).catch(function (err) {
        throw err;
    });
}, Constant.FOODCATEXISTS)

let FoodCategory = mongoose.model('FoodCategory', foodCategorySchema)

export default FoodCategory