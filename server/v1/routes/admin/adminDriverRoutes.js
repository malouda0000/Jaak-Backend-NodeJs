import express from 'express'
import uploads from '../../../services/FileUploadService'

import Auth from '../../../auth'

import adminDriverController from '../../controllers/admin/adminDriverController'
let adminDriverRepo = new adminDriverController()

let adminDriverRoutes = express.Router()

adminDriverRoutes.route('/deleteVehicleType').delete((req, res) => {
    adminDriverRepo.deleteVehicleType(req.query, req.headers.language)
        .then((result) => {
            return res.success(result.message, result.data);
        }).catch((err) => {
            return res.reject(err.message, err.data);
        });
});

adminDriverRoutes.route('/verifydocument')
    .put((req, res) => {
        adminDriverRepo.verifyDocument(req.body, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

adminDriverRoutes.route('/all')
    .get((req, res) => {
        adminDriverRepo.getAllDrivers(req.query, req.headers).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

adminDriverRoutes.route('/getDriversRatings')
    .get((req, res) => {
        adminDriverRepo.getDriversRatings(req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

adminDriverRoutes.route('/getAllDriversTotalCommission')
    .get((req, res) => {
        adminDriverRepo.getAllDriversTotalCommission(req.query, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

adminDriverRoutes.route('/getDriverAllOrders')
    .get((req, res) => {
        adminDriverRepo.getDriverAllOrders(req.query, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

adminDriverRoutes.route('/getDriverOrderCount')
    .get((req, res) => {
        adminDriverRepo.getDriverOrderCount(req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

adminDriverRoutes.route('/all/shuttle/:id').get((req, res) => {
    adminDriverRepo.getAllShuttleDrivers(req.params.id, req.query, req.headers.language).then(result => {
        return res.success(result.message, result.data)
    }).catch(err => {
        return res.reject(err.message)
    })
});

adminDriverRoutes.route('/all/shuttle').get((req, res) => {
    adminDriverRepo.getAllShuttleDriversList(req.query, req.headers.language).then(result => {
        return res.success(result.message, result.data)
    }).catch(err => {
        return res.reject(err.message)
    })
})

adminDriverRoutes.route('/document/:id')
    .get((req, res) => {
        adminDriverRepo.getDriverDocument(req.params.id, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })
    .post(uploads.driverDocument.single('image'), (req, res) => {
        adminDriverRepo.addDriverDocument(req.params.id, req.body.data === undefined ? "" : JSON.parse(req.body.data), req.file, req.headers.language, req.body.frontImage).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })
    .put(uploads.driverDocument.single('image'), (req, res) => {
        adminDriverRepo.updateDriverDocument(req.params.id, req.file, req.headers.language, req.body.frontImage,req.body.data === undefined ? "" : JSON.parse(req.body.data),req).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })
adminDriverRoutes.route('/blockUnblockDriver')
    .put((req, res) => {
        adminDriverRepo.blockUnblockDriver(req.body, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

adminDriverRoutes.route('/detail/:id')
    .get((req, res) => {
        adminDriverRepo.getDriverDetail(req.params.id, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })
    .put(uploads.drivers.single('pic'), (req, res) => {
        adminDriverRepo.updateDriverDetail(req.params.id, JSON.parse(req.body.data), req.file, req.headers.language, req.finalFileName).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })
    .delete((req, res) => {
        adminDriverRepo.deleteDriver(req.params.id, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })
adminDriverRoutes.route('/driverByStatus')
    .get((req, res) => {
        adminDriverRepo.driverByStatus(req.query, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

adminDriverRoutes.get('/getAllDriversCSV', adminDriverRepo.getAllDriversCSV);

adminDriverRoutes.get('/getAllNearDrivers', adminDriverRepo.getAllNearDrivers);
export default adminDriverRoutes
