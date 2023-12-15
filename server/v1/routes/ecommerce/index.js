import express from 'express'
import ecommerce from './storeEcommerceRoutes'

const route = express.Router()

route.use('', ecommerce)


export default route