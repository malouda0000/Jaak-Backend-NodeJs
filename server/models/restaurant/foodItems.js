import mongoose, { Schema } from 'mongoose'
import Constant from '../../constant'

let foodItemSchema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    foodCategoryId: {
        type: Schema.Types.ObjectId,
        ref: "FoodCategory",
        required: true
    },
    foodTypeId: {
        type: Schema.Types.ObjectId,
        ref: "FoodType",
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
    image: {
        type: String
    },
    description: {
        type: String,
        required: true
    },
    description_ar: {
        type: String,
        // required: true
    },
    type: {
        type: Number,
        default: 0 // 0 for veg, 1 for non-veg
    },
    price: {
        type: Number,
        required: true
    },
    discount: {
        type: Number
    },
    preprationTime: {
        type: Number,
        required: true
    },
    notAvailable: [{
        type: Schema.Types.ObjectId,
        ref: "RestaurantOutlet"
    }],
    notInOutlet: [{
        type: Schema.Types.ObjectId,
        ref: "RestaurantOutlet"
    }],
    addOn: [{ type: Schema.Types.ObjectId, ref: 'AddOns', default: "" }],
    date: {
        type: Number,
        select: false
    },
    status: {
        type: Number,
        default: 1 // 1 for available, 0 for not available, 2 for delete 
    }
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

foodItemSchema.path('name').validate(function (value, done) {

    let qry = { name: new RegExp('^' + value + '$', "i"), status: { $ne: 2 }, restaurantId: this.restaurantId }

    return mongoose.model('FoodItem').countDocuments(qry).exec().then(function (count) {
        return !count;
    }).catch(function (err) {
        throw err;
    });
}, Constant.FOODITEMEXISTS)


let FoodItem = mongoose.model('FoodItem', foodItemSchema)

export default FoodItem