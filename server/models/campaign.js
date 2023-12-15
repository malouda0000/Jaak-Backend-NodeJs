import mongoose, { Schema } from 'mongoose'
let campaignSchema = new Schema({
    name: {
        type: String,
        default: "",
    },
    startDate: {
        type: Date,   
    },
    endDate: {
        type: Date,
    },
    prizeDescription:{
        type : String,
    },
    banner: {
        type : String,
    },
    campaignOn:[
        {
            storeId :{
                type :  Schema.Types.ObjectId,
                ref: "store",
            },
            products : [
                {
                    productId : {
                        type : Schema.Types.ObjectId,
                        ref : "StoreItem"
                    }
                } 
            ]
        }
    ]
},
    { timestamps: true }
);
let campaign = mongoose.model('campaign', campaignSchema)

export default campaign