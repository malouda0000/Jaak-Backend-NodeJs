import express from 'express'
import store from './storeRoutes'
import employee from './employee'

const route = express.Router()

route.use('', store)
route.use('/employee', employee)


export default route