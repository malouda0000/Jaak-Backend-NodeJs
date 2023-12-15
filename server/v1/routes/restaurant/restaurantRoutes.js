import express from 'express'

import Auth from '../../../auth'
import restaurantController from '../../controllers/restaurant/restaurantController'
let restaurantRepo = new restaurantController()

let restaurantRoutes = express.Router()

restaurantRoutes.route('/')
    .post(Auth.isUserAuth, (req, res) => {

        restaurantRepo.homeData(req.body, req.user._id, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/allcategories')
    .get(Auth.isUserAuth, (req, res) => {

        restaurantRepo.allCategories(req.query, req.user._id, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/category')
    .get(Auth.isUserAuth, (req, res) => {

        restaurantRepo.allRestaurantsByCategory(req.query, req.user._id, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/allsaved')
    .get(Auth.isUserAuth, (req, res) => {

        restaurantRepo.allSaved(req.query, req.user._id, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/allbestoffer')
    .get(Auth.isUserAuth, (req, res) => {

        restaurantRepo.allBestOffer(req.query, req.user._id, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/allrecommened')
    .get(Auth.isUserAuth, (req, res) => {

        restaurantRepo.allRecommened(req.query, req.user._id, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/detail/:id')
    .get(Auth.isUserAuth, (req, res) => {

        restaurantRepo.restaurantDetail(req.params.id, req.query, req.user._id, req.headers.language).then(result => {
            return res.success('', result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/favourite')
    .post(Auth.isUserAuth, (req, res) => {

        restaurantRepo.markFavourite(req.body, req.user._id, req.headers.language).then(result => {
            return res.success(result.message)
        }).catch(err => {
            return res.reject(err.message)
        })
    })

restaurantRoutes.route('/rating')
    .post(Auth.isUserAuth, (req, res) => {

        restaurantRepo.rateRestaurant(req.body, req.user._id, req.headers.language).then(result => {
            return res.success(result.message)
        }).catch(err => {
            return res.reject(err.message)
        })
    })


restaurantRoutes.route('/order')
    .post(Auth.isUserAuth, (req, res) => {

        restaurantRepo.createOrder(req.body, req.user._id, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })
    .get(Auth.isUserAuth, (req, res) => {

        restaurantRepo.getAllOrders(req.query, req.user._id, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })


restaurantRoutes.route('/search')
    .post(Auth.isUserAuth, (req, res) => {

        restaurantRepo.getSearchRestaurants(req.body, req.user._id, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message)
        })
    })


restaurantRoutes.route('/addresscheck')
    .post(Auth.isUserAuth, (req, res) => {

        restaurantRepo.checkOrderAddress(req.body, req.user._id, req.headers.language).then(result => {
            return res.success(result.message, result.data)
        }).catch(err => {
            return res.reject(err.message, err.data)
        })
    })

export default restaurantRoutes