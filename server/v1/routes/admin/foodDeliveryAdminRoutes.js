import express from 'express'
import uploads from '../../../services/FileUploadService'

import Auth from '../../../auth'

import foodDeliveryController from '../../controllers/admin/foodDeliveryAdminController'
let foodDeliveryRepo = new foodDeliveryController()

let foodDeliveryRoutes = express.Router()



foodDeliveryRoutes
  .route('/category')
  .post(uploads.foodCategory.single('image'), (req, res) => {
    foodDeliveryRepo
      .addCategory(
        JSON.parse(req.body.data),
        req.file || '',
        req.headers.language
      )
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })
  .put(uploads.foodCategory.single('image'), (req, res) => {
    foodDeliveryRepo
      .editCategory(
        JSON.parse(req.body.data),
        req.file || '',
        req.headers.language
      )
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })
  .get((req, res) => {
    foodDeliveryRepo
      .getCategory(req.headers.language)
      .then(result => {
        return res.success(result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })

foodDeliveryRoutes
  .route('/restaurant')
  .post(uploads.restaurant.single('image'), (req, res) => {
    foodDeliveryRepo
      .addRestaurant(
        JSON.parse(req.body.data),
        req.file || '',
        req.headers.language
      )
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })
  .put(uploads.restaurant.single('image'), (req, res) => {
    foodDeliveryRepo
      .editRestaurant(
        JSON.parse(req.body.data),
        req.file || '',
        req.headers.language
      )
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })
  .get((req, res) => {
    foodDeliveryRepo
      .getRestaurants(req.query, req.headers.language)
      .then(result => {
        return res.success('', result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })

foodDeliveryRoutes.route('/restaurant/:id').get((req, res) => {
  foodDeliveryRepo
    .getRestaurantById(req.params.id, req.headers.language)
    .then(result => {
      return res.success(result.message, result.data)
    })
    .catch(err => {
      return res.reject(err.message)
    })
})

foodDeliveryRoutes.route('/changestatus').put((req, res) => {
  foodDeliveryRepo
    .orderChangeStatus(req.body, req.headers.language)
    .then(result => {
      return res.success(result.message, result.data)
    })
    .catch(err => {
      return res.reject(err.message)
    })
})

foodDeliveryRoutes
  .route('/restaurant/outlet')
  .post((req, res) => {
    foodDeliveryRepo
      .addRestaurantOutlet(req.body, req.headers.language)
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })
  .put((req, res) => {
    foodDeliveryRepo
      .editRestaurantOutlet(req.body, req.headers.language)
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })

foodDeliveryRoutes.route('/restaurant/outlet/:id').get((req, res) => {
  foodDeliveryRepo
    .getRestaurantOutlet(req.params.id, req.headers.language)
    .then(result => {
      return res.success('', result.data)
    })
    .catch(err => {
      return res.reject(err.message)
    })
})

foodDeliveryRoutes
  .route('/type')
  .post((req, res) => {
    foodDeliveryRepo
      .addFoodType(req.body, req.headers.language)
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })
  .put((req, res) => {
    foodDeliveryRepo
      .editFoodType(req.body, req.headers.language)
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })

foodDeliveryRoutes.route('/type/:id').get((req, res) => {
  foodDeliveryRepo
    .getAllFoodType(req.params.id, req.headers.language)
    .then(result => {
      return res.success('', result.data)
    })
    .catch(err => {
      return res.reject(err.message)
    })
})

foodDeliveryRoutes.route('/typebyid/:id').get((req, res) => {
  foodDeliveryRepo
    .getFoodTypeById(req.params.id, req.headers.language)
    .then(result => {
      return res.success('', result.data)
    })
    .catch(err => {
      return res.reject(err.message)
    })
})

foodDeliveryRoutes
  .route('/item')
  .post(uploads.foodItem.single('image'), (req, res) => {
    foodDeliveryRepo
      .addFoodItem(
        JSON.parse(req.body.data),
        req.file || '',
        req.headers.language
      )
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })
  .put(uploads.foodItem.single('image'), (req, res) => {
    foodDeliveryRepo
      .editFoodItem(
        JSON.parse(req.body.data),
        req.file || '',
        req.headers.language
      )
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })

foodDeliveryRoutes.route('/item/:id').get((req, res) => {
  foodDeliveryRepo
    .getAllFoodItems(req.params.id, req.headers.language)
    .then(result => {
      return res.success(result.message, result.data)
    })
    .catch(err => {
      return res.reject(err.message)
    })
})

foodDeliveryRoutes.route('/itembyid/:id').get((req, res) => {
  foodDeliveryRepo
    .getFoodItemById(req.params.id, req.headers.language)
    .then(result => {
      return res.success(result.message, result.data)
    })
    .catch(err => {
      return res.reject(err.message)
    })
})

foodDeliveryRoutes
  .route('/setting')
  .post((req, res) => {
    foodDeliveryRepo
      .addSetting(req.body, req.headers.language)
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })
  .put((req, res) => {
    foodDeliveryRepo
      .editSetting(req.body, req.headers.language)
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })
  .get((req, res) => {
    foodDeliveryRepo
      .getSetting(req.body, req.headers.language)
      .then(result => {
        return res.success(result.message, result.data)
      })
      .catch(err => {
        return res.reject(err.message)
      })
  })

foodDeliveryRoutes.route('/orders').get((req, res) => {
  foodDeliveryRepo
    .getAllOrders(req.query, req.headers.language)
    .then(result => {
      return res.success(result.message, result.data)
    })
    .catch(err => {
      return res.reject(err.message)
    })
})

foodDeliveryRoutes.route('/order/:id').get((req, res) => {
  foodDeliveryRepo
    .getOrderById(req.params.id, req.headers.language)
    .then(result => {
      return res.success(result.message, result.data)
    })
    .catch(err => {
      return res.reject(err.message)
    })
})


foodDeliveryRoutes
  .route('/revenue/restaurant')
  .get((req, res) => {
    foodDeliveryRepo
      .getRestaurantRevenue(req.query).then(result => {
        return res.success(result.message, result.data)
      }).catch(err => {
        return res.reject(err.message)
      })
  })


export default foodDeliveryRoutes
