import express from 'express'

import Auth from '../../../auth'
import restaurantController from '../../controllers/restaurant/restaurantController'
let restaurantRepo = new restaurantController()

let restaurantRoutes = express.Router()

restaurantRoutes.route('/')
    .post((req, res) => {

        restaurantRepo.homeData(req.body, req.body.userId, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })


restaurantRoutes.route('/allcategories')
    .get((req, res) => {

        restaurantRepo.allCategories(req.query, req.query.userId, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/category')
    .post((req, res) => {

        restaurantRepo.allRestaurantsByCategory(req.body, req.body.userId, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/allsaved')
    .post((req, res) => {

        restaurantRepo.allSaved(req.body, req.body.userId, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/allbestoffer')
    .post((req, res) => {

        restaurantRepo.allBestOffer(req.body, req.body.userId, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/allrecommened')
    .post((req, res) => {

        restaurantRepo.allRecommened(req.body, req.body.userId, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/detail/:id')
    .get((req, res) => {

        restaurantRepo.restaurantDetail(req.params.id, req.query, req.query.userId, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/favourite')
    .post((req, res) => {

        restaurantRepo.markFavourite(req.body, req.body.userId, req.headers.language).then(result => {
            return res.success(result.message)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/rating')
    .post((req, res) => {

        restaurantRepo.rateRestaurant(req.body, req.body.userId, req.headers.language).then(result => {
            return res.success(result.message)
        }).catch(err => {
            return res.reject(err.message)
        })
    })


restaurantRoutes.route('/order')
    .post((req, res) => {

        restaurantRepo.createOrder(req.body, req.body.userId, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })
    .get((req, res) => {

        restaurantRepo.getAllOrders(req.query, req.query.userId, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })


restaurantRoutes.route('/search')
    .post((req, res) => {

        restaurantRepo.getSearchRestaurants(req.body, req.body.userId, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })


restaurantRoutes.route('/addresscheck')
    .post((req, res) => {

        restaurantRepo.checkOrderAddress(req.body, req.body.userId, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

export default restaurantRoutes