import express from 'express'
import payment from './paymentRoute'
import razorpay from './razorpay'
import dibsyRoutes from './dibsy'
import razorRoutes from './razor.routes'
import stripe from './stripeRoutes'
import ccavenue from './ccavenue'
import flexPay from './flexPay'

const route = express.Router()

route.use('', payment)
route.use('/razorpay', razorpay)
route.use('/dibsy',dibsyRoutes)
route.use('/razor',razorRoutes)
route.use('/stripe',stripe)
route.use('/ccavenue',ccavenue)
route.use('/flexPay',flexPay)


export default route