import mongoose, { Schema } from 'mongoose'

let favouriteSchema = new Schema({
    geofenceId: { type: Schema.Types.ObjectId, ref: "geofence", default: null },
    storeId: {
        type: Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    moduleKey: { type: String },
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

let FavStore = mongoose.model('FavStore', favouriteSchema)

export default FavStore