import mongoose, { Schema } from 'mongoose'
import Constant from '../constant'

let razorPaySchema = new Schema({

    order:{
        type:Object
    }

})

let Razorpay = mongoose.model('razorpayModel', razorPaySchema)

export default Razorpay
