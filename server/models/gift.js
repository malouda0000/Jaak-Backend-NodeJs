import mongoose, {
    Schema
} from 'mongoose';
import Constant from '../constant';
let GiftSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    giftCode: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
GiftSchema.path("name").validate(function (value, done) {
    let qry = {};
    if (this.name) {
        qry = {
            name: new RegExp("^" + value + "$", "i"),
            isDeleted: false,
            isBlocked: false
        };
    }
    return mongoose
        .model("Gift")
        .countDocuments(qry)
        .exec()
        .then(function (count) {
            return !count;
        })
        .catch(function (err) {
            throw err;
        });
}, Constant.GIFTEXISTS);

let Gift = mongoose.model('Gift', GiftSchema)

export default Gift