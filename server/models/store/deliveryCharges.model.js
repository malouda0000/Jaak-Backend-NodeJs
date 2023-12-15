//////DEPENDIES//////
import mongoose, { Schema } from "mongoose";
const AutoIncrement = require("mongoose-sequence")(mongoose);

//////SUB-SCHEMAS/////
const merchantChargesSchema = new Schema({
    minimumCharges : {
        type: Number
    }
});
const driverChargesSchema = new Schema({

    isPaid:{
        type:Boolean,
        default:false
    },
    minimumCharges : {
        type: Number
    }

});


//////MAIN-SCHEMA/////
const deliveryChargesSchema = new Schema({

    merchantCharges : {
        type: merchantChargesSchema
    },
    driverCharges : {
        type: driverChargesSchema
    },
    distanceInKm : {
        type:Number
    },
    orderPriceWithoutDelivery : {
        type: Number
    },
    orderPriceWithDelivery : {
        type: Number
    },
    ofOrder : {
        type : Schema.Types.ObjectId,
        ref:'Orders'
    }

},
{
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
})

  
let deliveryCharges = mongoose.model("DeliveryCharges", deliveryChargesSchema);
  
export default deliveryCharges;