import express from "express";
import model from "../../models/index";
import Constant from "../../constant";
const Service = require("../../services");
import moment from "moment";
import mongoose from "mongoose";
import multilingualService from "../../services/multilingualService";
import deliveryController from "./controllers/deliveryController";
import { concatSeries } from "async";

let deliveryRepo = new deliveryController();

let route = express.Router();

module.exports = (io, socket, userSocketInfo, driverSocketInfo) => {
  console.log("userSocketInfo",userSocketInfo)

//Start Timer

socket.on("setDriverRequest",async function (data){
	try{
	var filterValue = {orderId: mongoose.Types.ObjectId(data.orderId)};
	var newValue = {$set: {status:2,ignored:false}};
	var result = await model.driverRequest.updateMany(filterValue,newValue,
		async function (err,res){
			
			if(!err){
			var filterValueforOrder = {_id: mongoose.Types.ObjectId(data.orderId)};
			var newValueforOrder = {$set:{status:0}};
			await model.storeOrder.updateOne(
			filterValueforOrder,
			newValueforOrder,
				function(err,res){
					if(!err){
					io.to(socket.id).emit("setDriverRequest",{
					success:true,
					message:"Success",
					data:data,
					});
					}
				}
			);
			
			//io.to(socket.id).emit("setDriverRequest",{
			//	success:true,
			//	message:"Success",
			//	data:data,
			//	});
			}
		})
	}
	catch(error){
	io.to(socket.id).emit("setDriverRequest",{
		success:false,
		message:error.message,
		data:data,
		});
	}
})

socket.on("getOrderAccepted",async function (data){
	getOrderDetail(data);
})
const getOrderDetail = async(data) => {
	try{
	
	for(let i=0;i<data.length;i++){
	var result = await model.driverRequest.find({
	orderId:mongoose.Types.ObjectId(data[i].orderId),
	status:1,
	});
	
	if(result.length > 0)data[i].isOrderAccepted = true;
	else data[i].isOrderAccepted = false;
	
	}
	io.to(socket.id).emit("getOrderAccepted",{
	success:true,
	message: "Success",
	data:data,
	});
}
catch(error)
{
	io.to(socket.id).emit("getOrderAccepted",{
		success:false,
		message:error,
		data:data,
	});
}

}
//End Timer

  // Add a username to connected socket for Single chat
  socket.on("requestDeliveryAction", async function (data) {
    console.log("+++++++++++++requestDeliveryAction++++++++++++++++");
console.log("Data",data);
    let queryModel = {};
    if (data.verticalType == 0)
      queryModel = await model.restaurantOrder
        .findOne({ _id: data._id })
        .lean()
        .exec();
    else if (data.verticalType == 1)
      queryModel = await model.storeOrder.findById(data._id).lean();

    let payload = {
      title: `Order Already Accepted`,
      type: 51,
      orderStatus: 1,
      requestId: data.requestId,
      verticalType: data.verticalType,
      driverId: data.driverId,
    };
console.log("DDD",queryModel.driverId);
    if (queryModel.driverId) {
      if (data.verticalType == 0) {
        payload.restaurantId = queryModel.restaurantId;
        payload.message = `Order is <strong>Accepted</strong> by other driver`;
        payload.notimessage = `Order is accepted by other driver`;
      } else if (data.verticalType == 1) {
        payload.storeId = queryModel.storeId;
        payload.message = `Order is <strong>Accepted</strong> by other driver`;
        payload.notimessage = `Order is accepted by other driver`;
      }
      await Service.Notification.driversend(payload);
      io.to(socket.id).emit("requestDeliveryAction", {
        sucess: false,
        message: Constant.LATEMSG,
        status: data.status,
      });
      return true;
    }
   //console.log("queryModel ***** " , queryModel)
    if (
      (data.verticalType == 0 || data.verticalType == 1) &&
      moment().valueOf() - Number(data.date) > 60000
    ) {
      console.log("in 60000 condition ",moment().valueOf(),Number(data.date));
      io.to(socket.id).emit("requestDeliveryAction", {
        sucess: false,
        message: Constant.LATEMSG,
        status: data.status,
      });
    } else {
      model.driverRequest
        .findByIdAndUpdate(
          data.requestId,
          { status: data.status },
          { new: true }
        )
        .then(async (result) => {
          let qryModel;
          if (data.status == 1) {
            if (data.verticalType == 0)
              qryModel = model.restaurantOrder.findByIdAndUpdate(
                data._id,
                { driverId: data.driverId },
                { new: true }
              );
            else if (data.verticalType == 1)
              qryModel = model.storeOrder.findByIdAndUpdate(
                data._id,
                { driverId: data.driverId },
                { new: true }
              );

            qryModel.then(async (result1) => {
//		console.log("Result 0f status 1",result1);
              model.driver
                .findByIdAndUpdate(
                  data.driverId,
                  // { isAvailable: 0 },
                  { new: true }
                )
                .select("firstName lastName profilePic countryCode phone")
                .then(async (driver) => {
                  io.to(socket.id).emit("requestDeliveryAction", {
                    sucess: true,
                    status: data.status,
                  });
		console.log("USerID portion",data);
                  io.to(userSocketInfo[data.userId]).emit("statusChange", {
                    sucess: true,
                    verticalType: data.verticalType,
                    driverId: driver,
                    bookingId: result1._id,
                  });
		io.emit("requestResult",{
			success:true,
			message:data,
			});
                });
              // }

              // model.driver
              //   .findByIdAndUpdate(
              //     data.driverId,
              //     { isAvailable: 0 },
              //     { new: true }
              //   )
              //   .select("firstName lastName profilePic countryCode phone")
              //   .then(async (driver) => {
              //     io.to(socket.id).emit("requestDeliveryAction", {
              //       sucess: true,
              //       status: data.status,
              //     });
              //     io.to(userSocketInfo[data.userId]).emit("statusChange", {
              //       sucess: true,
              //       verticalType: data.verticalType,
              //       driverId: driver,
              //       bookingId: result1._id,
              //     });
              //   });
            });
          } else {
            // if (data.status == 2) {
            let resp = await model.driverRequest.findByIdAndUpdate(
              data.requestId,
              {
                ignored: true,
              },
              { new: true }
            );
//console.log("Inside status:",data.status);
             //console.log("resp >>>>>" + resp);
            // }
            data.requestId = "";
            data.driverId = "";
            if (data.verticalType == 0)
              qryModel = await model.restaurantOrder
                .findById(data._id)
                .populate("outletId", "address latitude longitude")
                .populate(
                  "userId",
                  "firstName lastName profilePic countryCode phone"
                )
                .populate("items.itemId restaurantId", "name image");
            else if (data.verticalType == 1)
              qryModel = await model.storeOrder
                .findById(data._id)
                .populate("outletId", "address latitude longitude")
                .populate(
                  "userId",
                  "firstName lastName profilePic countryCode phone"
                )
                .populate("items.itemId storeId", "name image")

                .then((result1) => {
//                  console.log("result1 >>>" , result1)
                  if(result1.isTakeAway == false && result1.scheduleType  && (result1.scheduleType == "RECURING" || result1.scheduleType == "DELIVERY" || result1.scheduleType == "INSTANT")){
                    deliveryRepo.sendBooking(result1, io, driverSocketInfo);
                  }
                  console.log("after  ><><><><")
                  io.to(socket.id).emit("requestDeliveryAction", {
                    sucess: true,
                    status: data.status,
                  });
                });
          }
        });
    }
  });

  socket.on("requestDeliveryActionMicture", async function (data) {
    console.log("+++++++++++++requestDeliveryActionMicture++++++++++++++++");
    let queryModel = {};
    if (data.verticalType == 0)
      queryModel = await model.restaurantOrder
        .findOne({ _id: data._id })
        .lean()
        .exec();
    else if (data.verticalType == 1)
      queryModel = await model.storeOrder.findById(data._id).lean();

    let payload = {
      title: `Order Already Accepted`,
      type: 51,
      orderStatus: 1,
      requestId: data.requestId,
      verticalType: data.verticalType,
      driverId: data.driverId,
    };
    if (queryModel.driverId) {
      if (data.verticalType == 0) {
        payload.restaurantId = queryModel.restaurantId;
        payload.message = `Order is <strong>Accepted</strong> by other driver`;
        payload.notimessage = `Order is accepted by other driver`;
      } else if (data.verticalType == 1) {
        payload.storeId = queryModel.storeId;
        payload.message = `Order is <strong>Accepted</strong> by other driver`;
        payload.notimessage = `Order is accepted by other driver`;
      }
      await Service.Notification.driversend(payload);
      io.to(socket.id).emit("requestDeliveryActionMicture", {
        sucess: false,
        message: Constant.LATEMSG,
        status: data.status,
      });
      return true;
    }
    if (
      (data.verticalType == 0 || data.verticalType == 1) &&
      moment().valueOf() - Number(data.date) > 60000
    ) {
      io.to(socket.id).emit("requestDeliveryActionMicture", {
        sucess: false,
        message: Constant.LATEMSG,
        status: data.status,
      });
    } else {
      model.driverRequest
        .findByIdAndUpdate(
          data.requestId,
          { status: data.status },
          { new: true }
        )
        .then(async (result) => {
          let qryModel;
          if (data.status == 1) {
            if (data.verticalType == 0)
              qryModel = model.restaurantOrder.findByIdAndUpdate(
                data._id,
                { driverId: data.driverId },
                { new: true }
              );
            else if (data.verticalType == 1)
              qryModel = model.storeOrder.findByIdAndUpdate(
                data._id,
                { driverId: data.driverId },
                { new: true }
              );

            qryModel.then(async (result1) => {
              model.driver
                .findByIdAndUpdate(
                  data.driverId,
                  // { isAvailable: 0 },
                  { new: true }
                )
                .select("firstName lastName profilePic countryCode phone")
                .then(async (driver) => {
                  io.to(socket.id).emit("requestDeliveryActionMicture", {
                    sucess: true,
                    status: data.status,
                  });
                  io.to(userSocketInfo[data.userId]).emit("statusChange", {
                    sucess: true,
                    verticalType: data.verticalType,
                    driverId: driver,
                    bookingId: result1._id,
                  });
                });
              // }

              // model.driver
              //   .findByIdAndUpdate(
              //     data.driverId,
              //     { isAvailable: 0 },
              //     { new: true }
              //   )
              //   .select("firstName lastName profilePic countryCode phone")
              //   .then(async (driver) => {
              //     io.to(socket.id).emit("requestDeliveryActionMicture", {
              //       sucess: true,
              //       status: data.status,
              //     });
              //     io.to(userSocketInfo[data.userId]).emit("statusChange", {
              //       sucess: true,
              //       verticalType: data.verticalType,
              //       driverId: driver,
              //       bookingId: result1._id,
              //     });
              //   });
            });
          } else {
            // if (data.status == 2) {
            let resp = await model.driverRequest.findByIdAndUpdate(
              data.requestId,
              {
                ignored: true,
              },
              { new: true }
            );

            // console.log(resp);
            // }
            data.requestId = "";
            data.driverId = "";
            if (data.verticalType == 0)
              qryModel = await model.restaurantOrder
                .findById(data._id)
                .populate("outletId", "address latitude longitude")
                .populate(
                  "userId",
                  "firstName lastName profilePic countryCode phone"
                )
                .populate("items.itemId restaurantId", "name image");
            else if (data.verticalType == 1)
              qryModel = await model.storeOrder
                .findById(data._id)
                .populate("outletId", "address latitude longitude")
                .populate(
                  "userId",
                  "firstName lastName profilePic countryCode phone"
                )
                .populate("items.itemId storeId", "name image")

                .then((result1) => {
                  if(result1.isTakeAway == false && result1.scheduleType  && (result1.scheduleType == "RECURING" || result1.scheduleType == "DELIVERY" || result1.scheduleType == "INSTANT")){
                    deliveryRepo.sendBooking(result1, io, driverSocketInfo);
                  }
                  io.to(socket.id).emit("requestDeliveryActionMicture", {
                    sucess: true,
                    status: data.status,
                  });
                });
          }
        });
    }
  });

  socket.on('checkDeliveryRiderStatus', async function (data) {
    model.restaurantOrder
      .findOne({ driverId: data.driverId, status: { $lt: 4 } })
      .populate('outletId', 'address latitude longitude')
      .populate('userId', 'firstName lastName profilePic countryCode phone')
      .populate('items.itemId restaurantId storeId', 'name image')
      .populate('driverId', 'firstName lastName profilePic countryCode phone')
      .then(result => {
        if (!result) {
          model.storeOrder
            .findOne({ driverId: data.driverId, status: { $lt: 4 } })
            .populate('outletId', 'address latitude longitude')
            .populate(
              'userId',
              'firstName lastName profilePic countryCode phone'
            )
            .populate(
              'driverId',
              'firstName lastName profilePic countryCode phone'
            )
            .populate('items.itemId storeId', 'name image')
            .then(result => {
              io.to(socket.id).emit('checkDeliveryRiderStatus', {
                sucess: true,
                status: result ? result.status : 0,
                booking: result
              })
            })
        } else {
          io.to(socket.id).emit('checkDeliveryRiderStatus', {
            sucess: true,
            status: result ? result.status : 0,
            booking: result
          })
        }
      })
      .catch(err => console.log(err, 'error'))
  })

  socket.on("deliveryChangeStatus", async function (data) {
    let qryModel;
    let update = { status: data.status };
    if (data.status == 4){
      update.deliveryDate = moment().valueOf();
    }

    if (data.verticalType == 0)
      qryModel = model.restaurantOrder.findByIdAndUpdate(data._id, update, {
        new: true,
      });
    else if (data.verticalType == 1)
      qryModel = model.storeOrder.findByIdAndUpdate(data._id, update, {
        new: true,
      });

    qryModel
      .populate("outletId", "address latitude longitude")
      .populate("userId", "firstName lastName profilePic countryCode phone")
      .populate("driverId", "firstName lastName profilePic countryCode phone")
      .populate("items.itemId restaurantId storeId")
      .lean()
      .then(async (result) => {
        let obj = new Object();
        obj = result;
        io.to(userSocketInfo[result.userId._id]).emit("statusChange", {
          sucess: true,
          status: Number(data.status),
          verticalType: data.verticalType,
          driverId: result.driverId,
          bookingId: result._id,
        });
        if (data.status == 4){
          let userId = await model.storeOrder.findById(data._id).select('userId')
          let userDetials = await model.user.findById(userId.userId)
          let payload = {
            to:userDetials.email,
            subject: "Please Rate the Driver And Store",
            data : result
          }
	
          console.log("#################################" + JSON.stringify(result) + "<<<<<<<<<<<<<< result >>>>>>>>>")
          await Service.EmailService.mailer(payload, true);	
        }
        if (
          data.status == 4 &&
          (data.verticalType == 0 || data.verticalType == 1)
        ) {
          let payload = {
            title: `Order Delivered`,
            message: `Your order is <strong>Delivered by ${result.driverId.firstName} ${result.driverId.lastName}</strong>`,
            notimessage: `Your order is delivered by ${result.driverId.firstName}  ${result.driverId.lastName}`,
            type: 1,
            orderId: result._id,
            orderStatus: 4,
            verticalType: data.verticalType,
            userId: result.userId._id,
		data:{
		restaurantId:result.restaurantId,
		storeId:result.storeId,
		status:result.status,
		}
          };
          // new added by sagar
//          payload.data = await deliveryRepo.filterUserPayloadData(result);

//          payload.data.restaurantId = result.restaurantId;
//          payload.data.storeId = result.storeId;

          if (data.verticalType == 0)
            payload.restaurantId = result.restaurantId._id;
          else if (data.verticalType == 1) payload.storeId = result.storeId._id;

          await Service.Notification.usersend(payload);

          let driver = await model.driver.findByIdAndUpdate(result.driverId, {
            isAvailable: 1,
          });
          let adminOrderCommission = await model.storeOrder.findOne({
            _id: mongoose.Types.ObjectId(result._id),
          });
          if (driver.commissionType.toLowerCase() === "percentage") {
            await model.storeOrder.findOneAndUpdate(
              { _id: mongoose.Types.ObjectId(result._id) },
              {
                $set: {
                  driverCommission:
                    Number(
                      adminOrderCommission.adminCommission * driver.commission
                    ) * 0.01,
                  adminCommission:
                    Number(adminOrderCommission.adminCommission) -
                    Number(
                      adminOrderCommission.adminCommission *
                      driver.commission *
                      0.01
                    ),
                },
              }
            );
          }
          // if (driver.commissionType.toLowerCase() === "flat") {
          //   await model.storeOrder.findOneAndUpdate({ _id: mongoose.Types.ObjectId(result._id) }, {
          //     $set: {
          //       driverCommission: Number(driver.commission),
          //       adminCommission: Number(adminOrderCommission.adminCommission) - Number(driver.commission),
          //     }
          //   })
          // }
          // }
        }
        // Additional status to check order at your doorstep
        if (
          data.status == 13 &&
          (data.verticalType == 0 || data.verticalType == 1)
        ) {
          let payload = {
            title: `Driver Reached`,
            message: `Your order <strong>reached at your doorstep </strong>`,
            notimessage: `Your order reached at your doorstep`,
            type: 1,
            orderId: result._id,
            orderStatus: 13,
            verticalType: data.verticalType,
            userId: result.userId._id,
		data:{
		restaurantId:result.restaurantId,
		storeId:result.storeId,
		status:result.status
		}
          };

//          payload.data = await deliveryRepo.filterUserPayloadData(result); //new fixed by sagar

 //         payload.data.restaurantId = result.restaurantId;
 //         payload.data.storeId = result.storeId;

          if (data.verticalType == 0)
            payload.restaurantId = result.restaurantId._id;
          //new fixed by sagar
          else if (data.verticalType == 1) payload.storeId = result.storeId._id; //new fixed by sagar
          await Service.Notification.usersend(payload); //new fixed by sagar
        }

        if (
          data.status == 3 &&
          (data.verticalType == 0 || data.verticalType == 1)
        ) {
          let payload = {
            title: `On The Way`,
            message: `Your order is <strong>On The Way</strong>`,
            notimessage: `Your order is on the way`,
            type: 1,
            orderId: result._id,
            orderStatus: 3,
            verticalType: data.verticalType,
            userId: result.userId._id,
		data:{
	restaurantId: result.restaurantId,
	storeId:result.storeId,	
	status:result.status,
	}
          };

//          payload.data = await deliveryRepo.filterUserPayloadData(result); //new fixed by sagar

 //         payload.data.restaurantId = result.restaurantId;
 //         payload.data.storeId = result.storeId;

          if (data.verticalType == 0)
            payload.restaurantId = result.restaurantId._id;
          //new fixed by sagar
          else if (data.verticalType == 1) payload.storeId = result.storeId._id; //new fixed by sagar
          await Service.Notification.usersend(payload); //new fixed by sagar
        }

        // if (obj.restaurantId) obj.restaurantId = obj.restaurantId._id
        // if (obj.storeId) obj.storeId = obj.storeId._id

        io.to(socket.id).emit("deliveryChangeStatus", {
          sucess: true,
          status: data.status,
          booking: obj,
        });
	io.emit("orderCompleted",{
		success:true,
		status:data,
	})
      })
      .catch(
        (err) => console.log(err, "ERROR CODE 7854")
        // io.to(socket.id).emit('deliveryChangeStatus', { sucess: false, error: err })
      );
  });

  socket.on("restaurantOrder", function (data) {
    console.log("restaurantOrder"+ data);
    io.emit("restaurantOrder", { sucess: true, data: data });
  });

  socket.on("acceptOrder", async function (data) {
    let qryModel;
	console.log("Data transmitted",data);
    if (data.verticalType == 0)
      qryModel = model.restaurantOrder.findByIdAndUpdate(
        data._id,
        { status: data.status, preprationTime: data.time },
        { new: true }
      );
    if (data.verticalType == 1)
      qryModel = model.storeOrder.findByIdAndUpdate(
        data._id,
        { status: data.status, preprationTime: data.time },
        { new: true }
      );

    qryModel
      .populate("outletId", "address latitude longitude")
      .populate("userId", "firstName lastName profilePic countryCode phone")
      .populate("driverId", "firstName lastName profilePic countryCode phone")
      .populate("items.itemId restaurantId storeId", "name image")
      .lean()
      .then(async (result) => {
	
        io.to(userSocketInfo[result.userId._id]).emit("statusChange", {
          sucess: true,
          status: Number(data.status),
          orderType: data.orderType,
          verticalType: data.verticalType,
          preprationTime: data.time,
          bookingId: result._id,
		data:{
		scheduleTimeInMinute:data.scheduleTime,
		timeInMinute:data.time,
	},
        });

        let payload = {
          title: data.status == 1 || data.status == 9 || data.status == 15 ? `Order Accepted` : `Order Rejected`,
          type: 1,
          orderId: result._id,
          orderStatus: data.status, //1,
          verticalType: data.verticalType,
          userId: result.userId._id,
          phone: result.userId.phone,
          countryCode: result.userId.countryCode,
        };
        payload.data = await deliveryRepo.filterUserPayloadData(result);

        payload.data.restaurantId = result.restaurantId;
        payload.data.storeId = result.storeId;

        if (data.verticalType == 0) {
          payload.restaurantId = result.restaurantId._id;
          payload.message =
            data.status == 1 || data.status == 9 || data.status == 15
              ? `Your order is <strong>Accepted By Restaurant ${result.restaurantId.name}</strong>`
              : `Your order is <strong>Rejected By Restaurant ${result.restaurantId.name}</strong>`;
          payload.notimessage =
            data.status == 1 || data.status == 9 || data.status == 15
              ? `Your order is accepted by restaurant ${result.restaurantId.name}`
              : `Your order is rejected by restaurant ${result.restaurantId.name}`;
        } else if (data.verticalType == 1) {
          payload.storeId = result.storeId._id;
          payload.message =
            data.status == 1 || data.status == 9 || data.status == 15
              ? `Your order is <strong>Accepted By Store ${result.storeId.name}</strong>`
              : `Your order is <strong>Rejected By Store ${result.storeId.name}</strong>`;
          payload.notimessage =
            data.status == 1 || data.status == 9 || data.status == 15
              ? `Your order is accepted by store ${result.storeId.name}`
              : `Your order is rejected by store ${result.storeId.name}`;
        }

        if (data.status == 1 || data.status == 9) {
          let qryModel = model.storeOrder
            .findById(data._id)
            .populate("outletId", "address latitude longitude")
            .populate(
              "userId",
              "firstName lastName profilePic countryCode phone"
            )
            .populate("items.itemId storeId", "name image moduleKey")
            .then(async(result1) => {
              console.log(result1 + "<<<<<<<<<<<<<")
              const store = await model.store.findById(result1.storeId.id)
              if(store.storePackageType == "membership"){
                const driverCount = await model.storeOrder.find({
                  storeId : store._id,
                   driverId : {$ne : null} , 
                   status :{$in : [1,2,3]}
                }).countDocuments()
                if(store.driverCount == driverCount){
                reject({
                   message: multilingualService.getResponseMessage("STORE_MEMBERSHIP_HAVE_LIMIT_OF_DRIVER", lang),
                    data: {},
                });
              // store.driverCount = store.driverCount - 1
              // await model.store.findByIdAndUpdate(store._id, {$set : {orderCount : store.driverCount}})
              }
          }
              if(result1.isTakeAway == false && result1.scheduleType  && (result1.scheduleType == "RECURING" || result1.scheduleType == "DELIVERY" || result1.scheduleType == "INSTANT")){
                console.log("in if condition ********** ") 
                deliveryRepo.sendBooking(result1, io, driverSocketInfo);
              }
            });
        }
        await Service.Notification.usersend(payload);

        io.to(socket.id).emit("acceptOrder", {
          sucess: true,
          status: data.status,
          data: result,
        });
        io.emit("adminCheckChange", {
          sucess: true,
          Id: data.verticalType ? result.storeId._id : result.restaurantId._id,
        });
      })
      .catch((err) => {
        io.to(socket.id).emit("acceptOrder", { sucess: false, data: data });
      });
  });

  socket.on("adminChangeStatus", async function (data) {
    console.log("hey there",data )
    let qryModel;
    let update = { status: data.status };
    if(data.driverId != null){
      update.driverId = mongoose.Types.ObjectId(data.driverId);
    }
    if (data.status == 4) update.deliveryDate = moment().valueOf();

    if (data.verticalType == 0)
      qryModel = model.restaurantOrder.findByIdAndUpdate(data._id, {$set:update}, {
        new: true,
      });
    else if (data.verticalType == 1)
      qryModel = model.storeOrder.findByIdAndUpdate(data._id, {$set:update}, {
        new: true,
      });

    await qryModel
      .populate("outletId", "address latitude longitude")
      .populate("userId", "firstName lastName profilePic countryCode phone socketId")
      .populate("items.itemId storeId", "name image moduleKey")
      .lean()
//	.select("-store -userId -_id -driverId")
      .then(async (result) => {
	
        console.log("ggdggdfd",result.outletId.longitude,result.outletId.latitude,result.storeId.moduleKey,result._id,result.userId);
        let obj = new Object();
        obj = result;
	console.log("Data.status",data.status);
        io.to(result.userId._id).emit("statusChange", {
          sucess: true,
          status: Number(data.status),
          verticalType: data.verticalType,
          orderType: data.orderType,
          bookingId: result._id,
          driverId: result.driverId ? result.driverId : {},
        });
	if(data.status === 9 && data.verticalType ===1){
deliveryRepo.sendBooking(result,io,driverSocketInfo);
}
	if(data.status === 9 && data.verticalType ===1){
	let payload = {
	title: `Order Prepared`,
	message: `Your order is <strong>In Kitchen</strong>`,
	notimessage: `Your order is In Kitchen`,
	type:1,
	orderId:result._id,
	orderStatus:9,
	verticalType: data.verticalType,
	userId: result.userId._id,
//	data:{
//		restaurantId: result.restaurantId,
//		storeId: result.storeId,
//		}
	}
//	console.log("D1",payload);
	payload.data = await deliveryRepo.filterUserPayloadData(result);
//	console.log("D2",payload);
	payload.data.restaurantId = result.restaurantId;
	payload.data.storeId = result.storeId;
//	console.log("D3",payload);
	if(data.verticalType == 0)
	payload.restaurantId = result.restaurantId._id;
	else if(data.verticalType == 1) payload.storeId = result.storeId._id;
	await Service.Notification.usersend(payload);
	}
	if(data.status === 8 && data.verticalType === 1){
	let payload = {
	title:`Order Prepared`,
	message:`Your Order is <strong>Ready to Pickup</strong>`,
	notimessage:`Your Order is ready to Pickup`,
	type:1,
	orderId: result._id,
	orderStatus:8,
	verticalType:data.verticalType,
	userId:result.userId._id,
//	data:{
//		restaurantId: result.restaurantId,
//		storeId:result.storeId,
//		}
	}
	payload.data = await deliveryRepo.filterUserPayloadData(result);
	payload.data.restuarantId = result.restaurantId;
	payload.data.storeId = result.storeId;
	if(data.verticalType == 0)
	payload.restaurantId = result.restaurantId._id;
	else if(data.verticalType == 1) payload.storeId = result.storeId._id;
	await Service.Notification.usersend(payload);
	}
	if(data.status === 4 && data.verticalType === 1){
	let payload = {
	title:`Order Completed`,
	message:`Your Order is <strong>Completed</strong>`,
	notimessage:`Your Order is Completed`,
	type:1,
	orderId:result._id,
	orderStatus:4,
	verticalType:data.verticalType,
	userId:result.userId._id,
//	data:{
//		restaurantId: result.restaurantId,
//		storeId: result.storeId,
//		}
	}
	payload.data = await deliveryRepo.filterUserPayloadData(result);
	payload.data.restuarantId = result.restaurantId;
	payload.data.storeId = result.storeId;
	if(data.verticalType == 0)
	payload.restaurantId = result.restaurantId._id;
	else if(data.verticalType == 1) payload.storeId = result.storeId._id;
	await Service.Notification.usersend(payload);
	}
        if (data.status == 12) {
          let payload = {
            title: `Order Canceled`,
            message: `Your order <strong>Canceled</strong>`,
            notimessage: `Your order Canceled`,
            type: 1,
            orderId: result._id,
            orderStatus: 12,
            verticalType: data.verticalType,
            userId: result.userId._id,
          };
          payload.data = await deliveryRepo.filterUserPayloadData(result);

          payload.data.restaurantId = result.restaurantId;
          payload.data.storeId = result.storeId;

          if (data.verticalType == 0){
            payload.restaurantId = result.restaurantId._id;
          }else if (data.verticalType == 1) payload.storeId = result.storeId._id;

          await Service.Notification.usersend(payload);
          const order = await model.storeOrder.findById(data.orderId)
          const addWalletAmount = order.totalAmount - order.balanceLeft
          await model.user.findByIdAndUpdate(order.userId, {$inc : {wallet : addWalletAmount}})
          
          
        }

        if (data.status == 2 && data.orderType == 1) {
          let payload = {
            title: `Order Prepared`,
            message: `Your order is Prepared<strong>Ready to Pickup</strong>`,
            notimessage: `Your order is Prepared. Ready to Pickup`,
            type: 1,
            orderId: result._id,
            orderStatus: 2,
            verticalType: data.verticalType,
            userId: result.userId._id,
          };
          payload.data = await deliveryRepo.filterUserPayloadData(result);

          payload.data.restaurantId = result.restaurantId;
          payload.data.storeId = result.storeId;

          if (data.verticalType == 0)
            payload.restaurantId = result.restaurantId._id;
          else if (data.verticalType == 1) payload.storeId = result.storeId._id;

          await Service.Notification.usersend(payload);
        }

        if (data.status == 4 && (data.verticalType == 0 || data.verticalType == 1)) {
          let payload = {
            title: `Order Delivered`,
            message: `Your order is <strong>Delivered by ${result.driverId.firstName} ${result.driverId.lastName}</strong>`,
            notimessage: `Your order is delivered by ${result.driverId.firstName} ${result.driverId.lastName}`,
            type: 1,
            orderId: result._id,
            orderStatus: 4,
            verticalType: data.verticalType,
            userId: result.userId._id,
		data:{
		restaurantId:result.restaurantId,
		restautantId:result.storeId,
		status:result.status
		}
          };
//          payload.data = await deliveryRepo.filterUserPayloadData(result);
//          payload.data.restaurantId = result.restaurantId;
//          payload.data.storeId = result.storeId;

          if (data.verticalType == 0)
            payload.restaurantId = result.restaurantId._id;
          else if (data.verticalType == 1) payload.storeId = result.storeId._id;

          await Service.Notification.usersend(payload);

          await model.driver.findByIdAndUpdate(result.driverId, {
            isAvailable: 1,
          });
        }

        if (data.status == 3 && !data.orderType && (data.verticalType == 0 || data.verticalType == 1)) {
          let payload = {
            title: `On The Way`,
            message: `Your order is <strong>On The Way</strong>`,
            notimessage: `Your order is on the way`,
            type: 1,
            orderId: result._id,
            orderStatus: 3,
            verticalType: data.verticalType,
            userId: result.userId._id,
          };
          payload.data = await deliveryRepo.filterUserPayloadData(result);

          payload.data.restaurantId = result.restaurantId;
          payload.data.storeId = result.storeId;

          if (data.verticalType == 0)
            payload.restaurantId = result.restaurantId._id;
          else if (data.verticalType == 1) payload.storeId = result.storeId._id;

          await Service.Notification.usersend(payload);
        }
        if(data.driverId != null){
          let request = await model.driverRequest.findOne({
            orderId: result._id,
            driverId: mongoose.Types.ObjectId(data.driverId),
          });
          let ignored = false;
          if (request != null && request.ignored) ignored = true;
          if (!ignored) {
            if (!request) {
              request = new model.driverRequest({
                userId: resuly.userId._id,
                driverId: mongoose.Types.ObjectId(data.driverId),
                date: moment().valueOf(),
                requestData: result,
                ignored: false,
                orderId: result._id,
              });
              var req = await request.save();
            } else {
              var req = request;
            }
            val.driverId = mongoose.Types.ObjectId(data.driverId);
            val.requestId = req._id;
            val.date = moment().valueOf();
            result.driverId = mongoose.Types.ObjectId(data.driverId);
            result.requestId = req._id;
            result.date = moment().valueOf();

            let payload = {
              title: `New Order`,
              type: 51,
              orderStatus: 0,
              requestId: result.requestId,
              verticalType: result.verticalType,
              driverId : result.driverId,
            };

            payload.data = result;

            if (result.verticalType == 0) {
              payload.restaurantId = result._id;
              payload.message = `You have new order from <strong>Restaurant ${result.restaurantId.name}</strong>`;
              payload.notimessage = `You have new order from restaurant ${result.restaurantId.name}`;
            } else if (result.verticalType == 1) {
              payload.storeId = result._id;
              payload.message = `You have new order from <strong>Store ${result.storeId.name}</strong>`;
              payload.notimessage = `You have new order from store ${result.storeId.name}`;
            }
            try {
              await Service.Notification.driversend(payload);
            } catch (error) {
              throw error;
            }
            let Driver = await model.driver
              .findOne(
                { _id:mongoose.Types.ObjectId(data.driverId) },
                { firstName: 1, lastName: 1, _id: 1 }
              )
              .lean()
              .exec();
            Driver.requests = 0;
            sendObj.driverId = Driver;
            io.to(data.driverId).emit(
              "newBooking",
              sendObj
            );
          }
        }
        io.to(socket.id).emit("adminChangeStatus", {
          sucess: true,
          status: data.status,
          data: obj,
        });
        io.emit("adminCheckChange", {
          sucess: true,
          Id: data.verticalType ? result.storeId._id : result.restaurantId._id,
        });
      })
      .catch((err) => {
        io.to(socket.id).emit("adminChangeStatus", {
          sucess: false,
          data: data,
        });
      });
  });

  socket.on("storeOrder", function (data) {
    console.log(data + "***********************************///")
    io.emit("storeOrder", { sucess: true, data: data });
  });

  socket.on("lessItemQuantity", function (data) {
    console.log(data + "***********************************///")
    io.emit("lessItemQuantity", { sucess: true, data: data });
  });
  return route;
};
