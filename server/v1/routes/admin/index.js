import express from 'express'
import foodDelivery from './foodDeliveryAdminRoutes'
import storeAdmin from './storeAdminRoutes'
import admin from './adminRoutes'
import driver from './adminDriverRoutes'
//import taxiAdmin from './taxiAdminRoutes'
import giftAdmin from './giftRoutes'

const route = express.Router()

route.use('', admin)
route.use('/driver', driver)
route.use('/food', foodDelivery)
route.use('/store', storeAdmin)
//route.use('/taxi', taxiAdmin)
route.use('/gift',giftAdmin)

export default route