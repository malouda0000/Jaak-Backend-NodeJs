import express from 'express'
import restaurant from './restaurantRoutes'

const route = express.Router()

route.use('', restaurant)


export default route