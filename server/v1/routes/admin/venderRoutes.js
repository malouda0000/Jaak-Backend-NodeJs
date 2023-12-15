import express from 'express'
import uploads from '../../../services/FileUploadService'

import Auth from '../../../auth'

import venderAdminController from '../../controllers/admin/venderAdminController'
let venderAdminRepo = new venderAdminController()

let venderAdminRoutes = express.Router()



export default venderAdminRoutes